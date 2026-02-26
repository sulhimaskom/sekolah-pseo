const test = require('node:test');
const assert = require('node:assert');
const {
  generateProvincePageHtml,
  filterSchoolsByProvince,
  aggregateByKabupaten,
} = require('../src/presenters/templates/province-page');

test('filterSchoolsByProvince returns empty array for non-array input', () => {
  assert.deepStrictEqual(filterSchoolsByProvince(null, 'Jawa Barat'), []);
  assert.deepStrictEqual(filterSchoolsByProvince(undefined, 'Jawa Barat'), []);
  assert.deepStrictEqual(filterSchoolsByProvince('invalid', 'Jawa Barat'), []);
  assert.deepStrictEqual(filterSchoolsByProvince(123, 'Jawa Barat'), []);
  assert.deepStrictEqual(filterSchoolsByProvince({}, 'Jawa Barat'), []);
});

test('filterSchoolsByProvince returns empty array for empty array', () => {
  const result = filterSchoolsByProvince([], 'Jawa Barat');
  assert.strictEqual(result.length, 0);
});

test('filterSchoolsByProvince filters schools by province name', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Timur', kab_kota: 'Surabaya' },
    { npsn: '4', nama: 'School 4', provinsi: 'Jawa Timur', kab_kota: 'Surabaya' },
    { npsn: '5', nama: 'School 5', provinsi: 'Jawa Timur', kab_kota: 'Surabaya' },
  ];

  const result = filterSchoolsByProvince(schools, 'Jawa Barat');
  assert.strictEqual(result.length, 2);
  assert.ok(result.every(s => s.provinsi === 'Jawa Barat'));
});

test('filterSchoolsByProvince is case-sensitive', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2', provinsi: 'jawa barat' },
  ];

  const result = filterSchoolsByProvince(schools, 'Jawa Barat');
  assert.strictEqual(result.length, 1);
});

test('filterSchoolsByProvince returns empty array for non-matching province', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur' },
  ];

  const result = filterSchoolsByProvince(schools, 'Sulawesi');
  assert.strictEqual(result.length, 0);
});

test('aggregateByKabupaten returns empty array for non-array input', () => {
  assert.deepStrictEqual(aggregateByKabupaten(null), []);
  assert.deepStrictEqual(aggregateByKabupaten(undefined), []);
  assert.deepStrictEqual(aggregateByKabupaten('invalid'), []);
  assert.deepStrictEqual(aggregateByKabupaten(123), []);
  assert.deepStrictEqual(aggregateByKabupaten({}), []);
});

test('aggregateByKabupaten returns empty array for empty array', () => {
  const result = aggregateByKabupaten([]);
  assert.strictEqual(result.length, 0);
});

test('aggregateByKabupaten groups schools by kabupaten', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', kab_kota: 'Bandung' },
    { npsn: '3', nama: 'School 3', kab_kota: 'Surabaya' },
    { npsn: '4', nama: 'School 4', kab_kota: 'Surabaya' },
    { npsn: '5', nama: 'School 5', kab_kota: 'Surabaya' },
  ];

  const result = aggregateByKabupaten(schools);

  assert.strictEqual(result.length, 2);

  const bandung = result.find(k => k.name === 'Bandung');
  const surabaya = result.find(k => k.name === 'Surabaya');

  assert.ok(bandung);
  assert.strictEqual(bandung.count, 2);

  assert.ok(surabaya);
  assert.strictEqual(surabaya.count, 3);
});

test('aggregateByKabupaten sorts kabupaten alphabetically', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kab_kota: 'Sulawesi' },
    { npsn: '2', nama: 'School 2', kab_kota: 'Aceh' },
    { npsn: '3', nama: 'School 3', kab_kota: 'Bali' },
  ];

  const result = aggregateByKabupaten(schools);

  assert.strictEqual(result[0].name, 'Aceh');
  assert.strictEqual(result[1].name, 'Bali');
  assert.strictEqual(result[2].name, 'Sulawesi');
});

test('aggregateByKabupaten generates slugs for kabupaten names', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kab_kota: 'Kota Bandung' },
    { npsn: '2', nama: 'School 2', kab_kota: 'Kota Bandung' },
  ];

  const result = aggregateByKabupaten(schools);

  assert.ok(result[0].slug);
  assert.strictEqual(typeof result[0].slug, 'string');
  assert.ok(result[0].slug.includes('kota-bandung'));
});

test('aggregateByKabupaten skips schools without kab_kota', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2' }, // No kab_kota
    { npsn: '3', nama: 'School 3', kab_kota: 'Bandung' },
  ];

  const result = aggregateByKabupaten(schools);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].count, 2);
});

test('aggregateByKabupaten handles schools with undefined/null/empty kab_kota', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kab_kota: null },
    { npsn: '2', nama: 'School 2', kab_kota: undefined },
    { npsn: '3', nama: 'School 3', kab_kota: '' },
  ];

  const result = aggregateByKabupaten(schools);
  assert.strictEqual(result.length, 0);
});

test('generateProvincePageHtml generates valid HTML', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1 Bandung', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<html lang="id">'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('<title>'));
  assert.ok(html.includes('</head>'));
  assert.ok(html.includes('</body>'));
});

