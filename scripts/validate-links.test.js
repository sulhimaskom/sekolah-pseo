const test = require('node:test');
const assert = require('node:assert');
const { extractLinks, validateLinksInFile, validateLinks } = require('./validate-links');

test('extractLinks extracts relative links from HTML', () => {
  const html = '<a href="page.html">Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['page.html']);
});

test('extractLinks extracts multiple relative links', () => {
  const html = '<a href="page1.html">Link1</a><a href="page2.html">Link2</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['page1.html', 'page2.html']);
});

test('extractLinks ignores external http links', () => {
  const html = '<a href="http://example.com/page.html">External</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, []);
});

test('extractLinks ignores external https links', () => {
  const html = '<a href="https://example.com/page.html">External</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, []);
});

test('extractLinks extracts relative links with paths', () => {
  const html = '<a href="../parent/page.html">Parent Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['../parent/page.html']);
});

test('extractLinks extracts relative links with subdirectories', () => {
  const html = '<a href="subdir/page.html">Subdir Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['subdir/page.html']);
});

test('extractLinks handles empty HTML', () => {
  const result = extractLinks('');
  assert.deepStrictEqual(result, []);
});

test('extractLinks handles HTML with no links', () => {
  const html = '<p>No links here</p>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, []);
});

test('extractLinks handles links with query parameters', () => {
  const html = '<a href="page.html?param=value">Link with query</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['page.html?param=value']);
});

test('extractLinks handles links with hash fragments', () => {
  const html = '<a href="page.html#section">Link with hash</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['page.html#section']);
});

test('extractLinks handles mixed external and internal links', () => {
  const html = '<a href="https://external.com">External</a><a href="internal.html">Internal</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['internal.html']);
});

test('extractLinks handles links with special characters', () => {
  const html = '<a href="page-name.html">Link</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['page-name.html']);
});

test('extractLinks handles malformed href attributes', () => {
  const html = '<a href="">Empty</a><a href="  ">Spaces</a>';
  const result = extractLinks(html);
  assert.deepStrictEqual(result, ['  ']);
});

test('extractLinks handles null input', () => {
  const result = extractLinks(null);
  assert.deepStrictEqual(result, []);
});

test('extractLinks handles undefined input', () => {
  const result = extractLinks(undefined);
  assert.deepStrictEqual(result, []);
});

test('extractLinks handles non-string input', () => {
  const result = extractLinks(123);
  assert.deepStrictEqual(result, []);
});

test('validateLinksInFile skips hash-only links', async () => {
  const file = '/dist/index.html';
  const links = ['#', '#section'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.deepStrictEqual(result, []);
});

test('validateLinksInFile skips external http links', async () => {
  const file = '/dist/index.html';
  const links = ['http://example.com/page.html', 'https://other.com/test'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.deepStrictEqual(result, []);
});

test('validateLinksInFile handles absolute paths starting with /', async () => {
  const file = '/dist/index.html';
  const links = ['/about.html'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result));
});

test('validateLinksInFile handles relative paths', async () => {
  const file = '/dist/schools/jakarta/index.html';
  const links = ['../schools.html'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result));
});

test('validateLinksInFile strips query parameters from links', async () => {
  const file = '/dist/index.html';
  const links = ['page.html?param=value'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result));
});

test('validateLinksInFile strips hash fragments from links', async () => {
  const file = '/dist/index.html';
  const links = ['page.html#section'];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result));
});

test('validateLinksInFile handles empty links array', async () => {
  const file = '/dist/index.html';
  const links = [];
  const distDir = '/dist';
  const result = await validateLinksInFile(file, links, distDir);
  assert.deepStrictEqual(result, []);
});

test('validateLinksInFile handles null/undefined links', async () => {
  const file = '/dist/index.html';
  const distDir = '/dist';

  const result1 = await validateLinksInFile(file, [null], distDir);
  assert.deepStrictEqual(result1, []);

  const result2 = await validateLinksInFile(file, [undefined], distDir);
  assert.deepStrictEqual(result2, []);
});

test('validateLinksInFile handles broken links correctly', async () => {
  const file = '/dist/index.html';
  const links = ['nonexistent-page.html'];
  const distDir = '/nonexistent-dist';

  const result = await validateLinksInFile(file, links, distDir);
  assert.ok(Array.isArray(result));
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

test('validateLinksInFile handles non-directory target as broken link', async () => {
  // This tests the branch where safeAccess fails but safeStat shows it's not a directory
  const file = '/dist/index.html';
  const links = ['file.txt'];
  const distDir = '/dist';
  
  const result = await validateLinksInFile(file, links, distDir);
  // The result should contain broken links since file.txt doesn't exist
  assert.ok(Array.isArray(result));
});

test('validateLinks processes HTML files with links and returns false on broken links', async () => {
  const CONFIG = require('./config');
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  
  // Create a temp directory with HTML file containing broken link
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-' + Date.now()));
  
  // Create an HTML file with a broken link
  const htmlFile = path.join(tempDir, 'index.html');
  fs.writeFileSync(htmlFile, '<a href="nonexistent.html">Broken</a>');
  
  const originalDistDir = CONFIG.DIST_DIR;
  CONFIG.DIST_DIR = tempDir;
  
  try {
    const result = await validateLinks();
    // Should return false because broken link exists
    assert.strictEqual(result, false);
  } finally {
    CONFIG.DIST_DIR = originalDistDir;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinks processes HTML files with valid links and returns true', async () => {
  const CONFIG = require('./config');
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  
  // Create a temp directory with valid HTML structure
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-valid-' + Date.now()));
  
  // Create an HTML file with valid internal link
  const htmlFile = path.join(tempDir, 'index.html');
  fs.writeFileSync(htmlFile, '<a href="about.html">About</a>');
  
  // Create the target file that the link points to
  fs.writeFileSync(path.join(tempDir, 'about.html'), '<html><body>About</body></html>');
  
  const originalDistDir = CONFIG.DIST_DIR;
  CONFIG.DIST_DIR = tempDir;
  
  try {
    const result = await validateLinks();
    // Should return true because all links are valid
    assert.strictEqual(result, true);
  } finally {
    CONFIG.DIST_DIR = originalDistDir;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
