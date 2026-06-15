'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  analyzeQuality,
  checkThresholds,
  isValidCoordinate,
  isNonEmpty,
  pct,
  createBar,
  formatHuman,
  formatJson,
  REQUIRED_FIELDS,
  INDONESIA_BOUNDS,
  DEFAULT_THRESHOLDS,
} = require('./data-quality');

// ── isNonEmpty ──────────────────────────────────────────────────────────────

test('isNonEmpty returns true for valid strings', () => {
  assert.strictEqual(isNonEmpty('hello'), true);
  assert.strictEqual(isNonEmpty('0'), true);
  assert.strictEqual(isNonEmpty('   x'), true);
});

test('isNonEmpty returns false for null/undefined', () => {
  assert.strictEqual(isNonEmpty(null), false);
  assert.strictEqual(isNonEmpty(undefined), false);
});

test('isNonEmpty returns false for empty/whitespace strings', () => {
  assert.strictEqual(isNonEmpty(''), false);
  assert.strictEqual(isNonEmpty('   '), false);
  assert.strictEqual(isNonEmpty('\t'), false);
});

test('isNonEmpty handles numbers', () => {
  assert.strictEqual(isNonEmpty(0), true);
  assert.strictEqual(isNonEmpty(123), true);
});

// ── isValidCoordinate ───────────────────────────────────────────────────────

test('isValidCoordinate accepts valid Indonesia coordinates', () => {
  assert.strictEqual(isValidCoordinate('-6.2088', -11, 6), true);
  assert.strictEqual(isValidCoordinate('-6', -11, 6), true);
  assert.strictEqual(isValidCoordinate('0.5', -11, 6), true);
  assert.strictEqual(isValidCoordinate('5.999', -11, 6), true);
});

test('isValidCoordinate rejects out-of-bounds values', () => {
  assert.strictEqual(isValidCoordinate('-12', -11, 6), false); // below lat min
  assert.strictEqual(isValidCoordinate('7', -11, 6), false); // above lat max
  assert.strictEqual(isValidCoordinate('94', 95, 141), false); // below lon min
  assert.strictEqual(isValidCoordinate('142', 95, 141), false); // above lon max
});

test('isValidCoordinate rejects zero (unset marker)', () => {
  assert.strictEqual(isValidCoordinate('0', -11, 6), false);
  assert.strictEqual(isValidCoordinate(0, -11, 6), false);
});

test('isValidCoordinate rejects non-numeric values', () => {
  assert.strictEqual(isValidCoordinate('abc', -11, 6), false);
  assert.strictEqual(isValidCoordinate('', -11, 6), false);
  assert.strictEqual(isValidCoordinate(null, -11, 6), false);
  assert.strictEqual(isValidCoordinate(undefined, -11, 6), false);
});

test('isValidCoordinate accepts boundary values', () => {
  assert.strictEqual(isValidCoordinate('-11', -11, 6), true);
  assert.strictEqual(isValidCoordinate('6', -11, 6), true);
  assert.strictEqual(isValidCoordinate('95', 95, 141), true);
  assert.strictEqual(isValidCoordinate('141', 95, 141), true);
});

// ── pct ─────────────────────────────────────────────────────────────────────

test('pct formats percentage correctly', () => {
  assert.strictEqual(pct(50, 100), '50.0%');
  assert.strictEqual(pct(1, 3), '33.3%');
  assert.strictEqual(pct(0, 100), '0.0%');
  assert.strictEqual(pct(100, 100), '100.0%');
});

test('pct handles zero total', () => {
  assert.strictEqual(pct(10, 0), '0.0%');
});

test('pct handles partial values', () => {
  assert.strictEqual(pct(3474, 3474), '100.0%');
  assert.strictEqual(pct(3463, 3474), '99.7%');
  assert.strictEqual(pct(11, 3474), '0.3%');
});

// ── createBar ───────────────────────────────────────────────────────────────

