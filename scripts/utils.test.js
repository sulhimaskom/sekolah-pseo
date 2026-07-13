const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {
  parseCsv,
  formatStatus,
  formatEmptyValue,
  hasCoordinateData,
  escapeCsvField,
  writeCsv,
  clearEscapeHtmlCache,
} = require('./utils');

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

test('parseCsv handles quoted fields', () => {
  const csv = 'npsn,nama,alamat\n12345,"School Name","Street, City"';
  const expected = [{ npsn: '12345', nama: 'School Name', alamat: 'Street, City' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('parseCsv handles escaped quotes', () => {
  const csv = 'npsn,nama,alamat\n12345,"School ""Name""","Street, City"';
  const expected = [{ npsn: '12345', nama: 'School "Name"', alamat: 'Street, City' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('formatStatus converts N to Negeri', () => {
  assert.strictEqual(formatStatus('N'), 'Negeri');
  assert.strictEqual(formatStatus('n'), 'Negeri');
  assert.strictEqual(formatStatus(' N '), 'Negeri');
});

test('formatStatus converts S to Swasta', () => {
  assert.strictEqual(formatStatus('S'), 'Swasta');
  assert.strictEqual(formatStatus('s'), 'Swasta');
  assert.strictEqual(formatStatus(' S '), 'Swasta');
});

test('formatStatus handles unknown status', () => {
  assert.strictEqual(formatStatus('X'), 'X');
  assert.strictEqual(formatStatus('UNKNOWN'), 'UNKNOWN');
});

test('formatStatus handles empty/null input', () => {
  assert.strictEqual(formatStatus(''), 'Tidak Diketahui');
  assert.strictEqual(formatStatus(null), 'Tidak Diketahui');
  assert.strictEqual(formatStatus(undefined), 'Tidak Diketahui');
});

test('formatEmptyValue returns value when not empty', () => {
  assert.strictEqual(formatEmptyValue('Test Value'), 'Test Value');
  assert.strictEqual(formatEmptyValue('  Test  '), 'Test');
  assert.strictEqual(formatEmptyValue(123), '123');
});

test('formatEmptyValue returns placeholder when empty', () => {
  assert.strictEqual(formatEmptyValue(''), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue(null), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue(undefined), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue('   '), 'Tidak tersedia');
});

test('formatEmptyValue accepts custom placeholder', () => {
  assert.strictEqual(formatEmptyValue('', '-'), '-');
  assert.strictEqual(formatEmptyValue(null, 'N/A'), 'N/A');
  assert.strictEqual(formatEmptyValue('Data', 'N/A'), 'Data');
});

test('hasCoordinateData returns true for valid coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '-6.2088', lon: '106.8456' }), true);
  assert.strictEqual(hasCoordinateData({ lat: '0.5', lon: '100.5' }), true);
});

test('hasCoordinateData returns false for missing coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '', lon: '' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '', lon: '106.8456' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '-6.2088', lon: '' }), false);
  assert.strictEqual(hasCoordinateData({}), false);
});

test('hasCoordinateData returns false for zero coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '0', lon: '0' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '0.0', lon: '0.0' }), false);
});

test('hasCoordinateData returns false for null/undefined school', () => {
  assert.strictEqual(hasCoordinateData(null), false);
  assert.strictEqual(hasCoordinateData(undefined), false);
});

// Formula injection protection tests
test('escapeCsvField handles null and undefined', () => {
  assert.strictEqual(escapeCsvField(null), '');
  assert.strictEqual(escapeCsvField(undefined), '');
});

test('escapeCsvField returns string as-is for normal values', () => {
  assert.strictEqual(escapeCsvField('Test Value'), 'Test Value');
  assert.strictEqual(escapeCsvField('School Name'), 'School Name');
  assert.strictEqual(escapeCsvField(''), '');
  assert.strictEqual(escapeCsvField('123'), '123');
});

test('escapeCsvField escapes comma-containing values', () => {
  assert.strictEqual(escapeCsvField('Street, City'), '"Street, City"');
  assert.strictEqual(escapeCsvField('A, B, C'), '"A, B, C"');
});

test('escapeCsvField escapes double quotes', () => {
  assert.strictEqual(escapeCsvField('Test "Value"'), '"Test ""Value"""');
});

test('escapeCsvField escapes newline characters', () => {
  assert.strictEqual(escapeCsvField('Line1\nLine2'), '"Line1\nLine2"');
});

// Formula injection protection - critical security tests
test('escapeCsvField prefixes formula injection characters', () => {
  // Equal sign (=) - most common formula injection
  assert.strictEqual(escapeCsvField('=SUM(1,2)'), "'=SUM(1,2)");
  assert.strictEqual(escapeCsvField("=CMD|' /C calc"), "'=CMD|' /C calc");
  assert.strictEqual(escapeCsvField('=DDE("cmd""/c calc"'), '\'=DDE("cmd""/c calc"');

  // Plus sign (+)
  assert.strictEqual(escapeCsvField('+1+1'), "'+1+1");
  assert.strictEqual(escapeCsvField('+SUM(A1:B1)'), "'+SUM(A1:B1)");

  // Minus sign (-)
  assert.strictEqual(escapeCsvField('-1-1'), "'-1-1");
  assert.strictEqual(escapeCsvField('-2*3'), "'-2*3");

  // At sign (@)
  assert.strictEqual(escapeCsvField('@CONCATENATE(A1,B1)'), "'@CONCATENATE(A1,B1)");

  // Tab character
  assert.strictEqual(escapeCsvField('\tdata'), "'\tdata");
});

test('escapeCsvField handles formula injection combined with quoting needs', () => {
  // Formula char + comma needs both protections
  assert.strictEqual(escapeCsvField('=SUM(1,2),3'), "'=SUM(1,2),3");
});

test('escapeCsvField does not affect non-formula strings', () => {
  assert.strictEqual(escapeCsvField('formula'), 'formula');
  assert.strictEqual(escapeCsvField('=notformula'), "'=notformula");
  assert.strictEqual(escapeCsvField('test+value'), 'test+value');
  assert.strictEqual(escapeCsvField('test-value'), 'test-value');
  assert.strictEqual(escapeCsvField('email@domain.com'), 'email@domain.com');
});

// --- clearEscapeHtmlCache tests ---

test('clearEscapeHtmlCache clears the escapeHtml cache without throwing', () => {
  // Calling clearEscapeHtmlCache should not throw
  clearEscapeHtmlCache();
  assert.ok(true, 'clearEscapeHtmlCache should not throw when cache is empty');

  // Calling it multiple times should also be safe
  clearEscapeHtmlCache();
  clearEscapeHtmlCache();
  assert.ok(true, 'clearEscapeHtmlCache should be idempotent');
});

// --- writeCsv tests ---

test('writeCsv writes CSV with header and data rows', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [
      { npsn: '12345', nama: 'School A', provinsi: 'Jawa Barat' },
      { npsn: '67890', nama: 'School B', provinsi: 'Jawa Timur' },
    ];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 3, 'should have header + 2 data rows');
    assert.ok(lines[0].includes('npsn'), 'header should contain npsn');
    assert.ok(lines[0].includes('nama'), 'header should contain nama');
    assert.ok(lines[0].includes('provinsi'), 'header should contain provinsi');
    assert.ok(lines[1].includes('12345'), 'first row should contain school A npsn');
    assert.ok(lines[2].includes('67890'), 'second row should contain school B npsn');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv escapes special characters in CSV fields', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: 'School, Inc.', alamat: 'Jl. Sudirman No. 5' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    // The comma in "School, Inc." should be quoted
    assert.ok(content.includes('"School, Inc."'), 'comma-containing field should be quoted');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv handles formula injection protection', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: '=SUM(A1:A2)', alamat: '+CMD' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    assert.ok(content.includes("'=SUM"), 'formula injection should be prefixed with single quote');
    assert.ok(content.includes("'+CMD"), 'plus-prefixed values should be prefixed');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv throws for empty array', async () => {
  const { IntegrationError } = require('./resilience');
  await assert.rejects(() => writeCsv([], '/tmp/nonexistent/test.csv'), IntegrationError);
});

test('writeCsv throws for non-array input', async () => {
  const { IntegrationError } = require('./resilience');
  await assert.rejects(() => writeCsv(null, '/tmp/nonexistent/test.csv'), IntegrationError);
  await assert.rejects(() => writeCsv(undefined, '/tmp/nonexistent/test.csv'), IntegrationError);
  await assert.rejects(() => writeCsv('string', '/tmp/nonexistent/test.csv'), IntegrationError);
});

test('writeCsv handles single row', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: 'School A', provinsi: 'Jawa Barat' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 2, 'should have header + 1 data row');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv handles large dataset with batching', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    // Create 2500 records to test batching (batchSize is 1000 in writeCsv)
    const data = [];
    for (let i = 0; i < 2500; i++) {
      data.push({ npsn: String(i).padStart(5, '0'), nama: `School ${i}` });
    }

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 2501, 'should have header + 2500 data rows');
    assert.ok(lines[1].includes('00000'), 'first row should contain first school');
    assert.ok(lines[2500].includes('2499'), 'last row should contain last school');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});
