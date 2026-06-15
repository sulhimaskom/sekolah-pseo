const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const CONFIG = require('./config');

test.before(async () => {
  process.env.TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'sitemap-test-'));
});

test.after(async () => {
  const testDir = process.env.TEST_TEMP_DIR;
  if (testDir) {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to cleanup test directory: ${err.message}`);
    }
  }
});

test('collectUrls collects HTML files from directory structure', async () => {
  const { collectUrls } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'collect-test');
  await fs.mkdir(testDir, { recursive: true });

  await fs.writeFile(path.join(testDir, 'index.html'), '<html></html>', 'utf8');

  const subdir = path.join(testDir, 'subdir');
  await fs.mkdir(subdir, { recursive: true });
  await fs.writeFile(path.join(subdir, 'page.html'), '<html></html>', 'utf8');

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.strictEqual(urls.length, 2);
  assert.ok(urls.some(u => u.url === 'https://example.com/index.html'));
  assert.ok(urls.some(u => u.url === 'https://example.com/subdir/page.html'));
  // Verify lastmod is present
  assert.ok(urls.every(u => u.lastmod && u.lastmod.match(/^\d{4}-\d{2}-\d{2}$/)));
});

test('collectUrls ignores non-HTML files', async () => {
  const { collectUrls } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'collect-test2');
  await fs.mkdir(testDir, { recursive: true });

  await fs.writeFile(path.join(testDir, 'index.html'), '<html></html>', 'utf8');
  await fs.writeFile(path.join(testDir, 'style.css'), 'body {}', 'utf8');
  await fs.writeFile(path.join(testDir, 'script.js'), 'console.log()', 'utf8');

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.strictEqual(urls.length, 1);
  assert.ok(urls.some(u => u.url === 'https://example.com/index.html'));
});

test('collectUrls handles empty directory', async () => {
  const { collectUrls } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'collect-test3');
  await fs.mkdir(testDir, { recursive: true });

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.deepStrictEqual(urls, []);
});

test('collectUrls handles nested directory structures', async () => {
  const { collectUrls } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'collect-test4');
  await fs.mkdir(testDir, { recursive: true });

  const level1 = path.join(testDir, 'level1');
  await fs.mkdir(level1);
  const level2 = path.join(level1, 'level2');
  await fs.mkdir(level2);

  await fs.writeFile(path.join(level1, 'page1.html'), '<html></html>', 'utf8');
  await fs.writeFile(path.join(level2, 'page2.html'), '<html></html>', 'utf8');

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.strictEqual(urls.length, 2);
  assert.ok(urls.some(u => u.url === 'https://example.com/level1/page1.html'));
  assert.ok(urls.some(u => u.url === 'https://example.com/level1/level2/page2.html'));
});

test('writeSitemapFiles creates sitemap with correct XML structure', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test1');
  await fs.mkdir(testDir, { recursive: true });

  const urls = [
    { url: 'https://example.com/page1.html', lastmod: '2024-01-15' },
    { url: 'https://example.com/page2.html', lastmod: '2024-01-16' },
  ];
  const files = await writeSitemapFiles(urls, testDir);

  assert.strictEqual(files.length, 1);
  assert.strictEqual(files[0], 'sitemap-001.xml');

  const content = await fs.readFile(path.join(testDir, 'sitemap-001.xml'), 'utf8');
  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(
    content.includes(
      '<url><loc>https://example.com/page1.html</loc><lastmod>2024-01-15</lastmod></url>'
    )
  );
  assert.ok(
    content.includes(
      '<url><loc>https://example.com/page2.html</loc><lastmod>2024-01-16</lastmod></url>'
    )
  );
  assert.ok(content.includes('</urlset>'));
});

test('writeSitemapFiles includes lastmod tags from file modification time', async () => {
  const { collectUrls, writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test-lastmod');
  await fs.mkdir(testDir, { recursive: true });

  // Create file with specific modification time
  const testFile = path.join(testDir, 'test.html');
  await fs.writeFile(testFile, '<html></html>', 'utf8');

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.strictEqual(urls.length, 1);
  assert.ok(urls[0].lastmod, 'Should have lastmod');
  assert.ok(urls[0].lastmod.match(/^\d{4}-\d{2}-\d{2}$/), 'lastmod should be YYYY-MM-DD format');

  const files = await writeSitemapFiles(urls, testDir);
  const content = await fs.readFile(path.join(testDir, files[0]), 'utf8');
  assert.ok(content.includes('<lastmod>'), 'Should include lastmod tag');
  assert.ok(content.includes(urls[0].lastmod), 'lastmod value should match');
});

test('writeSitemapFiles splits URLs into multiple sitemaps when exceeding limit', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test2');
  await fs.mkdir(testDir, { recursive: true });

  const urls = Array.from({ length: 50001 }, (_, i) => ({
    url: `https://example.com/page${i}.html`,
    lastmod: '2024-01-15',
  }));
  const files = await writeSitemapFiles(urls, testDir);

  assert.strictEqual(files.length, 2);
  assert.ok(files.includes('sitemap-001.xml'));
  assert.ok(files.includes('sitemap-002.xml'));
});

