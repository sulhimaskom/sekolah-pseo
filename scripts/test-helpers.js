'use strict';

/**
 * @module test-helpers
 * @description Shared utilities for the JavaScript test suite (scripts/*.test.js).
 *
 * Many modules read global configuration from the shared CONFIG singleton
 * (scripts/config.js). Mutating CONFIG directly inside a test body is brittle:
 * if the test fails before restoring the original value, every later test in
 * the same file observes the mutated state — order-dependent, cascading
 * failures. These helpers make CONFIG overrides exception-safe so tests stay
 * isolated regardless of pass/fail. (REFACTOR-002)
 */

const CONFIG = require('../src/core/config');

/**
 * Temporarily override CONFIG values for the duration of `fn`, restoring the
 * originals afterward — even if `fn` throws or rejects. Accepts partial
 * overrides so callers only touch the keys they need; all other CONFIG keys
 * are left untouched.
 *
 * @param {Object<string, *>} overrides - Partial CONFIG overrides, e.g. `{ DIST_DIR: '/tmp/x' }`
 * @param {Function} fn - Sync or async function to run while the overrides are applied
 * @returns {Promise<*>} The resolved value of `fn`
 * @example
 * await withConfig({ SCHOOLS_CSV_PATH: '/tmp/schools.csv' }, async () => {
 *   const result = await getDataFreshness();
 *   assert.strictEqual(result.exists, true);
 * });
 */
async function withConfig(overrides, fn) {
  const originalValues = new Map();
  for (const key of Object.keys(overrides)) {
    originalValues.set(key, CONFIG[key]);
    CONFIG[key] = overrides[key];
  }
  try {
    return await fn();
  } finally {
    for (const [key, originalValue] of originalValues) {
      CONFIG[key] = originalValue;
    }
  }
}

module.exports = { withConfig };
