const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const CONFIG = require('../scripts/config');

test('CONFIG contains required path properties', () => {
  assert.ok(CONFIG.RAW_DATA_PATH, 'RAW_DATA_PATH should exist');
  assert.ok(CONFIG.SCHOOLS_CSV_PATH, 'SCHOOLS_CSV_PATH should exist');
  assert.ok(CONFIG.DIST_DIR, 'DIST_DIR should exist');
  assert.ok(CONFIG.DATA_DIR, 'DATA_DIR should exist');
  assert.ok(CONFIG.EXTERNAL_DIR, 'EXTERNAL_DIR should exist');
  assert.ok(CONFIG.ROOT_DIR, 'ROOT_DIR should exist');
});

test('CONFIG contains URL configuration', () => {
  assert.ok(CONFIG.SITE_URL, 'SITE_URL should exist');
  assert.strictEqual(typeof CONFIG.SITE_URL, 'string');
});

test('CONFIG contains concurrency limits', () => {
  assert.ok(
    typeof CONFIG.BUILD_CONCURRENCY_LIMIT === 'number',
    'BUILD_CONCURRENCY_LIMIT should be a number'
  );
  assert.ok(
    typeof CONFIG.VALIDATION_CONCURRENCY_LIMIT === 'number',
    'VALIDATION_CONCURRENCY_LIMIT should be a number'
  );
  assert.ok(CONFIG.BUILD_CONCURRENCY_LIMIT >= 1, 'BUILD_CONCURRENCY_LIMIT should be >= 1');
  assert.ok(CONFIG.BUILD_CONCURRENCY_LIMIT <= 1000, 'BUILD_CONCURRENCY_LIMIT should be <= 1000');
  assert.ok(
    CONFIG.VALIDATION_CONCURRENCY_LIMIT >= 1,
    'VALIDATION_CONCURRENCY_LIMIT should be >= 1'
  );
  assert.ok(
    CONFIG.VALIDATION_CONCURRENCY_LIMIT <= 500,
    'VALIDATION_CONCURRENCY_LIMIT should be <= 500'
  );
});

test('CONFIG contains sitemap limits', () => {
  assert.ok(
    typeof CONFIG.MAX_URLS_PER_SITEMAP === 'number',
    'MAX_URLS_PER_SITEMAP should be a number'
  );
  assert.ok(CONFIG.MAX_URLS_PER_SITEMAP >= 1, 'MAX_URLS_PER_SITEMAP should be >= 1');
  assert.ok(CONFIG.MAX_URLS_PER_SITEMAP <= 50000, 'MAX_URLS_PER_SITEMAP should be <= 50000');
});

test('CONFIG contains validatePath function', () => {
  assert.strictEqual(typeof CONFIG.validatePath, 'function');
});

test('validatePath returns true for paths inside base directory', () => {
  const baseDir = '/home/runner/work/sekolah-pseo/sekolah-pseo';
  const validPath = '/home/runner/work/sekolah-pseo/sekolah-pseo/scripts/utils.js';

  assert.strictEqual(CONFIG.validatePath(validPath, baseDir), true);
});

test('validatePath returns false for paths outside base directory', () => {
  const baseDir = '/home/runner/work/sekolah-pseo/sekolah-pseo';
  const invalidPath = '/etc/passwd';

  assert.strictEqual(CONFIG.validatePath(invalidPath, baseDir), false);
});

test('validatePath returns true for exact base directory', () => {
  const baseDir = '/home/runner/work/sekolah-pseo/sekolah-pseo';

  assert.strictEqual(CONFIG.validatePath(baseDir, baseDir), true);
});

test('validatePath handles path traversal attempts', () => {
  const baseDir = '/home/runner/work/sekolah-pseo/sekolah-pseo';
  const traversalPath = '/home/runner/work/sekolah-pseo/sekolah-pseo/../etc/passwd';

  assert.strictEqual(CONFIG.validatePath(traversalPath, baseDir), false);
});

test('validatePath handles nested path traversal', () => {
  const baseDir = '/home/runner/work/sekolah-pseo/sekolah-pseo';
  const nestedTraversal =
    '/home/runner/work/sekolah-pseo/sekolah-pseo/scripts/../../../../etc/passwd';

  assert.strictEqual(CONFIG.validatePath(nestedTraversal, baseDir), false);
});

test('CONFIG directories are absolute paths', () => {
  assert.ok(path.isAbsolute(CONFIG.ROOT_DIR), 'ROOT_DIR should be absolute');
  assert.ok(path.isAbsolute(CONFIG.DIST_DIR), 'DIST_DIR should be absolute');
  assert.ok(path.isAbsolute(CONFIG.DATA_DIR), 'DATA_DIR should be absolute');
  assert.ok(path.isAbsolute(CONFIG.EXTERNAL_DIR), 'EXTERNAL_DIR should be absolute');
  assert.ok(path.isAbsolute(CONFIG.RAW_DATA_PATH), 'RAW_DATA_PATH should be absolute');
  assert.ok(path.isAbsolute(CONFIG.SCHOOLS_CSV_PATH), 'SCHOOLS_CSV_PATH should be absolute');
});

test('CONFIG paths are within ROOT_DIR', () => {
  assert.ok(
    CONFIG.validatePath(CONFIG.DIST_DIR, CONFIG.ROOT_DIR),
    'DIST_DIR should be within ROOT_DIR'
  );
  assert.ok(
    CONFIG.validatePath(CONFIG.DATA_DIR, CONFIG.ROOT_DIR),
    'DATA_DIR should be within ROOT_DIR'
  );
  assert.ok(
    CONFIG.validatePath(CONFIG.EXTERNAL_DIR, CONFIG.ROOT_DIR),
    'EXTERNAL_DIR should be within ROOT_DIR'
  );
  assert.ok(
    CONFIG.validatePath(CONFIG.RAW_DATA_PATH, CONFIG.ROOT_DIR),
    'RAW_DATA_PATH should be within ROOT_DIR'
  );
});
