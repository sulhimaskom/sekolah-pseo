const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { generateSchoolPageStyles } = require('../src/presenters/styles');
const { DESIGN_TOKENS } = require('../src/presenters/design-system');

describe('generateSchoolPageStyles', () => {
  it('returns a string containing CSS', () => {
    const result = generateSchoolPageStyles();
    assert.ok(typeof result === 'string');
  });

  it('includes :root selector with CSS variables', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes(':root'));
    assert.ok(result.includes('--color-primary:'));
  });

  it('includes global box-sizing reset', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('box-sizing: border-box'));
    assert.ok(result.includes('margin: 0'));
    assert.ok(result.includes('padding: 0'));
  });

  it('includes html selector with base styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('html'));
    assert.ok(result.includes('font-size: var(--font-size-base)'));
    assert.ok(result.includes('line-height: var(--line-height-normal)'));
  });

  it('includes body selector with system font stack', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('body'));
    assert.ok(result.includes('-apple-system'));
    assert.ok(result.includes('sans-serif'));
  });

  it('includes skip link styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.skip-link'));
    assert.ok(result.includes('position: absolute'));
    assert.ok(result.includes('top: -3rem'));
  });

  it('skip link has focus styles that make it visible', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.skip-link:focus'));
    assert.ok(result.includes('top: var(--spacing-sm)'));
  });

  it('skip link includes focus outline for accessibility', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.skip-link:focus'));
    assert.ok(result.includes('outline'));
    assert.ok(result.includes('box-shadow'));
  });

  it('includes sr-only class for screen reader only content', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.sr-only'));
    assert.ok(result.includes('position: absolute'));
    assert.ok(result.includes('clip: rect'));
  });

  it('includes header styles with role="banner"', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('header[role="banner"]'));
    assert.ok(result.includes('border-bottom'));
  });

  it('header has sticky positioning', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('header[role="banner"]'));
    assert.ok(result.includes('position: sticky'));
    assert.ok(result.includes('top: 0'));
  });

  it('header has z-index for layer management', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('header[role="banner"]'));
    assert.ok(result.includes('z-index: var(--z-index-sticky)'));
  });

  it('includes navigation styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('nav[aria-label="Navigasi utama"]'));
    assert.ok(result.includes('display: flex'));
  });

  it('navigation links have transition', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('nav a'));
    assert.ok(result.includes('transition'));
  });

  it('navigation links have hover effect', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('nav a:hover'));
    assert.ok(result.includes('color: var(--color-primary)'));
  });

  it('navigation links have focus styles for accessibility', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('nav a:focus'));
    assert.ok(result.includes('outline'));
  });

  it('includes current page indicator styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('nav span[aria-current="page"]'));
    assert.ok(result.includes('font-weight'));
  });

  it('includes main content styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('main[role="main"]'));
    assert.ok(result.includes('max-width: 64rem'));
    assert.ok(result.includes('margin: 0 auto'));
  });

  it('includes article styles with card layout', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('article[aria-labelledby="school-name"]'));
    assert.ok(result.includes('border-radius'));
    assert.ok(result.includes('box-shadow'));
  });

  it('article has h1 styling', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('article h1'));
    assert.ok(result.includes('font-size: var(--font-size-3xl)'));
    assert.ok(result.includes('font-weight: var(--font-weight-bold)'));
  });

  it('includes section styles for school details', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('section[aria-labelledby="school-details"]'));
  });

  it('includes definition list styles for school details', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.school-details-list'));
    assert.ok(result.includes('display: grid'));
    assert.ok(result.includes('grid-template-columns'));
  });

  it('definition list term (dt) has label styling', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.school-details-list dt'));
    assert.ok(result.includes('font-weight: var(--font-weight-semibold)'));
    assert.ok(result.includes('color: var(--color-text-secondary)'));
  });

  it('definition list description (dd) has value styling', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.school-details-list dd'));
    assert.ok(result.includes('color: var(--color-text-primary)'));
    assert.ok(result.includes('word-break: break-word'));
  });

  it('includes footer styles with role="contentinfo"', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('footer[role="contentinfo"]'));
    assert.ok(result.includes('text-align: center'));
    assert.ok(result.includes('border-top'));
  });

  it('includes responsive breakpoints from design tokens', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes(`@media (min-width: ${DESIGN_TOKENS.breakpoints.md})`));
    assert.ok(result.includes(`@media (min-width: ${DESIGN_TOKENS.breakpoints.lg})`));
    assert.ok(result.includes(`@media (max-width: ${DESIGN_TOKENS.breakpoints.sm})`));
  });

  it('includes tablet breakpoint styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (min-width: 768px)'));
  });

  it('includes desktop breakpoint styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (min-width: 1024px)'));
  });

  it('includes mobile breakpoint styles', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (max-width: 640px)'));
  });

  it('mobile layout has single column grid', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (max-width: 640px)'));
    assert.ok(result.includes('.school-details-list'));
    assert.ok(result.includes('grid-template-columns: 1fr'));
  });

  it('desktop layout has two column grid with minmax', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (min-width: 1024px)'));
    assert.ok(result.includes('.school-details-list'));
    assert.ok(result.includes('minmax(200px, auto)'));
  });

  it('includes prefers-reduced-motion media query', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (prefers-reduced-motion: reduce)'));
  });

  it('prefers-reduced-motion sets very short durations', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('animation-duration: 0.01ms'));
    assert.ok(result.includes('transition-duration: 0.01ms'));
  });

  it('includes prefers-contrast media query', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (prefers-contrast: high)'));
  });

  it('high contrast mode increases focus outline width', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (prefers-contrast: high)'));
    assert.ok(result.includes('outline-width: 3px'));
  });

  it('high contrast mode boldens labels', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('@media (prefers-contrast: high)'));
    assert.ok(result.includes('.school-details-list dt'));
    assert.ok(result.includes('font-weight: var(--font-weight-bold)'));
  });

  it('uses design token variables throughout', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('var(--color-primary)'));
    assert.ok(result.includes('var(--spacing-md)'));
    assert.ok(result.includes('var(--font-size-base)'));
    assert.ok(result.includes('var(--transition-fast)'));
  });

  it('includes word-break for long URLs', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('.school-details-list dd'));
    assert.ok(result.includes('word-break: break-word'));
  });

  it('article h1 has border-bottom', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('article h1'));
    assert.ok(result.includes('border-bottom: 1px solid var(--color-border)'));
  });

  it('header has box-shadow for depth', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('header[role="banner"]'));
    assert.ok(result.includes('box-shadow: var(--shadow-sm)'));
  });

  it('article has box-shadow for card effect', () => {
    const result = generateSchoolPageStyles();
    assert.ok(result.includes('article[aria-labelledby="school-name"]'));
    assert.ok(result.includes('box-shadow: var(--shadow-md)'));
  });
});

