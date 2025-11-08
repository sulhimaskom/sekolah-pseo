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

/**
 * Load the processed schools CSV into an array of objects.
 */
async function loadSchools() {
  const csvPath = path.join(__dirname, '../data/schools.csv');
  const text = await fs.readFile(csvPath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift().split(',');
  return lines.map(l => {
    const values = l.split(',');
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

/**
 * Write a single school page. In a real implementation you would render an
 * Astro/Eleventy template here. For now we create a simple HTML stub with
 * placeholders.
 *
 * @param {Object} school
 */
async function writeSchoolPage(school) {
  const outDir = path.join(
    __dirname,
    '..',
    'dist',
    'provinsi',
    slugify(school.provinsi),
    'kabupaten',
    slugify(school.kab_kota),
    'kecamatan',
    slugify(school.kecamatan)
  );
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${school.npsn}-${slugify(school.nama)}.html`;
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${school.nama}</title>\n</head>\n<body>\n  <h1>${school.nama}</h1>\n  <p>Alamat: ${school.alamat}</p>\n  <p>Jenjang: ${school.bentuk_pendidikan}</p>\n  <p>Status: ${school.status}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n</body>\n</html>`;
  await fs.writeFile(path.join(outDir, filename), content, 'utf8');
}

/**
 * Write multiple school pages concurrently with a controlled concurrency limit
 * to avoid overwhelming the file system.
 *
 * @param {Array<Object>} schools
 * @param {number} concurrencyLimit
 */
async function writeSchoolPagesConcurrently(schools, concurrencyLimit = 100) {
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
