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

const path = require('path');
const { parseCsv } = require('./utils');
const logger = require('./logger');
const CONFIG = require('./config');
const { safeReadFile, safeWriteFile, safeMkdir } = require('./fs-safe');
const {
  buildSchoolPageData,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
} = require('../src/services/PageBuilder');
const { writeExternalStylesFile } = require('../src/presenters/styles');
const { generateHomepageHtml } = require('../src/presenters/templates/homepage');
const { RateLimiter } = require('./rate-limiter');
const { loadManifest, saveManifest, getChangedSchools, computeSchoolHash } = require('./manifest');

// Export functions for testing
module.exports = {
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  ensureDistDir,
  loadSchools,
  generateExternalStyles,
  generateProvincePages,
  preCreateProvinceDirectories,
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
    logger.error(`Failed to create dist directory: ${error.message}`);
    throw error;
  }
}

/**
 * Load the processed schools CSV into an array of objects.
 */
async function loadSchools() {
  try {
    const text = await safeReadFile(CONFIG.SCHOOLS_CSV_PATH);
    return parseCsv(text);
  } catch (error) {
    logger.error(`Failed to load schools from ${CONFIG.SCHOOLS_CSV_PATH}: ${error.message}`);
    return [];
  }
}

/**
 * Write a single school page using PageBuilder service.
 *
 * @param {Object} school
 */
async function writeSchoolPage(school) {
  const pageData = buildSchoolPageData(school);
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
      logger.error(`Failed to create directory ${fullPath}: ${err.message}`);
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
      logger.error(`Failed to create province directory ${fullPath}: ${err.message}`);
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

  let successful = 0;
  let failed = 0;

  for (const province of provinces) {
    try {
      const pageData = buildProvincePageData(province.name, schools);
      const outputPath = path.join(distDir, pageData.relativePath);
      await safeWriteFile(outputPath, pageData.content);
      successful++;
    } catch (err) {
      logger.error(`Failed to generate province page for ${province.name}: ${err.message}`);
      failed++;
    }
  }

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
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 */
async function writeSchoolPagesConcurrently(
  schools,
  concurrencyLimit = CONFIG.BUILD_CONCURRENCY_LIMIT
) {
  await preCreateDirectories(schools);

  const limiter = new RateLimiter({
    maxConcurrent: concurrencyLimit,
    queueTimeoutMs: CONFIG.RATE_LIMITER_DEFAULTS.QUEUE_TIMEOUT_MS,
  });

  let processed = 0;
  const results = [];

  const writePromises = schools.map(school =>
    limiter.execute(async () => {
      await writeSchoolPage(school);
      processed++;

      if (processed % 100 === 0 || processed === schools.length) {
        logger.info(`Processed ${processed} of ${schools.length} school pages`);
      }
    }, `writeSchoolPage-${school.npsn}`)
  );

  const writeResults = await Promise.allSettled(writePromises);
  results.push(...writeResults);

  const metrics = limiter.getMetrics();
  logger.info('Build metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;

  if (failed > 0) {
    logger.warn(`Warning: ${failed} school pages failed to generate`);
  }

  return { successful, failed };
}

/**
 * Create manifest object from schools.
 * @param {Array<Object>} schools - School records
 */
function createManifestFromSchools(schools) {
  const manifest = {
    version: 1,
    lastBuild: new Date().toISOString(),
    schools: {},
  };

  for (const school of schools) {
    const npsn = school.npsn;
    const hash = computeSchoolHash(school);
    const pageData = buildSchoolPageData(school);

    manifest.schools[npsn] = {
      hash,
      builtAt: new Date().toISOString(),
      path: pageData.relativePath,
    };
  }

  return manifest;
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

  if (incremental) {
    return buildIncremental();
  }

  await ensureDistDir();

  await generateExternalStyles();

  const schools = await loadSchools();
  logger.info(`Loaded ${schools.length} schools from CSV`);

  if (schools.length === 0) {
    throw new Error(
      'No schools loaded from CSV. Build aborted - ensure schools.csv exists and contains valid data.'
    );
  }

  // Generate homepage
  console.log(`Loaded ${schools.length} schools from CSV`);

  // Generate homepage
  logger.info('Generating homepage...');
  const homepageHtml = generateHomepageHtml(schools);
  await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
  logger.info('Generated homepage (index.html)');

  // Generate province pages
  await generateProvincePages(schools);

  const { successful, failed } = await writeSchoolPagesConcurrently(schools);
  logger.info(`Generated ${successful} school pages (${failed} failed)`);

  // Save manifest for incremental builds
  await saveManifest(createManifestFromSchools(schools));
  logger.info('Build manifest saved');
}

/**
 * Incremental build - only rebuilds pages that have changed.
 * Uses a manifest file to track built files and their content hashes.
 */
async function buildIncremental() {
  await ensureDistDir();

  await generateExternalStyles();

  const schools = await loadSchools();
  logger.info(`Loaded ${schools.length} schools from CSV`);

  if (schools.length === 0) {
    throw new Error(
      'No schools loaded from CSV. Build aborted - ensure schools.csv exists and contains valid data.'
    );
  }

  // Load manifest to check for changes
  console.log(`Loaded ${schools.length} schools from CSV`);

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

  // Generate homepage (always regenerate as it lists all schools)
  logger.info('Generating homepage...');
  const homepageHtml = generateHomepageHtml(schools);
  await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
  logger.info('Generated homepage (index.html)');

  // Generate province pages (always regenerate)
  await generateProvincePages(schools);

  if (schoolsToBuild.length === 0) {
    logger.info('No pages to rebuild');
  } else {
    const { successful, failed } = await writeSchoolPagesConcurrently(schoolsToBuild);
    logger.info(`Generated ${successful} school pages (${failed} failed)`);
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