test('writeSitemapFiles handles empty URL list', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test3');
  await fs.mkdir(testDir, { recursive: true });

  const files = await writeSitemapFiles([], testDir);
  assert.strictEqual(files.length, 0);
});

test('writeSitemapFiles respects MAX_URLS_PER_SITEMAP configuration', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const originalMax = CONFIG.MAX_URLS_PER_SITEMAP;
  CONFIG.MAX_URLS_PER_SITEMAP = 3;

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test4');
  await fs.mkdir(testDir, { recursive: true });

  try {
    const urls = [
      { url: 'url1', lastmod: '2024-01-15' },
      { url: 'url2', lastmod: '2024-01-15' },
      { url: 'url3', lastmod: '2024-01-15' },
      { url: 'url4', lastmod: '2024-01-15' },
      { url: 'url5', lastmod: '2024-01-15' },
      { url: 'url6', lastmod: '2024-01-15' },
    ];
    const files = await writeSitemapFiles(urls, testDir);

    assert.strictEqual(files.length, 2);
    assert.strictEqual(files[0], 'sitemap-001.xml');
    assert.strictEqual(files[1], 'sitemap-002.xml');
  } finally {
    CONFIG.MAX_URLS_PER_SITEMAP = originalMax;
  }
});

test('writeSitemapIndex creates sitemap index with correct XML structure', async () => {
  const { writeSitemapIndex } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'index-test1');
  await fs.mkdir(testDir, { recursive: true });

  const files = ['sitemap-001.xml', 'sitemap-002.xml'];
  await writeSitemapIndex(files, testDir, 'https://example.com');

  const content = await fs.readFile(path.join(testDir, 'sitemap-index.xml'), 'utf8');
  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(content.includes('<sitemap><loc>https://example.com/sitemap-001.xml</loc></sitemap>'));
  assert.ok(content.includes('<sitemap><loc>https://example.com/sitemap-002.xml</loc></sitemap>'));
  assert.ok(content.includes('</sitemapindex>'));
});

test('writeSitemapIndex handles empty file list', async () => {
  const { writeSitemapIndex } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'index-test2');
  await fs.mkdir(testDir, { recursive: true });

  await writeSitemapIndex([], testDir, 'https://example.com');

  const content = await fs.readFile(path.join(testDir, 'sitemap-index.xml'), 'utf8');
  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(content.includes('</sitemapindex>'));
});

test('writeSitemapIndex includes all sitemap files', async () => {
  const { writeSitemapIndex } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'index-test3');
  await fs.mkdir(testDir, { recursive: true });

  const files = [
    'sitemap-001.xml',
    'sitemap-002.xml',
    'sitemap-003.xml',
    'sitemap-004.xml',
    'sitemap-005.xml',
  ];

  await writeSitemapIndex(files, testDir, 'https://example.com');

  const content = await fs.readFile(path.join(testDir, 'sitemap-index.xml'), 'utf8');

  for (const file of files) {
    assert.ok(content.includes(`<sitemap><loc>https://example.com/${file}</loc></sitemap>`));
  }
});

