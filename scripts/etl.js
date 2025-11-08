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

/**
 * Parse a CSV string into an array of objects. Handles quoted fields properly.
 *
 * @param {string} csvData
 * @returns {Array<Object>}
 */
function parseCsv(csvData) {
  const lines = csvData.trim().split(/\r?\n/);
  const header = lines.shift().split(',').map(h => h.trim());
  
  return lines.map(line => {
    // Handle quoted fields properly
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Don't forget the last field
    values.push(current.trim());
    
    const record = {};
    header.forEach((h, i) => {
      record[h] = values[i] || '';
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
  const rawPath = require('path').join(__dirname, '../external/raw.csv');
  if (!fs.existsSync(rawPath)) {
    console.error('Raw data file not found. Please clone the source repo and place raw.csv in external/.');
    process.exit(1);
  }
  const rawCsv = fs.readFileSync(rawPath, 'utf8');
  const rawRecords = parseCsv(rawCsv);
  const processed = rawRecords
    .map(normaliseRecord)
    .filter(rec => rec.npsn && /^\d+$/.test(rec.npsn));
  const header = Object.keys(processed[0]);
  const lines = [header.join(',')].concat(
    processed.map(rec => header.map(h => rec[h]).join(','))
  );
  const outPath = require('path').join(__dirname, '../data/schools.csv');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${processed.length} records to ${outPath}`);
}

if (require.main === module) {
  run();
}
