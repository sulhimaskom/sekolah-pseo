const test = require('node:test');
const assert = require('node:assert');
const { generateHeroHtml } = require('../src/presenters/templates/shared/hero');

test('generateHeroHtml returns hero section with homepage-hero class', () => {
  const html = generateHeroHtml({ title: 'Jawa Barat', description: 'Daftar sekolah.' });
  assert.ok(html.includes('<div class="homepage-hero">'));
  assert.ok(html.includes('</div>'));
});

test('generateHeroHtml includes title as h1', () => {
  const html = generateHeroHtml({ title: 'Provinsi Jawa Barat', description: 'Daftar sekolah.' });
  assert.ok(html.includes('<h1>Provinsi Jawa Barat</h1>'));
});

test('generateHeroHtml includes description in hero-description paragraph', () => {
  const html = generateHeroHtml({
    title: 'Jawa Barat',
    description: 'Jelajahi daftar sekolah-sekolah di Jawa Barat.',
  });
  assert.ok(html.includes('hero-description'));
  assert.ok(html.includes('Jelajahi daftar sekolah-sekolah di Jawa Barat.'));
});

test('generateHeroHtml renders stat items with value and label', () => {
  const html = generateHeroHtml({
    title: 'Jawa Barat',
    description: 'Daftar sekolah.',
    stats: [{ value: '1.234', label: 'Total Sekolah' }],
  });
  assert.ok(html.includes('hero-stats'));
  assert.ok(html.includes('stat-item'));
  assert.ok(html.includes('stat-value'));
  assert.ok(html.includes('stat-label'));
  assert.ok(html.includes('>1.234<'));
  assert.ok(html.includes('>Total Sekolah<'));
});

test('generateHeroHtml renders multiple stat items', () => {
  const html = generateHeroHtml({
    title: 'Jawa Barat',
    description: 'Daftar sekolah.',
    stats: [
      { value: '123', label: 'Total Sekolah' },
      { value: '9', label: 'Kabupaten/Kota' },
    ],
  });
  const statItemCount = html.split('class="stat-item"').length - 1;
  assert.strictEqual(statItemCount, 2);
  assert.ok(html.includes('>9<'));
  assert.ok(html.includes('>Kabupaten/Kota<'));
});

test('generateHeroHtml handles empty stats array', () => {
  const html = generateHeroHtml({ title: 'Jawa Barat', description: 'Daftar sekolah.', stats: [] });
  assert.ok(html.includes('hero-stats'));
  const statItemCount = html.split('class="stat-item"').length - 1;
  assert.strictEqual(statItemCount, 0);
});

test('generateHeroHtml defaults stats to empty array', () => {
  const html = generateHeroHtml({ title: 'Jawa Barat', description: 'Daftar sekolah.' });
  const statItemCount = html.split('class="stat-item"').length - 1;
  assert.strictEqual(statItemCount, 0);
});

test('generateHeroHtml preserves hero landmark structure', () => {
  const html = generateHeroHtml({
    title: 'Jawa Barat',
    description: 'Daftar sekolah.',
    stats: [{ value: '1', label: 'Total Sekolah' }],
  });
  // h1 must come before the description, which comes before the stats
  const h1Pos = html.indexOf('<h1>');
  const descPos = html.indexOf('hero-description');
  const statsPos = html.indexOf('hero-stats');
  assert.ok(h1Pos !== -1 && descPos > h1Pos && statsPos > descPos);
});

test('generateHeroHtml does not escape values (caller pre-escapes)', () => {
  const html = generateHeroHtml({
    title: 'Provinsi &lt;script&gt;',
    description: 'Desc &amp; more',
    stats: [{ value: '1', label: 'Total &amp; Sekolah' }],
  });
  assert.ok(html.includes('>Provinsi &lt;script&gt;<'));
  assert.ok(html.includes('Desc &amp; more'));
  assert.ok(html.includes('>Total &amp; Sekolah<'));
});
