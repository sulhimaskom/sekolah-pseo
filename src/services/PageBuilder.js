const path = require('path');
const slugify = require('../../scripts/slugify');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');
const { generateProvincePageHtml } = require('../presenters/templates/province-page');

/**
 * Module-level cache for slugified values.
 * Pre-computes slugs to avoid repeated slugify calls across school processing.
 * This addresses the issue where the same province/kabupaten/kecamatan
 * values are repeated across multiple schools.
 */
const slugCache = new Map();

/**
 * Cached slugify function that uses module-level cache for O(1) lookups.
 * @param {string} input - String to slugify
 * @returns {string} - Slugified string
 */
function cachedSlugify(input) {
  if (typeof input !== 'string') {
    return '';
  }

  if (slugCache.has(input)) {
    return slugCache.get(input);
  }

  const slug = slugify(input);
  slugCache.set(input, slug);
  return slug;
}

/**
 * Pre-compute slugs for all unique location values in the schools array.
 * Call this once before processing schools to populate the cache.
 * @param {Array<Object>} schools - Array of school data objects
 */
function precomputeSlugCache(schools) {
  if (!Array.isArray(schools)) {
    return;
  }

  const uniqueValues = new Set();

  for (const school of schools) {
    if (school.provinsi) uniqueValues.add(school.provinsi);
    if (school.kab_kota) uniqueValues.add(school.kab_kota);
    if (school.kecamatan) uniqueValues.add(school.kecamatan);
    if (school.nama) uniqueValues.add(school.nama);
  }

  for (const value of uniqueValues) {
    if (!slugCache.has(value)) {
      slugCache.set(value, slugify(value));
    }
  }
}

/**
 * Clear the slug cache. Useful for testing or between build runs.
 */
function clearSlugCache() {
  slugCache.clear();
}

/**
 * Get cache statistics for monitoring.
 * @returns {Object} - Cache stats (size, hit rate, etc.)
 */
function getSlugCacheStats() {
  return {
    size: slugCache.size,
  };
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
  // New caching utilities
  precomputeSlugCache,
  clearSlugCache,
  getSlugCacheStats,
};