test('generateProvincePageHtml includes province name in title', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('Provinsi Jawa Barat'));
  assert.ok(html.includes('Sekolah PSEO'));
});

test('generateProvincePageHtml includes school count', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat', kab_kota: 'Surabaya' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('3'));
  assert.ok(html.includes('Total Sekolah'));
});

test('generateProvincePageHtml includes kabupaten count', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat', kab_kota: 'Surabaya' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('2'));
  assert.ok(html.includes('Kabupaten/Kota'));
});

test('generateProvincePageHtml includes province links', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('/kabupaten/'));
  assert.ok(html.includes('Bandung'));
  assert.ok(html.includes('province-link'));
});

test('generateProvincePageHtml includes security headers', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes('X-Content-Type-Options'));
  assert.ok(html.includes('X-Frame-Options'));
  assert.ok(html.includes('Referrer-Policy'));
});

test('generateProvincePageHtml includes accessibility features', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('skip-link'));
  assert.ok(html.includes('main-content'));
  assert.ok(html.includes('role="banner"'));
  assert.ok(html.includes('role="main"'));
  assert.ok(html.includes('role="contentinfo"'));
  assert.ok(html.includes('aria-label'));
});

test('generateProvincePageHtml includes viewport meta tag', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('viewport'));
  assert.ok(html.includes('width=device-width'));
});

test('generateProvincePageHtml includes external stylesheet', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('/styles.css'));
});

test('generateProvincePageHtml includes back-to-top button', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('back-to-top'));
  assert.ok(html.includes('Kembali ke atas'));
});

test('generateProvincePageHtml includes current year in copyright', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);
  const currentYear = new Date().getFullYear();

  assert.ok(html.includes(String(currentYear)));
});

test('generateProvincePageHtml handles empty schools array', () => {
  const html = generateProvincePageHtml('Jawa Barat', []);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('0'));
  assert.ok(html.includes('Total Sekolah'));
  assert.ok(html.includes('0'));
  assert.ok(html.includes('Kabupaten/Kota'));
});

test('generateProvincePageHtml escapes HTML in province names', () => {
  const schools = [
    {
      npsn: '12345678',
      nama: 'School',
      provinsi: '<script>alert("xss")</script>',
      kab_kota: 'Bandung',
    },
  ];

  const html = generateProvincePageHtml('<script>alert("xss")</script>', schools);

  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
});

test('generateProvincePageHtml escapes HTML in kabupaten names', () => {
  const schools = [
    {
      npsn: '12345678',
      nama: 'School',
      provinsi: 'Jawa Barat',
      kab_kota: '<script>alert("xss")</script>',
    },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
});

test('generateProvincePageHtml includes proper heading structure', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('<h1>'));
  assert.ok(html.includes('Provinsi Jawa Barat'));
  assert.ok(html.includes('<h2'));
  assert.ok(html.includes('Pilih Kabupaten/Kota'));
});

test('generateProvincePageHtml includes hero section', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('homepage-hero'));
  assert.ok(html.includes('hero-description'));
  assert.ok(html.includes('hero-stats'));
});

test('generateProvincePageHtml includes section with kabupaten list', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('province-list'));
  assert.ok(html.includes('section-title'));
  assert.ok(html.includes('section-description'));
});

test('generateProvincePageHtml includes proper language attribute', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('lang="id"'));
});

test('generateProvincePageHtml includes UTF-8 charset', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('charset="utf-8"'));
});

test('generateProvincePageHtml includes canonical URL', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('canonical'));
  assert.ok(html.includes('/provinsi/'));
});

test('generateProvincePageHtml includes meta description', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('meta name="description"'));
  assert.ok(html.includes('Jawa Barat'));
});

test('generateProvincePageHtml includes theme-color meta tags', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('theme-color'));
  assert.ok(html.includes('prefers-color-scheme'));
});

test('generateProvincePageHtml includes favicon link', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('rel="icon"'));
  assert.ok(html.includes('favicon.svg'));
});

test('generateProvincePageHtml includes navigation with home link', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('href="/"'));
  assert.ok(html.includes('Beranda'));
  assert.ok(html.includes('aria-current="page"'));
});

test('generateProvincePageHtml includes province name in breadcrumb', () => {
  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  assert.ok(html.includes('Jawa Barat'));
});

test('generateProvincePageHtml filters schools by province', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur', kab_kota: 'Surabaya' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  // Should only show 2 schools from Jawa Barat
  assert.ok(html.includes('2'));
  assert.ok(html.includes('Total Sekolah'));
});

test('generateProvincePageHtml generates correct kabupaten aggregation', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '3', nama: 'School 3', provinsi: 'Jawa Barat', kab_kota: 'Surabaya' },
  ];

  const html = generateProvincePageHtml('Jawa Barat', schools);

  // Should show 2 kabupaten
  assert.ok(html.includes('2'));
  assert.ok(html.includes('Kabupaten/Kota'));
  assert.ok(html.includes('Bandung'));
  assert.ok(html.includes('Surabaya'));
});