test('sitemap generation integration test', async () => {
  const { collectUrls, writeSitemapFiles, writeSitemapIndex } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'integration-test');
  await fs.mkdir(testDir, { recursive: true });

  const subdir = path.join(testDir, 'provinsi');
  await fs.mkdir(subdir);
  await fs.writeFile(path.join(subdir, 'index.html'), '<html></html>', 'utf8');
  await fs.writeFile(path.join(testDir, 'index.html'), '<html></html>', 'utf8');

  const urls = await collectUrls(testDir, 'https://example.com');
  assert.strictEqual(urls.length, 2);
  assert.ok(urls.every(u => u.url && u.lastmod));

  const sitemapFiles = await writeSitemapFiles(urls, testDir);
  assert.strictEqual(sitemapFiles.length, 1);

  await writeSitemapIndex(sitemapFiles, testDir, 'https://example.com');

  const indexExists = await fs
    .access(path.join(testDir, 'sitemap-index.xml'))
    .then(() => true)
    .catch(() => false);
  assert.strictEqual(indexExists, true);
});

test('escapeXml escapes XML special characters', () => {
  const { escapeXml } = require('./sitemap');

  assert.strictEqual(escapeXml('hello'), 'hello');
  assert.strictEqual(escapeXml('a & b'), 'a &amp; b');
  assert.strictEqual(escapeXml('<script>'), '&lt;script&gt;');
  assert.strictEqual(escapeXml('"quoted"'), '&quot;quoted&quot;');
  assert.strictEqual(escapeXml("it's"), 'it&apos;s');
  assert.strictEqual(
    escapeXml('<a href="url">test</a>'),
    '&lt;a href=&quot;url&quot;&gt;test&lt;/a&gt;'
  );
  assert.strictEqual(escapeXml(123), '');
  assert.strictEqual(escapeXml(null), '');
  assert.strictEqual(escapeXml(undefined), '');
  assert.strictEqual(escapeXml(''), '');
});

test('collectUrlsFromSchools returns homepage URL only for empty schools array', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const result = collectUrlsFromSchools([], 'https://example.com');

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].url, 'https://example.com/');
  assert.ok(result[0].lastmod);
  assert.ok(result[0].lastmod.match(/^\d{4}-\d{2}-\d{2}$/));
});

test('collectUrlsFromSchools handles null schools gracefully', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  assert.throws(() => collectUrlsFromSchools(null, 'https://example.com'), {
    name: 'Error',
    message: 'schools must be an array',
  });
});

test('collectUrlsFromSchools handles undefined schools gracefully', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  assert.throws(() => collectUrlsFromSchools(undefined, 'https://example.com'), {
    name: 'Error',
    message: 'schools must be an array',
  });
});

test('collectUrlsFromSchools returns homepage, province and school URLs for single school', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
  ];

  const result = collectUrlsFromSchools(schools, 'https://example.com');

  // Homepage + 1 province + 1 school = 3
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].url, 'https://example.com/');
  assert.ok(result[1].url.includes('/provinsi/'));
  assert.ok(result[2].url.includes('12345678'));
});

test('collectUrlsFromSchools handles baseUrl with trailing slash', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '12345678', nama: 'SMA Negeri 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
  ];

  const result = collectUrlsFromSchools(schools, 'https://example.com/');

  // Should normalize trailing slash
  assert.strictEqual(result[0].url, 'https://example.com/');
  assert.ok(result[1].url.startsWith('https://example.com/provinsi/'));
  assert.ok(result[2].url.startsWith('https://example.com/'));
});

test('collectUrlsFromSchools generates URLs for multiple schools in same province', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '11111111', nama: 'SDN 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
    { npsn: '22222222', nama: 'SMPN 2', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Cicendo' },
  ];

  const result = collectUrlsFromSchools(schools, 'https://example.com');

  // Homepage + 1 province + 2 schools = 4
  assert.strictEqual(result.length, 4);
  // Province pages end with /, school pages contain /provinsi/ but end with .html
  const provinceUrls = result.filter(u => u.url.match(/\/provinsi\/[^/]+\/$/));
  assert.strictEqual(provinceUrls.length, 1);
  const schoolUrls = result.filter(u => u.url.includes('.html'));
  assert.strictEqual(schoolUrls.length, 2);
});

