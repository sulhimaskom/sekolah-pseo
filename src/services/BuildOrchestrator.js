/**
 * @module BuildOrchestrator
 * @description Build pipeline orchestration service. Encapsulates the static site
 * generation pipeline — data loading, page generation, file output, manifest tracking,
 * and performance reporting. Controllers (scripts/build-pages.js) delegate to this
 * service rather than implementing pipeline logic directly.
 *
 * Architectural role (per docs/blueprint.md):
 *   src/services/        ← Business logic (this module)
 *   scripts/             ← Thin controllers / CLI entry points
 *   src/presenters/      ← Presentation / template layer
 */

'use strict';

const path = require('path');
const slugify = require('../../scripts/slugify');
const { parseCsv, processInBatches } = require('../../scripts/utils');
const logger = require('../../scripts/logger');
const CONFIG = require('../../scripts/config');
const { IntegrationError, ERROR_CODES } = require('../../scripts/resilience');
const {
  safeReadFile,
  safeWriteFile,
  fastWriteFile,
  fastMkdir,
  safeUnlink,
} = require('../../scripts/fs-safe');
const {
  buildSchoolPageData,
  buildHomepageData,
  getSchoolRelativePath,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
  groupSchoolsByProvince,
} = require('./PageBuilder');
const { writeSearchDataFile } = require('./SearchDataService');
const { exportSchoolsCsv, writeExternalStylesFile } = require('./ExportService');
const {
  loadManifest,
  saveManifest,
  getChangedSchools,
  getOrphanedSchoolPaths,
  computeSchoolHash,
  MANIFEST_VERSION,
} = require('../../scripts/manifest');
const { BuildPerformanceTracker } = require('../../scripts/build-performance');
const { loadEnrichmentData } = require('../../scripts/enrichment');
const { generateSitemaps } = require('../../scripts/sitemap');

// Ensure dist directory exists
const distDir = CONFIG.DIST_DIR;

/**
 * Ensure the dist directory exists.
 */
async function ensureDistDir() {
  try {
    await fastMkdir(distDir);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create dist directory');
    throw error;
  }
}

/**
 * Load the processed schools CSV into an array of objects.
 */
async function loadSchools() {
  const text = await safeReadFile(CONFIG.SCHOOLS_CSV_PATH);
  const schools = parseCsv(text);

  if (schools.length === 0) {
    throw new IntegrationError(
      `No schools found in ${CONFIG.SCHOOLS_CSV_PATH} - CSV may be empty or invalid`,
      ERROR_CODES.FILE_EMPTY,
      { path: CONFIG.SCHOOLS_CSV_PATH }
    );
  }

  return schools;
}

/**
 * Write a single school page using PageBuilder service.
 *
 * Circuit breaker is disabled for bulk page writes since isolated failures
 * should not cascade and block all remaining pages. Retry+timeout still
 * protect against transient filesystem errors.
 *
 * @param {Object} school
 * @param {Object} [enrichment] - Optional enrichment data for this school
 */
async function writeSchoolPage(school, enrichment) {
  const pageData = buildSchoolPageData(school, enrichment);
  const outputPath = path.join(distDir, pageData.relativePath);
  await fastWriteFile(outputPath, pageData.content);
}

/**
 * Pre-create all unique directories needed for schools to reduce redundant
 * fs.mkdir calls. Failed directories are tracked and reported — since this
 * is a bulk operation, the build continues but downstream file writes to
 * missing directories will fail.
 *
 * @param {Array<Object>} schools
 * @returns {Promise<string[]>} Array of directory paths that failed to create
 */
async function preCreateDirectories(schools) {
  const uniqueDirs = getUniqueDirectories(schools);

  logger.info(`Creating ${uniqueDirs.length} unique directories...`);

  const failures = [];

  const dirPromises = uniqueDirs.map(async dir => {
    const fullPath = path.join(distDir, dir);
    try {
      await fastMkdir(fullPath);
    } catch (err) {
      logger.error({ err, path: fullPath }, 'Failed to create directory');
      failures.push(fullPath);
    }
  });

  await Promise.all(dirPromises);

  if (failures.length > 0) {
    logger.warn(`${failures.length} of ${uniqueDirs.length} directories failed to create`);
  }

  return failures;
}

/**
 * Generate robots.txt with the actual SITE_URL.
 * @param {string} siteUrl - Base URL for the site
 */
