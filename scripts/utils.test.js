const test = require('node:test');
const assert = require('node:assert');
const { parseCsv, addNumbers, formatStatus, formatEmptyValue, hasCoordinateData } = require('../scripts/utils');

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