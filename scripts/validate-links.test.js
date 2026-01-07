const test = require('node:test');
const assert = require('node:assert');
const { extractLinks } = require('./validate-links');

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
