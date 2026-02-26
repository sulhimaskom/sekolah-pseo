const test = require('node:test');
const assert = require('node:assert');

test('aggregateByProvince returns empty array for non-array input', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  assert.deepStrictEqual(aggregateByProvince(null), []);
  assert.deepStrictEqual(aggregateByProvince(undefined), []);
  assert.deepStrictEqual(aggregateByProvince('invalid'), []);
  assert.deepStrictEqual(aggregateByProvince(123), []);
  assert.deepStrictEqual(aggregateByProvince({}), []);
});

test('aggregateByProvince returns empty array for empty array', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const result = aggregateByProvince([]);
  assert.strictEqual(result.length, 0);
});

test('aggregateByProvince groups schools by province', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Timur' },
    { npsn: '4', nama: 'School 4', provinsi: 'Jawa Timur' },
    { npsn: '5', nama: 'School 5', provinsi: 'Jawa Timur' },
  ];

  const result = aggregateByProvince(schools);

  assert.strictEqual(result.length, 2);

  const jawaBarat = result.find(p => p.name === 'Jawa Barat');
  const jawaTimur = result.find(p => p.name === 'Jawa Timur');

  assert.ok(jawaBarat);
  assert.strictEqual(jawaBarat.count, 2);

  assert.ok(jawaTimur);
  assert.strictEqual(jawaTimur.count, 3);
});

test('aggregateByProvince sorts provinces alphabetically', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Sulawesi' },
    { npsn: '2', nama: 'School 2', provinsi: 'Aceh' },
    { npsn: '3', nama: 'School 3', provinsi: 'Bali' },
  ];

  const result = aggregateByProvince(schools);

  assert.strictEqual(result[0].name, 'Aceh');
  assert.strictEqual(result[1].name, 'Bali');
  assert.strictEqual(result[2].name, 'Sulawesi');
});

test('aggregateByProvince generates slugs for province names', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'DKI Jakarta' },
    { npsn: '2', nama: 'School 2', provinsi: 'DKI Jakarta' },
  ];

  const result = aggregateByProvince(schools);

  assert.ok(result[0].slug);
  assert.strictEqual(typeof result[0].slug, 'string');
});

test('aggregateByProvince skips schools without provinsi', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2' }, // No provinsi
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Barat' },
  ];

  const result = aggregateByProvince(schools);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].count, 2);
});

test('aggregateByProvince handles schools with undefined/null provinsi', () => {
  const { aggregateByProvince } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: null },
    { npsn: '2', nama: 'School 2', provinsi: undefined },
    { npsn: '3', nama: 'School 3', provinsi: '' },
  ];

  const result = aggregateByProvince(schools);

  assert.strictEqual(result.length, 0);
});

test('generateHomepageHtml generates valid HTML', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1 Bandung', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<html lang="id">'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('<title>'));
  assert.ok(html.includes('</head>'));
  assert.ok(html.includes('</body>'));
});

test('generateHomepageHtml includes school count', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Barat' },
  ];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('3'));
  assert.ok(html.includes('Total Sekolah'));
});

test('generateHomepageHtml includes province count', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur' },
  ];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('2'));
  assert.ok(html.includes('Provinsi'));
});

test('generateHomepageHtml includes province links', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('/provinsi/'));
  assert.ok(html.includes('Jawa Barat'));
  assert.ok(html.includes('province-link'));
});

test('generateHomepageHtml includes security headers', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes('X-Content-Type-Options'));
  assert.ok(html.includes('X-Frame-Options'));
  assert.ok(html.includes('Referrer-Policy'));
});

test('generateHomepageHtml includes accessibility features', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('skip-link'));
  assert.ok(html.includes('main-content'));
  assert.ok(html.includes('role="banner"'));
  assert.ok(html.includes('role="main"'));
  assert.ok(html.includes('role="contentinfo"'));
  assert.ok(html.includes('aria-label'));
});

test('generateHomepageHtml includes viewport meta tag', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('viewport'));
  assert.ok(html.includes('width=device-width'));
});

test('generateHomepageHtml includes external stylesheet', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('/styles.css'));
});

test('generateHomepageHtml includes back-to-top button', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('back-to-top'));
  assert.ok(html.includes('Kembali ke atas'));
});

test('generateHomepageHtml includes current year in copyright', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);
  const currentYear = new Date().getFullYear();

  assert.ok(html.includes(String(currentYear)));
});

test('generateHomepageHtml handles empty schools array', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const html = generateHomepageHtml([]);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('0'));
  assert.ok(html.includes('Total Sekolah'));
  assert.ok(html.includes('0'));
  assert.ok(html.includes('Provinsi'));
});

test('generateHomepageHtml escapes HTML in province names', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'School', provinsi: '<script>alert("xss")</script>' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
});

test('generateHomepageHtml includes proper heading structure', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('<h1>'));
  assert.ok(html.includes('Sekolah PSEO'));
  assert.ok(html.includes('<h2'));
  assert.ok(html.includes('Pilih Provinsi'));
});

test('generateHomepageHtml includes hero section', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('homepage-hero'));
  assert.ok(html.includes('hero-description'));
  assert.ok(html.includes('hero-stats'));
});

test('generateHomepageHtml includes section with province list', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('province-list'));
  assert.ok(html.includes('section-title'));
  assert.ok(html.includes('section-description'));
});

test('generateHomepageHtml includes proper language attribute', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('lang="id"'));
});

test('generateHomepageHtml includes UTF-8 charset', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('charset="utf-8"'));
});

test('generateHomepageHtml includes canonical URL', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('canonical'));
  assert.ok(html.includes('href="/"'));
});

test('generateHomepageHtml includes meta description', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('meta name="description"'));
  assert.ok(html.includes('Sekolah'));
  assert.ok(html.includes('Indonesia'));
});

test('generateHomepageHtml includes theme-color meta tags', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('theme-color'));
  assert.ok(html.includes('prefers-color-scheme'));
});

test('generateHomepageHtml includes favicon link', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('rel="icon"'));
  assert.ok(html.includes('favicon.svg'));
});

test('generateHomepageHtml includes current page indicator', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [{ npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat' }];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('Beranda'));
});
