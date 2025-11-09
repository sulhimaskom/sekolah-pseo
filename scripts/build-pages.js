/*
 * Static page generator. Reads the normalised schools dataset and writes
 * individual pages for each school as well as index pages for provinces,
 * kabupaten/kota and kecamatan.
 *
 * This script is a skeleton to illustrate the structure expected by the
 * project plan. To actually generate pages you need to integrate with
 * your chosen SSG (Astro or Eleventy) and template files under src/templates.
 */

const fs = require('fs').promises;
const path = require('path');
const slugify = require('./slugify');
const { parseCsv } = require('./utils');
const CONFIG = require('./config');

// Ensure dist directory exists
const distDir = CONFIG.DIST_DIR;

/**
 * Ensure the dist directory exists.
 */
async function ensureDistDir() {
  try {
    await fs.mkdir(distDir, { recursive: true });
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
    const text = await fs.readFile(CONFIG.SCHOOLS_CSV_PATH, 'utf8');
    return parseCsv(text);
  } catch (error) {
    console.error(`Failed to load schools from ${CONFIG.SCHOOLS_CSV_PATH}: ${error.message}`);
    return [];
  }
}

/**
 * Write a single school page. In a real implementation you would render an
 * Astro/Eleventy template here. For now we create a simple HTML stub with
 * placeholders.
 *
 * @param {Object} school
 */
async function writeSchoolPage(school) {
  // Validate school object
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }
  
  // Ensure required fields exist
  if (!school.provinsi || !school.kab_kota || !school.kecamatan || !school.npsn || !school.nama) {
    throw new Error('School object missing required fields');
  }
  
  // Pre-compute slugs to avoid redundant calls
  const provinsiSlug = slugify(school.provinsi);
  const kabKotaSlug = slugify(school.kab_kota);
  const kecamatanSlug = slugify(school.kecamatan);
  const namaSlug = slugify(school.nama);
  
  const outDir = path.join(
    __dirname,
    '..',
    'dist',
    'provinsi',
    provinsiSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug
  );
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${school.npsn}-${namaSlug}.html`;
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${school.nama}</title>\n</head>\n<body>\n  <h1>${school.nama}</h1>\n  <p>Alamat: ${school.alamat}</p>\n  <p>Jenjang: ${school.bentuk_pendidikan}</p>\n  <p>Status: ${school.status}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n  <!-- For implementation, integrate with Astro templates in src/templates/ -->\n</body>\n</html>`;
  await fs.writeFile(path.join(outDir, filename), content, 'utf8');
}

/**
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 */
async function writeSchoolPagesConcurrently(schools, concurrencyLimit = CONFIG.BUILD_CONCURRENCY_LIMIT) {
  const results = [];
  for (let i = 0; i < schools.length; i += concurrencyLimit) {
    const batch = schools.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(school => writeSchoolPage(school));
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Log progress every batch
    console.log(`Processed ${Math.min(i + concurrencyLimit, schools.length)} of ${schools.length} school pages`);
  }
  
  // Count successful and failed operations
  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;
  
  if (failed > 0) {
    console.warn(`Warning: ${failed} school pages failed to generate`);
  }
  
  return { successful, failed };
}

/**
 * Main build function. Iterates over all schools, writing pages. You can add
 * flags to limit by region to adhere to the monthly build cap.
 */
async function build() {
  // Ensure dist directory exists before building
  await ensureDistDir();
  
  const schools = await loadSchools();
  console.log(`Loaded ${schools.length} schools from CSV`);
  
  const { successful, failed } = await writeSchoolPagesConcurrently(schools, CONFIG.BUILD_CONCURRENCY_LIMIT);
  console.log(`Generated ${successful} school pages (${failed} failed)`);
}

if (require.main === module) {
  build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}
