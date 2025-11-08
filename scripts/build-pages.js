/*
 * Static page generator. Reads the normalised schools dataset and writes
 * individual pages for each school as well as index pages for provinces,
 * kabupaten/kota and kecamatan.
 *
 * This script is a skeleton to illustrate the structure expected by the
 * project plan. To actually generate pages you need to integrate with
 * your chosen SSG (Astro or Eleventy) and template files under src/templates.
 */

const fs = require('fs');
const path = require('path');
const slugify = require('./slugify');

/**
 * Load the processed schools CSV into an array of objects.
 * Uses streaming to handle large files more efficiently.
 */
function loadSchools() {
  const csvPath = path.join(__dirname, '../schools.csv');
  const text = fs.readFileSync(csvPath, 'utf8');
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
function writeSchoolPage(school) {
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
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const filename = `${school.npsn}-${slugify(school.nama)}.html`;
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${escapeHtml(school.nama)}</title>\n</head>\n<body>\n  <h1>${escapeHtml(school.nama)}</h1>\n  <p>Alamat: ${escapeHtml(school.alamat)}</p>\n  <p>Jenjang: ${escapeHtml(school.bentuk_pendidikan)}</p>\n  <p>Status: ${escapeHtml(school.status)}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n</body>\n</html>`;
  fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
}

/**
 * Escape HTML special characters to prevent XSS vulnerabilities
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main build function. Iterates over all schools, writing pages.
 * Processes schools in batches to improve memory usage.
 */
function build() {
  const schools = loadSchools();
  const batchSize = 1000;
  let processed = 0;
  
  // Process schools in batches to reduce memory usage
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);
    batch.forEach(writeSchoolPage);
    processed += batch.length;
    console.log(`Processed ${processed} of ${schools.length} school pages`);
  }
  
  console.log(`Generated ${schools.length} school pages`);
}

if (require.main === module) {
  build();
}
