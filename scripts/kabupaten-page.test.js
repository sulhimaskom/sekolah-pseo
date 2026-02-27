const test = require('node:test');
const assert = require('node:assert');
const {
  generateKabupatenPageHtml,
  filterSchoolsByProvinceAndKabupaten,
  aggregateByKecamatan,
} = require('../src/presenters/templates/kabupaten-page');

test('filterSchoolsByProvinceAndKabupaten returns empty array for non-array input', () => {
  assert.deepStrictEqual(filterSchoolsByProvinceAndKabupaten(null, 'Jawa Barat', 'Bandung'), []);
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten(undefined, 'Jawa Barat', 'Bandung'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten('invalid', 'Jawa Barat', 'Bandung'),
    []
  );
  assert.deepStrictEqual(filterSchoolsByProvinceAndKabupaten(123, 'Jawa Barat', 'Bandung'), []);
  assert.deepStrictEqual(filterSchoolsByProvinceAndKabupaten({}, 'Jawa Barat', 'Bandung'), []);
});

test('filterSchoolsByProvinceAndKabupaten returns empty array for empty array', () => {
  const result = filterSchoolsByProvinceAndKabupaten([], 'Jawa Barat', 'Bandung');
  assert.strictEqual(result.length, 0);
});

test('filterSchoolsByProvinceAndKabupaten filters schools by province and kabupaten', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
    {
      npsn: '2',
      nama: 'School 2',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
    {
      npsn: '3',
      nama: 'School 3',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bekasi',
      kecamatan: 'Bekasi',
    },
    {
      npsn: '4',
      nama: 'School 4',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Genteng',
    },
    {
      npsn: '5',
      nama: 'School 5',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Genteng',
    },
  ];

  const result = filterSchoolsByProvinceAndKabupaten(schools, 'Jawa Barat', 'Bandung');
  assert.strictEqual(result.length, 2);
  assert.ok(result.every(s => s.provinsi === 'Jawa Barat' && s.kab_kota === 'Bandung'));
});

test('filterSchoolsByProvinceAndKabupaten is case-sensitive', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'jawa barat', kab_kota: 'bandung' },
  ];

  const result = filterSchoolsByProvinceAndKabupaten(schools, 'Jawa Barat', 'Bandung');
  assert.strictEqual(result.length, 1);
});

test('filterSchoolsByProvinceAndKabupaten returns empty array for non-matching province', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur', kab_kota: 'Surabaya' },
  ];

  const result = filterSchoolsByProvinceAndKabupaten(schools, 'Sulawesi', 'Makassar');
  assert.strictEqual(result.length, 0);
});

test('filterSchoolsByProvinceAndKabupaten returns empty array for non-matching kabupaten', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
    { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat', kab_kota: 'Bekasi' },
  ];

  const result = filterSchoolsByProvinceAndKabupaten(schools, 'Jawa Barat', 'Jakarta');
  assert.strictEqual(result.length, 0);
});

test('aggregateByKecamatan returns empty array for non-array input', () => {
  assert.deepStrictEqual(aggregateByKecamatan(null), []);
  assert.deepStrictEqual(aggregateByKecamatan(undefined), []);
  assert.deepStrictEqual(aggregateByKecamatan('invalid'), []);
  assert.deepStrictEqual(aggregateByKecamatan(123), []);
  assert.deepStrictEqual(aggregateByKecamatan({}), []);
});

test('aggregateByKecamatan returns empty array for empty array', () => {
  const result = aggregateByKecamatan([]);
  assert.strictEqual(result.length, 0);
});

test('aggregateByKecamatan groups schools by kecamatan', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kecamatan: 'Bandung' },
    { npsn: '2', nama: 'School 2', kecamatan: 'Bandung' },
    { npsn: '3', nama: 'School 3', kecamatan: 'Bandung' },
    { npsn: '4', nama: 'School 4', kecamatan: 'Cimahi' },
    { npsn: '5', nama: 'School 5', kecamatan: 'Cimahi' },
  ];

  const result = aggregateByKecamatan(schools);
  assert.strictEqual(result.length, 2);

  const bandung = result.find(k => k.name === 'Bandung');
  assert.ok(bandung);
  assert.strictEqual(bandung.count, 3);

  const cimahi = result.find(k => k.name === 'Cimahi');
  assert.ok(cimahi);
  assert.strictEqual(cimahi.count, 2);
});

test('aggregateByKecamatan sorts kecamatan alphabetically', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kecamatan: 'Cimahi' },
    { npsn: '2', nama: 'School 2', kecamatan: 'Bandung' },
    { npsn: '3', nama: 'School 3', kecamatan: 'Astraman' },
  ];

  const result = aggregateByKecamatan(schools);
  assert.strictEqual(result[0].name, 'Astraman');
  assert.strictEqual(result[1].name, 'Bandung');
  assert.strictEqual(result[2].name, 'Cimahi');
});

test('aggregateByKecamatan generates slugs for kecamatan names', () => {
  const schools = [{ npsn: '1', nama: 'School 1', kecamatan: 'Ciparay' }];

  const result = aggregateByKecamatan(schools);
  assert.strictEqual(result[0].slug, 'ciparay');
});

