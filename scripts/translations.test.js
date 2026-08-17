const test = require('node:test');
const assert = require('node:assert');
const CONFIG = require('../src/core/config');
const { escapeHtml } = require('../src/core/utils');
const { T } = require('../src/presenters/templates/shared/translations');

test('T exposes every CONFIG.TEXT key', () => {
  const textKeys = Object.keys(CONFIG.TEXT);
  assert.ok(textKeys.length > 0, 'CONFIG.TEXT must have at least one key');
  for (const key of textKeys) {
    assert.ok(Object.hasOwn(T, key), `T missing CONFIG.TEXT key: ${key}`);
  }
});

test('T contains no keys beyond CONFIG.TEXT', () => {
  assert.deepStrictEqual(Object.keys(T).sort(), Object.keys(CONFIG.TEXT).sort());
});

test('T values are pre-escaped', () => {
  for (const [key, value] of Object.entries(CONFIG.TEXT)) {
    assert.strictEqual(T[key], escapeHtml(value), `T[${key}] was not pre-escaped`);
  }
});

test('T values are non-empty strings', () => {
  for (const [key, value] of Object.entries(T)) {
    assert.strictEqual(typeof value, 'string', `T[${key}] is not a string`);
    assert.ok(value.length > 0, `T[${key}] is empty`);
  }
});

test('T values render unescaped-safe in attribute context', () => {
  // Pre-escaping guarantees values are safe to interpolate into HTML attributes
  // and text content without a second escapeHtml call at the use site.
  for (const value of Object.values(T)) {
    assert.strictEqual(value.includes('"'), false, `T value contains a raw quote: ${value}`);
    assert.strictEqual(value.includes('<'), false, `T value contains a raw <: ${value}`);
    assert.strictEqual(value.includes('&'), false, `T value contains a raw &: ${value}`);
  }
});

test('T is frozen against accidental mutation', () => {
  // Templates share the module-level T instance — accidental mutation would leak
  // across page renders, so the object must be immutable.
  assert.ok(Object.isFrozen(T), 'T must be frozen');
});
