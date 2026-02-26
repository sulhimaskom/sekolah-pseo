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

test('slugify returns untitled for special characters only', () => {
  assert.strictEqual(slugify('!@#$%'), 'untitled');
  assert.strictEqual(slugify('!!!'), 'untitled');
  assert.strictEqual(slugify('---'), 'untitled');
});

test('slugify handles numbers only', () => {
  assert.strictEqual(slugify('123'), '123');
  assert.strictEqual(slugify('456 789'), '456-789');
});

test('slugify handles whitespace-only input', () => {
  assert.strictEqual(slugify('   '), '');
  assert.strictEqual(slugify('\t\n'), '');
});
