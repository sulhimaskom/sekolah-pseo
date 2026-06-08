/*
 * Static page generator controller. Orchestrates the build process by:
 * 1. Loading school data from CSV
 * 2. Building page content using PageBuilder service
 * 3. Writing pages to file system with concurrency control
 *
 * This script acts as a thin controller that coordinates between:
 * - Data access (CSV loading)
 * - Business logic (PageBuilder service)
 * - File I/O (fs-safe wrappers)
 */

'use strict';

const path = require('path');
const { parseCsv, processConcurrently } = require('./utils');
const logger = require('./logger');
const CONFIG = require('./config');
const { IntegrationError, ERROR_CODES } = require('./resilience');
const { safeReadFile, safeWriteFile, safeMkdir } = require('./fs-safe');
const {
  buildSchoolPageData,
  getSchoolRelativePath,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
} = require('../src/services/PageBuilder');
const { writeExternalStylesFile } = require('../src/presenters/styles');
const {
  generateHomepageHtml,
  prepareSchoolDataForSearch,
} = require('../src/presenters/templates/homepage');
const { loadManifest, saveManifest, getChangedSchools, computeSchoolHash } = require('./manifest');
const { BuildPerformanceTracker } = require('./build-performance');
const { loadEnrichmentData } = require('./enrichment');

// Export functions for testing
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

module.exports = {
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  ensureDistDir,
  loadSchools,
  generateExternalStyles,
  generateRobotsTxt,
  generateProvincePages,
  preCreateProvinceDirectories,
  writeSearchDataFile,
  build,
  buildIncremental,
  computeSchoolHash,
  createManifestFromSchools,
};

// Ensure dist directory exists
const distDir = CONFIG.DIST_DIR;

/**
 * Ensure the dist directory exists.
 */
