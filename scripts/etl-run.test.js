'use strict';

/**
 * @module etl-run.test
 * @description Integration tests for etl.run() — the ETL pipeline entry point.
 *
 * These tests verify the full ETL flow: file access, CSV parsing, record
 * normalization, schema validation, categorical warnings, data quality
 * reporting, and CSV output. Uses real file I/O with temp directories
 * and mocks process.exit to prevent test runner termination.
 *
 * Architecture per docs/blueprint.md:
 *   scripts/etl.js    ← ETL pipeline orchestration (this tests run())
 *   src/services/      ← Business logic (not involved here)
 *
 * Coverage target: etl.js run() function (lines 322-443) — 0% prior coverage.
 */

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const CONFIG = require('./config');
const { resetCircuitBreakers } = require('./fs-safe');
const { withConfig } = require('./test-helpers');

// ── Process exit mock ───────────────────────────────────────────
// The run() function calls terminate() which calls process.exit().
// We mock it to throw so the test can catch the termination.

const originalExit = process.exit;

test.before(() => {
  process.exit = code => {
    throw new Error(`PROCESS_EXIT:${code}`);
  };
});

test.after(() => {
  process.exit = originalExit;
});

// Reset circuit breakers before each test to prevent state leakage
// from other test files sharing the fs-safe singleton.
test.beforeEach(() => {
  resetCircuitBreakers();
});

// Clean up any stale .build-manifest.json that could interfere
test.beforeEach(async () => {
  try {
    await fs.rm(path.join(CONFIG.ROOT_DIR, '.build-manifest.json'), { force: true });
  } catch {
    // Ignore if manifest doesn't exist
  }
});

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Create a temp directory with a raw CSV file at the expected path.
 * @param {string} csvContent - Raw CSV content
 * @returns {{ tmpDir: string, rawPath: string, outPath: string }}
 */
async function createTempCsv(csvContent) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'etl-run-'));
  const rawPath = path.join(tmpDir, 'raw.csv');
  const outPath = path.join(tmpDir, 'schools.csv');
  await fs.writeFile(rawPath, csvContent);
  return { tmpDir, rawPath, outPath };
}

/**
 * Parse CSV string into array of objects (simple implementation for assertions).
 */
function parseCsvSimple(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
    });
    return obj;
  });
}

// We require etl lazily because the module reads CONFIG at import time
// (via require('./config') which returns a reference — the function reads
// CONFIG.RAW_DATA_PATH at call time, so lazy import is fine but we still
// need the module object for run()).
let etl;

test.before(() => {
  etl = require('./etl');
});

// ── Happy Path ───────────────────────────────────────────────────

test('run() processes valid CSV with multiple records', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status,lat,lon',
    '12345,Sekolah A,Jawa Barat,Bandung,Bojongsoang,SD,N,-6.2088,106.8456',
    '67890,Sekolah B,Jawa Timur,Surabaya,Tegalsari,SMP,S,-7.2504,112.7688',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 2, 'Should have 2 records');
    assert.ok(records[0].npsn === '12345', 'First record NPSN');
    assert.ok(records[0].nama === 'Sekolah A', 'First record name');
    assert.ok(records[1].npsn === '67890', 'Second record NPSN');
    assert.ok(records[1].nama === 'Sekolah B', 'Second record name');

    // Verify updated_at was added
    assert.ok(records[0].updated_at, 'Should have updated_at field');
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(records[0].updated_at), 'updated_at should be ISO date');

    // Verify all expected fields are present
    const expectedHeaders = [
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
      'updated_at',
    ];
    for (const header of expectedHeaders) {
      assert.ok(header in records[0], `Output should have field: ${header}`);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() handles single valid record', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '11111,Sekolah Tunggal,Jawa Tengah,Semarang,Banyumanik,SD,N',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 1, 'Should have 1 record');
    assert.strictEqual(records[0].npsn, '11111');
    assert.strictEqual(records[0].nama, 'Sekolah Tunggal');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() preserves optional fields when present', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status,alamat,kelurahan,lat,lon',
    '99999,Sekolah Lengkap,DKI Jakarta,Jakarta Pusat,Menteng,SMA,S,Jl. Contoh No.1,Menteng,-6.2000,106.8000',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 1);
    assert.strictEqual(records[0].alamat, 'Jl. Contoh No.1');
    assert.strictEqual(records[0].kelurahan, 'Menteng');
    // escapeCsvField prefixes '-' with "'" for formula injection protection
    assert.strictEqual(records[0].lat, "'-6.2000");
    assert.strictEqual(records[0].lon, '106.8000');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() normalizes status values (negeri→N, swasta→S)', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '11111,Negeri School,Jawa Barat,Bandung,Coblong,SD,negeri',
    '22222,Swasta School,Jawa Barat,Bandung,Cicendo,SMP,swasta',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[0].status, 'N', 'negeri should be normalized to N');
    assert.strictEqual(records[1].status, 'S', 'swasta should be normalized to S');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ── Error Paths ──────────────────────────────────────────────────

