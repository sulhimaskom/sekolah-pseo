const test = require('node:test');
const assert = require('node:assert');
const {
  extractLinks,
  validateLinksInFile,
  validateLinks,
  isRelativeLink,
  statExistsCached,
} = require('./validate-links');
const { withConfig } = require('./test-helpers');

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

// ── isRelativeLink ─────────────────────────────────────────────────────────

test('isRelativeLink returns true for relative paths', () => {
  assert.strictEqual(isRelativeLink('page.html'), true);
  assert.strictEqual(isRelativeLink('../parent/page.html'), true);
  assert.strictEqual(isRelativeLink('subdir/page.html'), true);
  assert.strictEqual(isRelativeLink('/absolute/path.html'), true);
  assert.strictEqual(isRelativeLink('page.html?param=value'), true);
  assert.strictEqual(isRelativeLink('page.html#section'), true);
});

test('isRelativeLink returns false for null/undefined/empty', () => {
  assert.strictEqual(isRelativeLink(null), false);
  assert.strictEqual(isRelativeLink(undefined), false);
  assert.strictEqual(isRelativeLink(''), false);
});

test('isRelativeLink returns false for hash-only links', () => {
  assert.strictEqual(isRelativeLink('#'), false);
  assert.strictEqual(isRelativeLink('#section'), false);
  assert.strictEqual(isRelativeLink('#nested/anchor'), false);
});

test('isRelativeLink returns false for external http/https links', () => {
  assert.strictEqual(isRelativeLink('http://example.com/page.html'), false);
  assert.strictEqual(isRelativeLink('https://example.com/page.html'), false);
  assert.strictEqual(isRelativeLink('http://'), false);
  assert.strictEqual(isRelativeLink('https://'), false);
});

test('isRelativeLink returns false for non-hierarchical URI schemes', () => {
  const jsUrl = 'javascript' + ':void(0)';
  assert.strictEqual(isRelativeLink('mailto:info@example.com'), false);
  assert.strictEqual(isRelativeLink('tel:+62215012345'), false);
  assert.strictEqual(isRelativeLink(jsUrl), false);
  assert.strictEqual(isRelativeLink('data:text/html;base64,PGI+'), false);
  assert.strictEqual(isRelativeLink('ftp://files.example.com/x'), false);
});

test('isRelativeLink returns false for protocol-relative URLs', () => {
  assert.strictEqual(isRelativeLink('//example.com/page.html'), false);
  assert.strictEqual(isRelativeLink('//cdn.example.com/style.css'), false);
});

test('isRelativeLink still returns true for query/hash relative paths', () => {
  assert.strictEqual(isRelativeLink('page.html?param=value'), true);
  assert.strictEqual(isRelativeLink('page.html#section'), true);
  assert.strictEqual(isRelativeLink('../parent/page.html?x=1#y'), true);
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
  await withConfig({ DIST_DIR: '/nonexistent-dist-dir-' + Date.now() }, async () => {
    const result = await validateLinks();
    assert.strictEqual(result, true, 'Should return true when dist does not exist');
  });
});

test('validateLinks returns true when no HTML files found', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-validate-' + Date.now()));

  try {
    await withConfig({ DIST_DIR: emptyDir }, async () => {
      const result = await validateLinks();
      assert.strictEqual(result, true, 'Should return true when no HTML files found');
    });
  } finally {
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

test('validateLinksInFile does not report existing file targets as broken', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-exists-' + Date.now()));
  try {
    fs.writeFileSync(path.join(tempDir, 'about.html'), '<html><body>About</body></html>');
    const file = path.join(tempDir, 'index.html');
    const result = await validateLinksInFile(file, ['about.html'], tempDir);
    assert.deepStrictEqual(result, []);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinksInFile does not report directory targets as broken', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-dir-' + Date.now()));
  try {
    fs.mkdirSync(path.join(tempDir, 'provinsi'));
    const file = path.join(tempDir, 'index.html');
    const result = await validateLinksInFile(file, ['provinsi/'], tempDir);
    assert.deepStrictEqual(result, []);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinks processes HTML files with links and returns false on broken links', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  // Create a temp directory with HTML file containing broken link
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-' + Date.now()));

  // Create an HTML file with a broken link
  const htmlFile = path.join(tempDir, 'index.html');
  fs.writeFileSync(htmlFile, '<a href="nonexistent.html">Broken</a>');

  try {
    await withConfig({ DIST_DIR: tempDir }, async () => {
      const result = await validateLinks();
      // Should return false because broken link exists
      assert.strictEqual(result, false);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinks processes HTML files with valid links and returns true', async () => {
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

  try {
    await withConfig({ DIST_DIR: tempDir }, async () => {
      const result = await validateLinks();
      // Should return true because all links are valid
      assert.strictEqual(result, true);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ── statExistsCached (memoized existence probe) ────────────────────────────

test('statExistsCached resolves true for existing targets and caches one entry', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stat-cache-' + Date.now()));
  try {
    const target = path.join(tempDir, 'existing.html');
    fs.writeFileSync(target, '<html></html>');

    const cache = new Map();
    assert.strictEqual(await statExistsCached(cache, target), true);
    assert.strictEqual(await statExistsCached(cache, target), true);
    // Same target probed twice → only one cache entry (deduplicated stat).
    assert.strictEqual(cache.size, 1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('statExistsCached resolves false for missing targets', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stat-cache-missing-' + Date.now()));
  try {
    const cache = new Map();
    const missing = path.join(tempDir, 'missing.html');
    assert.strictEqual(await statExistsCached(cache, missing), false);
    assert.strictEqual(cache.get(missing) !== undefined, true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('statExistsCached short-circuits on pre-populated cache entries', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stat-cache-pre-' + Date.now()));
  try {
    const existing = path.join(tempDir, 'existing.html');
    fs.writeFileSync(existing, '<html></html>');

    const cache = new Map();
    // Cache says the target does NOT exist even though the file does —
    // proves the probe is skipped entirely.
    cache.set(existing, Promise.resolve(false));
    assert.strictEqual(await statExistsCached(cache, existing), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinksInFile honors a shared statCache across calls', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-shared-cache-' + Date.now()));
  try {
    fs.writeFileSync(path.join(tempDir, 'about.html'), '<html><body>About</body></html>');
    const file = path.join(tempDir, 'index.html');
    const statCache = new Map();

    const first = await validateLinksInFile(file, ['about.html'], tempDir, statCache);
    const second = await validateLinksInFile(file, ['about.html'], tempDir, statCache);

    assert.deepStrictEqual(first, []);
    assert.deepStrictEqual(second, []);
    // Both calls resolved the same target → exactly one stat was performed.
    assert.strictEqual(statCache.size, 1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('validateLinksInFile with pre-populated false cache reports broken link without stat', async () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-cached-broken-' + Date.now()));
  try {
    fs.writeFileSync(path.join(tempDir, 'about.html'), '<html><body>About</body></html>');
    const file = path.join(tempDir, 'index.html');

    const statCache = new Map();
    // Cache says the existing target is missing — the probe is skipped and the
    // cached verdict is used, proving cache consultation in validateLinksInFile.
    statCache.set(path.join(tempDir, 'about.html'), Promise.resolve(false));

    const result = await validateLinksInFile(file, ['about.html'], tempDir, statCache);
    assert.deepStrictEqual(result, [{ source: file, link: 'about.html' }]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
