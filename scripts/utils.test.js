const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {
  parseCsv,
  formatStatus,
  formatEmptyValue,
  hasCoordinateData,
  escapeCsvField,
  writeCsv,
  clearEscapeHtmlCache,
  walkDirectory,
  escapeHtml,
  processConcurrently,
  generateMetaDescription,
} = require('./utils');

test('parseCsv handles empty data', () => {
  assert.deepStrictEqual(parseCsv(''), []);
  assert.deepStrictEqual(parseCsv(null), []);
  assert.deepStrictEqual(parseCsv(undefined), []);
});

test('parseCsv handles header only', () => {
  const result = parseCsv('npsn,nama');
  assert.deepStrictEqual(result, []);
});

test('parseCsv parses valid CSV', () => {
  const csv = 'npsn,nama\n12345,School Name';
  const expected = [{ npsn: '12345', nama: 'School Name' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('parseCsv handles quoted fields', () => {
  const csv = 'npsn,nama,alamat\n12345,"School Name","Street, City"';
  const expected = [{ npsn: '12345', nama: 'School Name', alamat: 'Street, City' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('parseCsv handles escaped quotes', () => {
  const csv = 'npsn,nama,alamat\n12345,"School ""Name""","Street, City"';
  const expected = [{ npsn: '12345', nama: 'School "Name"', alamat: 'Street, City' }];
  assert.deepStrictEqual(parseCsv(csv), expected);
});

test('formatStatus converts N to Negeri', () => {
  assert.strictEqual(formatStatus('N'), 'Negeri');
  assert.strictEqual(formatStatus('n'), 'Negeri');
  assert.strictEqual(formatStatus(' N '), 'Negeri');
});

test('formatStatus converts S to Swasta', () => {
  assert.strictEqual(formatStatus('S'), 'Swasta');
  assert.strictEqual(formatStatus('s'), 'Swasta');
  assert.strictEqual(formatStatus(' S '), 'Swasta');
});

test('formatStatus handles unknown status', () => {
  assert.strictEqual(formatStatus('X'), 'X');
  assert.strictEqual(formatStatus('UNKNOWN'), 'UNKNOWN');
});

test('formatStatus handles empty/null input', () => {
  assert.strictEqual(formatStatus(''), 'Tidak Diketahui');
  assert.strictEqual(formatStatus(null), 'Tidak Diketahui');
  assert.strictEqual(formatStatus(undefined), 'Tidak Diketahui');
});

test('formatEmptyValue returns value when not empty', () => {
  assert.strictEqual(formatEmptyValue('Test Value'), 'Test Value');
  assert.strictEqual(formatEmptyValue('  Test  '), 'Test');
  assert.strictEqual(formatEmptyValue(123), '123');
});

test('formatEmptyValue returns placeholder when empty', () => {
  assert.strictEqual(formatEmptyValue(''), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue(null), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue(undefined), 'Tidak tersedia');
  assert.strictEqual(formatEmptyValue('   '), 'Tidak tersedia');
});

test('formatEmptyValue accepts custom placeholder', () => {
  assert.strictEqual(formatEmptyValue('', '-'), '-');
  assert.strictEqual(formatEmptyValue(null, 'N/A'), 'N/A');
  assert.strictEqual(formatEmptyValue('Data', 'N/A'), 'Data');
});

test('hasCoordinateData returns true for valid coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '-6.2088', lon: '106.8456' }), true);
  assert.strictEqual(hasCoordinateData({ lat: '0.5', lon: '100.5' }), true);
});

test('hasCoordinateData returns false for missing coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '', lon: '' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '', lon: '106.8456' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '-6.2088', lon: '' }), false);
  assert.strictEqual(hasCoordinateData({}), false);
});

test('hasCoordinateData returns false for zero coordinates', () => {
  assert.strictEqual(hasCoordinateData({ lat: '0', lon: '0' }), false);
  assert.strictEqual(hasCoordinateData({ lat: '0.0', lon: '0.0' }), false);
});

test('hasCoordinateData returns false for null/undefined school', () => {
  assert.strictEqual(hasCoordinateData(null), false);
  assert.strictEqual(hasCoordinateData(undefined), false);
});

// Formula injection protection tests
test('escapeCsvField handles null and undefined', () => {
  assert.strictEqual(escapeCsvField(null), '');
  assert.strictEqual(escapeCsvField(undefined), '');
});

test('escapeCsvField returns string as-is for normal values', () => {
  assert.strictEqual(escapeCsvField('Test Value'), 'Test Value');
  assert.strictEqual(escapeCsvField('School Name'), 'School Name');
  assert.strictEqual(escapeCsvField(''), '');
  assert.strictEqual(escapeCsvField('123'), '123');
});

test('escapeCsvField escapes comma-containing values', () => {
  assert.strictEqual(escapeCsvField('Street, City'), '"Street, City"');
  assert.strictEqual(escapeCsvField('A, B, C'), '"A, B, C"');
});

test('escapeCsvField escapes double quotes', () => {
  assert.strictEqual(escapeCsvField('Test "Value"'), '"Test ""Value"""');
});

test('escapeCsvField escapes newline characters', () => {
  assert.strictEqual(escapeCsvField('Line1\nLine2'), '"Line1\nLine2"');
});

// Formula injection protection - critical security tests
test('escapeCsvField prefixes formula injection characters', () => {
  // Equal sign (=) - most common formula injection
  assert.strictEqual(escapeCsvField('=SUM(1,2)'), "'=SUM(1,2)");
  assert.strictEqual(escapeCsvField("=CMD|' /C calc"), "'=CMD|' /C calc");
  assert.strictEqual(escapeCsvField('=DDE("cmd""/c calc"'), '\'=DDE("cmd""/c calc"');

  // Plus sign (+)
  assert.strictEqual(escapeCsvField('+1+1'), "'+1+1");
  assert.strictEqual(escapeCsvField('+SUM(A1:B1)'), "'+SUM(A1:B1)");

  // Minus sign (-)
  assert.strictEqual(escapeCsvField('-1-1'), "'-1-1");
  assert.strictEqual(escapeCsvField('-2*3'), "'-2*3");

  // At sign (@)
  assert.strictEqual(escapeCsvField('@CONCATENATE(A1,B1)'), "'@CONCATENATE(A1,B1)");

  // Tab character
  assert.strictEqual(escapeCsvField('\tdata'), "'\tdata");
});

test('escapeCsvField handles formula injection combined with quoting needs', () => {
  // Formula char + comma needs both protections
  assert.strictEqual(escapeCsvField('=SUM(1,2),3'), "'=SUM(1,2),3");
});

test('escapeCsvField does not affect non-formula strings', () => {
  assert.strictEqual(escapeCsvField('formula'), 'formula');
  assert.strictEqual(escapeCsvField('=notformula'), "'=notformula");
  assert.strictEqual(escapeCsvField('test+value'), 'test+value');
  assert.strictEqual(escapeCsvField('test-value'), 'test-value');
  assert.strictEqual(escapeCsvField('email@domain.com'), 'email@domain.com');
});

// --- clearEscapeHtmlCache tests ---

test('clearEscapeHtmlCache clears the escapeHtml cache without throwing', () => {
  // Calling clearEscapeHtmlCache should not throw
  clearEscapeHtmlCache();
  assert.ok(true, 'clearEscapeHtmlCache should not throw when cache is empty');

  // Calling it multiple times should also be safe
  clearEscapeHtmlCache();
  clearEscapeHtmlCache();
  assert.ok(true, 'clearEscapeHtmlCache should be idempotent');
});

// --- writeCsv tests ---

test('writeCsv writes CSV with header and data rows', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [
      { npsn: '12345', nama: 'School A', provinsi: 'Jawa Barat' },
      { npsn: '67890', nama: 'School B', provinsi: 'Jawa Timur' },
    ];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 3, 'should have header + 2 data rows');
    assert.ok(lines[0].includes('npsn'), 'header should contain npsn');
    assert.ok(lines[0].includes('nama'), 'header should contain nama');
    assert.ok(lines[0].includes('provinsi'), 'header should contain provinsi');
    assert.ok(lines[1].includes('12345'), 'first row should contain school A npsn');
    assert.ok(lines[2].includes('67890'), 'second row should contain school B npsn');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv escapes special characters in CSV fields', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: 'School, Inc.', alamat: 'Jl. Sudirman No. 5' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    // The comma in "School, Inc." should be quoted
    assert.ok(content.includes('"School, Inc."'), 'comma-containing field should be quoted');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv handles formula injection protection', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: '=SUM(A1:A2)', alamat: '+CMD' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    assert.ok(content.includes("'=SUM"), 'formula injection should be prefixed with single quote');
    assert.ok(content.includes("'+CMD"), 'plus-prefixed values should be prefixed');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv throws for empty array', async () => {
  const { IntegrationError } = require('./resilience');
  await assert.rejects(() => writeCsv([], '/tmp/nonexistent/test.csv'), IntegrationError);
});

test('writeCsv throws for non-array input', async () => {
  const { IntegrationError } = require('./resilience');
  await assert.rejects(() => writeCsv(null, '/tmp/nonexistent/test.csv'), IntegrationError);
  await assert.rejects(() => writeCsv(undefined, '/tmp/nonexistent/test.csv'), IntegrationError);
  await assert.rejects(() => writeCsv('string', '/tmp/nonexistent/test.csv'), IntegrationError);
});

test('writeCsv handles single row', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    const data = [{ npsn: '12345', nama: 'School A', provinsi: 'Jawa Barat' }];

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 2, 'should have header + 1 data row');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('writeCsv handles large dataset with batching', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writecsv-test-'));
  const outputPath = path.join(tmpDir, 'test.csv');
  try {
    // Create 2500 records to test batching (batchSize is 1000 in writeCsv)
    const data = [];
    for (let i = 0; i < 2500; i++) {
      data.push({ npsn: String(i).padStart(5, '0'), nama: `School ${i}` });
    }

    await writeCsv(data, outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 2501, 'should have header + 2500 data rows');
    assert.ok(lines[1].includes('00000'), 'first row should contain first school');
    assert.ok(lines[2500].includes('2499'), 'last row should contain last school');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

// --- escapeHtml tests ---

test('escapeHtml returns empty string for null and undefined', () => {
  assert.strictEqual(escapeHtml(null), '');
  assert.strictEqual(escapeHtml(undefined), '');
});

test('escapeHtml escapes special HTML characters', () => {
  assert.strictEqual(escapeHtml('&'), '&amp;');
  assert.strictEqual(escapeHtml('<'), '&lt;');
  assert.strictEqual(escapeHtml('>'), '&gt;');
  assert.strictEqual(escapeHtml('"'), '&quot;');
  assert.strictEqual(escapeHtml("'"), '&#39;');
});

test('escapeHtml escapes all five characters in combined input', () => {
  const input = '<script>alert("xss&\'test")</script>';
  const expected = '&lt;script&gt;alert(&quot;xss&amp;&#39;test&quot;)&lt;/script&gt;';
  assert.strictEqual(escapeHtml(input), expected);
});

test('escapeHtml returns safe strings unchanged', () => {
  assert.strictEqual(escapeHtml('plain text'), 'plain text');
  assert.strictEqual(escapeHtml(''), '');
  assert.strictEqual(escapeHtml('123'), '123');
  assert.strictEqual(escapeHtml('hello world'), 'hello world');
});

test('escapeHtml converts numbers to strings', () => {
  assert.strictEqual(escapeHtml(42), '42');
  assert.strictEqual(escapeHtml(0), '0');
});

test('escapeHtml caching returns consistent results', () => {
  clearEscapeHtmlCache();
  const input = '<test>';
  const first = escapeHtml(input);
  const second = escapeHtml(input);
  assert.strictEqual(first, '&lt;test&gt;');
  assert.strictEqual(second, '&lt;test&gt;');
  assert.strictEqual(first, second);
});

test('escapeHtml cache eviction does not affect correctness', () => {
  clearEscapeHtmlCache();
  // Fill cache with unique values
  const results = new Set();
  for (let i = 0; i < 100; i++) {
    results.add(escapeHtml(`<item${i}>`));
  }
  // Verify all results correct
  for (let i = 0; i < 100; i++) {
    assert.ok(results.has(`&lt;item${i}&gt;`));
  }
  // Verify repeated call still works
  assert.strictEqual(escapeHtml('<item0>'), '&lt;item0&gt;');
});

// --- generateMetaDescription tests ---

test('generateMetaDescription returns empty string for null/undefined/non-object', () => {
  assert.strictEqual(generateMetaDescription(null), '');
  assert.strictEqual(generateMetaDescription(undefined), '');
  assert.strictEqual(generateMetaDescription('string'), '');
  assert.strictEqual(generateMetaDescription(42), '');
});

test('generateMetaDescription generates description from school data', () => {
  const school = {
    nama: 'SDN Merdeka',
    bentuk_pendidikan: 'SD',
    kab_kota: 'Bandung',
    kecamatan: 'Coblong',
  };
  const desc = generateMetaDescription(school);
  assert.ok(desc.includes('SDN Merdeka'));
  assert.ok(desc.includes('SD'));
  assert.ok(desc.includes('Bandung'));
  assert.ok(desc.includes('Coblong'));
});

test('generateMetaDescription handles missing optional fields', () => {
  const school = { nama: 'SMA 1 Jakarta' };
  const desc = generateMetaDescription(school);
  assert.strictEqual(desc, 'SMA 1 Jakarta');
});

test('generateMetaDescription describes location when available', () => {
  const school = {
    nama: 'SMK Nusantara',
    bentuk_pendidikan: 'SMK',
    kab_kota: 'Surabaya',
  };
  const desc = generateMetaDescription(school);
  assert.strictEqual(desc, 'SMK Nusantara - SMK - di Surabaya');
});

test('generateMetaDescription truncates long descriptions to 155 chars', () => {
  const school = {
    nama: 'A'.repeat(100),
    bentuk_pendidikan: 'SMA',
    kab_kota: 'Kota Administrasi Jakarta Selatan',
    kecamatan: 'Kecamatan Tebet',
  };
  const desc = generateMetaDescription(school);
  assert.ok(desc.length <= 155);
  assert.ok(desc.endsWith('...'));
});

test('generateMetaDescription does not truncate short descriptions', () => {
  const school = {
    nama: 'SD Harapan',
    bentuk_pendidikan: 'SD',
    kab_kota: 'Bogor',
    kecamatan: 'Bogor Tengah',
  };
  const desc = generateMetaDescription(school);
  assert.ok(desc.length < 155);
  assert.ok(!desc.endsWith('...'));
});

// --- processConcurrently tests ---

test('processConcurrently processes all items', async () => {
  const items = [1, 2, 3, 4, 5];
  const results = await processConcurrently(items, item => item * 2);
  assert.strictEqual(results.results.length, 5);
  const values = results.results.map(r => r.value);
  assert.deepStrictEqual(values, [2, 4, 6, 8, 10]);
});

test('processConcurrently returns metrics', async () => {
  const items = [1, 2, 3];
  const results = await processConcurrently(items, item => item);
  assert.ok(results.metrics, 'should have metrics');
  assert.ok(typeof results.metrics.total === 'number');
});

test('processConcurrently handles empty array', async () => {
  const results = await processConcurrently([], item => item);
  assert.deepStrictEqual(results.results, []);
});

test('processConcurrently respects concurrency limit', async () => {
  let maxConcurrent = 0;
  let currentConcurrent = 0;
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const results = await processConcurrently(
    items,
    async item => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      await new Promise(r => setTimeout(r, 10));
      currentConcurrent--;
      return item;
    },
    { limit: 3 }
  );

  assert.strictEqual(maxConcurrent, 3, 'should not exceed concurrency limit of 3');
  const values = results.results.map(r => r.value);
  assert.deepStrictEqual(values, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('processConcurrently uses custom getName option', async () => {
  const items = ['a', 'b', 'c'];
  const names = [];

  const results = await processConcurrently(items, item => item, {
    getName: item => {
      names.push(`custom-${item}`);
      return `custom-${item}`;
    },
  });
  assert.deepStrictEqual(names, ['custom-a', 'custom-b', 'custom-c']);
  const values = results.results.map(r => r.value);
  assert.deepStrictEqual(values, ['a', 'b', 'c']);
});

test('processConcurrently handles rejected processor', async () => {
  const items = [1, 2, 3];
  const results = await processConcurrently(items, item => {
    if (item === 2) throw new Error('processor error');
    return item;
  });
  assert.strictEqual(results.results.length, 3);
  assert.strictEqual(results.results[0].status, 'fulfilled');
  assert.strictEqual(results.results[0].value, 1);
  assert.strictEqual(results.results[1].status, 'rejected');
  assert.strictEqual(results.results[2].status, 'fulfilled');
  assert.strictEqual(results.results[2].value, 3);
});

test('processConcurrently onProgress callback receives updates', async () => {
  const items = [1, 2, 3];
  const progressUpdates = [];
  const results = await processConcurrently(items, item => item, {
    onProgress: (processed, total) => {
      progressUpdates.push({ processed, total });
    },
  });
  assert.strictEqual(progressUpdates.length, 3, 'should receive 3 progress updates');
  assert.deepStrictEqual(progressUpdates[progressUpdates.length - 1], { processed: 3, total: 3 });
  const values = results.results.map(r => r.value);
  assert.deepStrictEqual(values, [1, 2, 3]);
});

test('walkDirectory returns empty array for empty directory', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    const results = await walkDirectory(tmpDir, () => 'found');
    assert.deepStrictEqual(results, []);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('walkDirectory finds HTML files in flat directory', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    await fs.writeFile(path.join(tmpDir, 'page1.html'), '<html></html>');
    await fs.writeFile(path.join(tmpDir, 'page2.html'), '<html></html>');
    await fs.writeFile(path.join(tmpDir, 'data.json'), '{}');
    await fs.writeFile(path.join(tmpDir, 'notes.txt'), 'text');

    const results = await walkDirectory(tmpDir, (fullPath, relPath) => relPath);
    results.sort();
    assert.deepStrictEqual(results, ['page1.html', 'page2.html']);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('walkDirectory returns callback results when defined', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    await fs.writeFile(path.join(tmpDir, 'a.html'), '<html></html>');
    await fs.writeFile(path.join(tmpDir, 'b.html'), '<html></html>');

    const results = await walkDirectory(tmpDir, (fullPath, relPath, entry) => ({
      file: entry,
      size: entry.length,
    }));
    results.sort((a, b) => a.file.localeCompare(b.file));
    assert.deepStrictEqual(results, [
      { file: 'a.html', size: 6 },
      { file: 'b.html', size: 6 },
    ]);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('walkDirectory skips results when callback returns undefined', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    await fs.writeFile(path.join(tmpDir, 'keep.html'), '<html></html>');
    await fs.writeFile(path.join(tmpDir, 'skip.html'), '<html></html>');

    const results = await walkDirectory(tmpDir, (fullPath, relPath, entry) => {
      if (entry === 'keep.html') return 'kept';
      // returning undefined skips this entry
    });
    assert.deepStrictEqual(results, ['kept']);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('walkDirectory traverses nested subdirectories', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    const subDir = path.join(tmpDir, 'subdir');
    const nestedDir = path.join(subDir, 'nested');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'root.html'), '<html></html>');
    await fs.writeFile(path.join(subDir, 'sub.html'), '<html></html>');
    await fs.writeFile(path.join(nestedDir, 'deep.html'), '<html></html>');

    const results = await walkDirectory(tmpDir, (fullPath, relPath) => relPath);
    results.sort();
    assert.deepStrictEqual(results, ['root.html', 'subdir/nested/deep.html', 'subdir/sub.html']);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

test('walkDirectory ignores non-HTML files in subdirectories', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walkdir-test-'));
  try {
    const subDir = path.join(tmpDir, 'assets');
    await fs.mkdir(subDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'index.html'), '<html></html>');
    await fs.writeFile(path.join(subDir, 'style.css'), 'body {}');
    await fs.writeFile(path.join(subDir, 'script.js'), 'console.log(1)');
    await fs.writeFile(path.join(subDir, 'page.html'), '<html></html>');

    const results = await walkDirectory(tmpDir, (fullPath, relPath) => relPath);
    results.sort();
    assert.deepStrictEqual(results, ['assets/page.html', 'index.html']);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});