test('createBar renders full bar at 100%', () => {
  const bar = createBar(100, 10);
  assert.strictEqual(bar.length, 10);
  assert.ok(bar.includes('█'));
  assert.ok(!bar.includes('░'));
});

test('createBar renders empty bar at 0%', () => {
  const bar = createBar(0, 10);
  assert.strictEqual(bar.length, 10);
  assert.ok(!bar.includes('█'));
  assert.ok(bar.includes('░'));
});

test('createBar renders half bar at 50%', () => {
  const bar = createBar(50, 10);
  assert.strictEqual(bar.length, 10);
  assert.ok(bar.includes('█'));
  assert.ok(bar.includes('░'));
});

test('createBar handles rounding correctly', () => {
  const bar = createBar(25, 40);
  assert.strictEqual(bar.length, 40);
  // 25% of 40 = 10 filled
  assert.strictEqual(bar.split('█').length - 1, 10);
});

test('createBar works with narrow width', () => {
  const bar = createBar(99, 1);
  assert.strictEqual(bar.length, 1);
});

// ── analyzeQuality ──────────────────────────────────────────────────────────

test('analyzeQuality returns empty report for empty array', () => {
  const report = analyzeQuality([]);
  assert.strictEqual(report.summary.totalSchools, 0);
  assert.strictEqual(report.summary.overallScore, 0);
  assert.deepStrictEqual(report.fieldCompleteness, {});
  assert.strictEqual(report.coordinates.total, 0);
  assert.strictEqual(report.npsnUniqueness.unique, 0);
});

test('analyzeQuality computes field completeness correctly', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'N',
    },
    {
      npsn: '002',
      nama: '',
      bentuk_pendidikan: 'SMP',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'S',
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.summary.totalSchools, 2);
  assert.strictEqual(report.fieldCompleteness.nama.present, 1);
  assert.strictEqual(report.fieldCompleteness.nama.missing, 1);
  assert.strictEqual(report.fieldCompleteness.nama.completenessPct, 50);
  assert.strictEqual(report.fieldCompleteness.npsn.completenessPct, 100);
});

test('analyzeQuality tracks coordinate validity', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '-6.2',
      lon: '106.8',
    },
    {
      npsn: '002',
      nama: 'B',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '',
      lon: '',
    },
    {
      npsn: '003',
      nama: 'C',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '0',
      lon: '0',
    },
    {
      npsn: '004',
      nama: 'D',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '-20',
      lon: '200',
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.coordinates.valid, 1);
  assert.strictEqual(report.coordinates.missing, 1);
  assert.strictEqual(report.coordinates.zero, 1);
  assert.strictEqual(report.coordinates.outOfBounds, 1);
  assert.strictEqual(report.coordinates.total, 4);
});

test('analyzeQuality detects duplicate NPSNs', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '001',
      nama: 'B',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '002',
      nama: 'C',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.npsnUniqueness.unique, 1);
  assert.strictEqual(report.npsnUniqueness.duplicates, 1);
  assert.strictEqual(report.npsnUniqueness.duplicateCount, 2);
  assert.strictEqual(report.npsnUniqueness.duplicateNpsns.length, 1);
  assert.strictEqual(report.npsnUniqueness.duplicateNpsns[0].npsn, '001');
  assert.strictEqual(report.npsnUniqueness.duplicateNpsns[0].count, 2);
});

test('analyzeQuality tracks categorical distribution', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'Jawa Barat',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'N',
    },
    {
      npsn: '002',
      nama: 'B',
      bentuk_pendidikan: 'SMP',
      provinsi: 'Jawa Barat',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'S',
    },
    {
      npsn: '003',
      nama: 'C',
      bentuk_pendidikan: 'SD',
      provinsi: 'Jawa Timur',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'N',
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.categoricalDistribution.provinces['Jawa Barat'], 2);
  assert.strictEqual(report.categoricalDistribution.provinces['Jawa Timur'], 1);
  assert.strictEqual(report.categoricalDistribution.educationTypes['SD'], 2);
  assert.strictEqual(report.categoricalDistribution.educationTypes['SMP'], 1);
  assert.strictEqual(report.categoricalDistribution.statuses['Negeri'], 2);
  assert.strictEqual(report.categoricalDistribution.statuses['Swasta'], 1);
});

