/*
 * ETL Script for Indonesian School Data
 *
 * This script reads the raw dataset from the external `daftar‑sekolah‑indonesia`
 * repository and produces a normalized CSV at `data/schools.csv`.
 *
 * Responsibilities:
 *  - Load raw CSV or JSON files from the cloned repository
 *  - Normalise field names to a standard schema (see plan.md and task.md)
 *  - Sanitize values: trim whitespace, unify case, remove special characters
 *  - Validate records: ensure numeric NPSN, consistent province/district names,
 *    and plausible coordinates
 *  - Append an `updated_at` timestamp to each record
 *  - Write the result to `data/schools.csv`
 *
 * This file is intentionally kept simple to avoid adding external dependencies.
 * It uses Node.js built‑in modules (fs) and a minimal CSV parser. In a real
 * implementation you may consider using a robust library such as `csv-parse`
 * or `papaparse`.
 */

const { parseCsv, writeCsv } = require('./utils');
const logger = require('./logger');
const CONFIG = require('./config');
const { safeReadFile, safeAccess } = require('./fs-safe');

// Export functions for testing
module.exports = {
  parseCsv,
  sanitize,
  normaliseRecord,
  validateRecord,
  validateLatLon,
  validateCategoricalField,
  checkNpsnUniqueness,
  generateDataQualityReport,
};

/**
 * Sanitize a string by trimming whitespace, collapsing multiple spaces and
 * removing problematic characters. Update this function to suit your needs.
 *
 * @param {string} value
 * @returns {string}
 */
function sanitize(value) {
  if (typeof value !== 'string') {
    return '';
  }

  // Cache regex patterns to avoid recreating them each time
  const whitespaceRegex = /\s+/g;
  const controlCharsRegex = /[\u0000-\u001F]/g;
  const nonPrintableRegex = /[^\x20-\x7E\u00A0-\u017F\u0190-\u024F\u1E00-\u1EFF]/g;

  return value
    .replace(whitespaceRegex, ' ') // collapse whitespace
    .replace(controlCharsRegex, '') // remove control chars
    .trim()
    .replace(nonPrintableRegex, ''); // remove non-printable characters except common Unicode
}

/**
 * Normalise a record into the canonical schema expected by the site generator.
 *
 * @param {Object} raw
 * @returns {Object}
 */
function normaliseRecord(raw) {
  // Handle case where raw is null or undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  // Cache the current date to avoid creating multiple Date objects
  const currentDate = new Date().toISOString().split('T')[0];

  return {
    npsn: sanitize(raw.npsn || raw.NPSN || ''),
    nama: sanitize(raw.nama || raw.nama_sekolah || raw.Nama || ''),
    bentuk_pendidikan: sanitize(raw.bentuk_pendidikan || raw.jenjang || ''),
    status: sanitize(raw.status || raw.status_sekolah || ''),
    alamat: sanitize(raw.alamat || raw.alamat_jalan || ''),
    kelurahan: sanitize(raw.kelurahan || raw.desa || ''),
    kecamatan: sanitize(raw.kecamatan || ''),
    kab_kota: sanitize(raw.kabupaten || raw.kab_kota || raw.kota || ''),
    provinsi: sanitize(raw.provinsi || ''),
    lat: sanitize(raw.lat || raw.latitude || ''),
    lon: sanitize(raw.lon || raw.longitude || ''),
    updated_at: currentDate,
  };
}

/**
 * Validate a normalized record to ensure it meets the required criteria.
 *
 * @param {Object} record
 * @returns {boolean}
 */
function validateRecord(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const requiredFields = ['npsn', 'nama', 'bentuk_pendidikan', 'provinsi', 'kab_kota', 'kecamatan'];

  for (const field of requiredFields) {
    if (!record[field] || record[field].trim() === '') {
      return false;
    }
  }

  if (!/^\d+$/.test(record.npsn)) {
    return false;
  }

  return true;
}

/**
 * Validate latitude and longitude coordinates for Indonesia bounds.
 * Indonesia: Latitude -11 to 6, Longitude 95 to 141
 *
 * @param {string} lat - Latitude as string
 * @param {string} lon - Longitude as string
 * @returns {boolean}
 */
function validateLatLon(lat, lon) {
  if (!lat || !lon) {
    return false;
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return false;
  }

  const { LAT_MIN, LAT_MAX, LON_MIN, LON_MAX } = CONFIG.INDONESIA_BOUNDS;

  return (
    latNum >= LAT_MIN &&
    latNum <= LAT_MAX &&
    lonNum >= LON_MIN &&
    lonNum <= LON_MAX
  );
}

/**
 * Validate categorical field against allowed values.
 *
 * @param {string} field - Field value to validate
 * @param {Array<string>} allowedValues - Array of allowed values
 * @returns {boolean}
 */
function validateCategoricalField(field, allowedValues) {
  if (!field || typeof field !== 'string') {
    return false;
  }

  return allowedValues.includes(field.trim());
}

/**
 * Check if all NPSN values in the dataset are unique.
 *
 * @param {Array<Object>} records - Array of school records
 * @returns {{isUnique: boolean, duplicates: Array<string>}}
 */