test('aggregateByKecamatan skips schools without kecamatan', () => {
  const schools = [
    { npsn: '1', nama: 'School 1', kecamatan: 'Bandung' },
    { npsn: '2', nama: 'School 2' },
    { npsn: '3', nama: 'School 3', kecamatan: null },
    { npsn: '4', nama: 'School 4', kecamatan: undefined },
    { npsn: '5', nama: 'School 5', kecamatan: '' },
  ];

  const result = aggregateByKecamatan(schools);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].count, 1);
});

test('aggregateByKecamatan handles schools with undefined/null kecamatan', () => {
  const schools = [
    { npsn: '1', nama: 'School 1' },
    { npsn: '2', nama: 'School 2', kecamatan: null },
    { npsn: '3', nama: 'School 3', kecamatan: undefined },
    { npsn: '4', nama: 'School 4', kecamatan: '' },
  ];

  const result = aggregateByKecamatan(schools);
  assert.strictEqual(result.length, 0);
});

test('generateKabupatenPageHtml generates valid HTML', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'SDN 1 Bandung',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
    {
      npsn: '2',
      nama: 'SDN 2 Bandung',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
    {
      npsn: '3',
      nama: 'SMPN 1 Bandung',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Cimahi',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('<!DOCTYPE html>'));
  assert.ok(result.includes('<html lang="id">'));
  assert.ok(result.includes('<head>'));
  assert.ok(result.includes('</head>'));
  assert.ok(result.includes('<body>'));
  assert.ok(result.includes('</body>'));
  assert.ok(result.includes('</html>'));
});

test('generateKabupatenPageHtml includes school count', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('Total Sekolah'));
  assert.ok(result.includes('1 sekolah'));
});

test('generateKabupatenPageHtml includes kecamatan count', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
    {
      npsn: '2',
      nama: 'School 2',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Cimahi',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('Kecamatan'));
  assert.ok(result.includes('2</span>'));
  assert.ok(result.includes('<span class="stat-label">Kecamatan</span>'));
});

test('generateKabupatenPageHtml includes kecamatan links', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('/kabupaten/bandung/kecamatan/bandung/'));
});

test('generateKabupatenPageHtml includes security headers', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('Content-Security-Policy'));
  assert.ok(result.includes('X-Content-Type-Options'));
  assert.ok(result.includes('X-Frame-Options'));
  assert.ok(result.includes('Referrer-Policy'));
  assert.ok(result.includes('Permissions-Policy'));
  assert.ok(result.includes('Cross-Origin-Opener-Policy'));
  assert.ok(result.includes('Cross-Origin-Resource-Policy'));
  assert.ok(result.includes('X-XSS-Protection'));
});

test('generateKabupatenPageHtml includes accessibility features', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('lang="id"'));
  assert.ok(result.includes('role="banner"'));
  assert.ok(result.includes('role="main"'));
  assert.ok(result.includes('role="contentinfo"'));
  assert.ok(result.includes('aria-label'));
  assert.ok(result.includes('skip-link'));
  assert.ok(result.includes('Langsung ke konten utama'));
});

test('generateKabupatenPageHtml includes viewport meta tag', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('viewport'));
  assert.ok(result.includes('width=device-width'));
});

test('generateKabupatenPageHtml includes external stylesheet', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('<link rel="stylesheet" href="/styles.css">'));
});

test('generateKabupatenPageHtml includes back-to-top button', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('back-to-top'));
  assert.ok(result.includes('Kembali ke atas'));
});

test('generateKabupatenPageHtml includes current year in copyright', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);
  const currentYear = new Date().getFullYear();

  assert.ok(result.includes(`&copy; ${currentYear}`));
});

test('generateKabupatenPageHtml handles empty schools array', () => {
  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', []);

  assert.ok(result.includes('Total Sekolah'));
  assert.ok(result.includes('0 sekolah'));
  assert.ok(result.includes('0</span>'));
  assert.ok(result.includes('<span class="stat-label">Kecamatan</span>'));
});

test('generateKabupatenPageHtml escapes HTML in province and kabupaten names', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml(
    '<script>alert(1)</script>',
    '<img onerror="alert(1)" src="x">',
    schools
  );

  assert.ok(!result.includes('<script>alert(1)</script>'));
  assert.ok(!result.includes('<img onerror="alert(1)" src="x">'));
});

test('generateKabupatenPageHtml includes proper heading structure', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('<h1>Bandung</h1>'));
  assert.ok(result.includes('id="kecamatan-heading"'));
  assert.ok(result.includes('<h2 id="kecamatan-heading"'));
});

test('generateKabupatenPageHtml includes hero section', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('homepage-hero'));
  assert.ok(result.includes('hero-stats'));
  assert.ok(result.includes('hero-description'));
});

test('generateKabupatenPageHtml includes section with kecamatan list', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('<section'));
  assert.ok(result.includes('Pilih Kecamatan'));
  assert.ok(result.includes('province-list'));
});

test('generateKabupatenPageHtml includes proper language attribute', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('lang="id"'));
});

test('generateKabupatenPageHtml includes navigation breadcrumbs', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('Beranda'));
  assert.ok(result.includes('/provinsi/'));
  assert.ok(result.includes('aria-current="page"'));
});

test('generateKabupatenPageHtml includes meta description', () => {
  const schools = [
    {
      npsn: '1',
      nama: 'School 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung',
    },
  ];

  const result = generateKabupatenPageHtml('Jawa Barat', 'Bandung', schools);

  assert.ok(result.includes('<meta name="description"'));
  assert.ok(result.includes('Daftar sekolah di Bandung, Provinsi Jawa Barat'));
});