test('collectUrlsFromSchools generates URLs for multiple provinces', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '11111111', nama: 'SDN 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
    { npsn: '22222222', nama: 'SDN 2', provinsi: 'Jawa Timur', kab_kota: 'Surabaya', kecamatan: 'Gubeng' },
  ];

  const result = collectUrlsFromSchools(schools, 'https://example.com');

  // Homepage + 2 provinces + 2 schools = 5
  assert.strictEqual(result.length, 5);
  const provinceUrls = result.filter(u => u.url.match(/\/provinsi\/[^/]+\/$/));
  assert.strictEqual(provinceUrls.length, 2);
  const schoolUrls = result.filter(u => u.url.includes('.html'));
  assert.strictEqual(schoolUrls.length, 2);
});

test('collectUrlsFromSchools throws for schools without required fields', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '11111111', nama: 'SDN 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
    { npsn: '22222222', nama: 'SDN 2', kab_kota: 'Surabaya', kecamatan: 'Gubeng' }, // No provinsi
  ];

  // getSchoolRelativePath requires provinsi, so it throws for the second school
  assert.throws(() => collectUrlsFromSchools(schools, 'https://example.com'), {
    message: /missing required fields/,
  });
});

test('collectUrlsFromSchools generates all URLs for large school set', () => {
  const { collectUrlsFromSchools } = require('./sitemap');

  const schools = [
    { npsn: '00001', nama: 'SDN A', provinsi: 'Aceh', kab_kota: 'Kota A', kecamatan: 'Kec A' },
    { npsn: '00002', nama: 'SDN B', provinsi: 'Bali', kab_kota: 'Kota B', kecamatan: 'Kec B' },
    { npsn: '00003', nama: 'SDN C', provinsi: 'Jawa Barat', kab_kota: 'Kota C', kecamatan: 'Kec C' },
    { npsn: '00004', nama: 'SDN D', provinsi: 'Jawa Timur', kab_kota: 'Kota D', kecamatan: 'Kec D' },
    { npsn: '00005', nama: 'SDN E', provinsi: 'Jawa Barat', kab_kota: 'Kota E', kecamatan: 'Kec E' },
  ];

  const result = collectUrlsFromSchools(schools, 'https://example.com');

  // Homepage + 4 provinces + 5 schools = 10
  assert.strictEqual(result.length, 10);
  const provinceUrls = result.filter(u => u.url.match(/\/provinsi\/[^/]+\/$/));
  assert.strictEqual(provinceUrls.length, 4);
  const schoolUrls = result.filter(u => u.url.includes('.html'));
  assert.strictEqual(schoolUrls.length, 5);
});

test('writeSitemapFiles handles URLs without lastmod field', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test-nolastmod');
  await fs.mkdir(testDir, { recursive: true });

  const urls = [
    { url: 'https://example.com/page1.html' }, // No lastmod
    { url: 'https://example.com/page2.html' }, // No lastmod
  ];

  const files = await writeSitemapFiles(urls, testDir);
  assert.strictEqual(files.length, 1);

  const content = await fs.readFile(path.join(testDir, 'sitemap-001.xml'), 'utf8');
  assert.ok(content.includes('<loc>https://example.com/page1.html</loc>'));
  assert.ok(content.includes('<loc>https://example.com/page2.html</loc>'));
  // Should NOT include <lastmod> tags for URLs without it
  assert.ok(!content.includes('<lastmod>'));
});

test('writeSitemapFiles escapes XML special characters in URLs', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test-xml');
  await fs.mkdir(testDir, { recursive: true });

  const urls = [
    { url: 'https://example.com/page&test<script>.html', lastmod: '2024-01-15' },
  ];

  const files = await writeSitemapFiles(urls, testDir);
  const content = await fs.readFile(path.join(testDir, files[0]), 'utf8');

  // XML special characters should be escaped
  assert.ok(content.includes('&amp;'));
  assert.ok(content.includes('&lt;'));
  assert.ok(content.includes('&gt;'));
  // Raw special characters should NOT appear
  assert.ok(!content.includes('<script>'));
  assert.ok(!content.includes('&<'));
});

test('writeSitemapFiles escapes XML in URLs without lastmod', async () => {
  const { writeSitemapFiles } = require('./sitemap');

  const testDir = path.join(process.env.TEST_TEMP_DIR, 'write-test-xml2');
  await fs.mkdir(testDir, { recursive: true });

  // URL with quotes and apostrophes, no lastmod (testing the else branch)
  const urls = [
    { url: "https://example.com/page?q=it's&title=\"hello\"" },
  ];

  const files = await writeSitemapFiles(urls, testDir);
  const content = await fs.readFile(path.join(testDir, files[0]), 'utf8');

  assert.ok(content.includes('&quot;'));
  assert.ok(content.includes('&apos;'));
  assert.ok(content.includes('&amp;'));
});

