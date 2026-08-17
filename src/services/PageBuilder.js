'use strict';

const path = require('path');
const slugify = require('../../scripts/slugify');
const { IntegrationError, ERROR_CODES } = require('../../scripts/resilience');
const { REQUIRED_SCHOOL_FIELDS, SEARCH_DATA_FIELDS } = require('../../scripts/data-schema');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');
const { generateProvincePageHtml } = require('../presenters/templates/province-page');
const { generateKabupatenPageHtml } = require('../presenters/templates/kabupaten-page');
const { generateKecamatanPageHtml } = require('../presenters/templates/kecamatan-page');
const { generateHomepageHtml } = require('../presenters/templates/homepage');

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
    throw new IntegrationError('Invalid school object provided', ERROR_CODES.INVALID_INPUT, {
      field: 'school',
      expectedType: 'object',
    });
  }

  const cached = relativePathCache.get(school);
  if (cached !== undefined) {
    return cached;
  }

  const missingFields = REQUIRED_SCHOOL_FIELDS.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new IntegrationError(
      `School object missing required fields: ${missingFields.join(', ')}`,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      { missingFields }
    );
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

  relativePathCache.set(school, result);
  return result;
}

function buildSchoolPageData(school, enrichment) {
  if (!school || typeof school !== 'object') {
    throw new IntegrationError('Invalid school object provided', ERROR_CODES.INVALID_INPUT, {
      field: 'school',
      expectedType: 'object',
    });
  }

  const missingFields = REQUIRED_SCHOOL_FIELDS.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new IntegrationError(
      `School object missing required fields: ${missingFields.join(', ')}`,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      { missingFields }
    );
  }

  const relativePath = getSchoolRelativePath(school);

  return {
    relativePath,
    content: generateSchoolPageHtml(school, relativePath, enrichment),
  };
}

function getUniqueDirectories(schools) {
  if (!Array.isArray(schools)) {
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
  }

  const uniqueDirs = new Set();

  for (const school of schools) {
    // Use getSchoolRelativePath (WeakMap-cached) to eliminate duplicate path computation.
    // Wrap in try-catch because getSchoolRelativePath validates all school fields including
    // npsn/nama, while getUniqueDirectories only needs directory-level fields (provinsi,
    // kab_kota, kecamatan). Invalid schools are skipped here; their failure is handled
    // later by the caller (e.g. writeSchoolPagesConcurrently).
    try {
      const relPath = getSchoolRelativePath(school);
      uniqueDirs.add(path.dirname(relPath));
    } catch {
      // School is missing required fields for path computation — skip it.
      // The caller will handle the validation error downstream.
    }
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
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
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
    throw new IntegrationError('Invalid province name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'provinceName',
      expectedType: 'non-empty string',
    });
  }

  if (!Array.isArray(schools)) {
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
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

/**
 * Build homepage data (HTML content).
 * Routes through PageBuilder so controllers don't import templates directly.
 *
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {string} Homepage HTML content
 */
function buildHomepageData(schools) {
  if (!Array.isArray(schools)) {
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
  }

  return generateHomepageHtml(schools);
}

/**
 * Group schools by kabupaten/kota within their province in a single O(n) pass.
 *
 * Returns a Map keyed by `${provinsi}\u0000${kab_kota}` → filtered schools array.
 * Use this to pre-group schools once and then pass pre-filtered arrays
 * to buildKabupatenPageData with skipFilter=true, eliminating the
 * per-kabupaten filterSchoolsByProvinceAndKabupaten call (O(n×k) → O(n)).
 *
 * @param {Array<Object>} schools - Array of all school data objects
 * @returns {Map<string, Array<Object>>} Map of `${provinsi}\u0000${kab_kota}` → schools
 */
function groupSchoolsByKabupaten(schools) {
  if (!Array.isArray(schools)) {
    return new Map();
  }

  const grouped = new Map();

  for (const school of schools) {
    if (!school.provinsi || !school.kab_kota) continue;

    const key = `${school.provinsi}\u0000${school.kab_kota}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(school);
  }

  return grouped;
}

/**
 * Group schools by kecamatan within their province/kabupaten in a single O(n) pass.
 *
 * Returns a Map keyed by `${provinsi}\u0000${kab_kota}\u0000${kecamatan}` → filtered
 * schools array. Use this to pre-group schools once and then pass pre-filtered
 * arrays to buildKecamatanPageData with skipFilter=true, eliminating the
 * per-kecamatan filterSchoolsByLocation call (O(n×c) → O(n)).
 *
 * @param {Array<Object>} schools - Array of all school data objects
 * @returns {Map<string, Array<Object>>} Map of `${provinsi}\u0000${kab_kota}\u0000${kecamatan}` → schools
 */
function groupSchoolsByKecamatan(schools) {
  if (!Array.isArray(schools)) {
    return new Map();
  }

  const grouped = new Map();

  for (const school of schools) {
    if (!school.provinsi || !school.kab_kota || !school.kecamatan) continue;

    const key = `${school.provinsi}\u0000${school.kab_kota}\u0000${school.kecamatan}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(school);
  }

  return grouped;
}

/**
 * Build kabupaten/kota page data (HTML content).
 *
 * @param {string} provinceName - Province name
 * @param {string} kabKotaName - Kabupaten/Kota name
 * @param {Array<Object>} schools - Array of school data objects (all schools or pre-filtered)
 * @param {boolean} [skipFilter=false] - When true, skip internal kabupaten filtering
 *        (schools array is assumed to be already filtered to this kabupaten)
 * @returns {Object} - Kabupaten page data with relativePath and content
 */
function buildKabupatenPageData(provinceName, kabKotaName, schools, skipFilter = false) {
  if (!provinceName || typeof provinceName !== 'string') {
    throw new IntegrationError('Invalid province name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'provinceName',
      expectedType: 'non-empty string',
    });
  }

  if (!kabKotaName || typeof kabKotaName !== 'string') {
    throw new IntegrationError('Invalid kabupaten name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'kabKotaName',
      expectedType: 'non-empty string',
    });
  }

  if (!Array.isArray(schools)) {
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
  }

  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);
  const relativePath = path.join('provinsi', provinceSlug, 'kabupaten', kabKotaSlug, 'index.html');

  return {
    relativePath,
    content: generateKabupatenPageHtml(provinceName, kabKotaName, schools, skipFilter),
  };
}

