const test = require('node:test');
const assert = require('node:assert');
const {
  parseCsv,
  addNumbers,
  formatStatus,
  formatEmptyValue,
  hasCoordinateData,
  escapeCsvField,
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

test('addNumbers computes sum of two numbers', () => {
  assert.strictEqual(addNumbers(2, 3), 5);
  assert.strictEqual(addNumbers(-1, 1), 0);
  assert.strictEqual(addNumbers(0, 0), 0);
  assert.ok(Math.abs(addNumbers(10.5, 2.3) - 12.8) < 1e-10, '10.5 + 2.3 should be close to 12.8');
});

test('addNumbers throws error for non-number inputs', () => {
  assert.throws(() => addNumbers('a', 'b'), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(1, 'b'), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers('a', 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(null, 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(undefined, 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(Infinity, 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(-Infinity, 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(NaN, 2), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(2, Infinity), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(2, -Infinity), /Both parameters must be finite numbers/);
  assert.throws(() => addNumbers(2, NaN), /Both parameters must be finite numbers/);
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
