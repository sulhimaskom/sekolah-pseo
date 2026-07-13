const test = require('node:test');
const assert = require('node:assert');
const { generateFooterHtml } = require('../src/presenters/templates/shared/footer');

test('generateFooterHtml returns footer with contentinfo role', () => {
  const html = generateFooterHtml();
  assert.ok(html.includes('<footer role="contentinfo">'));
  assert.ok(html.includes('</footer>'));
});

test('generateFooterHtml includes copyright with current year', () => {
  const html = generateFooterHtml();
  const currentYear = new Date().getFullYear();
  assert.ok(html.includes(String(currentYear)));
  assert.ok(html.includes('&copy;'));
});

test('generateFooterHtml includes default site name', () => {
  const html = generateFooterHtml();
  assert.ok(html.includes('Sekolah PSEO'));
});

test('generateFooterHtml includes data source attribution', () => {
  const html = generateFooterHtml();
  assert.ok(html.includes('Data sekolah berasal dari Dapodik'));
});

test('generateFooterHtml accepts custom site name', () => {
  const html = generateFooterHtml({ siteName: 'Test School' });
  assert.ok(html.includes('Test School'));
});

test('generateFooterHtml renders extra content', () => {
  const extra = '\n    <p class="footer-links"><a href="/data.csv" download>Unduh CSV</a></p>';
  const html = generateFooterHtml({ extraContent: extra });
  assert.ok(html.includes('footer-links'));
  assert.ok(html.includes('/data.csv'));
  assert.ok(html.includes('Unduh CSV'));
});

test('generateFooterHtml preserves accessibility landmarks', () => {
  const html = generateFooterHtml();
  assert.ok(html.includes('role="contentinfo"'));
});