/**
 * Build kecamatan page data (HTML content).
 *
 * @param {string} provinceName - Province name
 * @param {string} kabKotaName - Kabupaten/Kota name
 * @param {string} kecamatanName - Kecamatan name
 * @param {Array<Object>} schools - Array of school data objects (all schools or pre-filtered)
 * @param {boolean} [skipFilter=false] - When true, skip internal kecamatan filtering
 *        (schools array is assumed to be already filtered to this kecamatan)
 * @returns {Object} - Kecamatan page data with relativePath and content
 */
function buildKecamatanPageData(
  provinceName,
  kabKotaName,
  kecamatanName,
  schools,
  skipFilter = false
) {
  if (!provinceName || typeof provinceName !== 'string') {
    throw new IntegrationError('Invalid province name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'provinceName',
      expectedType: 'non-empty string',
    });
  }

  if (!kabKotaName || typeof kabKotaName !== 'string') {
    throw new IntegrationError('Invalid kabupaten name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'kabKotaName',
      expectedType: 'non-empty string',
    });
  }

  if (!kecamatanName || typeof kecamatanName !== 'string') {
    throw new IntegrationError('Invalid kecamatan name provided', ERROR_CODES.INVALID_INPUT, {
      field: 'kecamatanName',
      expectedType: 'non-empty string',
    });
  }

  if (!Array.isArray(schools)) {
    throw new IntegrationError('schools must be an array', ERROR_CODES.INVALID_INPUT, {
      field: 'schools',
      expectedType: 'array',
    });
  }

  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);
  const kecamatanSlug = slugify(kecamatanName);
  const relativePath = path.join(
    'provinsi',
    provinceSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug,
    'index.html'
  );

  return {
    relativePath,
    content: generateKecamatanPageHtml(
      provinceName,
      kabKotaName,
      kecamatanName,
      schools,
      skipFilter
    ),
  };
}

/**
 * Prepare minimal school data for client-side search.
 * This belongs in the service layer (not the template/presenter) because it:
 * 1. Computes relative paths via getSchoolRelativePath() (service concern)
 * 2. Transforms data shape for serialization (data transformation, not presentation)
 * 3. Returns a flat array format that saves ~13% payload over object format
 *
 * Field order is defined by `SEARCH_DATA_FIELDS` (scripts/data-schema.js) — the
 * single source of truth shared with the client-side converter in homepage.js.
 *
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Array<string>>} - Array of flat arrays ordered by SEARCH_DATA_FIELDS
 */
function prepareSchoolDataForSearch(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  const logger = require('../../scripts/logger');

  // F046: isolate per-school failures — a single malformed row must not abort
  // the whole build via the search-data path (page pipeline already guards per-school).
  const result = [];
  for (const school of schools) {
    try {
      const relPath = getSchoolRelativePath(school);
      result.push(
        SEARCH_DATA_FIELDS.map(field => {
          if (field === 'url') {
            return '/' + relPath;
          }
          return school[field] || '';
        })
      );
    } catch (err) {
      logger.warn(`Skipping invalid school row in search data: ${err.message}`);
    }
  }
  return result;
}

module.exports = {
  buildSchoolPageData,
  buildHomepageData,
  getSchoolRelativePath,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
  groupSchoolsByProvince,
  buildKabupatenPageData,
  buildKecamatanPageData,
  groupSchoolsByKabupaten,
  groupSchoolsByKecamatan,
  prepareSchoolDataForSearch,
};