test('generateSitemaps generates sitemaps from schools data', async () => {
  const { generateSitemaps } = require('./sitemap');
  const CONFIG = require('./config');

  const schools = [
    { npsn: '11111111', nama: 'SDN 1', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' },
    { npsn: '22222222', nama: 'SDN 2', provinsi: 'Jawa Timur', kab_kota: 'Surabaya', kecamatan: 'Gubeng' },
  ];

  const result = await generateSitemaps(schools);
  const { urls, files } = result;

  // Should have generated URLs
  assert.ok(urls.length > 0);
  // Homepage + 2 provinces + 2 schools = 5
  assert.strictEqual(urls.length, 5);
  // Should have sitemap file(s)
  assert.ok(files.length > 0);
  assert.ok(files.every(f => f.startsWith('sitemap-') && f.endsWith('.xml')));

  // Verify sitemap file exists on disk
  const sitemapPath = path.join(CONFIG.DIST_DIR, files[0]);
  const sitemapContent = await fs.readFile(sitemapPath, 'utf8');
  assert.ok(sitemapContent.includes('<?xml version="1.0"'));
  assert.ok(sitemapContent.includes('<urlset xmlns='));

  // Verify sitemap index exists
  const indexPath = path.join(CONFIG.DIST_DIR, 'sitemap-index.xml');
  const indexContent = await fs.readFile(indexPath, 'utf8');
  assert.ok(indexContent.includes('<?xml version="1.0"'));
  assert.ok(indexContent.includes('<sitemapindex xmlns='));

  // Cleanup
  await fs.rm(sitemapPath, { force: true });
  await fs.rm(indexPath, { force: true });
});

test('generateSitemaps generates sitemap index referencing all sitemap files', async () => {
  const { generateSitemaps } = require('./sitemap');
  const CONFIG = require('./config');

  const schools = [
    { npsn: '11111111', nama: 'SDN 1', provinsi: 'Aceh', kab_kota: 'A', kecamatan: 'A' },
    { npsn: '22222222', nama: 'SDN 2', provinsi: 'Bali', kab_kota: 'B', kecamatan: 'B' },
  ];

  const { files } = await generateSitemaps(schools);

  // Verify sitemap index references all sitemap files
  const indexPath = path.join(CONFIG.DIST_DIR, 'sitemap-index.xml');
  const indexContent = await fs.readFile(indexPath, 'utf8');

  for (const file of files) {
    assert.ok(indexContent.includes(`<loc>${CONFIG.SITE_URL}/${file}</loc>`));
  }

  // Cleanup
  for (const file of files) {
    await fs.rm(path.join(CONFIG.DIST_DIR, file), { force: true });
  }
  await fs.rm(indexPath, { force: true });
});

test('generateSitemaps uses collectUrlsFromSchools when schools provided', async () => {
  const { generateSitemaps } = require('./sitemap');

  const schools = [
    { npsn: '11111111', nama: 'SDN Test', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
  ];

  const result = await generateSitemaps(schools);
  // The data-driven path uses collectUrlsFromSchools
  // Homepage + 1 province + 1 school = 3
  assert.strictEqual(result.urls.length, 3);
});

test('generateSitemaps with single school produces consistent structure', async () => {
  const { generateSitemaps } = require('./sitemap');
  const CONFIG = require('./config');

  const schools = [
    { npsn: '99999999', nama: 'TK Negeri 1', provinsi: 'DKI Jakarta', kab_kota: 'Jakarta Selatan', kecamatan: 'Kebayoran Baru' },
  ];

  const { urls, files } = await generateSitemaps(schools);
  assert.strictEqual(urls.length, 3, 'should have homepage, province page, and school page');

  // Cleanup
  for (const file of files) {
    await fs.rm(path.join(CONFIG.DIST_DIR, file), { force: true });
  }
  await fs.rm(path.join(CONFIG.DIST_DIR, 'sitemap-index.xml'), { force: true });
});
