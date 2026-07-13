const test = require('node:test');
const assert = require('node:assert');
const {
  generateBackToTopHtml,
  generateBackToTopScript,
} = require('../src/presenters/templates/shared/back-to-top');

test('generateBackToTopHtml returns HTML with back-to-top class', () => {
  const html = generateBackToTopHtml();
  assert.ok(html.includes('back-to-top'));
  assert.ok(html.includes('Kembali ke atas'));
});

test('generateBackToTopHtml includes SVG icon', () => {
  const html = generateBackToTopHtml();
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('</svg>'));
  assert.ok(html.includes('polyline'));
});

test('generateBackToTopHtml includes aria-label for accessibility', () => {
  const html = generateBackToTopHtml();
  assert.ok(html.includes('aria-label'));
  assert.ok(html.includes('Kembali ke atas'));
});

test('generateBackToTopScript returns script tag', () => {
  const script = generateBackToTopScript();
  assert.ok(script.includes('<script>'));
  assert.ok(script.includes('</script>'));
});

test('generateBackToTopScript includes scroll handling logic', () => {
  const script = generateBackToTopScript();
  assert.ok(script.includes('scrollY'));
  assert.ok(script.includes('scrollTo'));
  assert.ok(script.includes('backToTop'));
  assert.ok(script.includes('addEventListener'));
});

test('generateBackToTopScript handles prefers-reduced-motion', () => {
  const script = generateBackToTopScript();
  assert.ok(script.includes('prefers-reduced-motion'));
  assert.ok(script.includes('matchMedia'));
});

test('generateBackToTopScript uses passive scroll listener', () => {
  const script = generateBackToTopScript();
  assert.ok(script.includes('passive: true'));
});
