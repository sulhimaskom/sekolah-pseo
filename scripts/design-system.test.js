const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { DESIGN_TOKENS, getCssVariables } = require('../src/presenters/design-system');

describe('DESIGN_TOKENS', () => {
  it('contains colors object with primary and text colors', () => {
    assert.ok(DESIGN_TOKENS.colors);
    assert.strictEqual(typeof DESIGN_TOKENS.colors.primary, 'string');
    assert.strictEqual(DESIGN_TOKENS.colors.primary, '#2563eb');
    assert.ok(DESIGN_TOKENS.colors.text);
    assert.ok(DESIGN_TOKENS.colors.text.primary);
    assert.ok(DESIGN_TOKENS.colors.text.secondary);
    assert.ok(DESIGN_TOKENS.colors.text.light);
  });

  it('contains background colors', () => {
    assert.ok(DESIGN_TOKENS.colors.background);
    assert.ok(DESIGN_TOKENS.colors.background.primary);
    assert.ok(DESIGN_TOKENS.colors.background.secondary);
    assert.ok(DESIGN_TOKENS.colors.background.accent);
  });

  it('contains spacing tokens', () => {
    assert.ok(DESIGN_TOKENS.spacing);
    assert.strictEqual(DESIGN_TOKENS.spacing.xs, '0.25rem');
    assert.strictEqual(DESIGN_TOKENS.spacing.sm, '0.5rem');
    assert.strictEqual(DESIGN_TOKENS.spacing.md, '1rem');
    assert.strictEqual(DESIGN_TOKENS.spacing.lg, '1.5rem');
    assert.strictEqual(DESIGN_TOKENS.spacing.xl, '2rem');
    assert.strictEqual(DESIGN_TOKENS.spacing['2xl'], '3rem');
  });

  it('contains typography tokens', () => {
    assert.ok(DESIGN_TOKENS.typography);
    assert.ok(DESIGN_TOKENS.typography.fontSize);
    assert.ok(DESIGN_TOKENS.typography.fontWeight);
    assert.ok(DESIGN_TOKENS.typography.lineHeight);
  });

  it('contains font size tokens from xs to 4xl', () => {
    const { fontSize } = DESIGN_TOKENS.typography;
    assert.strictEqual(fontSize.xs, '0.75rem');
    assert.strictEqual(fontSize.sm, '0.875rem');
    assert.strictEqual(fontSize.base, '1rem');
    assert.strictEqual(fontSize.lg, '1.125rem');
    assert.strictEqual(fontSize.xl, '1.25rem');
    assert.strictEqual(fontSize['2xl'], '1.5rem');
    assert.strictEqual(fontSize['3xl'], '1.875rem');
    assert.strictEqual(fontSize['4xl'], '2.25rem');
  });

  it('contains font weight tokens', () => {
    const { fontWeight } = DESIGN_TOKENS.typography;
    assert.strictEqual(fontWeight.normal, '400');
    assert.strictEqual(fontWeight.medium, '500');
    assert.strictEqual(fontWeight.semibold, '600');
    assert.strictEqual(fontWeight.bold, '700');
  });

  it('contains line height tokens', () => {
    const { lineHeight } = DESIGN_TOKENS.typography;
    assert.strictEqual(lineHeight.tight, '1.25');
    assert.strictEqual(lineHeight.normal, '1.5');
    assert.strictEqual(lineHeight.relaxed, '1.75');
  });

  it('contains border radius tokens', () => {
    assert.ok(DESIGN_TOKENS.borderRadius);
    assert.strictEqual(DESIGN_TOKENS.borderRadius.sm, '0.25rem');
    assert.strictEqual(DESIGN_TOKENS.borderRadius.md, '0.375rem');
    assert.strictEqual(DESIGN_TOKENS.borderRadius.lg, '0.5rem');
    assert.strictEqual(DESIGN_TOKENS.borderRadius.full, '9999px');
  });

  it('contains shadow tokens', () => {
    assert.ok(DESIGN_TOKENS.shadows);
    assert.ok(DESIGN_TOKENS.shadows.sm);
    assert.ok(DESIGN_TOKENS.shadows.md);
    assert.ok(DESIGN_TOKENS.shadows.lg);
    assert.ok(DESIGN_TOKENS.shadows.focus);
  });

  it('contains responsive breakpoints', () => {
    assert.ok(DESIGN_TOKENS.breakpoints);
    assert.strictEqual(DESIGN_TOKENS.breakpoints.sm, '640px');
    assert.strictEqual(DESIGN_TOKENS.breakpoints.md, '768px');
    assert.strictEqual(DESIGN_TOKENS.breakpoints.lg, '1024px');
    assert.strictEqual(DESIGN_TOKENS.breakpoints.xl, '1280px');
  });

  it('contains transition duration tokens', () => {
    assert.ok(DESIGN_TOKENS.transitions);
    assert.strictEqual(DESIGN_TOKENS.transitions.fast, '150ms');
    assert.strictEqual(DESIGN_TOKENS.transitions.normal, '200ms');
    assert.strictEqual(DESIGN_TOKENS.transitions.slow, '300ms');
  });

  it('contains z-index scale tokens', () => {
    assert.ok(DESIGN_TOKENS.zIndex);
    assert.strictEqual(DESIGN_TOKENS.zIndex.base, '1');
    assert.strictEqual(DESIGN_TOKENS.zIndex.dropdown, '10');
    assert.strictEqual(DESIGN_TOKENS.zIndex.sticky, '20');
    assert.strictEqual(DESIGN_TOKENS.zIndex.fixed, '100');
    assert.strictEqual(DESIGN_TOKENS.zIndex.modal, '1000');
  });

  it('contains primary hover and focus colors', () => {
    assert.strictEqual(DESIGN_TOKENS.colors.primaryHover, '#1d4ed8');
    assert.strictEqual(DESIGN_TOKENS.colors.primaryFocus, '#3b82f6');
  });

  it('contains focus color', () => {
    assert.strictEqual(DESIGN_TOKENS.colors.focus, '#2563eb');
  });

  it('contains border color', () => {
    assert.strictEqual(DESIGN_TOKENS.colors.border, '#d1d5db');
  });

  it('contains skip link colors', () => {
    assert.ok(DESIGN_TOKENS.colors.skipLink);
    assert.strictEqual(DESIGN_TOKENS.colors.skipLink.background, '#000000');
    assert.strictEqual(DESIGN_TOKENS.colors.skipLink.text, '#ffffff');
  });
});

