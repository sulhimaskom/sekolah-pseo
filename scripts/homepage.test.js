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

test('generateHomepageHtml renders empty homepage for undefined input', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  const html = generateHomepageHtml(undefined);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('0'));
  assert.ok(html.includes('Total Sekolah'));
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

describe('generateHomepageHtml search-data contract', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');
  const { SEARCH_DATA_FIELDS } = require('../src/core/data-schema');

  function extractSearchScript(html) {
    const match = html.match(/<script>([\s\S]*?)<\/script>/g);
    assert.ok(match, 'homepage should contain a script block');
    return match[match.length - 1].replace(/<\/?script>/g, '');
  }

  it('embeds SEARCH_DATA_FIELDS literal in the generated client script', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const script = extractSearchScript(html);

    assert.ok(
      script.includes(`var SEARCH_DATA_FIELDS = ${JSON.stringify(SEARCH_DATA_FIELDS)}`),
      'generated script should embed the shared field-order constant'
    );
  });

  it('uses named field lookups instead of positional index literals', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const script = extractSearchScript(html);

    assert.ok(script.includes('SEARCH_FIELD_INDEX'), 'conversion should use named lookups');
    assert.doesNotMatch(script, /s\[[0-9]\]/, 'no positional index literals should remain');
    SEARCH_DATA_FIELDS.forEach(field => {
      assert.ok(
        script.includes(`SEARCH_FIELD_INDEX.${field}`),
        `conversion should reference SEARCH_FIELD_INDEX.${field}`
      );
    });
  });

  it('generated search script parses as valid JavaScript', () => {
    const vm = require('node:vm');
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const script = extractSearchScript(html);

    // Compiling without running validates syntax; runtime DOM deps are not touched.
    assert.doesNotThrow(() => new vm.Script(script), 'generated script should be valid JS');
  });

  it('client conversion of flat payload is stable under SEARCH_DATA_FIELDS reorder', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const script = extractSearchScript(html);

    // Extract the field-order literal and index map emitted into the script.
    const fieldsMatch = script.match(/var SEARCH_DATA_FIELDS = (\[[^\n]+\]);/);
    assert.ok(fieldsMatch, 'field-order literal should be present');
    const fields = JSON.parse(fieldsMatch[1]);
    assert.deepStrictEqual(fields, SEARCH_DATA_FIELDS);

    // Simulate the client-side conversion with a flat payload row.
    const fieldIndex = {};
    fields.forEach((f, i) => {
      fieldIndex[f] = i;
    });
    const row = [
      '10001',
      'SMA 1',
      'SMA',
      'N',
      'Jl. A',
      'Kec',
      'Kab',
      'Prov',
      '/provinsi/prov/kabupaten/kab/kecamatan/kec/10001-sma-1.html',
    ];
    const converted = {
      n: row[fieldIndex.npsn],
      a: row[fieldIndex.nama],
      b: row[fieldIndex.bentuk_pendidikan],
      s: row[fieldIndex.status],
      al: row[fieldIndex.alamat],
      kc: row[fieldIndex.kecamatan],
      kk: row[fieldIndex.kab_kota],
      p: row[fieldIndex.provinsi],
      u: row[fieldIndex.url],
    };

    assert.strictEqual(converted.n, '10001');
    assert.strictEqual(converted.a, 'SMA 1');
    assert.strictEqual(converted.p, 'Prov');
    assert.strictEqual(converted.u, '/provinsi/prov/kabupaten/kab/kecamatan/kec/10001-sma-1.html');
  });
});

describe('generateHomepageHtml search interaction state', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');

  function extractSearchScript(html) {
    const match = html.match(/<script>([\s\S]*?)<\/script>/g);
    assert.ok(match, 'homepage should contain a script block');
    return match[match.length - 1].replace(/<\/?script>/g, '');
  }

  const schools = [{ npsn: '1', nama: 'A', provinsi: 'JB', bentuk_pendidikan: 'SMA', status: 'N' }];

  it('renders filter selects disabled until search data loads', () => {
    const html = generateHomepageHtml(schools);

    assert.ok(
      html.includes('<select id="province-filter" class="filter-select" disabled>'),
      'province filter should render disabled (loading state)'
    );
    assert.ok(
      html.includes('<select id="type-filter" class="filter-select" disabled>'),
      'type filter should render disabled (loading state)'
    );
    assert.ok(
      html.includes('<select id="status-filter" class="filter-select" disabled>'),
      'status filter should render disabled (loading state)'
    );
  });

  it('scopes aria-live to the result count, keeping the CSV button out of the live region', () => {
    const html = generateHomepageHtml(schools);

    assert.ok(
      html.includes('<span id="result-count" aria-live="polite">'),
      'result count should carry the polite live region'
    );
    assert.ok(
      !html.includes('search-results-info" aria-live'),
      'the wrapper div should not be a live region (it contains an interactive button)'
    );
  });

  it('client script enables filters on load success and re-runs an existing search', () => {
    const html = generateHomepageHtml(schools);
    const script = extractSearchScript(html);

    assert.ok(
      script.includes('provinceFilter.disabled = false'),
      'script should re-enable the province filter once data loads'
    );
    assert.ok(
      script.includes('typeFilter.disabled = false') &&
        script.includes('statusFilter.disabled = false'),
      'script should re-enable the type and status filters once data loads'
    );
  });

  it('client script announces a load failure instead of staying silent', () => {
    const html = generateHomepageHtml(schools);
    const script = extractSearchScript(html);

    assert.ok(script.includes('searchFailed'), 'script should track a search-failure flag');
    assert.ok(
      script.includes('Data pencarian gagal dimuat.'),
      'script should surface a clear message when schools.json fails to load'
    );
  });

  it('Escape handling is scoped to the search input and never resets the filters', () => {
    const html = generateHomepageHtml(schools);
    const script = extractSearchScript(html);

    assert.ok(
      script.includes("e.key === 'Escape' && document.activeElement === searchInput"),
      'Escape should only act when the search input is focused'
    );
    assert.ok(
      !script.includes('provinceFilter.value = '),
      'Escape should not clear the province filter'
    );
    assert.ok(
      !script.includes('typeFilter.value = ') && !script.includes('statusFilter.value = '),
      'Escape should not clear the type or status filters'
    );
  });
});

