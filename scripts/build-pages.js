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
const CONFIG = require('./config');
const { safeReadFile, safeWriteFile, safeMkdir } = require('./fs-safe');
const { buildSchoolPageData, getUniqueDirectories } = require('../src/services/PageBuilder');
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
  build,
  buildIncremental,
  computeSchoolHash,
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
    console.error(`Failed to create dist directory: ${error.message}`);
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
    console.error(`Failed to load schools from ${CONFIG.SCHOOLS_CSV_PATH}: ${error.message}`);
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

  console.log(`Creating ${uniqueDirs.length} unique directories...`);

  const dirPromises = uniqueDirs.map(dir => {
    const fullPath = path.join(distDir, dir);
    return safeMkdir(fullPath).catch(err => {
      console.error(`Failed to create directory ${fullPath}: ${err.message}`);
    });
  });

  await Promise.all(dirPromises);
}

/**
 * Generate external styles.css file.
 */
async function generateExternalStyles() {
  console.log('Generating external styles.css...');
  await writeExternalStylesFile(distDir);
  console.log('Generated styles.css');
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
    queueTimeoutMs: 30000,
  });

  let processed = 0;
  const results = [];

  const writePromises = schools.map(school =>
    limiter.execute(async () => {
      await writeSchoolPage(school);
      processed++;

      if (processed % 100 === 0 || processed === schools.length) {
        console.log(`Processed ${processed} of ${schools.length} school pages`);
      }
    }, `writeSchoolPage-${school.npsn}`)
  );

  const writeResults = await Promise.allSettled(writePromises);
  results.push(...writeResults);

  const metrics = limiter.getMetrics();
  console.log('Build metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;

  if (failed > 0) {
    console.warn(`Warning: ${failed} school pages failed to generate`);
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
 * 5. Generating and writing pages
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
  console.log(`Loaded ${schools.length} schools from CSV`);

  if (schools.length === 0) {
    throw new Error('No schools loaded from CSV. Build aborted - ensure schools.csv exists and contains valid data.');
  }

  // Generate homepage
  console.log(`Loaded ${schools.length} schools from CSV`);

  // Generate homepage
  console.log('Generating homepage...');
  const homepageHtml = generateHomepageHtml(schools);
  await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
  console.log('Generated homepage (index.html)');

  const { successful, failed } = await writeSchoolPagesConcurrently(schools);
  console.log(`Generated ${successful} school pages (${failed} failed)`);

  // Save manifest for incremental builds
  await saveManifest(createManifestFromSchools(schools));
  console.log('Build manifest saved');
}

/**
 * Incremental build - only rebuilds pages that have changed.
 * Uses a manifest file to track built files and their content hashes.
 */
async function buildIncremental() {
  await ensureDistDir();

  await generateExternalStyles();

  const schools = await loadSchools();
  console.log(`Loaded ${schools.length} schools from CSV`);

  if (schools.length === 0) {
    throw new Error('No schools loaded from CSV. Build aborted - ensure schools.csv exists and contains valid data.');
  }

  // Load manifest to check for changes
  console.log(`Loaded ${schools.length} schools from CSV`);

  // Load manifest to check for changes
  const manifest = await loadManifest();

  let schoolsToBuild = schools;

  if (manifest) {
    const { changed, unchanged } = getChangedSchools(schools, manifest);
    console.log(`Incremental build: ${unchanged.length} unchanged, ${changed.length} changed`);
    schoolsToBuild = changed;
  } else {
    console.log('No manifest found, performing full build');
  }

  // Generate homepage (always regenerate as it lists all schools)
  console.log('Generating homepage...');
  const homepageHtml = generateHomepageHtml(schools);
  await safeWriteFile(path.join(distDir, 'index.html'), homepageHtml);
  console.log('Generated homepage (index.html)');

  if (schoolsToBuild.length === 0) {
    console.log('No pages to rebuild');
  } else {
    const { successful, failed } = await writeSchoolPagesConcurrently(schoolsToBuild);
    console.log(`Generated ${successful} school pages (${failed} failed)`);
  }

  // Save manifest for future incremental builds
  await saveManifest(createManifestFromSchools(schools));
  console.log('Build manifest saved');
}

if (require.main === module) {
  build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}
