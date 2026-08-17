const test = require('node:test');
const assert = require('node:assert');
const {
  generateKabupatenPageHtml,
  filterSchoolsByProvinceAndKabupaten,
  aggregateByKecamatan,
} = require('../src/presenters/templates/kabupaten-page');

const sampleSchools = [
  {
    npsn: '1',
    nama: 'SDN 1 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Gambir',
    bentuk_pendidikan: 'SD',
    status: 'N',
  },
  {
    npsn: '2',
    nama: 'SMPN 2 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Gambir',
    bentuk_pendidikan: 'SMP',
    status: 'S',
  },
  {
    npsn: '3',
    nama: 'SMAN 3 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    bentuk_pendidikan: 'SMA',
    status: 'N',
  },
  {
    npsn: '4',
    nama: 'SDN 1 Bandung',
    provinsi: 'Jawa Barat',
    kab_kota: 'Kota Bandung',
    kecamatan: 'Cicendo',
    bentuk_pendidikan: 'SD',
    status: 'N',
  },
];

test('filterSchoolsByProvinceAndKabupaten returns empty array for non-array input', () => {
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten(null, 'DKI Jakarta', 'Jakarta Pusat'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten(undefined, 'DKI Jakarta', 'Jakarta Pusat'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten('invalid', 'DKI Jakarta', 'Jakarta Pusat'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten(123, 'DKI Jakarta', 'Jakarta Pusat'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByProvinceAndKabupaten({}, 'DKI Jakarta', 'Jakarta Pusat'),
    []
  );
});

test('filterSchoolsByProvinceAndKabupaten filters by both province and kabupaten', () => {
  const result = filterSchoolsByProvinceAndKabupaten(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat');
  assert.strictEqual(result.length, 3);
  assert.ok(result.every(s => s.provinsi === 'DKI Jakarta' && s.kab_kota === 'Jakarta Pusat'));
});

test('filterSchoolsByProvinceAndKabupaten returns empty for non-matching kabupaten', () => {
  const result = filterSchoolsByProvinceAndKabupaten(sampleSchools, 'DKI Jakarta', 'Kota Bandung');
  assert.strictEqual(result.length, 0);
});

test('aggregateByKecamatan returns empty array for non-array input', () => {
  assert.deepStrictEqual(aggregateByKecamatan(null), []);
  assert.deepStrictEqual(aggregateByKecamatan(undefined), []);
  assert.deepStrictEqual(aggregateByKecamatan('invalid'), []);
  assert.deepStrictEqual(aggregateByKecamatan(123), []);
  assert.deepStrictEqual(aggregateByKecamatan({}), []);
});

test('aggregateByKecamatan groups and counts schools by kecamatan', () => {
  const result = aggregateByKecamatan(
    filterSchoolsByProvinceAndKabupaten(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat')
  );
  assert.strictEqual(result.length, 2);
  const gambir = result.find(k => k.name === 'Gambir');
  const menteng = result.find(k => k.name === 'Menteng');
  assert.strictEqual(gambir.count, 2);
  assert.strictEqual(gambir.slug, 'gambir');
  assert.strictEqual(menteng.count, 1);
  assert.strictEqual(menteng.slug, 'menteng');
});

test('aggregateByKecamatan sorts by name with Indonesian locale', () => {
  const result = aggregateByKecamatan(
    filterSchoolsByProvinceAndKabupaten(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat')
  );
  assert.deepStrictEqual(
    result.map(k => k.name),
    ['Gambir', 'Menteng']
  );
});

test('generateKabupatenPageHtml contains heading with kabupaten name', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('<h1>Jakarta Pusat</h1>'));
});

test('generateKabupatenPageHtml renders kecamatan links with counts', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/gambir/'));
  assert.ok(html.includes('/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng/'));
  assert.ok(html.includes('2 sekolah'));
  assert.ok(html.includes('1 sekolah'));
});

test('generateKabupatenPageHtml skipFilter=true uses pre-filtered schools directly', () => {
  const preFiltered = filterSchoolsByProvinceAndKabupaten(
    sampleSchools,
    'DKI Jakarta',
    'Jakarta Pusat'
  );
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', preFiltered, true);
  assert.ok(html.includes('3 sekolah'));
  assert.ok(html.includes('Menteng'));
});

test('generateKabupatenPageHtml escapeHtml protects against XSS in names', () => {
  const evil = [
    {
      npsn: '9',
      nama: 'SDN Aman',
      provinsi: 'DKI Jakarta',
      kab_kota: 'Jakarta Pusat',
      kecamatan: '<script>alert(1)</script>',
      bentuk_pendidikan: 'SD',
      status: 'N',
    },
  ];
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', evil);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('generateKabupatenPageHtml includes skip link and main landmark', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('class="skip-link"'));
  assert.ok(html.includes('id="main-content"'));
  assert.ok(html.includes('role="main"'));
});

test('generateKabupatenPageHtml includes breadcrumb navigation with aria-current', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('aria-label="Navigasi utama"'));
  assert.ok(html.includes('/provinsi/dki-jakarta/'));
  assert.ok(html.includes('aria-current="page"'));
});

test('generateKabupatenPageHtml includes footer, back-to-top, and canonical', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('role="contentinfo"'));
  assert.ok(html.includes('back-to-top'));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes('https://example.com/provinsi/dki-jakarta/kabupaten/jakarta-pusat/'));
});

test('generateKabupatenPageHtml empty schools renders zero counts', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', []);
  assert.ok(html.includes('0 sekolah'));
  assert.ok(html.includes('Kecamatan'));
});

test('generateKabupatenPageHtml stat labels present', () => {
  const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', sampleSchools);
  assert.ok(html.includes('Total Sekolah'));
  assert.ok(html.includes('Kecamatan'));
});