async function generateRobotsTxt(siteUrl) {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${normalizedUrl}/sitemap-index.xml`,
    '',
  ].join('\n');

  await safeWriteFile(path.join(distDir, 'robots.txt'), content);
  logger.info(`Generated robots.txt with sitemap URL: ${normalizedUrl}/sitemap-index.xml`);
}

/**
 * Generate external styles.css file.
 */
async function generateExternalStyles() {
  logger.info('Generating external styles.css...');
  await writeExternalStylesFile(distDir);
  logger.info('Generated styles.css');
}

/**
 * Pre-create all unique province directories.
 * Accepts an optional pre-computed provinces array to avoid
 * redundant getUniqueProvinces() calls.
 *
 * @param {Array<Object>} schools - School records (used if provinces not provided)
 * @param {Array<Object>} [provinces] - Pre-computed province objects with slug/name/count
 */
async function preCreateProvinceDirectories(schools, provinces) {
  const provinceList = provinces || getUniqueProvinces(schools);

  logger.info(`Creating ${provinceList.length} province directories...`);

  const dirPromises = provinceList.map(province => {
    const fullPath = path.join(distDir, 'provinsi', province.slug);
    return fastMkdir(fullPath).catch(err => {
      logger.error({ err, path: fullPath }, 'Failed to create province directory');
    });
  });

  await Promise.all(dirPromises);
}

/**
 * F045: delete dist/ pages whose relative path no longer matches any current
 * school. Schools removed from the CSV or whose path changed (provinsi /
 * kab_kota / kecamatan / nama) would otherwise leave stale, linkable pages in
 * dist/ forever — getChangedSchools() only iterates current schools, so the
 * orphaned pages are never touched by the normal incremental diff.
 *
 * Only files recorded in the previous manifest are candidates, and each is
 * verified against the current path set — nothing outside the manifest's own
 * school entries can be deleted.
 *
 * @param {Array<Object>} schools - Current school records
 * @param {Object} manifest - Previous build manifest
 * @returns {Promise<number>} Number of orphaned pages deleted
 */
async function removeOrphanedSchoolPages(schools, manifest) {
  if (!manifest || !manifest.schools) {
    return 0;
  }

  const currentPaths = new Set();
  for (const school of schools) {
    try {
      currentPaths.add(getSchoolRelativePath(school));
    } catch {
      // Invalid row cannot produce a page; its stale entry is a delete candidate too
    }
  }

  const orphaned = getOrphanedSchoolPaths(manifest, currentPaths);
  if (orphaned.length === 0) {
    return 0;
  }

  logger.info(`Removing ${orphaned.length} orphaned page(s) from previous build`);
  await Promise.all(orphaned.map(relPath => safeUnlink(path.join(distDir, relPath))));
  return orphaned.length;
}

/**
 * Create manifest object from schools.
 * @param {Array<Object>} schools - School records
 */
function createManifestFromSchools(schools) {
  const nowISO = new Date().toISOString();
  const manifest = {
    version: MANIFEST_VERSION,
    lastBuild: nowISO,
    schools: {},
  };

  for (const school of schools) {
    const npsn = school.npsn;
    const hash = computeSchoolHash(school);

    manifest.schools[npsn] = {
      hash,
      builtAt: nowISO,
      path: getSchoolRelativePath(school),
    };
  }

  return manifest;
}

/**
 * Generate all province pages.
 * Uses province pre-grouping (O(n) single pass) to avoid redundant per-province filtering.
 *
 * @param {Array<Object>} schools
 */
async function generateProvincePages(schools) {
  // Pre-group schools by province in a single O(n) pass.
  // Derive province list from the grouped Map instead of a second O(n) pass
  // via getUniqueProvinces — we already have the schools grouped.
  const grouped = groupSchoolsByProvince(schools);
  const provinces = Array.from(grouped.entries()).map(([name, provinceSchools]) => ({
    name,
    slug: slugify(name),
    count: provinceSchools.length,
  }));

  await preCreateProvinceDirectories(schools, provinces);

  logger.info(`Generating ${provinces.length} province pages...`);

  const { results } = await processInBatches(
    provinces,
    async province => {
      try {
        // Use pre-filtered schools with skipFilter=true to avoid redundant filtering
        const provinceSchools = grouped.get(province.name) || [];
        const pageData = buildProvincePageData(province.name, provinceSchools, true);
        const outputPath = path.join(distDir, pageData.relativePath);
        await fastWriteFile(outputPath, pageData.content);
        return { success: true, name: province.name };
      } catch (err) {
        logger.error({ err, province: province.name }, 'Failed to generate province page');
        return { success: false, name: province.name };
      }
    },
    {
      batchSize: CONFIG.BUILD_CONCURRENCY_LIMIT,
    }
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(
    r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  ).length;

  logger.info(`Generated ${successful} province pages (${failed} failed)`);
  return { successful, failed };
}

/**
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 * @param {Object} [enrichmentMap] - Optional map of NPSN to enrichment data
 */
async function writeSchoolPagesConcurrently(
  schools,
  concurrencyLimit = CONFIG.BUILD_CONCURRENCY_LIMIT,
  enrichmentMap
) {
  await preCreateDirectories(schools);

  // Use batch-based concurrency instead of RateLimiter-based to eliminate
  // per-item Promise+setTimeout overhead for 3474+ fast filesystem writes.
  // Each write is a lightweight fastWriteFile (no retry/timeout/circuit-breaker),
  // so the RateLimiter's queue management and timer overhead is pure waste.
  const { results } = await processInBatches(
    schools,
    async school => {
      const enrichment = enrichmentMap ? enrichmentMap[school.npsn] : undefined;
      await writeSchoolPage(school, enrichment);
    },
    {
      batchSize: concurrencyLimit,
      onProgress: (processed, total) => {
        if (processed % 100 === 0 || processed === total) {
          logger.info(`Processed ${processed} of ${total} school pages`);
        }
      },
    }
  );

  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failedResults = results.filter(result => result.status === 'rejected');
  const failed = failedResults.length;

  if (failed > 0) {
    const failureDetails = failedResults.slice(0, 5).map(r => ({
      reason: r.reason?.message || 'Unknown error',
      npsn: r.reason?.details?.npsn || 'unknown',
      operationName: r.reason?.details?.operationName,
    }));
    logger.warn(
      { failures: failureDetails, totalFailed: failed },
      `${failed} school pages failed to generate`
    );
  }

  return { successful, failed };
}

/**
 * Prepare the build environment and generate shared pages.
 * Extracted to eliminate duplication between full and incremental builds.
 *
 * Returns immediately after CSV load and enrichment load, with shared
 * page generation (homepage, province pages, schools.json) running in
 * the background as `sharedPagesPromise`. The caller can overlap school
 * page writing with shared page generation, saving ~60-80ms on a full build.
 *
 * @returns {Promise<{schools: Array, enrichmentMap: Object, sharedPagesPromise: Promise<void>}>}
 */
async function prepareBuildEnvironment() {
  await ensureDistDir();
  await generateExternalStyles();
  await generateRobotsTxt(CONFIG.SITE_URL);

  const schools = await loadSchools();
  logger.info(`Loaded ${schools.length} schools from CSV`);

  if (schools.length === 0) {
    throw new IntegrationError(
      'No schools loaded from CSV. Build aborted - ensure schools.csv exists and contains valid data.',
      ERROR_CODES.FILE_EMPTY,
      { path: CONFIG.SCHOOLS_CSV_PATH }
    );
  }

  const enrichmentMap = await loadEnrichmentData();
  const enrichedCount = Object.keys(enrichmentMap).length;
  if (enrichedCount > 0) {
    logger.info(`Loaded enrichment data for ${enrichedCount} schools`);
  }

  // Fire homepage, search data, and province page generation in the background.
  // These are independent of school page writing — they read from the same
  // schools array but write to different files. Running them concurrently
  // with school page writing overlaps ~60-80ms of CPU+I/O with the page
  // writing pipeline, reducing critical-path wall time.
  const sharedPagesPromise = Promise.all([
    (async () => {
      logger.info('Generating homepage...');
      const homepageHtml = buildHomepageData(schools);
      await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
      logger.info('Generated homepage (index.html)');
    })(),
    writeSearchDataFile(schools),
    generateProvincePages(schools),
  ]);

  return { schools, enrichmentMap, sharedPagesPromise };
}

/**
 * Log the build performance report with optional GITHUB_STEP_SUMMARY.
 *
 * @param {BuildPerformanceTracker} tracker
 */
function finalizeBuild(tracker) {
  tracker.stop();
  tracker.logReport();

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, tracker.getGitHubSummary() + '\n');
    } catch (summaryError) {
      logger.debug(`Could not write to GITHUB_STEP_SUMMARY: ${summaryError.message}`);
    }
  }
}

/**
 * Main build function. Orchestrates the build process by:
 * 1. Ensuring dist directory exists
 * 2. Loading school data
 * 3. Generating external CSS file
 * 4. Generating homepage
 * 5. Generating province pages
 * 6. Generating and writing pages
 *
 * Supports --incremental flag for faster rebuilds.
 * Incremental mode filters schools via the build manifest so only
 * changed (or new) pages are regenerated, sharing the same pipeline.
 *
 * Usage: node build-pages.js [--incremental]
 *
 * @param {Object} [options] - Build options
 * @param {boolean} [options.incremental] - If true, only rebuild changed pages
 */
async function build(options = {}) {
  const incremental = options.incremental || process.argv.includes('--incremental');
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  tracker.setBuildType(incremental ? 'incremental' : 'full');

  try {
    const { schools, enrichmentMap, sharedPagesPromise } = await prepareBuildEnvironment();

    // Filter to changed schools for incremental builds
    let schoolsToBuild = schools;
    if (incremental) {
      const manifest = await loadManifest();
      if (manifest) {
        const { changed, unchanged } = getChangedSchools(schools, manifest);
        logger.info(`Incremental build: ${unchanged.length} unchanged, ${changed.length} changed`);
        schoolsToBuild = changed;
        await removeOrphanedSchoolPages(schools, manifest);
      } else {
        logger.info('No manifest found, performing full build');
      }
    }

    // Run school page writing and shared page generation (homepage, province,
    // schools.json) concurrently. SharedPagesPromise was started by
    // prepareBuildEnvironment() — we overlap it with school pages here.
    if (schoolsToBuild.length === 0) {
      // No school pages to write — still need shared pages to complete
      logger.info('No pages to rebuild');
      await sharedPagesPromise;
      tracker.recordPageCounts(0, 0);
    } else {
      const [, writeResult] = await Promise.all([
        sharedPagesPromise,
        writeSchoolPagesConcurrently(schoolsToBuild, CONFIG.BUILD_CONCURRENCY_LIMIT, enrichmentMap),
      ]);
      const { successful, failed } = writeResult;
      logger.info(`Generated ${successful} school pages (${failed} failed)`);
      tracker.recordPageCounts(successful + failed, failed);
    }

    // Save manifest and (for full builds) export CSV in parallel.
    // These are independent I/O operations — manifest writes to dist/.build-manifest.json,
    // CSV export copies to dist/data/schools.csv. Running them concurrently
    // reduces critical-path wall time.
    // F024: generate sitemaps so robots.txt's advertised sitemap-index.xml
    // actually exists after every build. Data-driven (schools already loaded),
    // so it runs for both full and incremental builds. Independent of the
    // manifest/CSV writes — fused into the same parallel batch.
    const manifestPromise = saveManifest(createManifestFromSchools(schools));
    const sitemapPromise = generateSitemaps(schools);

    if (!incremental) {
      await Promise.all([manifestPromise, exportSchoolsCsv(), sitemapPromise]);
      logger.info('Build manifest saved');
    } else {
      await Promise.all([manifestPromise, sitemapPromise]);
      logger.info('Build manifest saved');
    }
  } finally {
    finalizeBuild(tracker);
  }
}

/**
 * Incremental build - only rebuilds pages that have changed.
 * Thin wrapper for backward compatibility.
 *
 * @returns {Promise<void>}
 */
async function buildIncremental() {
  return build({ incremental: true });
}

module.exports = {
  // Build pipeline
  build,
  buildIncremental,
  prepareBuildEnvironment,
  finalizeBuild,

  // Step functions
  ensureDistDir,
  loadSchools,
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  preCreateDirectories,
  preCreateProvinceDirectories,
  generateProvincePages,
  generateRobotsTxt,
  generateExternalStyles,
  writeExternalStylesFile,
  writeSearchDataFile,
  exportSchoolsCsv,
  createManifestFromSchools,
  removeOrphanedSchoolPages,

  // Re-exported for convenience
  computeSchoolHash,
};