test('analyzeQuality handles schools with unknown status', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: null,
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.categoricalDistribution.statuses['(unknown)'], 1);
});

test('analyzeQuality computes overall score correctly', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '-6.2',
      lon: '106.8',
    },
    {
      npsn: '002',
      nama: 'B',
      bentuk_pendidikan: 'SMP',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '-7.2',
      lon: '112.7',
    },
  ];

  const report = analyzeQuality(schools);
  // 100% completeness (all required fields filled)
  // 100% coordinates valid (2/2)
  // 100% uniqueness (no duplicates)
  // Score = 100*0.4 + 100*0.3 + 100*0.3 = 100.0
  assert.strictEqual(report.summary.overallScore, 100);
});

test('analyzeQuality handles large dataset efficiently', () => {
  const schools = [];
  for (let i = 0; i < 500; i++) {
    schools.push({
      npsn: String(i).padStart(3, '0'),
      nama: `School ${i}`,
      bentuk_pendidikan: i % 2 === 0 ? 'SD' : 'SMP',
      provinsi: 'Test',
      kab_kota: 'City',
      kecamatan: 'District',
      lat: '-6.2',
      lon: '106.8',
    });
  }

  const report = analyzeQuality(schools);
  assert.strictEqual(report.summary.totalSchools, 500);
  assert.strictEqual(report.coordinates.valid, 500);
  assert.strictEqual(report.npsnUniqueness.unique, 500);
});

test('analyzeQuality handles missing optional fields gracefully', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ];

  const report = analyzeQuality(schools);
  assert.strictEqual(report.summary.totalSchools, 1);
  assert.strictEqual(report.coordinates.total, 1);
  assert.strictEqual(report.coordinates.missing, 1);
});

// ── checkThresholds ─────────────────────────────────────────────────────────

test('checkThresholds passes when all thresholds met', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 95 },
    fieldCompleteness: {
      npsn: { completenessPct: 100 },
      nama: { completenessPct: 100 },
      bentuk_pendidikan: { completenessPct: 100 },
      provinsi: { completenessPct: 100 },
      kab_kota: { completenessPct: 100 },
      kecamatan: { completenessPct: 100 },
    },
    coordinates: { valid: 100 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  const result = checkThresholds(report);
  assert.strictEqual(result.passed, true);
  assert.deepStrictEqual(result.failures, []);
});

test('checkThresholds fails on low completeness', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 50 },
    fieldCompleteness: {
      npsn: { completenessPct: 50 },
      nama: { completenessPct: 100 },
      bentuk_pendidikan: { completenessPct: 100 },
      provinsi: { completenessPct: 100 },
      kab_kota: { completenessPct: 100 },
      kecamatan: { completenessPct: 100 },
    },
    coordinates: { valid: 100 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  const result = checkThresholds(report);
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.some(f => f.includes('npsn')));
});

test('checkThresholds fails on low coordinate validity', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 50 },
    fieldCompleteness: {
      npsn: { completenessPct: 100 },
      nama: { completenessPct: 100 },
      bentuk_pendidikan: { completenessPct: 100 },
      provinsi: { completenessPct: 100 },
      kab_kota: { completenessPct: 100 },
      kecamatan: { completenessPct: 100 },
    },
    coordinates: { valid: 10 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  const result = checkThresholds(report, { ...DEFAULT_THRESHOLDS, MIN_COORDINATE_PCT: 50 });
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.some(f => f.includes('Coordinate')));
});

