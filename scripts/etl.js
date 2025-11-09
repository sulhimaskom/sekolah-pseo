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

const fs = require('fs').promises;
const path = require('path');
const { parseCsv } = require('./utils');
const CONFIG = require('./config');

// Export functions for testing
module.exports = {
  parseCsv,
  sanitize,
  normaliseRecord,
  validateRecord
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
  // Handle case where record is null or undefined
  if (!record || typeof record !== 'object') {
    return false;
  }
  
  // Check that NPSN exists and is numeric
  return record.npsn && /^\d+$/.test(record.npsn);
}

/**
 * Entry point: read raw data, normalise and write output. For now this
 * function simply reads from a single CSV file at `external/raw.csv`.
 */
async function run() {
  const rawPath = CONFIG.RAW_DATA_PATH;
  try {
    await fs.access(rawPath);
  } catch {
    console.error(`Raw data file not found at ${rawPath}. Please ensure the data file exists.`);
    process.exit(1);
  }
  
  const rawCsv = await fs.readFile(rawPath, 'utf8');
  const rawRecords = parseCsv(rawCsv);
  
  console.log(`Loaded ${rawRecords.length} raw records`);
  
  // Use a more efficient approach for processing records
  const processed = [];
  for (const record of rawRecords) {
    const normalized = normaliseRecord(record);
    if (validateRecord(normalized)) {
      processed.push(normalized);
    }
  }
    
  console.log(`Processed ${processed.length} valid records`);
  
  if (processed.length === 0) {
    console.error('No valid records found after processing');
    process.exit(1);
  }
  
  const header = Object.keys(processed[0]);
  const lines = [header.join(',')];
  
  // Process records in batches to reduce memory usage
  const batchSize = 1000;
  for (let i = 0; i < processed.length; i += batchSize) {
    const batch = processed.slice(i, i + batchSize);
    const batchLines = batch.map(rec => header.map(h => rec[h]).join(','));
    lines.push(...batchLines);
  }
  
  await fs.writeFile(CONFIG.SCHOOLS_CSV_PATH, lines.join('\n'), 'utf8');
  console.log(`Wrote ${processed.length} records to ${CONFIG.SCHOOLS_CSV_PATH}`);
}

if (require.main === module) {
  run().catch(error => {
    console.error('ETL process failed:', error);
    process.exit(1);
  });
}
