const test = require('node:test');
const assert = require('node:assert');
const { generateIndexPageHead } = require('../src/presenters/templates/shared/index-head');

const HEAD = {
  title: 'Daftar Sekolah di Provinsi Jawa Barat - Sekolah PSEO',
  description: 'Daftar sekolah di Provinsi Jawa Barat.',
  canonicalUrl: 'https://example.com/provinsi/jawa-barat/',
};

test('generateIndexPageHead includes meta description', () => {
  const html = generateIndexPageHead(HEAD);
  assert.ok(html.includes('meta name="description"'));
  assert.ok(html.includes('Daftar sekolah di Provinsi Jawa Barat.'));
});

test('generateIndexPageHead includes page title', () => {
  const html = generateIndexPageHead(HEAD);
  assert.ok(html.includes('<title>'));
  assert.ok(html.includes('Daftar Sekolah di Provinsi Jawa Barat - Sekolah PSEO'));
  assert.ok(html.includes('</title>'));
});

test('generateIndexPageHead includes canonical URL', () => {
  const html = generateIndexPageHead(HEAD);
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes('https://example.com/provinsi/jawa-barat/'));
});

test('generateIndexPageHead includes Open Graph tags', () => {
  const html = generateIndexPageHead(HEAD);
  assert.ok(html.includes('property="og:title"'));
  assert.ok(html.includes('property="og:description"'));
  assert.ok(html.includes('property="og:type" content="website"'));
  assert.ok(html.includes('property="og:url"'));
});

test('generateIndexPageHead keeps og tags in sync with plain tags', () => {
  const html = generateIndexPageHead(HEAD);
  // og:title mirrors <title>, og:description mirrors meta description, og:url mirrors canonical
  const titlePos = html.indexOf('<title>');
  const ogTitlePos = html.indexOf('property="og:title"');
  assert.ok(ogTitlePos > titlePos);
  const descPos = html.indexOf('meta name="description"');
  const ogDescPos = html.indexOf('property="og:description"');
  assert.ok(ogDescPos > descPos);
  const canonicalPos = html.indexOf('rel="canonical"');
  const ogUrlPos = html.indexOf('property="og:url"');
  assert.ok(ogUrlPos > canonicalPos);
});

test('generateIndexPageHead includes stylesheet link', () => {
  const html = generateIndexPageHead(HEAD);
  assert.ok(html.includes('<link rel="stylesheet" href="/styles.css">'));
});

test('generateIndexPageHead does not escape values (caller pre-escapes)', () => {
  const html = generateIndexPageHead({
    title: 'Daftar Sekolah di &lt;X&gt; - Sekolah PSEO',
    description: 'Desc &amp; more',
    canonicalUrl: 'https://example.com/&amp;path/',
  });
  assert.ok(html.includes('Daftar Sekolah di &lt;X&gt; - Sekolah PSEO'));
  assert.ok(html.includes('Desc &amp; more'));
  assert.ok(html.includes('https://example.com/&amp;path/'));
});