test('checkThresholds fails on duplicate NPSNs', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 50 },
    fieldCompleteness: {
      npsn: { completenessPct: 100 },
      nama: { completenessPct: 100 },
      bentuk_pendidikan: { completenessPct: 100 },
      provinsi: { completenessPct: 100 },
      kab_kota: { completenessPct: 100 },
      kecamatan: { completenessPct: 100 },
    },
    coordinates: { valid: 100 },
    npsnUniqueness: {
      duplicates: 2,
      duplicateCount: 5,
      unique: 95,
      duplicateNpsns: [
        { npsn: '001', count: 3 },
        { npsn: '002', count: 2 },
      ],
    },
  };

  const result = checkThresholds(report);
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.some(f => f.includes('NPSN')));
});

test('checkThresholds supports custom thresholds', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 95 },
    fieldCompleteness: {
      npsn: { completenessPct: 99 },
      nama: { completenessPct: 99 },
      bentuk_pendidikan: { completenessPct: 99 },
      provinsi: { completenessPct: 99 },
      kab_kota: { completenessPct: 99 },
      kecamatan: { completenessPct: 99 },
    },
    coordinates: { valid: 99 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  // Custom thresholds: expect 100% for everything
  const strict = {
    MIN_COMPLETENESS_PCT: 100,
    MAX_DUPLICATE_NPSN: 0,
    MIN_COORDINATE_PCT: 100,
  };
  const result = checkThresholds(report, strict);
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.length > 0);
});

test('checkThresholds handles empty totalSchools gracefully', () => {
  const report = {
    summary: { totalSchools: 0, overallScore: 0 },
    fieldCompleteness: {},
    coordinates: { valid: 0 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 0, duplicateNpsns: [] },
  };

  const result = checkThresholds(report);
  // Coordinate validity fails because 0% < 50% threshold
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.some(f => f.includes('Coordinate')));
  assert.strictEqual(result.failures.length, 1); // only coordinate failure
});

test('checkThresholds passes when metrics exactly at threshold boundary', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 90 },
    fieldCompleteness: {
      npsn: { completenessPct: 90 },
      nama: { completenessPct: 90 },
      bentuk_pendidikan: { completenessPct: 90 },
      provinsi: { completenessPct: 90 },
      kab_kota: { completenessPct: 90 },
      kecamatan: { completenessPct: 90 },
    },
    coordinates: { valid: 50 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  const result = checkThresholds(report);
  assert.strictEqual(result.passed, true);
  assert.deepStrictEqual(result.failures, []);
});

test('checkThresholds fails when completeness just below threshold', () => {
  const report = {
    summary: { totalSchools: 100, overallScore: 89 },
    fieldCompleteness: {
      npsn: { completenessPct: 89 },
      nama: { completenessPct: 100 },
      bentuk_pendidikan: { completenessPct: 100 },
      provinsi: { completenessPct: 100 },
      kab_kota: { completenessPct: 100 },
      kecamatan: { completenessPct: 100 },
    },
    coordinates: { valid: 100 },
    npsnUniqueness: { duplicates: 0, duplicateCount: 0, unique: 100, duplicateNpsns: [] },
  };

  const result = checkThresholds(report);
  assert.strictEqual(result.passed, false);
  assert.ok(result.failures.some(f => f.includes('npsn')));
});

// ── formatHuman ─────────────────────────────────────────────────────────────

test('formatHuman returns non-empty string', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ]);
  const output = formatHuman(report);
  assert.strictEqual(typeof output, 'string');
  assert.ok(output.length > 50);
  assert.ok(output.includes('DATA QUALITY REPORT'));
  assert.ok(output.includes('Total schools: 1'));
});

test('formatHuman includes coordinate info when present', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      lat: '-6.2',
      lon: '106.8',
    },
  ]);
  const output = formatHuman(report);
  assert.ok(output.includes('Coordinate Validity'));
  assert.ok(output.includes('Valid'));
});

test('formatHuman shows no duplicates message', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ]);
  const output = formatHuman(report);
  assert.ok(output.includes('No duplicate NPSNs'));
});