test('run() terminates when raw CSV file does not exist', async () => {
  const { tmpDir, rawPath, outPath } = await createTempCsv('dummy\nx');
  // Remove the raw file so safeAccess fails
  await fs.rm(rawPath);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, async () => {
      await assert.rejects(
        () => etl.run(),
        /PROCESS_EXIT:1/,
        'Should throw when raw data file is missing'
      );
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() terminates when CSV has headers only (no data rows)', async () => {
  const csv = 'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status';

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, async () => {
      await assert.rejects(
        () => etl.run(),
        /PROCESS_EXIT:1/,
        'Should throw when CSV has no data rows'
      );
    });
    // Verify no output file was created
    await assert.rejects(
      () => fs.access(outPath),
      /ENOENT/,
      'No output file should exist when no records processed'
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() terminates when all records fail schema validation', async () => {
  // All records missing required fields
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    ',,Jawa Barat,Bandung,,SD,N',
    'abcde,School B,Jawa Timur,,,SMP,',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, async () => {
      await assert.rejects(
        () => etl.run(),
        /PROCESS_EXIT:1/,
        'Should throw when no valid records found'
      );
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() terminates when processed array is empty after filtering', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    'abcde,,Jawa Barat,Bandung,Coblong,SD,N', // non-numeric npsn and missing nama
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, async () => {
      await assert.rejects(
        () => etl.run(),
        /PROCESS_EXIT:1/,
        'Should throw when all records are invalid'
      );
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ── Mixed Valid/Invalid Records ──────────────────────────────────

test('run() filters out invalid records and only writes valid ones', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '12345,Valid School,Jawa Barat,Bandung,Coblong,SD,N',
    'xxxxx,Invalid School,Jawa Timur,Surabaya,Tegalsari,SMP,S', // non-numeric npsn
    '', // empty record
    '67890,Another Valid,Jawa Tengah,Semarang,Gajahmungkur,SMA,N',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 2, 'Only 2 valid records should be written');
    assert.strictEqual(records[0].npsn, '12345');
    assert.strictEqual(records[1].npsn, '67890');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ── Categorical Validation ───────────────────────────────────────

test('run() rejects records with invalid categorical values but processes valid ones', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '12345,Valid School,Jawa Barat,Bandung,Coblong,SD,N',
    // Invalid bentuk_pendidikan (SCHEMA.validateRecord rejects it)
    '99999,Wrong Type,Jawa Barat,Bandung,Cicendo,INVALID_TYPE,N',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 1, 'Only the valid record should be written');
    assert.strictEqual(records[0].npsn, '12345');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() rejects records with invalid status categorical values', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '12345,Valid School,Jawa Barat,Bandung,Coblong,SD,N',
    '99999,Bad Status,Jawa Barat,Bandung,Cicendo,SD,INVALID',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 1, 'Only the valid record should be written');
    assert.strictEqual(records[0].npsn, '12345');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ── Edge Cases ──────────────────────────────────────────────────

test('run() handles duplicate NPSN values (warns but processes both)', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '12345,Sekolah A,Jawa Barat,Bandung,Coblong,SD,N',
    '12345,Sekolah A Duplicate,Jawa Barat,Bandung,Coblong,SMP,S',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 2, 'Both records with duplicate NPSN should be processed');
    assert.strictEqual(records[0].npsn, '12345');
    assert.strictEqual(records[1].npsn, '12345');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() handles records with all optional fields missing', async () => {
  // Required fields present, no optional fields
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status',
    '12345,Sekolah Minimal,Jawa Barat,Bandung,Coblong,SD,N',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    assert.strictEqual(records.length, 1);
    // Optional fields should default to empty
    assert.strictEqual(records[0].alamat, '', 'alamat should default to empty');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('run() handles coordinate edge cases (zero, out-of-bounds)', async () => {
  const csv = [
    'npsn,nama,provinsi,kab_kota,kecamatan,bentuk_pendidikan,status,lat,lon',
    '10001,Zero Coord,Jawa Barat,Bandung,Coblong,SD,N,0,0',
    '10002,Valid Coord,Jawa Timur,Surabaya,Tegalsari,SMP,S,-7.2504,112.7688',
  ].join('\n');

  const { tmpDir, rawPath, outPath } = await createTempCsv(csv);
  try {
    await withConfig({ RAW_DATA_PATH: rawPath, SCHOOLS_CSV_PATH: outPath }, () => etl.run());

    const output = await fs.readFile(outPath, 'utf8');
    const records = parseCsvSimple(output);

    // Both records should be processed (coordinate validation is warning-only in run())
    assert.strictEqual(records.length, 2);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
