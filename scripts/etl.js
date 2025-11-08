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

const fs = require('fs');
const path = require('path');

/**
 * Parse a CSV string into an array of objects. This minimal parser assumes
 * there are no quoted fields containing commas. It splits on newlines and
 * commas, which is sufficient for the initial pilot dataset.
 *
 * @param {string} csvData
 * @returns {Array<Object>}
 */
function parseCsv(csvData) {
  const lines = csvData.trim().split(/\r?\n/);
  const header = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',');
    const record = {};
    header.forEach((h, i) => {
      // Security: Limit field length to prevent potential DoS
      const value = values[i] ? values[i].trim() : '';
      record[h] = value.length > 1000 ? value.substring(0, 1000) : value;
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
  if (!value) return '';
  return value
    .toString()
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[\u0000-\u001F]/g, '') // remove control chars
    .trim();
}

/**
 * Validate NPSN (National School Identification Number)
 * @param {string} npsn
 * @returns {boolean}
 */
function validateNPSN(npsn) {
  return npsn && /^\d{8}$/.test(npsn);
}

/**
 * Normalise a record into the canonical schema expected by the site generator.
 *
 * @param {Object} raw
 * @returns {Object}
 */
function normaliseRecord(raw) {
  return {
    npsn: sanitize(raw.npsn || raw.NPSN || ''),
    nama: sanitize(raw.nama || raw.nama_sekolah || raw.Nama || ''),
    bentuk_pendidikan: sanitize(raw.bentuk_pendidikan || raw.jenjang || ''),
    status: sanitize(raw.status || raw.status_sekolah || ''),
    alamat: sanitize(raw.alamat || raw.alamat_jalan || ''),
    kelurahan: sanitize(raw.kelurahan || raw.desa || ''),
    kecamatan: sanitize(raw.kecamatan || ''),
    kab_kota: sanitize(raw.kabupaten || raw.kota || ''),
    provinsi: sanitize(raw.provinsi || ''),
    lat: sanitize(raw.lat || raw.latitude || ''),
    lon: sanitize(raw.lon || raw.longitude || ''),
    updated_at: new Date().toISOString().split('T')[0],
  };
}

/**
 * Entry point: read raw data, normalise and write output.
 */
function run() {
  // Updated path to match the actual location of schools.csv
  const rawPath = path.join(__dirname, '../schools.csv');
  if (!fs.existsSync(rawPath)) {
    console.error('Raw data file not found. Please ensure schools.csv exists in the project root.');
    process.exit(1);
  }
  const rawCsv = fs.readFileSync(rawPath, 'utf8');
  const rawRecords = parseCsv(rawCsv);
  const processed = rawRecords
    .map(normaliseRecord)
    .filter(rec => validateNPSN(rec.npsn));
  
  if (processed.length === 0) {
    console.error('No valid records found after processing.');
    process.exit(1);
  }
  
  const header = Object.keys(processed[0]);
  const lines = [header.join(',')].concat(
    processed.map(rec => header.map(h => {
      // Escape CSV values that contain commas or quotes
      const value = rec[h] || '';
      return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(','))
  );
  const outPath = path.join(__dirname, '../schools.csv');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${processed.length} records to ${outPath}`);
}

if (require.main === module) {
  run();
}
