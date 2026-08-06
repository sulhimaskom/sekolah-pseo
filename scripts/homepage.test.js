const { test, describe, it } = require('node:test');
const assert = require('node:assert');

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

test('generateHomepageHtml falls back to raw value for unknown status in option display', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [
    {
      npsn: '12345678',
      nama: 'SMA Negeri 1',
      provinsi: 'Jawa Barat',
      bentuk_pendidikan: 'SMA',
      status: 'X', // Unknown status - should fall back to raw value
    },
  ];

  const html = generateHomepageHtml(schools);

  // The unknown status 'X' should appear as-is in the dropdown since it's not in the statusLabels map
  assert.ok(html.includes('value="X"'), 'Unknown status value X should appear in dropdown options');
  assert.ok(html.includes('>X<'), 'Unknown status X should be displayed as-is (not mapped)');
});

test('generateHomepageHtml includes status filter dropdown when schools have status data', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const schools = [
    {
      npsn: '12345678',
      nama: 'SMA Negeri 1',
      provinsi: 'Jawa Barat',
      bentuk_pendidikan: 'SMA',
      status: 'N',
    },
    {
      npsn: '87654321',
      nama: 'SMP Swasta 1',
      provinsi: 'Jawa Timur',
      bentuk_pendidikan: 'SMP',
      status: 'S',
    },
  ];

  const html = generateHomepageHtml(schools);

  assert.ok(html.includes('status-filter'), 'Should have status filter select element');
  assert.ok(html.includes('Semua Status'), 'Should have default option for all statuses');
  assert.ok(html.includes('Negeri'), 'Should include Negeri option');
  assert.ok(html.includes('Swasta'), 'Should include Swasta option');
});

test('aggregateProvinceAndFilters includes statuses in filterOptions', () => {
  const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');

  const schools = [
    { npsn: '1', nama: 'A', provinsi: 'JB', bentuk_pendidikan: 'SMA', status: 'N' },
    { npsn: '2', nama: 'B', provinsi: 'JT', bentuk_pendidikan: 'SMP', status: 'S' },
  ];

  const result = aggregateProvinceAndFilters(schools);

  assert.ok(result.filterOptions.statuses, 'filterOptions should have statuses');
  assert.deepStrictEqual(result.filterOptions.statuses, ['N', 'S']);
});

describe('aggregateProvinceAndFilters edge cases', () => {
  it('returns default structure for null input', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');
    const result = aggregateProvinceAndFilters(null);

    assert.ok(Array.isArray(result.provinces));
    assert.strictEqual(result.provinces.length, 0);
    assert.deepStrictEqual(result.filterOptions, { provinces: [], types: [], statuses: [] });
  });

  it('returns default structure for undefined input', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');
    const result = aggregateProvinceAndFilters(undefined);

    assert.ok(Array.isArray(result.provinces));
    assert.strictEqual(result.provinces.length, 0);
    assert.deepStrictEqual(result.filterOptions, { provinces: [], types: [], statuses: [] });
  });

  it('returns default structure for string input', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');
    const result = aggregateProvinceAndFilters('invalid');

    assert.strictEqual(result.provinces.length, 0);
    assert.deepStrictEqual(result.filterOptions, { provinces: [], types: [], statuses: [] });
  });

  it('returns aggregated data with types and statuses for valid schools', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');

    const schools = [
      { npsn: '1', nama: 'A', provinsi: 'JB', bentuk_pendidikan: 'SMA', status: 'N' },
      { npsn: '2', nama: 'B', provinsi: 'JT', bentuk_pendidikan: 'SMP', status: 'S' },
      { npsn: '3', nama: 'C', provinsi: 'JB', bentuk_pendidikan: 'SD', status: 'N' },
    ];

    const result = aggregateProvinceAndFilters(schools);

    assert.strictEqual(result.provinces.length, 2);
    assert.deepStrictEqual(result.filterOptions.provinces.sort(), ['JB', 'JT']);
    assert.deepStrictEqual(result.filterOptions.types.sort(), ['SD', 'SMA', 'SMP']);
    assert.deepStrictEqual(result.filterOptions.statuses.sort(), ['N', 'S']);
  });

  it('handles schools without optional status field', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');

    const schools = [
      { npsn: '1', nama: 'A', provinsi: 'JB', bentuk_pendidikan: 'SMA' },
      { npsn: '2', nama: 'B', provinsi: 'JT', bentuk_pendidikan: 'SMP' },
    ];

    const result = aggregateProvinceAndFilters(schools);

    assert.strictEqual(result.filterOptions.statuses.length, 0);
    assert.strictEqual(result.filterOptions.types.length, 2);
  });

  it('handles schools without bentuk_pendidikan field', () => {
    const { aggregateProvinceAndFilters } = require('../src/presenters/templates/homepage');

    const schools = [
      { npsn: '1', nama: 'A', provinsi: 'JB', status: 'N' },
      { npsn: '2', nama: 'B', provinsi: 'JT', status: 'S' },
    ];

    const result = aggregateProvinceAndFilters(schools);

    assert.strictEqual(result.filterOptions.types.length, 0);
    assert.strictEqual(result.filterOptions.statuses.length, 2);
  });
});
