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
const { parseCsv } = require('./csv-utils');

/**
 * Load the processed schools CSV into an array of objects.
 */
function loadSchools() {
  const csvPath = path.join(__dirname, '../data/schools.csv');
  const text = fs.readFileSync(csvPath, 'utf8');
  return parseCsv(text);
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
  fs.mkdirSync(outDir, { recursive: true });
  const filename = `${school.npsn}-${slugify(school.nama)}.html`;
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${escapeHtml(school.nama)}</title>\n</head>\n<body>\n  <h1>${escapeHtml(school.nama)}</h1>\n  <p>Alamat: ${escapeHtml(school.alamat)}</p>\n  <p>Jenjang: ${escapeHtml(school.bentuk_pendidikan)}</p>\n  <p>Status: ${escapeHtml(school.status)}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n</body>\n</html>`;
  fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
}

/**
 * Escape HTML special characters to prevent XSS vulnerabilities.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main build function. Iterates over all schools, writing pages. You can add
 * flags to limit by region to adhere to the monthly build cap.
 */
function build() {
  const schools = loadSchools();
  schools.forEach(writeSchoolPage);
  console.log(`Generated ${schools.length} school pages`);
}

if (require.main === module) {
  build();
}
