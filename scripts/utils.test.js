const test = require('node:test');
const assert = require('node:assert');
const { parseCsv } = require('../scripts/utils');

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