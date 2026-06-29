'use strict';

const test = require('node:test');
const assert = require('node:assert');
const SCHEMA = require('./data-schema');

// ── Constants ───────────────────────────────────────────────────────────────

test('SCHEMA_VERSION is a non-empty string', () => {
  assert.strictEqual(typeof SCHEMA.SCHEMA_VERSION, 'string');
  assert.ok(SCHEMA.SCHEMA_VERSION.length > 0);
});

test('INDONESIA_BOUNDS has expected values', () => {
  assert.strictEqual(SCHEMA.INDONESIA_BOUNDS.LAT_MIN, -11);
  assert.strictEqual(SCHEMA.INDONESIA_BOUNDS.LAT_MAX, 6);
  assert.strictEqual(SCHEMA.INDONESIA_BOUNDS.LON_MIN, 95);
  assert.strictEqual(SCHEMA.INDONESIA_BOUNDS.LON_MAX, 141);
});

test('ALLOWED_VALUES has expected categorical fields', () => {
  assert.deepStrictEqual(SCHEMA.ALLOWED_VALUES.status, ['N', 'S']);
  assert.ok(SCHEMA.ALLOWED_VALUES.bentuk_pendidikan.includes('SD'));
  assert.ok(SCHEMA.ALLOWED_VALUES.bentuk_pendidikan.includes('SMP'));
  assert.ok(SCHEMA.ALLOWED_VALUES.bentuk_pendidikan.includes('SMA'));
  assert.ok(SCHEMA.ALLOWED_VALUES.bentuk_pendidikan.includes('SMK'));
  assert.ok(SCHEMA.ALLOWED_VALUES.bentuk_pendidikan.includes('SLB'));
});

