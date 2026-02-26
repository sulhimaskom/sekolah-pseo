const path = require('path');
const slugify = require('../../scripts/slugify');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');
const { generateProvincePageHtml } = require('../presenters/templates/province-page');

// Simple memoization cache for slugify to avoid repeated computation
const slugCache = new Map();

/**
 * Cached version of slugify to avoid repeated computation for the same input
 * @param {string} text - Text to convert to slug
 * @returns {string} - Slugified text
 */
function cachedSlugify(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (!slugCache.has(text)) {
    slugCache.set(text, slugify(text));
  }

  return slugCache.get(text);
}

/**
 * Clear the slug cache (useful for testing)
 */
function clearSlugCache() {
  slugCache.clear();
}

function buildSchoolPageData(school) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const provinsiSlug = cachedSlugify(school.provinsi);
  const kabKotaSlug = cachedSlugify(school.kab_kota);
  const kecamatanSlug = cachedSlugify(school.kecamatan);
  const namaSlug = cachedSlugify(school.nama);

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
    const provinsiSlug = cachedSlugify(school.provinsi);
    const kabKotaSlug = cachedSlugify(school.kab_kota);
    const kecamatanSlug = cachedSlugify(school.kecamatan);

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
        slug: cachedSlugify(provinsiName),
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

  const provinceSlug = cachedSlugify(provinceName);
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
  clearSlugCache,
};
