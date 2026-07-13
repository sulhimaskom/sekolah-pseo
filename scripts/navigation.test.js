const test = require('node:test');
const assert = require('node:assert');
const { generateBreadcrumbHtml } = require('../src/presenters/templates/shared/navigation');

test('generateBreadcrumbHtml returns empty string for empty array', () => {
  assert.strictEqual(generateBreadcrumbHtml([]), '');
});

test('generateBreadcrumbHtml returns empty string for null', () => {
  assert.strictEqual(generateBreadcrumbHtml(null), '');
});

test('generateBreadcrumbHtml returns empty string for undefined', () => {
  assert.strictEqual(generateBreadcrumbHtml(undefined), '');
});

test('generateBreadcrumbHtml returns empty string for non-array', () => {
  assert.strictEqual(generateBreadcrumbHtml('invalid'), '');
  assert.strictEqual(generateBreadcrumbHtml(123), '');
  assert.strictEqual(generateBreadcrumbHtml({}), '');
});

test('generateBreadcrumbHtml includes nav with aria-label', () => {
  const html = generateBreadcrumbHtml([{ label: 'Beranda' }]);
  assert.ok(html.includes('nav'));
  assert.ok(html.includes('aria-label="Navigasi utama"'));
});

test('generateBreadcrumbHtml renders single item as current page', () => {
  const html = generateBreadcrumbHtml([{ label: 'Beranda' }]);
  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('Beranda'));
});

test('generateBreadcrumbHtml renders two items with separator', () => {
  const html = generateBreadcrumbHtml([{ label: 'Beranda', url: '/' }, { label: 'Jawa Barat' }]);
  assert.ok(html.includes('aria-hidden="true"'));
  assert.ok(html.includes(' / '));
  assert.ok(html.includes('href="/"'));
  assert.ok(html.includes('Beranda'));
  assert.ok(html.includes('Jawa Barat'));
  assert.ok(html.includes('aria-current="page"'));
});

test('generateBreadcrumbHtml first item is link, last item is current page', () => {
  const html = generateBreadcrumbHtml([
    { label: 'Home', url: '/' },
    { label: 'Province', url: '/provinsi/test/' },
    { label: 'Current Page' },
  ]);
  assert.ok(html.includes('href="/"'));
  assert.ok(html.includes('href="/provinsi/test/"'));
  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('Current Page'));
});

test('generateBreadcrumbHtml escapes url and label from caller', () => {
  const html = generateBreadcrumbHtml([
    { label: 'Home', url: '/' },
    { label: 'Province &amp; City', url: '/provinsi/test/' },
  ]);
  assert.ok(html.includes('Province &amp; City'));
  assert.ok(html.includes('aria-current="page"'));
});
