const test = require('node:test');
const assert = require('node:assert');
const {
  generateKecamatanPageHtml,
  filterSchoolsByLocation,
  generateSchoolLinksHtml,
} = require('../src/presenters/templates/kecamatan-page');

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

test('filterSchoolsByLocation returns empty array for non-array input', () => {
  assert.deepStrictEqual(
    filterSchoolsByLocation(null, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByLocation(undefined, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByLocation('invalid', 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    []
  );
  assert.deepStrictEqual(
    filterSchoolsByLocation(123, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    []
  );
  assert.deepStrictEqual(filterSchoolsByLocation({}, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'), []);
});

test('filterSchoolsByLocation filters by province, kabupaten, and kecamatan', () => {
  const result = filterSchoolsByLocation(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir');
  assert.strictEqual(result.length, 2);
  assert.ok(result.every(s => s.kecamatan === 'Gambir'));
});

test('filterSchoolsByLocation returns empty for non-matching kecamatan', () => {
  const result = filterSchoolsByLocation(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat', 'Cicendo');
  assert.strictEqual(result.length, 0);
});

test('generateSchoolLinksHtml builds correct school URLs', () => {
  const html = generateSchoolLinksHtml(
    filterSchoolsByLocation(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    'dki-jakarta',
    'jakarta-pusat'
  );
  assert.ok(
    html.includes(
      '/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/gambir/1-sdn-1-jakarta.html'
    )
  );
  assert.ok(
    html.includes(
      '/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/gambir/2-smpn-2-jakarta.html'
    )
  );
});

test('generateSchoolLinksHtml renders badges with status classes', () => {
  const html = generateSchoolLinksHtml(
    filterSchoolsByLocation(sampleSchools, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir'),
    'dki-jakarta',
    'jakarta-pusat'
  );
  assert.ok(html.includes('badge badge-education'));
  assert.ok(html.includes('badge badge-n'));
  assert.ok(html.includes('badge badge-s'));
  assert.ok(html.includes('Negeri'));
  assert.ok(html.includes('Swasta'));
});

test('generateSchoolLinksHtml escapes school names', () => {
  const evil = [
    {
      npsn: '9',
      nama: '<img src=x onerror=alert(1)>',
      provinsi: 'DKI Jakarta',
      kab_kota: 'Jakarta Pusat',
      kecamatan: 'Gambir',
      bentuk_pendidikan: 'SD',
      status: 'N',
    },
  ];
  const html = generateSchoolLinksHtml(evil, 'dki-jakarta', 'jakarta-pusat');
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});

test('generateKecamatanPageHtml contains heading with kecamatan name', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', sampleSchools);
  assert.ok(html.includes('<h1>Kecamatan Gambir</h1>'));
});

test('generateKecamatanPageHtml renders school links and count', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', sampleSchools);
  assert.ok(html.includes('1-sdn-1-jakarta.html'));
  assert.ok(html.includes('2-smpn-2-jakarta.html'));
  assert.ok(html.includes('2 sekolah'));
  assert.ok(!html.includes('3-sman-3-jakarta.html'));
});

test('generateKecamatanPageHtml skipFilter=true uses pre-filtered schools directly', () => {
  const preFiltered = filterSchoolsByLocation(
    sampleSchools,
    'DKI Jakarta',
    'Jakarta Pusat',
    'Gambir'
  );
  const html = generateKecamatanPageHtml(
    'DKI Jakarta',
    'Jakarta Pusat',
    'Gambir',
    preFiltered,
    true
  );
  assert.ok(html.includes('2 sekolah'));
  assert.ok(html.includes('SMPN 2 Jakarta'));
});

test('generateKecamatanPageHtml includes full breadcrumb hierarchy', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', sampleSchools);
  assert.ok(html.includes('aria-label="Navigasi utama"'));
  assert.ok(html.includes('/provinsi/dki-jakarta/'));
  assert.ok(html.includes('/provinsi/dki-jakarta/kabupaten/jakarta-pusat/'));
  assert.ok(html.includes('aria-current="page"'));
});

test('generateKecamatanPageHtml includes skip link, main landmark, footer, back-to-top', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', sampleSchools);
  assert.ok(html.includes('class="skip-link"'));
  assert.ok(html.includes('id="main-content"'));
  assert.ok(html.includes('role="contentinfo"'));
  assert.ok(html.includes('back-to-top'));
});

test('generateKecamatanPageHtml canonical URL is correct', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', sampleSchools);
  assert.ok(
    html.includes(
      'https://example.com/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/gambir/'
    )
  );
});

test('generateKecamatanPageHtml empty schools renders zero count', () => {
  const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', []);
  assert.ok(html.includes('0 sekolah'));
});
