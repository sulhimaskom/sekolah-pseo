const path = require('path');
const slugify = require('../../scripts/slugify');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');
const { generateProvincePageHtml } = require('../presenters/templates/province-page');

function buildSchoolPageData(school) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const provinsiSlug = slugify(school.provinsi);
  const kabKotaSlug = slugify(school.kab_kota);
  const kecamatanSlug = slugify(school.kecamatan);
  const namaSlug = slugify(school.nama);

  const relativePath = path.join(
    'provinsi',
    provinsiSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug,
    `${school.npsn}-${namaSlug}.html`
  );

  return {
    relativePath,
    content: generateSchoolPageHtml(school, relativePath),
  };
}

function getUniqueDirectories(schools) {
  if (!Array.isArray(schools)) {
    throw new Error('schools must be an array');
  }

  const uniqueDirs = new Set();

  for (const school of schools) {
    const provinsiSlug = slugify(school.provinsi);
    const kabKotaSlug = slugify(school.kab_kota);
    const kecamatanSlug = slugify(school.kecamatan);

    const dirPath = path.join(
      'provinsi',
      provinsiSlug,
      'kabupaten',
      kabKotaSlug,
      'kecamatan',
      kecamatanSlug
    );

    uniqueDirs.add(dirPath);
  }

  return Array.from(uniqueDirs);
}

/**
 * Get unique provinces from schools list
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Object>} - Array of province objects with name, slug, and school count
 */
function getUniqueProvinces(schools) {
  if (!Array.isArray(schools)) {
    throw new Error('schools must be an array');
  }

  const provinceMap = new Map();

  for (const school of schools) {
    if (!school.provinsi) continue;

    const provinsiName = school.provinsi;
    if (!provinceMap.has(provinsiName)) {
      provinceMap.set(provinsiName, {
        name: provinsiName,
        slug: slugify(provinsiName),
        count: 0,
      });
    }

    const province = provinceMap.get(provinsiName);
    province.count++;
  }

  return Array.from(provinceMap.values());
}

/**
 * Build province page data
 * @param {string} provinceName - Province name
 * @param {Array<Object>} schools - Array of all school data objects
 * @returns {Object} - Province page data with relativePath and content
 */
function buildProvincePageData(provinceName, schools) {
  if (!provinceName || typeof provinceName !== 'string') {
    throw new Error('Invalid province name provided');
  }

  if (!Array.isArray(schools)) {
    throw new Error('schools must be an array');
  }

  const provinceSlug = slugify(provinceName);
  const relativePath = path.join('provinsi', provinceSlug, 'index.html');

  return {
    relativePath,
    content: generateProvincePageHtml(provinceName, schools),
  };
}

module.exports = {
  buildSchoolPageData,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
};
