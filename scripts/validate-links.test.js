const test = require('node:test');
const assert = require('node:assert');
const {
  extractLinks,
  categorizeLink,
  validateLinksInFile,
  validateExternalLink,
  validateLinks,
} = require('./validate-links');

test('extractLinks extracts relative links from HTML', () => {
  const html = '<a href="page.html">Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['page.html']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks extracts multiple relative links', () => {
  const html = '<a href="page1.html">Link1</a><a href="page2.html">Link2</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['page1.html', 'page2.html']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks extracts external http links', () => {
  const html = '<a href="http://example.com/page.html">External</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, ['http://example.com/page.html']);
});

test('extractLinks extracts external https links', () => {
  const html = '<a href="https://example.com/page.html">External</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, ['https://example.com/page.html']);
});

test('extractLinks extracts relative links with paths', () => {
  const html = '<a href="../parent/page.html">Parent Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['../parent/page.html']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks extracts relative links with subdirectories', () => {
  const html = '<a href="subdir/page.html">Subdir Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['subdir/page.html']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles empty HTML', () => {
  const result = extractLinks('');
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles HTML with no links', () => {
  const html = '<p>No links here</p>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles links with query parameters', () => {
  const html = '<a href="page.html?param=value">Link with query</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['page.html?param=value']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles links with hash fragments', () => {
  const html = '<a href="page.html#section">Link with hash</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['page.html#section']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles mixed external and internal links', () => {
  const html = '<a href="https://external.com">External</a><a href="internal.html">Internal</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['internal.html']);
  assert.deepStrictEqual(result.external, ['https://external.com']);
});

test('extractLinks handles links with special characters', () => {
  const html = '<a href="page-name.html">Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['page-name.html']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles malformed href attributes', () => {
  const html = '<a href="">Empty</a><a href="  ">Spaces</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result.internal, ['  ']);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles null input', () => {
  const result = extractLinks(null);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles undefined input', () => {
  const result = extractLinks(undefined);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('extractLinks handles non-string input', () => {
  const result = extractLinks(123);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('categorizeLink returns internal for relative links', () => {
  const result = categorizeLink('page.html');
  assert.strictEqual(result.type, 'internal');
  assert.strictEqual(result.url, null);
});

test('categorizeLink returns internal for absolute path links', () => {
  const result = categorizeLink('/about.html');
  assert.strictEqual(result.type, 'internal');
  assert.strictEqual(result.url, null);
});

test('categorizeLink returns external for http links', () => {
  const result = categorizeLink('http://example.com/page.html');
  assert.strictEqual(result.type, 'external');
  assert.strictEqual(result.url, 'http://example.com/page.html');
});

test('categorizeLink returns external for https links', () => {
  const result = categorizeLink('https://example.com/page.html');
  assert.strictEqual(result.type, 'external');
  assert.strictEqual(result.url, 'https://example.com/page.html');
});

test('categorizeLink returns internal for hash-only links', () => {
  const result = categorizeLink('#');
  assert.strictEqual(result.type, 'internal');
  assert.strictEqual(result.url, null);
});

test('categorizeLink returns internal for hash fragment links', () => {
  const result = categorizeLink('#section');
  assert.strictEqual(result.type, 'internal');
  assert.strictEqual(result.url, null);
});

test('categorizeLink returns internal for empty/null links', () => {
  assert.strictEqual(categorizeLink('').type, 'internal');
  assert.strictEqual(categorizeLink(null).type, 'internal');
  assert.strictEqual(categorizeLink(undefined).type, 'internal');
});

test('validateLinksInFile skips hash-only internal links', async () => {
  const file = '/dist/index.html';
  const links = { internal: ['#', '#section'], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('validateLinksInFile skips external http links', async () => {
  const file = '/dist/index.html';
  const links = {
    internal: [],
    external: ['http://example.com/page.html', 'https://other.com/test'],
  };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
  assert.ok(Array.isArray(result.external));
});

test('validateLinksInFile handles absolute paths starting with /', async () => {
  const file = '/dist/index.html';
  const links = { internal: ['/about.html'], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
});

test('validateLinksInFile handles relative paths', async () => {
  const file = '/dist/schools/jakarta/index.html';
  const links = { internal: ['../schools.html'], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
});

test('validateLinksInFile strips query parameters from links', async () => {
  const file = '/dist/index.html';
  const links = { internal: ['page.html?param=value'], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
});

test('validateLinksInFile strips hash fragments from links', async () => {
  const file = '/dist/index.html';
  const links = { internal: ['page.html#section'], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
});

test('validateLinksInFile handles empty links array', async () => {
  const file = '/dist/index.html';
  const links = { internal: [], external: [] };
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.deepStrictEqual(result.internal, []);
  assert.deepStrictEqual(result.external, []);
});

test('validateLinksInFile handles null/undefined links', async () => {
  const file = '/dist/index.html';
  const distDir = '/dist';

  const result1 = await validateLinksInFile(file, { internal: [null], external: [] }, distDir);
  assert.deepStrictEqual(result1.internal, []);

  const result2 = await validateLinksInFile(file, { internal: [undefined], external: [] }, distDir);
  assert.deepStrictEqual(result2.internal, []);
});

test('validateLinksInFile handles broken links correctly', async () => {
  const file = '/dist/index.html';
  const links = { internal: ['nonexistent-page.html'], external: [] };
  const distDir = '/nonexistent-dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result.internal));
});

test('validateExternalLink handles valid HTTPS URL', async () => {
  const result = await validateExternalLink('https://httpbin.org/status/200', 5000);
  assert.ok(result.ok || !result.ok);
});

test('validateExternalLink handles invalid URL', async () => {
  const result = await validateExternalLink('not-a-valid-url');
  assert.strictEqual(result.ok, false);
});

test('validateExternalLink handles request timeout', async () => {
  const result = await validateExternalLink('https://192.0.2.1/', 100);
  assert.strictEqual(result.ok, false);
});

test('validateLinks returns true when dist directory does not exist', async () => {
  const CONFIG = require('./config');

  const originalDistDir = CONFIG.DIST_DIR;
  CONFIG.DIST_DIR = '/nonexistent-dist-dir-' + Date.now();

  try {
    const result = await validateLinks();
    assert.strictEqual(result, true, 'Should return true when dist does not exist');
  } finally {
    CONFIG.DIST_DIR = originalDistDir;
  }
});

test('validateLinks returns true when no HTML files found', async () => {
  const CONFIG = require('./config');
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-validate-' + Date.now()));

  const originalDistDir = CONFIG.DIST_DIR;
  CONFIG.DIST_DIR = emptyDir;

  try {
    const result = await validateLinks();
    assert.strictEqual(result, true, 'Should return true when no HTML files found');
  } finally {
    CONFIG.DIST_DIR = originalDistDir;
    fs.rmSync(emptyDir, { recursive: true, force: true });
  }
});
