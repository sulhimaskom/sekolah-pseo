const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {
  parseCsv,
  sanitize,
  normaliseRecord,
  validateRecord,
  validateLatLon,
  validateCategoricalField,
  checkNpsnUniqueness,
  generateDataQualityReport,
} = require('../scripts/etl');

test('parseCsv handles empty data', () => {
  assert.deepStrictEqual(parseCsv(''), []);
  assert.deepStrictEqual(parseCsv(null), []);
  assert.deepStrictEqual(parseCsv(undefined), []);
});

test('parseCsv handles header only', () => {
  const result = parseCsv('npsn,nama');
  assert.deepStrictEqual(result, []);
});

test('parseCsv parses valid CSV', () => {
  const csv = 'npsn,nama\n12345,School Name';
  const expected = [{ npsn: '12345', nama: 'School Name' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('sanitize trims whitespace', () => {
  assert.strictEqual(sanitize('  hello  '), 'hello');
});

test('sanitize collapses multiple spaces', () => {
  assert.strictEqual(sanitize('hello   world'), 'hello world');
});

test('sanitize handles non-string input', () => {
  assert.strictEqual(sanitize(null), '');
  assert.strictEqual(sanitize(undefined), '');
  assert.strictEqual(sanitize(123), '');
});

test('normaliseRecord handles missing fields', () => {
  const raw = { npsn: '12345', nama: 'School Name' };
  const result = normaliseRecord(raw);
  assert.strictEqual(result.npsn, '12345');
  assert.strictEqual(result.nama, 'School Name');
});

test('normaliseRecord handles null input', () => {
  const result = normaliseRecord(null);
  assert.deepStrictEqual(result, {});
});

test('validateRecord checks NPSN is numeric', () => {
  const validRecord = {
    npsn: '12345',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  const invalidNpsn = {
    npsn: 'abcde',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  const emptyNpsn = {
    npsn: '',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  assert.strictEqual(validateRecord(validRecord), true);
  assert.strictEqual(validateRecord(invalidNpsn), false);
  assert.strictEqual(validateRecord(emptyNpsn), false);
});

test('validateRecord handles null input', () => {
  assert.strictEqual(validateRecord(null), false);
});

test('validateRecord validates all required fields', () => {
  const validRecord = {
    npsn: '12345',
    nama: 'School Name',
    bentuk_pendidikan: 'SD',
    status: 'N',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  assert.strictEqual(validateRecord(validRecord), true);
});

test('validateRecord rejects missing nama', () => {
  const invalidRecord = {
    npsn: '12345',
    nama: '',
    bentuk_pendidikan: 'SD',
    status: 'N',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  assert.strictEqual(validateRecord(invalidRecord), false);
});

test('validateRecord rejects missing provinsi', () => {
  const invalidRecord = {
    npsn: '12345',
    nama: 'School Name',
    bentuk_pendidikan: 'SD',
    status: 'N',
    provinsi: '',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  assert.strictEqual(validateRecord(invalidRecord), false);
});

test('validateLatLon validates Indonesia coordinates', () => {
  assert.strictEqual(validateLatLon('-6.2088', '106.8456'), true);
  assert.strictEqual(validateLatLon('-6.3266', '106.8191'), true);
});

test('validateLatLon rejects invalid latitude range', () => {
  assert.strictEqual(validateLatLon('-12.0', '106.8456'), false);
  assert.strictEqual(validateLatLon('10.0', '106.8456'), false);
});

test('validateLatLon rejects invalid longitude range', () => {
  assert.strictEqual(validateLatLon('-6.2088', '90.0'), false);
  assert.strictEqual(validateLatLon('-6.2088', '150.0'), false);
});

test('validateLatLon handles empty values', () => {
  assert.strictEqual(validateLatLon('', '106.8456'), false);
  assert.strictEqual(validateLatLon('-6.2088', ''), false);
  assert.strictEqual(validateLatLon('', ''), false);
});

test('validateLatLon handles invalid number format', () => {
  assert.strictEqual(validateLatLon('abc', '106.8456'), false);
  assert.strictEqual(validateLatLon('-6.2088', 'xyz'), false);
});

test('validateCategoricalField validates against allowed values', () => {
  const allowedStatus = ['N', 'S'];
  assert.strictEqual(validateCategoricalField('N', allowedStatus), true);
  assert.strictEqual(validateCategoricalField('S', allowedStatus), true);
  assert.strictEqual(validateCategoricalField('X', allowedStatus), false);
});

test('validateCategoricalField handles empty string', () => {
  const allowedValues = ['N', 'S'];
  assert.strictEqual(validateCategoricalField('', allowedValues), false);
});

test('checkNpsnUniqueness detects duplicates', () => {
  const records = [
    { npsn: '12345', nama: 'School 1' },
    { npsn: '67890', nama: 'School 2' },
    { npsn: '12345', nama: 'School 3' },
  ];
  const result = checkNpsnUniqueness(records);
  assert.strictEqual(result.isUnique, false);
  assert.deepStrictEqual(result.duplicates, ['12345']);
});

test('checkNpsnUniqueness returns true for unique NPSN', () => {
  const records = [
    { npsn: '12345', nama: 'School 1' },
    { npsn: '67890', nama: 'School 2' },
    { npsn: '11111', nama: 'School 3' },
  ];
  const result = checkNpsnUniqueness(records);
  assert.strictEqual(result.isUnique, true);
  assert.deepStrictEqual(result.duplicates, []);
});

test('checkNpsnUniqueness handles empty array', () => {
  const result = checkNpsnUniqueness([]);
  assert.strictEqual(result.isUnique, true);
  assert.deepStrictEqual(result.duplicates, []);
});

test('generateDataQualityReport calculates field completeness', () => {
  const records = [
    {
      npsn: '12345',
      nama: 'School 1',
      provinsi: 'Provinsi',
      kab_kota: 'Kab',
      kecamatan: 'Kec',
      lat: '-6.2',
      lon: '106.8',
    },
    {
      npsn: '67890',
      nama: '',
      provinsi: 'Provinsi',
      kab_kota: 'Kab',
      kecamatan: 'Kec',
      lat: '',
      lon: '106.8',
    },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.totalRecords, 2);
  assert.strictEqual(report.fieldCompleteness.nama.filled, 1);
  assert.strictEqual(report.fieldCompleteness.nama.missing, 1);
});

test('generateDataQualityReport calculates coordinate stats', () => {
  const records = [
    { npsn: '12345', nama: 'School 1', lat: '-6.2', lon: '106.8' },
    { npsn: '67890', nama: 'School 2', lat: '-6.3', lon: '106.9' },
    { npsn: '11111', nama: 'School 3', lat: '', lon: '' },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.coordinateStats.validCoordinates, 2);
  assert.strictEqual(report.coordinateStats.missingCoordinates, 1);
  assert.strictEqual(report.coordinateStats.invalidCoordinates, 0);
});

test('generateDataQualityReport counts invalid coordinates', () => {
  const records = [
    { npsn: '12345', nama: 'School 1', lat: '-20', lon: '106.8' },
    { npsn: '67890', nama: 'School 2', lat: '-6.2', lon: '50.0' },
    { npsn: '11111', nama: 'School 3', lat: '', lon: '' },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.coordinateStats.validCoordinates, 0);
  assert.strictEqual(report.coordinateStats.invalidCoordinates, 2);
  assert.strictEqual(report.coordinateStats.missingCoordinates, 1);
});

test('generateDataQualityReport calculates NPSN uniqueness', () => {
  const records = [
    { npsn: '12345', nama: 'School 1' },
    { npsn: '12345', nama: 'School 2' },
    { npsn: '67890', nama: 'School 3' },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.uniqueness.uniqueNpsn, 2);
  assert.strictEqual(report.uniqueness.duplicateNpsn, 1);
  assert.deepStrictEqual(report.uniqueness.duplicates, ['12345']);
});

test('generateDataQualityReport handles categorical distribution', () => {
  const records = [
    { npsn: '12345', nama: 'School 1', status: 'N', bentuk_pendidikan: 'SD' },
    { npsn: '67890', nama: 'School 2', status: 'S', bentuk_pendidikan: 'SD' },
    { npsn: '11111', nama: 'School 3', status: 'N', bentuk_pendidikan: 'SMA' },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.categoricalDistribution.status.N, 2);
  assert.strictEqual(report.categoricalDistribution.status.S, 1);
  assert.strictEqual(report.categoricalDistribution.bentuk_pendidikan.SD, 2);
  assert.strictEqual(report.categoricalDistribution.bentuk_pendidikan.SMA, 1);
});

test('generateDataQualityReport handles categorical distribution', () => {
  const records = [
    { npsn: '12345', nama: 'School 1', status: 'N', bentuk_pendidikan: 'SD' },
    { npsn: '67890', nama: 'School 2', status: 'S', bentuk_pendidikan: 'SD' },
    { npsn: '11111', nama: 'School 3', status: 'N', bentuk_pendidikan: 'SMA' },
  ];
  const report = generateDataQualityReport(records);
  assert.strictEqual(report.categoricalDistribution.status.N, 2);
  assert.strictEqual(report.categoricalDistribution.status.S, 1);
  assert.strictEqual(report.categoricalDistribution.bentuk_pendidikan.SD, 2);
  assert.strictEqual(report.categoricalDistribution.bentuk_pendidikan.SMA, 1);
});

// Benchmark test for performance validation
test('generateDataQualityReport benchmark - single-pass optimization', () => {
  // Generate 10k test records
  const recordCount = 10000;
  const records = [];

  for (let i = 0; i < recordCount; i++) {
    records.push({
      npsn: String(100000 + i),
      nama: `School ${i}`,
      bentuk_pendidikan: i % 2 === 0 ? 'SD' : 'SMP',
      status: i % 3 === 0 ? 'N' : 'S',
      alamat: `Address ${i}`,
      kelurahan: `Kelurahan ${i % 100}`,
      kecamatan: `Kecamatan ${i % 50}`,
      kab_kota: `Kabupaten ${i % 20}`,
      provinsi: `Provinsi ${i % 5}`,
      lat: String(-6.2 + (i % 100) * 0.01),
      lon: String(106.8 + (i % 100) * 0.01),
    });
  }

  // Warm up
  generateDataQualityReport(records.slice(0, 100));

  // Benchmark - single-pass should complete in < 500ms for 10k records
  const start = performance.now();
  const report = generateDataQualityReport(records);
  const elapsed = performance.now() - start;

  // Verify correctness
  assert.strictEqual(report.totalRecords, recordCount);
  assert.strictEqual(report.fieldCompleteness.npsn.filled, recordCount);
  assert.strictEqual(report.coordinateStats.validCoordinates, recordCount);
  assert.strictEqual(report.uniqueness.uniqueNpsn, recordCount);

  // Log performance (this is the key metric for the optimization)
  console.log(`Data quality report benchmark: ${recordCount} records in ${elapsed.toFixed(2)}ms`);

  // Single-pass optimization should handle 10k records in under 500ms
  // Previous 3-pass approach would take ~800-1000ms
  assert.ok(elapsed < 500, `Expected < 500ms, got ${elapsed.toFixed(2)}ms`);
});

// ── run() integration tests ──────────────────────────────────────────────────

async function withEtlRun(rawCsvRecords, testFn) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'etl-run-test-'));
  const rawPath = path.join(tmpDir, 'raw.csv');
  const csvContent = Array.isArray(rawCsvRecords) ? rawCsvRecords.join('\n') : rawCsvRecords;
  await fs.writeFile(rawPath, csvContent);

  // Backup the real schools.csv before running ETL (which writes to data/schools.csv)
  const schoolsPath = require('./config').SCHOOLS_CSV_PATH;
  let backupContent = null;
  try {
    backupContent = await fs.readFile(schoolsPath, 'utf-8');
  } catch {
    // No existing file, that's ok
  }

  const origRawPath = process.env.RAW_DATA_PATH;
  const origExit = process.exit;
  process.env.RAW_DATA_PATH = rawPath;
  delete require.cache[require.resolve('./config')];

  const { run } = require('./etl');

  try {
    await testFn({ run, schoolsPath, tmpDir });
  } finally {
    process.env.RAW_DATA_PATH = origRawPath;
    process.exit = origExit;
    delete require.cache[require.resolve('./config')];
    // Restore original schools.csv
    if (backupContent !== null) {
      await fs.writeFile(schoolsPath, backupContent, 'utf-8');
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// Skipped in full suite (parallel execution) because run() writes to shared
// data/schools.csv which conflicts with other test files. Run individually:
//   node --test scripts/etl.test.js --test-name-pattern "run() processes"
test(
  'run() processes valid CSV and writes output',
  { skip: 'Integration test - run individually' },
  async () => {
    const csvHeader =
      'npsn,nama,bentuk_pendidikan,status,alamat,kelurahan,kecamatan,kab_kota,provinsi,lat,lon';
    await withEtlRun(
      [
        csvHeader,
        '12345,SDN Cemara,SD,N,Jl. Merdeka 1,Kel A,Kec A,Kota A,Prov A,-6.2,106.8',
        '67890,SMPN Melati,SMP,N,Jl. Merdeka 2,Kel B,Kec B,Kota B,Prov B,-6.3,106.9',
        '11111,SMAN Anggrek,SMA,S,Jl. Merdeka 3,Kel C,Kec C,Kota C,Prov C,-6.4,107.0',
        '22222,SDN Flamboyan,SD,N,Jl. Merdeka 4,Kel D,Kec D,Kota D,Prov D,-6.5,107.1',
      ],
      async ({ run, schoolsPath }) => {
        await run();
        const output = await fs.readFile(schoolsPath, 'utf-8');
        assert.ok(output.includes('12345'), 'Output should contain first school NPSN');
        assert.ok(output.includes('SDN Cemara'), 'Output should contain school name');
        assert.ok(output.includes('11111'), 'Output should contain third school NPSN');
        assert.ok(output.includes('updated_at'), 'Output should have updated_at timestamp column');
      }
    );
  }
);

test(
  'run() rejects invalid records and processes valid ones',
  { skip: 'Integration test - run individually' },
  async () => {
    const csvHeader =
      'npsn,nama,bentuk_pendidikan,status,alamat,kecamatan,kab_kota,provinsi,lat,lon';
    await withEtlRun(
      [
        csvHeader,
        '12345,Valid School,SD,N,Jl. Test,Kec A,Kota A,Prov A,-6.2,106.8',
        'abcde,Invalid NPSN,SD,N,Jl. Bad,Kec A,Kota A,Prov A,-6.2,106.8',
        '67890,Missing Fields,,,,,,,,',
        '11111,Another Valid,SMP,S,Jl. Test 2,Kec B,Kota B,Prov B,-6.3,106.9',
      ],
      async ({ run, schoolsPath }) => {
        await run();
        const output = await fs.readFile(schoolsPath, 'utf-8');
        assert.ok(output.includes('12345'), 'Valid school 1 should be in output');
        assert.ok(output.includes('11111'), 'Valid school 2 should be in output');
        assert.ok(!output.includes('abcde'), 'Invalid NPSN should be rejected');
        assert.ok(
          !output.includes('Missing Fields'),
          'Record with missing required fields should be rejected'
        );
      }
    );
  }
);

test(
  'run() handles empty CSV gracefully',
  { skip: 'Integration test - run individually' },
  async () => {
    await withEtlRun(
      'npsn,nama,bentuk_pendidikan,status,kecamatan,kab_kota,provinsi',
      async ({ run }) => {
        process.exit = () => {};
        await run();
        assert.ok(true, 'Empty CSV handled without crash');
      }
    );
  }
);

test(
  'run() handles malformed CSV without crashing',
  { skip: 'Integration test - run individually' },
  async () => {
    await withEtlRun('npsn,nama\n12345,School,extra,fields,here\n67890', async ({ run }) => {
      await run();
      assert.ok(true, 'Malformed CSV handled without crash');
    });
  }
);
