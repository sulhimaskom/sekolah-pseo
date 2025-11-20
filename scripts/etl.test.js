const test = require('node:test');
const assert = require('node:assert');
const { parseCsv, sanitize, normaliseRecord, validateRecord } = require('../scripts/etl');

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
  assert.strictEqual(validateRecord({ npsn: '12345' }), true);
  assert.strictEqual(validateRecord({ npsn: 'abcde' }), false);
  assert.strictEqual(!!validateRecord({ npsn: '' }), false); // Empty string is falsy
});

test('validateRecord handles null input', () => {
  assert.strictEqual(validateRecord(null), false);
});