describe('downloadCsv formula-injection guard (client-side)', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');
  const vm = require('node:vm');

  function extractSearchScript(html) {
    const match = html.match(/<script>([\s\S]*?)<\/script>/g);
    assert.ok(match, 'homepage should contain a script block');
    return match[match.length - 1].replace(/<\/?script>/g, '');
  }

  // Pull sanitizeCsvField out of the generated client script and evaluate it in
  // an isolated vm context so its behavior can be asserted without a DOM.
  function extractSanitizeCsvField(script) {
    const start = script.indexOf('function sanitizeCsvField(');
    assert.ok(start !== -1, 'generated script should define sanitizeCsvField');
    const bodyStart = script.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < script.length; i += 1) {
      if (script[i] === '{') {
        depth += 1;
      } else if (script[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          const sandbox = {};
          vm.createContext(sandbox);
          vm.runInContext(script.slice(start, i + 1), sandbox);
          return sandbox.sanitizeCsvField;
        }
      }
    }
    assert.fail('sanitizeCsvField function body not terminated');
  }

  it('prefixes formula-injection characters with a single quote', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const sanitize = extractSanitizeCsvField(extractSearchScript(html));
    assert.strictEqual(sanitize('=SUM(1,2)'), "'=SUM(1,2)");
    assert.strictEqual(sanitize("+cmd|' /C calc"), "'+cmd|' /C calc");
    assert.strictEqual(sanitize('@import'), "'@import");
    assert.strictEqual(sanitize('\tTab-lead'), "'\tTab-lead");
    assert.strictEqual(sanitize('-name'), "'-name");
  });

  it('exempts negative numeric literals like the server-side guard', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const sanitize = extractSanitizeCsvField(extractSearchScript(html));
    assert.strictEqual(sanitize('-6.2088'), '-6.2088');
    assert.strictEqual(sanitize('-123'), '-123');
  });

  it('passes plain values through untouched', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const sanitize = extractSanitizeCsvField(extractSearchScript(html));
    assert.strictEqual(sanitize('SMA Negeri 1 Jakarta'), 'SMA Negeri 1 Jakarta');
    assert.strictEqual(sanitize('123'), '123');
    assert.strictEqual(sanitize(''), '');
    assert.strictEqual(sanitize(null), '');
    assert.strictEqual(sanitize(undefined), '');
  });

  it('downloadCsv applies the sanitizer to every exported field', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const script = extractSearchScript(html);
    ['s.n', 's.a', 's.s', 's.b', 's.p', 's.kk', 's.kc', 's.al'].forEach(field => {
      assert.ok(
        script.includes(`sanitizeCsvField(${field}`),
        `downloadCsv should sanitize the ${field} field before export`
      );
    });
  });
});

describe('provinceUrlFallback (client-side, F247)', () => {
  const { generateHomepageHtml } = require('../src/presenters/templates/homepage');
  const vm = require('node:vm');

  function extractSearchScript(html) {
    const match = html.match(/<script>([\s\S]*?)<\/script>/g);
    assert.ok(match, 'homepage should contain a script block');
    return match[match.length - 1].replace(/<\/?script>/g, '');
  }

  function extractProvinceUrlFallback(script) {
    const start = script.indexOf('function provinceUrlFallback(');
    assert.ok(start !== -1, 'generated script should define provinceUrlFallback');
    const bodyStart = script.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < script.length; i += 1) {
      if (script[i] === '{') {
        depth += 1;
      } else if (script[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          const sandbox = {};
          vm.createContext(sandbox);
          vm.runInContext(script.slice(start, i + 1), sandbox);
          return sandbox.provinceUrlFallback;
        }
      }
    }
    assert.fail('provinceUrlFallback function body not terminated');
  }

  it('builds a province page URL from the provinsi name', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const fallback = extractProvinceUrlFallback(extractSearchScript(html));
    assert.strictEqual(fallback({ p: 'Jawa Barat' }), '/provinsi/jawa-barat/');
    assert.strictEqual(fallback({ p: 'DKI Jakarta' }), '/provinsi/dki-jakarta/');
  });

  it('mirrors the server slugify diacritic stripping', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const fallback = extractProvinceUrlFallback(extractSearchScript(html));
    assert.strictEqual(fallback({ p: 'D.I. Yogyakarta' }), '/provinsi/d-i-yogyakarta/');
  });

  it('returns a hash link when provinsi is missing', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    const fallback = extractProvinceUrlFallback(extractSearchScript(html));
    assert.strictEqual(fallback({}), '#');
    assert.strictEqual(fallback({ p: '' }), '#');
  });

  it('never emits /provinsi/undefined/ in the generated page', () => {
    const html = generateHomepageHtml([{ npsn: '1', nama: 'A', provinsi: 'JB' }]);
    assert.ok(!html.includes('/provinsi/undefined/'));
    assert.ok(!html.includes('provinceSlug'));
  });
});