describe('writeExternalStylesFile', () => {
  it('generates CSS content', () => {
    const css = generateSchoolPageStyles();

    assert.ok(typeof css === 'string');
    assert.ok(css.length > 0);
    assert.ok(css.includes(':root'));
    assert.ok(css.includes('--color-primary:'));
  });

  it('includes all essential CSS sections', () => {
    const css = generateSchoolPageStyles();

    assert.ok(css.includes('box-sizing: border-box'));
    assert.ok(css.includes('.skip-link'));
    assert.ok(css.includes('.sr-only'));
    assert.ok(css.includes('header[role="banner"]'));
    assert.ok(css.includes('.school-details-list'));
    assert.ok(css.includes('@media'));
  });

  it('includes responsive breakpoints', () => {
    const css = generateSchoolPageStyles();

    assert.ok(css.includes(`@media (min-width: ${DESIGN_TOKENS.breakpoints.md})`));
    assert.ok(css.includes(`@media (min-width: ${DESIGN_TOKENS.breakpoints.lg})`));
    assert.ok(css.includes(`@media (max-width: ${DESIGN_TOKENS.breakpoints.sm})`));
  });

  it('includes accessibility media queries', () => {
    const css = generateSchoolPageStyles();

    assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(css.includes('@media (prefers-contrast: high)'));
  });
});
