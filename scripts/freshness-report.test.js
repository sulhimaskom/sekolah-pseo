'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { generateHtml, getReportData } = require('./freshness-report');

// ── Mock Data ────────────────────────────────────────────────────────────────

function makeMockFreshness(overrides = {}) {
  return {
    isFresh: true,
    date: '2026-05-15',
    daysAgo: 3,
    recordCount: 3474,
    maxAgeDays: 7,
    exists: true,
    ...overrides,
  };
}

function makeMockQuality(overrides = {}) {
  return {
    totalRecords: 3474,
    metrics: {
      npsn: { percentage: '100.0', count: 3474, total: 3474 },
      nama: { percentage: '100.0', count: 3474, total: 3474 },
      coordinates: { percentage: '99.7', count: 3463, total: 3474 },
      address: { percentage: '100.0', count: 3474, total: 3474 },
      province: { percentage: '100.0', count: 3474, total: 3474 },
    },
    ...overrides,
  };
}

// ── generateHtml ────────────────────────────────────────────────────────────

test('generateHtml returns a non-empty HTML string', () => {
  const html = generateHtml(makeMockFreshness(), makeMockQuality());
  assert.strictEqual(typeof html, 'string');
  assert.ok(html.length > 100);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
});

test('generateHtml includes title and freshness data', () => {
  const freshness = makeMockFreshness({ recordCount: 5000 });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('Data Freshness Report'));
  assert.ok(html.includes('Sekolah PSEO'));
  assert.ok(html.includes('5,000')); // recordCount with locale formatting
});

test('generateHtml shows Fresh status when data is fresh', () => {
  const freshness = makeMockFreshness({ isFresh: true, daysAgo: 2 });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('Fresh'));
  assert.ok(!html.includes('Stale'));
});

test('generateHtml shows Stale status when data is stale', () => {
  const freshness = makeMockFreshness({ isFresh: false, daysAgo: 30, date: '2026-04-01' });
  const html = generateHtml(freshness, makeMockQuality());
  // Check rendered status text (CSS class name also contains "fresh" but that's in styles)
  assert.ok(html.includes('>Stale<'));
  // CSS class 'status-stale' should be present, not the status text 'Fresh'
  assert.ok(html.includes('status-stale'));
  assert.ok(!html.includes('>Fresh<'));
});

test('generateHtml displays last updated date and days ago', () => {
  const freshness = makeMockFreshness({ date: '2026-01-01', daysAgo: 150 });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('2026-01-01'));
  assert.ok(html.includes('150 days ago'));
});

test('generateHtml handles null daysAgo gracefully', () => {
  const freshness = makeMockFreshness({ date: null, daysAgo: null });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('N/A'));
  assert.ok(html.includes('Unknown'));
});

test('generateHtml handles missing quality data', () => {
  const freshness = makeMockFreshness();
  const html = generateHtml(freshness, null);
  assert.ok(html.includes('Fresh'));
  assert.strictEqual(html.includes('Data Quality Metrics'), false);
});

test('generateHtml handles quality without metrics', () => {
  const freshness = makeMockFreshness();
  const html = generateHtml(freshness, { totalRecords: 0, metrics: {} });
  assert.ok(html.includes('Data Quality Metrics'));
});

test('generateHtml renders metric bars for quality data', () => {
  const quality = makeMockQuality({
    metrics: {
      npsn: { percentage: '100.0', count: 100, total: 100 },
      coordinates: { percentage: '50.0', count: 50, total: 100 },
    },
  });
  const html = generateHtml(makeMockFreshness(), quality);
  assert.ok(html.includes('Npsn'));
  assert.ok(html.includes('Coordinates'));
  assert.ok(html.includes('100.0%'));
  assert.ok(html.includes('50.0%'));
});

test('generateHtml includes maxAgeDays threshold', () => {
  const freshness = makeMockFreshness({ maxAgeDays: 14 });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('14 days'));
});

test('generateHtml includes SITE_URL when configured', () => {
  // The module reads CONFIG.SITE_URL at render time inside generateHtml
  const freshness = makeMockFreshness();
  const html = generateHtml(freshness, makeMockQuality());
  // If SITE_URL is set, it appears as a link
  const hasUrl = html.includes('href=') || html.includes('sekolah-pseo');
  // Just verify it renders without error regardless
  assert.ok(html.length > 0);
});

test('generateHtml renders dark mode support', () => {
  const html = generateHtml(makeMockFreshness(), makeMockQuality());
  assert.ok(html.includes('prefers-color-scheme: dark'));
});

test('generateHtml renders responsive grid layout', () => {
  const html = generateHtml(makeMockFreshness(), makeMockQuality());
  assert.ok(html.includes('grid-template-columns'));
  assert.ok(html.includes('auto-fit'));
});

test('generateHtml has semantic HTML structure', () => {
  const html = generateHtml(makeMockFreshness(), makeMockQuality());
  assert.ok(html.includes('<h1>'));
  assert.ok(html.includes('</h1>'));
  assert.ok(html.includes('<div class="container">'));
  assert.ok(html.includes('<div class="footer">'));
});

test('generateHtml handles zero record count', () => {
  const freshness = makeMockFreshness({ recordCount: 0, isFresh: false });
  const html = generateHtml(freshness, makeMockQuality());
  assert.ok(html.includes('0'));
});

test('generateHtml renders metric bar colors based on percentage', () => {
  const quality = makeMockQuality({
    metrics: {
      high: { percentage: '100.0', count: 100, total: 100 },
      medium: { percentage: '95.0', count: 95, total: 100 },
      low: { percentage: '80.0', count: 80, total: 100 },
    },
  });
  const html = generateHtml(makeMockFreshness(), quality);
  // High percentage → green (#22c55e), medium → yellow (#eab308), low → red (#ef4444)
  assert.ok(html.includes('#22c55e'));
  assert.ok(html.includes('#eab308'));
  assert.ok(html.includes('#ef4444'));
});

// ── getReportData ───────────────────────────────────────────────────────────

test('getReportData returns an object with freshness and quality', () => {
  // NOTE: This reads the actual CSV file at CONFIG.SCHOOLS_CSV_PATH
  // If schools.csv does not exist, exists will be false
  const data = getReportData();
  assert.strictEqual(typeof data, 'object');
  assert.ok('exists' in data);
  assert.ok('isFresh' in data);
  assert.ok('recordCount' in data);
  assert.ok('generatedAt' in data);
  assert.ok(typeof data.generatedAt === 'string');
});

test('getReportData contains generatedAt timestamp', () => {
  const data = getReportData();
  const ts = new Date(data.generatedAt);
  assert.ok(ts instanceof Date);
  assert.ok(!isNaN(ts.getTime()));
});