async function ensureDistDir() {
  try {
    await safeMkdir(distDir);
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
 * @param {Object} school
 * @param {Object} [enrichment] - Optional enrichment data for this school
 */
async function writeSchoolPage(school, enrichment) {
  const pageData = buildSchoolPageData(school, enrichment);
  const outputPath = path.join(distDir, pageData.relativePath);
  await safeWriteFile(outputPath, pageData.content);
}

/**
 * Pre-create all unique directories needed for schools to reduce redundant fs.mkdir calls.
 *
 * @param {Array<Object>} schools
 */
async function preCreateDirectories(schools) {
  const uniqueDirs = getUniqueDirectories(schools);

  logger.info(`Creating ${uniqueDirs.length} unique directories...`);

  const dirPromises = uniqueDirs.map(dir => {
    const fullPath = path.join(distDir, dir);
    return safeMkdir(fullPath).catch(err => {
      logger.error({ err, path: fullPath }, 'Failed to create directory');
    });
  });

  await Promise.all(dirPromises);
}

/**
 * Pre-create all unique province directories.
 *
 * @param {Array<Object>} schools
 */
async function preCreateProvinceDirectories(schools) {
  const provinces = getUniqueProvinces(schools);

  logger.info(`Creating ${provinces.length} province directories...`);

  const dirPromises = provinces.map(province => {
    const fullPath = path.join(distDir, 'provinsi', province.slug);
    return safeMkdir(fullPath).catch(err => {
      logger.error({ err, path: fullPath }, 'Failed to create province directory');
    });
  });

  await Promise.all(dirPromises);
}

/**
 * Generate all province pages.
 *
 * @param {Array<Object>} schools
 */
async function generateProvincePages(schools) {
  const provinces = getUniqueProvinces(schools);
  await preCreateProvinceDirectories(schools);

  logger.info(`Generating ${provinces.length} province pages...`);

  const { results, metrics } = await processConcurrently(
    provinces,
    async province => {
      try {
        const pageData = buildProvincePageData(province.name, schools);
        const outputPath = path.join(distDir, pageData.relativePath);
        await safeWriteFile(outputPath, pageData.content);
        return { success: true, name: province.name };
      } catch (err) {
        logger.error({ err, province: province.name }, 'Failed to generate province page');
        return { success: false, name: province.name };
      }
    },
    {
      limit: CONFIG.BUILD_CONCURRENCY_LIMIT,
      timeout: CONFIG.RATE_LIMITER_DEFAULTS.QUEUE_TIMEOUT_MS,
      getName: province => `generateProvincePage-${province.name}`,
    }
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(
    r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  ).length;

  logger.info('Province build metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

  logger.info(`Generated ${successful} province pages (${failed} failed)`);
  return { successful, failed };
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
 * Generate external search data file (schools.json) for lazy-loaded client-side search.
 * This separates the ~1.3MB JSON search data from the homepage HTML,
 * allowing the homepage to load as a lightweight ~14KB page.
 * The JS client fetches the JSON asynchronously after page load.
 *
 * @param {Array<Object>} schools
 */
async function writeSearchDataFile(schools) {
  const searchData = prepareSchoolDataForSearch(schools);
  const jsonContent = JSON.stringify(searchData);
  const outputPath = path.join(distDir, 'schools.json');
  await safeWriteFile(outputPath, jsonContent);
  logger.info(
    `Generated schools.json (${(Buffer.byteLength(jsonContent, 'utf-8') / 1024).toFixed(0)} KB)`
  );
}

/**
 * Export schools CSV to dist directory for user download.
 */
async function exportSchoolsCsv() {
  const csvPath = CONFIG.SCHOOLS_CSV_PATH;
  const distDataDir = path.join(distDir, 'data');
  await safeMkdir(distDataDir);
  const csvContent = await safeReadFile(csvPath);
  const outputPath = path.join(distDataDir, 'schools.csv');
  await safeWriteFile(outputPath, csvContent);
  logger.info(
    `Exported schools data (${(Buffer.byteLength(csvContent, 'utf-8') / 1024 / 1024).toFixed(1)} MB)`
  );
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

  const { results, metrics } = await processConcurrently(
    schools,
    async school => {
      const enrichment = enrichmentMap ? enrichmentMap[school.npsn] : undefined;
      await writeSchoolPage(school, enrichment);
    },
    {
      limit: concurrencyLimit,
      timeout: CONFIG.RATE_LIMITER_DEFAULTS.QUEUE_TIMEOUT_MS,
      getName: school => `writeSchoolPage-${school.npsn}`,
      onProgress: (processed, total) => {
        if (processed % 100 === 0 || processed === total) {
          logger.info(`Processed ${processed} of ${total} school pages`);
        }
      },
    }
  );

  logger.info('Build metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

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
 * Create manifest object from schools.
 * @param {Array<Object>} schools - School records
 */
function createManifestFromSchools(schools) {
  const nowISO = new Date().toISOString();
  const manifest = {
    version: 1,
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
 * Prepare the build environment and generate shared pages.
 * Extracted to eliminate duplication between full and incremental builds.
 *
 * @returns {Promise<{schools: Array, enrichmentMap: Object}>}
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

  // Generate homepage (always regenerate as it lists all schools)
  logger.info('Generating homepage...');
  const homepageHtml = generateHomepageHtml(schools);
  await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
  logger.info('Generated homepage (index.html)');

  // Generate external search data for lazy-loaded client-side search
  await writeSearchDataFile(schools);

  // Generate province pages (always regenerate)
  await generateProvincePages(schools);

  return { schools, enrichmentMap };
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
 * Supports --incremental flag for faster rebuilds
 * Usage: node build-pages.js --incremental
 */
async function build(options = {}) {
  const incremental = options.incremental || process.argv.includes('--incremental');
  const tracker = new BuildPerformanceTracker();
  tracker.start();

  try {
    if (incremental) {
      return await buildIncremental(tracker);
    }

    tracker.setBuildType('full');

    const { schools, enrichmentMap } = await prepareBuildEnvironment();

    const { successful, failed } = await writeSchoolPagesConcurrently(
      schools,
      CONFIG.BUILD_CONCURRENCY_LIMIT,
      enrichmentMap
    );
    logger.info(`Generated ${successful} school pages (${failed} failed)`);

    // Save manifest for incremental builds
    await saveManifest(createManifestFromSchools(schools));
    logger.info('Build manifest saved');

    await exportSchoolsCsv();

    tracker.recordPageCounts(successful + failed, failed);
  } finally {
    finalizeBuild(tracker);
  }
}

/**
 * Incremental build - only rebuilds pages that have changed.
 * Uses a manifest file to track built files and their content hashes.
 *
 * @param {BuildPerformanceTracker} [tracker] - Optional performance tracker
 */
async function buildIncremental(tracker) {
  if (tracker) tracker.setBuildType('incremental');

  const { schools, enrichmentMap } = await prepareBuildEnvironment();

  // Load manifest to check for changes
  const manifest = await loadManifest();

  let schoolsToBuild = schools;

  if (manifest) {
    const { changed, unchanged } = getChangedSchools(schools, manifest);
    logger.info(`Incremental build: ${unchanged.length} unchanged, ${changed.length} changed`);
    schoolsToBuild = changed;
  } else {
    logger.info('No manifest found, performing full build');
  }

  if (schoolsToBuild.length === 0) {
    logger.info('No pages to rebuild');
    if (tracker) tracker.recordPageCounts(0, 0);
  } else {
    const { successful, failed } = await writeSchoolPagesConcurrently(
      schoolsToBuild,
      CONFIG.BUILD_CONCURRENCY_LIMIT,
      enrichmentMap
    );
    logger.info(`Generated ${successful} school pages (${failed} failed)`);
    if (tracker) tracker.recordPageCounts(successful + failed, failed);
  }

  // Save manifest for future incremental builds
  await saveManifest(createManifestFromSchools(schools));
  logger.info('Build manifest saved');
}

if (require.main === module) {
  build().catch(error => {
    logger.error('Build failed:', error);
    process.exit(1);
  });
}