function checkNpsnUniqueness(records) {
  const npsnMap = new Map();
  const duplicates = [];

  for (const record of records) {
    const npsn = record.npsn;
    if (npsn) {
      if (npsnMap.has(npsn)) {
        if (!duplicates.includes(npsn)) {
          duplicates.push(npsn);
        }
      } else {
        npsnMap.set(npsn, true);
      }
    }
  }

  return {
    isUnique: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Generate data quality metrics report.
 *
 * @param {Array<Object>} records - Array of school records
 * @returns {Object}
 */
function generateDataQualityReport(records) {
  const totalRecords = records.length;
  const metrics = {
    totalRecords,
    fieldCompleteness: {},
    coordinateStats: {
      validCoordinates: 0,
      missingCoordinates: 0,
      invalidCoordinates: 0,
    },
    uniqueness: {
      uniqueNpsn: 0,
      duplicateNpsn: 0,
    },
    categoricalDistribution: {},
  };

  const fields = [
    'npsn',
    'nama',
    'bentuk_pendidikan',
    'status',
    'alamat',
    'kelurahan',
    'kecamatan',
    'kab_kota',
    'provinsi',
    'lat',
    'lon',
  ];

  for (const field of fields) {
    const filledCount = records.filter(r => r[field] && r[field].trim() !== '').length;
    metrics.fieldCompleteness[field] = {
      filled: filledCount,
      missing: totalRecords - filledCount,
      percentage: ((filledCount / totalRecords) * 100).toFixed(2),
    };
  }

  for (const record of records) {
    if (record.lat && record.lon) {
      if (validateLatLon(record.lat, record.lon)) {
        metrics.coordinateStats.validCoordinates++;
      } else {
        metrics.coordinateStats.invalidCoordinates++;
      }
    } else {
      metrics.coordinateStats.missingCoordinates++;
    }

    if (record.status) {
      metrics.categoricalDistribution.status = metrics.categoricalDistribution.status || {};
      const status = record.status;
      metrics.categoricalDistribution.status[status] =
        (metrics.categoricalDistribution.status[status] || 0) + 1;
    }

    if (record.bentuk_pendidikan) {
      metrics.categoricalDistribution.bentuk_pendidikan =
        metrics.categoricalDistribution.bentuk_pendidikan || {};
      const bentuk = record.bentuk_pendidikan;
      metrics.categoricalDistribution.bentuk_pendidikan[bentuk] =
        (metrics.categoricalDistribution.bentuk_pendidikan[bentuk] || 0) + 1;
    }
  }

  const npsnCheck = checkNpsnUniqueness(records);
  metrics.uniqueness.uniqueNpsn = totalRecords - npsnCheck.duplicates.length;
  metrics.uniqueness.duplicateNpsn = npsnCheck.duplicates.length;
  metrics.uniqueness.duplicates = npsnCheck.duplicates;

  return metrics;
}

/**
 * Entry point: read raw data, normalise and write output. For now this
 * function simply reads from a single CSV file at `external/raw.csv`.
 */
async function run() {
  const rawPath = CONFIG.RAW_DATA_PATH;
  try {
    await safeAccess(rawPath);
  } catch (error) {
    logger.error(`Raw data file not found at ${rawPath}. Please ensure the data file exists.`);
    logger.error(`Error details: ${error.message}`);
    process.exit(1);
  }

  try {
    const rawCsv = await safeReadFile(rawPath);
    const rawRecords = parseCsv(rawCsv);

    logger.info(`Loaded ${rawRecords.length} raw records`);

    const processed = [];
    const rejected = [];
    for (const record of rawRecords) {
      try {
        const normalized = normaliseRecord(record);
        if (validateRecord(normalized)) {
          processed.push(normalized);
        } else {
          rejected.push({
            npsn: normalized.npsn || 'N/A',
            reason: 'Missing required fields or invalid NPSN',
          });
        }
      } catch (recordError) {
        rejected.push({
          npsn: record.npsn || record.NPSN || 'N/A',
          reason: `Processing error: ${recordError.message}`,
        });
      }
    }

    logger.info(`Processed ${processed.length} valid records`);
    logger.info(`Rejected ${rejected.length} invalid records`);

    if (processed.length === 0) {
      logger.error('No valid records found after processing');
      process.exit(1);
    }

    const qualityReport = generateDataQualityReport(processed);

    logger.info('\n=== Data Quality Report ===');
    logger.info(`Total records: ${qualityReport.totalRecords}`);
    logger.info(`Valid coordinates: ${qualityReport.coordinateStats.validCoordinates}`);
    logger.info(`Missing coordinates: ${qualityReport.coordinateStats.missingCoordinates}`);
    logger.info(`Invalid coordinates: ${qualityReport.coordinateStats.invalidCoordinates}`);
    logger.info(`Unique NPSN: ${qualityReport.uniqueness.uniqueNpsn}`);
    logger.info(`Duplicate NPSN: ${qualityReport.uniqueness.duplicateNpsn}`);

    if (qualityReport.uniqueness.duplicateNpsn > 0) {
      logger.warn(
        `\nWarning: Found ${qualityReport.uniqueness.duplicateNpsn} duplicate NPSN values:`
      );
      qualityReport.uniqueness.duplicates.forEach(npsn => logger.warn(`  ${npsn}`));
    }

    logger.info('\n=== Field Completeness ===');
    for (const [field, stats] of Object.entries(qualityReport.fieldCompleteness)) {
      logger.info(`${field}: ${stats.percentage}% (${stats.filled}/${qualityReport.totalRecords})`);
    }

    await writeCsv(processed, CONFIG.SCHOOLS_CSV_PATH);
    logger.info(`\nWrote ${processed.length} records to ${CONFIG.SCHOOLS_CSV_PATH}`);
  } catch (error) {
    if (error.name === 'IntegrationError') {
      logger.error(`Integration error: ${error.code} - ${error.message}`);
    } else {
      logger.error(`ETL process failed: ${error.message}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch(error => {
    logger.error('ETL process failed:', error);
    process.exit(1);
  });
}
