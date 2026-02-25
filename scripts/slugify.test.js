const test = require('node:test');
const assert = require('node:assert');
const slugify = require('../scripts/slugify');

test('slugify converts string to lowercase', () => {
  assert.strictEqual(slugify('Hello World'), 'hello-world');
});

test('slugify replaces spaces with hyphens', () => {
  assert.strictEqual(slugify('hello world'), 'hello-world');
});

test('slugify removes special characters', () => {
  assert.strictEqual(slugify('hello@world!'), 'hello-world');
});

test('slugify handles accented characters', () => {
  assert.strictEqual(slugify('café'), 'cafe');
});

test('slugify handles empty string', () => {
  assert.strictEqual(slugify(''), '');
});

test('slugify handles non-string input', () => {
  assert.strictEqual(slugify(null), '');
  assert.strictEqual(slugify(undefined), '');
  assert.strictEqual(slugify(123), '');
});
