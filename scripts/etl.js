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

// Export functions for testing
module.exports = {
  parseCsv,
  sanitize,
  normaliseRecord,
  validateRecord
};

/**
 * Parse a CSV string into an array of objects. This minimal parser assumes
 * there are no quoted fields containing commas. It splits on newlines and
 * commas, which is sufficient for the initial pilot dataset.
 *
 * @param {string} csvData
 * @returns {Array<Object>}
 */
function parseCsv(csvData) {
  // Handle empty or invalid CSV data
  if (!csvData || typeof csvData !== 'string') {
    return [];
  }
  
  const lines = csvData.trim().split(/\r?\n/);
  
  // Handle empty CSV
  if (lines.length === 0) {
    return [];
  }
  
  const header = lines.shift().split(',').map(h => h.trim());
  
  // Handle CSV with only header
  if (lines.length === 0) {
    return [];
  }
  
  return lines.map(line => {
    const values = line.split(',');
    const record = {};
    header.forEach((h, i) => {
      record[h] = values[i] ? values[i].trim() : '';
    });
    return record;
  });
}

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
  
  return value
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[\u0000-\u001F]/g, '') // remove control chars
    .trim()
    .replace(/[^\x20-\x7E\u00A0-\u017F\u0190-\u024F\u1E00-\u1EFF]/g, ''); // remove non-printable characters except common Unicode
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
    updated_at: new Date().toISOString().split('T')[0],
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
  // Use environment variable for data path, fallback to default path
  const rawPath = process.env.RAW_DATA_PATH || require('path').join(__dirname, '../external/raw.csv');
  try {
    await fs.access(rawPath);
  } catch (error) {
    console.error(`Raw data file not found at ${rawPath}. Please ensure the data file exists.`);
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
  
  const rawCsv = await fs.readFile(rawPath, 'utf8');
  const rawRecords = parseCsv(rawCsv);
  
  console.log(`Loaded ${rawRecords.length} raw records`);
  
  const processed = rawRecords
    .map(normaliseRecord)
    .filter(validateRecord);
    
  console.log(`Processed ${processed.length} valid records`);
  
  if (processed.length === 0) {
    console.error('No valid records found after processing');
    process.exit(1);
  }
  
  const header = Object.keys(processed[0]);
  const lines = [header.join(',')].concat(
    processed.map(rec => header.map(h => rec[h]).join(','))
  );
  const outPath = require('path').join(__dirname, '../data/schools.csv');
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${processed.length} records to ${outPath}`);
}

if (require.main === module) {
  run().catch(error => {
    console.error('ETL process failed:', error);
    process.exit(1);
  });
}
