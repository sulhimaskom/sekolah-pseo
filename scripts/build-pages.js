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
const { parseCsv, escapeHtml } = require('./utils');
const CONFIG = require('./config');

// Export functions for testing
module.exports = {
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  ensureDistDir,
  loadSchools
};

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
  const filename = `${school.npsn}-${namaSlug}.html`;
  const content = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>${escapeHtml(school.nama)}</title>
</head>
<body>
  <h1>${escapeHtml(school.nama)}</h1>
  <p>Alamat: ${escapeHtml(school.alamat)}</p>
  <p>Jenjang: ${escapeHtml(school.bentuk_pendidikan)}</p>
  <p>Status: ${escapeHtml(school.status)}</p>
  <!-- TODO: Insert generator and FAQ components here -->
  <!-- For implementation, integrate with Astro templates in src/templates/ -->
</body>
</html>`;
  await fs.writeFile(path.join(outDir, filename), content, 'utf8');
}

/**
 * Pre-create all unique directories needed for schools to reduce redundant fs.mkdir calls.
 *
 * @param {Array<Object>} schools
 */
async function preCreateDirectories(schools) {
  const uniqueDirs = new Set();
  
  for (const school of schools) {
    const provinsiSlug = slugify(school.provinsi);
    const kabKotaSlug = slugify(school.kab_kota);
    const kecamatanSlug = slugify(school.kecamatan);
    
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
    uniqueDirs.add(outDir);
  }
  
  console.log(`Creating ${uniqueDirs.size} unique directories...`);
  
  const dirPromises = Array.from(uniqueDirs).map(dir => 
    fs.mkdir(dir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') {
        console.error(`Failed to create directory ${dir}: ${err.message}`);
      }
    })
  );
  
  await Promise.all(dirPromises);
}

/**
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 */
async function writeSchoolPagesConcurrently(schools, concurrencyLimit = CONFIG.BUILD_CONCURRENCY_LIMIT) {
  await preCreateDirectories(schools);
  
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
  
  const { successful, failed } = await writeSchoolPagesConcurrently(schools);
  console.log(`Generated ${successful} school pages (${failed} failed)`);
}

if (require.main === module) {
  build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}
