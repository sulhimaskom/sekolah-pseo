'use strict';

/**
 * @module test-helpers.test
 * @description Unit tests for the shared test-helpers module (withConfig).
 *
 * withConfig() makes CONFIG singleton mutation exception-safe: overrides are
 * applied for the duration of a callback and restored even when the callback
 * throws/rejects. These tests verify the contract so test isolation doesn't
 * regress. (REFACTOR-002)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const CONFIG = require('../src/core/config');
const { withConfig } = require('./test-helpers');

describe('withConfig', () => {
  test('applies overrides and restores the original value after the callback', async () => {
    const original = CONFIG.DIST_DIR;
    const override = '/tmp/with-config-test-dist';

    let observedDuringCallback;
    await withConfig({ DIST_DIR: override }, () => {
      observedDuringCallback = CONFIG.DIST_DIR;
    });

    assert.strictEqual(
      observedDuringCallback,
      override,
      'override should be visible inside callback'
    );
    assert.strictEqual(
      CONFIG.DIST_DIR,
      original,
      'original value should be restored after callback'
    );
  });

  test('restores the original value even when the callback throws', async () => {
    const original = CONFIG.SCHOOLS_CSV_PATH;
    const override = '/nonexistent/path/schools.csv';

    await assert.rejects(
      () =>
        withConfig({ SCHOOLS_CSV_PATH: override }, () => {
          throw new Error('boom');
        }),
      /boom/
    );

    assert.strictEqual(
      CONFIG.SCHOOLS_CSV_PATH,
      original,
      'original value should be restored after throw'
    );
  });

  test('restores the original value even when the callback rejects', async () => {
    const original = CONFIG.SCHOOLS_CSV_PATH;
    const override = '/nonexistent/path/schools.csv';

    await assert.rejects(
      () =>
        withConfig({ SCHOOLS_CSV_PATH: override }, async () => {
          throw new Error('async boom');
        }),
      /async boom/
    );

    assert.strictEqual(
      CONFIG.SCHOOLS_CSV_PATH,
      original,
      'original value should be restored after rejection'
    );
  });

  test('resolves to the callback result', async () => {
    const result = await withConfig({}, async () => 'callback-result');
    assert.strictEqual(result, 'callback-result');
  });

  test('supports synchronous callbacks', async () => {
    const original = CONFIG.DIST_DIR;
    const override = '/tmp/with-config-sync';

    await withConfig({ DIST_DIR: override }, () => {
      assert.strictEqual(CONFIG.DIST_DIR, override);
    });

    assert.strictEqual(
      CONFIG.DIST_DIR,
      original,
      'original value should be restored after sync callback'
    );
  });

  test('applies and restores multiple overrides', async () => {
    const originalDist = CONFIG.DIST_DIR;
    const originalMax = CONFIG.MAX_URLS_PER_SITEMAP;

    await withConfig({ DIST_DIR: '/tmp/a', MAX_URLS_PER_SITEMAP: 3 }, () => {
      assert.strictEqual(CONFIG.DIST_DIR, '/tmp/a');
      assert.strictEqual(CONFIG.MAX_URLS_PER_SITEMAP, 3);
    });

    assert.strictEqual(CONFIG.DIST_DIR, originalDist);
    assert.strictEqual(CONFIG.MAX_URLS_PER_SITEMAP, originalMax);
  });

  test('leaves non-overridden CONFIG keys untouched', async () => {
    const originalRoot = CONFIG.ROOT_DIR;

    await withConfig({ DIST_DIR: '/tmp/touch-test' }, () => {
      assert.strictEqual(CONFIG.ROOT_DIR, originalRoot, 'non-overridden key should keep its value');
    });

    assert.strictEqual(CONFIG.ROOT_DIR, originalRoot);
  });

  test('restores each key independently when a later override is exceptional', async () => {
    const originalRoot = CONFIG.ROOT_DIR;
    const originalDist = CONFIG.DIST_DIR;

    await assert.rejects(
      () =>
        withConfig({ ROOT_DIR: '/tmp/root-a', DIST_DIR: '/tmp/dist-a' }, () => {
          throw new Error('multi-key boom');
        }),
      /multi-key boom/
    );

    assert.strictEqual(CONFIG.ROOT_DIR, originalRoot);
    assert.strictEqual(CONFIG.DIST_DIR, originalDist);
  });
});
