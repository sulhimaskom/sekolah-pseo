'use strict';

const path = require('path');
const slugify = require('../../scripts/slugify');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');
const { generateProvincePageHtml } = require('../presenters/templates/province-page');

const REQUIRED_SCHOOL_FIELDS = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];

// WeakMap cache for getSchoolRelativePath - caches computed path by school object reference.
// This eliminates redundant slugify+path.join calls when the same school object is
// processed across multiple build phases (search data generation, page writing, manifest creation).
// WeakMap ensures automatic cleanup when school objects are garbage collected.
const relativePathCache = new WeakMap();

/**
 * Compute the relative path for a school page without generating HTML.
 * Lightweight alternative to buildSchoolPageData() for cases where only the path is needed.
 * Results are cached via WeakMap keyed by school object reference.
 * @param {Object} school - School data object
 * @returns {string} Relative path for the school page
 */
function getSchoolRelativePath(school) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  // Check WeakMap cache first
  const cached = relativePathCache.get(school);
  if (cached !== undefined) {
    return cached;
  }

  const missingFields = REQUIRED_SCHOOL_FIELDS.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const provinsiSlug = slugify(school.provinsi);
  const kabKotaSlug = slugify(school.kab_kota);
  const kecamatanSlug = slugify(school.kecamatan);
  const namaSlug = slugify(school.nama);

  const result = path.join(
    'provinsi',
    provinsiSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug,
    `${school.npsn}-${namaSlug}.html`
  );

  // Cache by school object reference
  relativePathCache.set(school, result);
  return result;
}

function buildSchoolPageData(school, enrichment) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const missingFields = REQUIRED_SCHOOL_FIELDS.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const relativePath = getSchoolRelativePath(school);

  return {
    relativePath,
    content: generateSchoolPageHtml(school, relativePath, enrichment),
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
 * @param {Array<Object>} schools - Array of school data objects (all schools or pre-filtered)
 * @param {boolean} [skipFilter=false] - When true, skip internal province filtering
 *        (schools array is assumed to be already filtered to this province)
 * @returns {Object} - Province page data with relativePath and content
 */
function buildProvincePageData(provinceName, schools, skipFilter = false) {
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
    content: generateProvincePageHtml(provinceName, schools, skipFilter),
  };
}

/**
 * Group schools by province in a single O(n) pass.
 *
 * Returns a Map of province name → filtered schools array.
 * Use this to pre-group schools once and then pass pre-filtered arrays
 * to buildProvincePageData with skipFilter=true, eliminating the
 * per-province filterSchoolsByProvince call (O(n×p) → O(n)).
 *
 * @param {Array<Object>} schools - Array of all school data objects
 * @returns {Map<string, Array<Object>>} Map of province name → schools in that province
 */
function groupSchoolsByProvince(schools) {
  if (!Array.isArray(schools)) {
    return new Map();
  }

  const grouped = new Map();

  for (const school of schools) {
    if (!school.provinsi) continue;

    if (!grouped.has(school.provinsi)) {
      grouped.set(school.provinsi, []);
    }
    grouped.get(school.provinsi).push(school);
  }

  return grouped;
}

module.exports = {
  buildSchoolPageData,
  getSchoolRelativePath,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
  groupSchoolsByProvince,
};