test('formatHuman shows categorical distribution', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
      status: 'N',
    },
  ]);
  const output = formatHuman(report);
  assert.ok(output.includes('Categorical Distribution'));
  assert.ok(output.includes('Education types'));
  assert.ok(output.includes('Negeri'));
});

test('formatHuman lists duplicate NPSN details when duplicates exist', () => {
  const schools = [
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '001',
      nama: 'B',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '002',
      nama: 'C',
      bentuk_pendidikan: 'SMP',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '003',
      nama: 'D',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '003',
      nama: 'E',
      bentuk_pendidikan: 'SMA',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
    {
      npsn: '003',
      nama: 'F',
      bentuk_pendidikan: 'SMK',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ];
  const report = analyzeQuality(schools);
  const output = formatHuman(report);
  assert.ok(output.includes('Duplicate NPSN groups: 2'));
  assert.ok(output.includes('Records with duplicate NPSN: 5'));
  assert.ok(output.includes('NPSN 001'));
  assert.ok(output.includes('NPSN 003'));
  assert.ok(output.includes('→ 2 records'));
  assert.ok(output.includes('→ 3 records'));
});

// ── formatJson ──────────────────────────────────────────────────────────────

test('formatJson produces valid JSON', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ]);
  const json = formatJson(report);
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.summary.totalSchools, 1);
  assert.ok(parsed.fieldCompleteness);
  assert.ok(parsed.coordinates);
  assert.ok(parsed.npsnUniqueness);
  assert.ok(parsed.categoricalDistribution);
});

test('formatJson includes all required sections', () => {
  const report = analyzeQuality([
    {
      npsn: '001',
      nama: 'A',
      bentuk_pendidikan: 'SD',
      provinsi: 'X',
      kab_kota: 'Y',
      kecamatan: 'Z',
    },
  ]);
  const parsed = JSON.parse(formatJson(report));
  assert.ok('summary' in parsed);
  assert.ok('fieldCompleteness' in parsed);
  assert.ok('coordinates' in parsed);
  assert.ok('npsnUniqueness' in parsed);
  assert.ok('categoricalDistribution' in parsed);
});

// ── Constants ───────────────────────────────────────────────────────────────

test('REQUIRED_FIELDS contains all expected fields', () => {
  assert.ok(Array.isArray(REQUIRED_FIELDS));
  assert.strictEqual(REQUIRED_FIELDS.length, 6);
  assert.ok(REQUIRED_FIELDS.includes('npsn'));
  assert.ok(REQUIRED_FIELDS.includes('nama'));
  assert.ok(REQUIRED_FIELDS.includes('bentuk_pendidikan'));
  assert.ok(REQUIRED_FIELDS.includes('provinsi'));
  assert.ok(REQUIRED_FIELDS.includes('kab_kota'));
  assert.ok(REQUIRED_FIELDS.includes('kecamatan'));
});

test('INDONESIA_BOUNDS defines correct geographic range', () => {
  assert.strictEqual(INDONESIA_BOUNDS.LAT_MIN, -11);
  assert.strictEqual(INDONESIA_BOUNDS.LAT_MAX, 6);
  assert.strictEqual(INDONESIA_BOUNDS.LON_MIN, 95);
  assert.strictEqual(INDONESIA_BOUNDS.LON_MAX, 141);
});

test('DEFAULT_THRESHOLDS has all expected keys', () => {
  assert.ok('MIN_COMPLETENESS_PCT' in DEFAULT_THRESHOLDS);
  assert.ok('MAX_DUPLICATE_NPSN' in DEFAULT_THRESHOLDS);
  assert.ok('MIN_COORDINATE_PCT' in DEFAULT_THRESHOLDS);
  assert.strictEqual(DEFAULT_THRESHOLDS.MIN_COMPLETENESS_PCT, 90);
  assert.strictEqual(DEFAULT_THRESHOLDS.MAX_DUPLICATE_NPSN, 0);
  assert.strictEqual(DEFAULT_THRESHOLDS.MIN_COORDINATE_PCT, 50);
});