describe('getCssVariables', () => {
  it('returns a string containing :root selector', () => {
    const result = getCssVariables();
    assert.ok(typeof result === 'string');
    assert.ok(result.includes(':root'));
  });

  it('includes color variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--color-primary:'));
    assert.ok(result.includes('--color-text-primary:'));
    assert.ok(result.includes('--color-bg-primary:'));
  });

  it('includes spacing variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--spacing-xs:'));
    assert.ok(result.includes('--spacing-md:'));
    assert.ok(result.includes('--spacing-xl:'));
  });

  it('includes font size variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--font-size-xs:'));
    assert.ok(result.includes('--font-size-base:'));
    assert.ok(result.includes('--font-size-4xl:'));
  });

  it('includes font weight variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--font-weight-normal:'));
    assert.ok(result.includes('--font-weight-bold:'));
  });

  it('includes line height variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--line-height-tight:'));
    assert.ok(result.includes('--line-height-normal:'));
    assert.ok(result.includes('--line-height-relaxed:'));
  });

  it('includes border radius variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--radius-sm:'));
    assert.ok(result.includes('--radius-md:'));
    assert.ok(result.includes('--radius-lg:'));
  });

  it('includes shadow variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--shadow-sm:'));
    assert.ok(result.includes('--shadow-md:'));
    assert.ok(result.includes('--shadow-lg:'));
    assert.ok(result.includes('--shadow-focus:'));
  });

  it('includes transition variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--transition-fast:'));
    assert.ok(result.includes('--transition-normal:'));
    assert.ok(result.includes('--transition-slow:'));
  });

  it('includes z-index variables', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--z-index-base:'));
    assert.ok(result.includes('--z-index-dropdown:'));
    assert.ok(result.includes('--z-index-sticky:'));
    assert.ok(result.includes('--z-index-fixed:'));
    assert.ok(result.includes('--z-index-modal:'));
  });

  it('includes primary color variants', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--color-primary-hover:'));
    assert.ok(result.includes('--color-primary-focus:'));
  });

  it('includes text color variants', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--color-text-secondary:'));
    assert.ok(result.includes('--color-text-light:'));
  });

  it('includes background color variants', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--color-bg-secondary:'));
    assert.ok(result.includes('--color-bg-accent:'));
  });

  it('includes border and focus colors', () => {
    const result = getCssVariables();
    assert.ok(result.includes('--color-border:'));
    assert.ok(result.includes('--color-focus:'));
  });

  it('has correct CSS syntax with semicolons', () => {
    const result = getCssVariables();
    assert.match(result, /--[\w-]+:\s*[^;]+;/);
  });

  it('properly closes :root block with closing brace', () => {
    const result = getCssVariables();
    assert.ok(result.includes('}'));
  });

  it('includes newline after each variable declaration', () => {
    const result = getCssVariables();
    assert.ok(result.includes(';\n'));
  });

  it('uses correct color values from DESIGN_TOKENS', () => {
    const result = getCssVariables();
    assert.ok(result.includes('#2563eb'));
    assert.ok(result.includes('#111827'));
    assert.ok(result.includes('#d1d5db'));
  });

  it('uses correct spacing values from DESIGN_TOKENS', () => {
    const result = getCssVariables();
    assert.ok(result.includes('0.25rem'));
    assert.ok(result.includes('1rem'));
    assert.ok(result.includes('3rem'));
  });
});
