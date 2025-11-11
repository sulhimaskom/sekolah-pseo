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

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');

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
  const csvPath = path.join(__dirname, '../data/schools.csv');
  
  // Validate csvPath to prevent path traversal vulnerabilities
  if (!path.isAbsolute(csvPath) && csvPath.includes('..')) {
    console.error(`Invalid CSV file path: ${csvPath}. Path traversal is not allowed.`);
    return [];
  }
  
  try {
    const text = await fs.readFile(csvPath, 'utf8');
    return parseCsv(text);
  } catch (error) {
    console.error(`Failed to load schools from ${csvPath}: ${error.message}`);
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
  
  // Validate slugs to prevent path traversal
  if (provinsiSlug.includes('..') || kabKotaSlug.includes('..') || kecamatanSlug.includes('..') || namaSlug.includes('..')) {
    throw new Error('Invalid slug values that could cause path traversal');
  }
  
  const outDir = path.join(
    __dirname,
    '..',n    'dist',
    'provinsi',
    provinsiSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug
  );
  
  // Validate outDir to prevent path traversal
  if (!outDir.startsWith(path.join(__dirname, '../dist'))) {
    throw new Error('Invalid output directory path that could cause path traversal');
  }
  
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${school.npsn}-${namaSlug}.html`;
  
  // Validate filename to prevent path traversal
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error('Invalid filename that could cause path traversal');
  }
  
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${escapeHtml(school.nama)}</title>\n</head>\n<body>\n  <h1>${escapeHtml(school.nama)}</h1>\n  <p>Alamat: ${escapeHtml(school.alamat)}</p>\n  <p>Jenjang: ${escapeHtml(school.bentuk_pendidikan)}</p>\n  <p>Status: ${escapeHtml(school.status)}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n  <!-- For implementation, integrate with Astro templates in src/templates/ -->\n</body>\n</html>`;
  await fs.writeFile(path.join(outDir, filename), content, 'utf8');
}

/**
 * Escape HTML characters to prevent XSS vulnerabilities
 * 
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 */
async function writeSchoolPagesConcurrently(schools, concurrencyLimit = parseInt(process.env.BUILD_CONCURRENCY_LIMIT) || 100) {
  // Validate inputs
  if (!Array.isArray(schools)) {
    throw new Error('Schools must be an array');
  }
  
  if (typeof concurrencyLimit !== 'number' || concurrencyLimit <= 0) {
    concurrencyLimit = 100; // Default value
  }
  
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
  try {
    // Ensure dist directory exists before building
    await ensureDistDir();
    
    const schools = await loadSchools();
    console.log(`Loaded ${schools.length} schools from CSV`);
    
    if (schools.length === 0) {
      console.warn('No schools found in CSV file. Nothing to build.');
      return;
    }
    
    // Allow concurrency limit to be configured via environment variable
    const concurrencyLimit = parseInt(process.env.BUILD_CONCURRENCY_LIMIT) || 100;
    const { successful, failed } = await writeSchoolPagesConcurrently(schools, concurrencyLimit);
    console.log(`Generated ${successful} school pages (${failed} failed)`);
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}
