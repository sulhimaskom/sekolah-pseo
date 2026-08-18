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

test('generateFooterHtml accepts an injectable year', () => {
  const html = generateFooterHtml({ year: 2025 });
  assert.ok(html.includes('&copy; 2025'));
  assert.ok(!html.includes(String(new Date().getFullYear())));
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

test('generateFooterHtml injects the comparison tray after the footer', () => {
  const html = generateFooterHtml();
  assert.ok(html.includes('id="comparison-tray"'));
  assert.ok(html.includes('id="comparison-toggle"'));
  assert.ok(html.includes('id="school-data"') === false); // payload only on school pages
  const footerEnd = html.indexOf('</footer>');
  const trayStart = html.indexOf('id="comparison-tray"');
  assert.ok(footerEnd !== -1 && trayStart > footerEnd, 'tray must follow the footer');
});