test('FIELDS has all expected field definitions', () => {
  const expectedFields = [
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
  for (const field of expectedFields) {
    assert.ok(SCHEMA.FIELDS[field], `Missing field: ${field}`);
    assert.strictEqual(typeof SCHEMA.FIELDS[field].description, 'string');
  }
});

test('CSV_FIELD_ORDER includes all required fields', () => {
  for (const field of SCHEMA.REQUIRED_FIELDS) {
    assert.ok(SCHEMA.CSV_FIELD_ORDER.includes(field));
  }
  assert.strictEqual(SCHEMA.CSV_FIELD_ORDER[SCHEMA.CSV_FIELD_ORDER.length - 1], 'updated_at');
});

test('REQUIRED_FIELDS is non-empty array', () => {
  assert.ok(Array.isArray(SCHEMA.REQUIRED_FIELDS));
  assert.ok(SCHEMA.REQUIRED_FIELDS.length > 0);
  assert.ok(SCHEMA.REQUIRED_FIELDS.includes('npsn'));
  assert.ok(SCHEMA.REQUIRED_FIELDS.includes('nama'));
  assert.ok(SCHEMA.REQUIRED_FIELDS.includes('provinsi'));
});

// ── isNonEmpty ──────────────────────────────────────────────────────────────

test('isNonEmpty returns false for null/undefined/empty', () => {
  assert.strictEqual(SCHEMA.isNonEmpty(null), false);
  assert.strictEqual(SCHEMA.isNonEmpty(undefined), false);
  assert.strictEqual(SCHEMA.isNonEmpty(''), false);
  assert.strictEqual(SCHEMA.isNonEmpty('   '), false);
});

test('isNonEmpty returns true for non-empty values', () => {
  assert.strictEqual(SCHEMA.isNonEmpty('hello'), true);
  assert.strictEqual(SCHEMA.isNonEmpty('  hello  '), true);
  assert.strictEqual(SCHEMA.isNonEmpty(0), true);
  assert.strictEqual(SCHEMA.isNonEmpty(false), true);
});

// ── isValidCoordinate ───────────────────────────────────────────────────────

test('isValidCoordinate returns true for valid Indonesia coordinates', () => {
  assert.strictEqual(SCHEMA.isValidCoordinate('-6.2088', -11, 6), true);
  assert.strictEqual(SCHEMA.isValidCoordinate('106.8456', 95, 141), true);
  assert.strictEqual(SCHEMA.isValidCoordinate('-11', -11, 6), true);
  assert.strictEqual(SCHEMA.isValidCoordinate('141', 95, 141), true);
});

test('isValidCoordinate returns false for out-of-bounds coordinates', () => {
  assert.strictEqual(SCHEMA.isValidCoordinate('-12', -11, 6), false);
  assert.strictEqual(SCHEMA.isValidCoordinate('7', -11, 6), false);
  assert.strictEqual(SCHEMA.isValidCoordinate('94', 95, 141), false);
  assert.strictEqual(SCHEMA.isValidCoordinate('142', 95, 141), false);
});

test('isValidCoordinate returns false for zero coordinates (unset)', () => {
  assert.strictEqual(SCHEMA.isValidCoordinate('0', -11, 6), false);
  assert.strictEqual(SCHEMA.isValidCoordinate(0, -11, 6), false);
});

test('isValidCoordinate returns false for non-numeric input', () => {
  assert.strictEqual(SCHEMA.isValidCoordinate('abc', -11, 6), false);
  assert.strictEqual(SCHEMA.isValidCoordinate('', -11, 6), false);
  assert.strictEqual(SCHEMA.isValidCoordinate(null, -11, 6), false);
});

// ── isValidCategoricalValue ─────────────────────────────────────────────────

test('isValidCategoricalValue validates status values', () => {
  assert.strictEqual(SCHEMA.isValidCategoricalValue('status', 'N'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('status', 'S'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('status', 'X'), false);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('status', ''), false);
});

test('isValidCategoricalValue validates bentuk_pendidikan values', () => {
  assert.strictEqual(SCHEMA.isValidCategoricalValue('bentuk_pendidikan', 'SD'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('bentuk_pendidikan', 'SMP'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('bentuk_pendidikan', 'SMA'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('bentuk_pendidikan', 'TK'), false);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('bentuk_pendidikan', ''), false);
});

test('isValidCategoricalValue returns true for non-categorical fields', () => {
  assert.strictEqual(SCHEMA.isValidCategoricalValue('nama', 'anything'), true);
  assert.strictEqual(SCHEMA.isValidCategoricalValue('npsn', '12345'), true);
});

// ── matchesPattern ──────────────────────────────────────────────────────────

test('matchesPattern validates regex patterns', () => {
  assert.strictEqual(SCHEMA.matchesPattern('12345', /^\d+$/), true);
  assert.strictEqual(SCHEMA.matchesPattern('abc', /^\d+$/), false);
  assert.strictEqual(SCHEMA.matchesPattern('', /^\d+$/), false);
  assert.strictEqual(SCHEMA.matchesPattern(null, /^\d+$/), false);
});

// ── validateRecord ──────────────────────────────────────────────────────────

test('validateRecord returns no errors for valid record', () => {
  const record = {
    npsn: '12345',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    status: 'N',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
    alamat: 'Jl. Example No. 1',
    lat: '-6.2088',
    lon: '106.8456',
  };
  const errors = SCHEMA.validateRecord(record);
  assert.deepStrictEqual(errors, []);
});

test('validateRecord detects missing required fields', () => {
  const record = {
    npsn: '12345',
    nama: 'Test School',
  };
  const errors = SCHEMA.validateRecord(record);
  assert.ok(errors.length > 0);
  const msg = errors.join(' ');
  assert.ok(msg.includes('bentuk_pendidikan'));
  assert.ok(msg.includes('provinsi'));
});

test('validateRecord reports invalid categorical values', () => {
  const record = {
    npsn: '12345',
    nama: 'Test School',
    bentuk_pendidikan: 'TK',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
    status: 'X',
  };
  const errors = SCHEMA.validateRecord(record);
  const msg = errors.join(' ');
  assert.ok(errors.length > 0, 'Expected errors for invalid categorical values');
  assert.ok(msg.includes('bentuk_pendidikan'), `Expected bentuk_pendidikan error, got: ${msg}`);
  assert.ok(msg.includes('TK'), 'Expected TK to be mentioned as invalid');
  assert.ok(msg.includes('allowed'), 'Expected error to mention allowed values');
});

test('validateRecord reports invalid optional categorical values', () => {
  const record = {
    npsn: '12345',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
    status: 'INVALID',
  };
  const errors = SCHEMA.validateRecord(record);
  assert.ok(errors.length > 0);
  const msg = errors.join(' ');
  assert.ok(msg.includes('status'));
  assert.ok(msg.includes('INVALID'));
});

test('validateRecord reports non-numeric NPSN', () => {
  const record = {
    npsn: 'ABCDE',
    nama: 'Test School',
    bentuk_pendidikan: 'SD',
    provinsi: 'Provinsi Test',
    kab_kota: 'Kabupaten Test',
    kecamatan: 'Kecamatan Test',
  };
  const errors = SCHEMA.validateRecord(record);
  assert.ok(errors.length > 0);
  const msg = errors.join(' ');
  assert.ok(msg.includes('npsn'));
  assert.ok(msg.includes('numeric'));
});

test('validateRecord handles null/undefined record', () => {
  assert.deepStrictEqual(SCHEMA.validateRecord(null), ['Record must be a non-null object']);
  assert.deepStrictEqual(SCHEMA.validateRecord(undefined), ['Record must be a non-null object']);
  assert.deepStrictEqual(SCHEMA.validateRecord([]), ['Record must be a non-null object']);
});

// ── validateCoordinates ─────────────────────────────────────────────────────

test('validateCoordinates returns valid for Indonesia coordinates', () => {
  const result = SCHEMA.validateCoordinates({ lat: '-6.2088', lon: '106.8456' });
  assert.strictEqual(result.lat.valid, true);
  assert.strictEqual(result.lon.valid, true);
});

test('validateCoordinates reports invalid latitude', () => {
  const result = SCHEMA.validateCoordinates({ lat: '-20', lon: '106.8456' });
  assert.strictEqual(result.lat.valid, false);
  assert.ok(result.lat.error.includes('bounds'));
  assert.strictEqual(result.lon.valid, true);
});

test('validateCoordinates handles empty coordinates', () => {
  const result = SCHEMA.validateCoordinates({ lat: '', lon: '' });
  assert.strictEqual(result.lat.valid, true);
  assert.strictEqual(result.lon.valid, true);
});

// ── checkCoordinateQuality ──────────────────────────────────────────────────

test('checkCoordinateQuality validates coordinate presence and validity', () => {
  assert.deepStrictEqual(SCHEMA.checkCoordinateQuality({ lat: '-6.2088', lon: '106.8456' }), {
    hasData: true,
    isValid: true,
  });
  assert.deepStrictEqual(SCHEMA.checkCoordinateQuality({ lat: '', lon: '' }), {
    hasData: false,
    isValid: false,
  });
  assert.deepStrictEqual(SCHEMA.checkCoordinateQuality({ lat: '-20', lon: '106.8456' }), {
    hasData: true,
    isValid: false,
  });
});

// ── mapRawField ─────────────────────────────────────────────────────────────

test('mapRawField resolves field from raw mappings', () => {
  const raw = {
    NPSN: '12345',
    nama_sekolah: 'Test School',
    jenjang: 'SMA',
    latitude: '-6.2088',
  };
  assert.strictEqual(SCHEMA.mapRawField(raw, 'npsn'), '12345');
  assert.strictEqual(SCHEMA.mapRawField(raw, 'nama'), 'Test School');
  assert.strictEqual(SCHEMA.mapRawField(raw, 'bentuk_pendidikan'), 'SMA');
  assert.strictEqual(SCHEMA.mapRawField(raw, 'lat'), '-6.2088');
});

test('mapRawField returns empty string for non-existent field', () => {
  assert.strictEqual(SCHEMA.mapRawField({}, 'npsn'), '');
  assert.strictEqual(SCHEMA.mapRawField({}, 'nonexistent'), '');
});

test('mapRawField prefers canonical field name', () => {
  const raw = { npsn: '99999', NPSN: '88888' };
  assert.strictEqual(SCHEMA.mapRawField(raw, 'npsn'), '99999');
});

// ── getSchemaInfo ───────────────────────────────────────────────────────────

test('getSchemaInfo returns schema metadata', () => {
  const info = SCHEMA.getSchemaInfo();
  assert.strictEqual(typeof info.version, 'string');
  assert.ok(info.version.length > 0);
  assert.ok(Array.isArray(info.fields));
  assert.ok(info.fields.length > 0);
  assert.ok(info.fields.some(f => f.name === 'npsn'));
  assert.ok(info.fields.some(f => f.name === 'nama'));
  assert.strictEqual(info.requiredFields.length, SCHEMA.REQUIRED_FIELDS.length);
  assert.deepStrictEqual(info.indonesiaBounds, SCHEMA.INDONESIA_BOUNDS);
});

test('getSchemaInfo includes field constraints for fields with patterns', () => {
  const info = SCHEMA.getSchemaInfo();
  const npsnField = info.fields.find(f => f.name === 'npsn');
  assert.ok(npsnField.constraints.pattern);
  assert.strictEqual(npsnField.constraints.pattern, '^\\d+$');
});

test('getSchemaInfo includes allowed values for categorical fields', () => {
  const info = SCHEMA.getSchemaInfo();
  const statusField = info.fields.find(f => f.name === 'status');
  assert.deepStrictEqual(statusField.allowedValues, ['N', 'S']);
});

// ── validateRecord with real-world data ──────────────────────────────────────

test('validateRecord accepts a real-world record shape', () => {
  const record = {
    npsn: '20106991',
    nama: 'SMP Pattimura',
    bentuk_pendidikan: 'SMP',
    status: 'S',
    alamat: 'Jl. Jagakarsa Raya No. 88',
    kecamatan: 'Kec. Jagakarsa',
    kab_kota: 'Kota Jakarta Selatan',
    provinsi: 'Prov. D.K.I. Jakarta',
    lat: '-6.3266000',
    lon: '106.8191000',
  };
  const errors = SCHEMA.validateRecord(record);
  assert.deepStrictEqual(errors, []);
});
