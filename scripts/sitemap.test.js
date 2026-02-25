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
    { url: 'https://example.com/page2.html', lastmod: '2024-01-16' }
  ];
  const files = await writeSitemapFiles(urls, testDir);
  
  assert.strictEqual(files.length, 1);
  assert.strictEqual(files[0], 'sitemap-001.xml');
  
  const content = await fs.readFile(path.join(testDir, 'sitemap-001.xml'), 'utf8');
  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(content.includes('<url><loc>https://example.com/page1.html</loc><lastmod>2024-01-15</lastmod></url>'));
  assert.ok(content.includes('<url><loc>https://example.com/page2.html</loc><lastmod>2024-01-16</lastmod></url>'));
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
    lastmod: '2024-01-15'
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
      { url: 'url6', lastmod: '2024-01-15' }
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
    'sitemap-005.xml'
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
  
  const indexExists = await fs.access(path.join(testDir, 'sitemap-index.xml')).then(() => true).catch(() => false);
  assert.strictEqual(indexExists, true);
});
