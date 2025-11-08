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
 */

const fs = require('fs');
const path = require('path');
const { parseCsv, toCsv } = require('./csv-utils');

/**
 * Sanitize a string by trimming whitespace, collapsing multiple spaces and
 * removing problematic characters. Update this function to suit your needs.
 *
 * @param {string} value
 * @returns {string}
 */
function sanitize(value) {
  if (typeof value !== 'string') return '';
  
  return value
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[\u0000-\u001F]/g, '') // remove control chars
    .trim();
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
 * Entry point: read raw data, normalise and write output. For now this
 * function simply reads from a single CSV file at `external/raw.csv`.
 */
function run() {
  // TODO: Update this path to point to the cloned repository data source.
  const rawPath = path.join(__dirname, '../external/raw.csv');
  if (!fs.existsSync(rawPath)) {
    console.error('Raw data file not found. Please clone the source repo and place raw.csv in external/.');
    process.exit(1);
  }
  const rawCsv = fs.readFileSync(rawPath, 'utf8');
  const rawRecords = parseCsv(rawCsv);
  const processed = rawRecords
    .map(normaliseRecord)
    .filter(rec => rec.npsn && /^\d+$/.test(rec.npsn));
  
  // Convert to CSV and write to file
  const csvOutput = toCsv(processed);
  const outPath = path.join(__dirname, '../data/schools.csv');
  fs.writeFileSync(outPath, csvOutput, 'utf8');
  console.log(`Wrote ${processed.length} records to ${outPath}`);
}

if (require.main === module) {
  run();
}
