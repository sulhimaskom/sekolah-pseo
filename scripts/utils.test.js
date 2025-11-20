const test = require('node:test');
const assert = require('node:assert');
const { parseCsv, addNumbers } = require('../scripts/utils');

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
  assert.ok(Math.abs(addNumbers(10.5, 2.3) - 12.8) < Number.EPSILON, '10.5 + 2.3 should be close to 12.8');
});

test('addNumbers throws error for non-number inputs', () => {
  assert.throws(() => addNumbers('a', 'b'), /Both parameters must be numbers/);
  assert.throws(() => addNumbers(1, 'b'), /Both parameters must be numbers/);
  assert.throws(() => addNumbers('a', 2), /Both parameters must be numbers/);
  assert.throws(() => addNumbers(null, 2), /Both parameters must be numbers/);
  assert.throws(() => addNumbers(undefined, 2), /Both parameters must be numbers/);
});