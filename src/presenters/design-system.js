const DESIGN_TOKENS = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryFocus: '#3b82f6',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      light: '#6b7280'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      accent: '#f3f4f6'
    },
    border: '#d1d5db',
    focus: '#2563eb',
    skipLink: {
      background: '#000000',
      text: '#ffffff'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(37, 99, 235, 0.3)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  },
  zIndex: {
    base: '1',
    dropdown: '10',
    sticky: '20',
    fixed: '100',
    modal: '1000'
  }
};

function getCssVariables() {
  const variables = {
    '--color-primary': DESIGN_TOKENS.colors.primary,
    '--color-primary-hover': DESIGN_TOKENS.colors.primaryHover,
    '--color-primary-focus': DESIGN_TOKENS.colors.primaryFocus,
    '--color-text-primary': DESIGN_TOKENS.colors.text.primary,
    '--color-text-secondary': DESIGN_TOKENS.colors.text.secondary,
    '--color-text-light': DESIGN_TOKENS.colors.text.light,
    '--color-bg-primary': DESIGN_TOKENS.colors.background.primary,
    '--color-bg-secondary': DESIGN_TOKENS.colors.background.secondary,
    '--color-bg-accent': DESIGN_TOKENS.colors.background.accent,
    '--color-border': DESIGN_TOKENS.colors.border,
    '--color-focus': DESIGN_TOKENS.colors.focus,
    '--spacing-xs': DESIGN_TOKENS.spacing.xs,
    '--spacing-sm': DESIGN_TOKENS.spacing.sm,
    '--spacing-md': DESIGN_TOKENS.spacing.md,
    '--spacing-lg': DESIGN_TOKENS.spacing.lg,
    '--spacing-xl': DESIGN_TOKENS.spacing.xl,
    '--spacing-2xl': DESIGN_TOKENS.spacing['2xl'],
    '--font-size-xs': DESIGN_TOKENS.typography.fontSize.xs,
    '--font-size-sm': DESIGN_TOKENS.typography.fontSize.sm,
    '--font-size-base': DESIGN_TOKENS.typography.fontSize.base,
    '--font-size-lg': DESIGN_TOKENS.typography.fontSize.lg,
    '--font-size-xl': DESIGN_TOKENS.typography.fontSize.xl,
    '--font-size-2xl': DESIGN_TOKENS.typography.fontSize['2xl'],
    '--font-size-3xl': DESIGN_TOKENS.typography.fontSize['3xl'],
    '--font-size-4xl': DESIGN_TOKENS.typography.fontSize['4xl'],
    '--font-weight-normal': DESIGN_TOKENS.typography.fontWeight.normal,
    '--font-weight-medium': DESIGN_TOKENS.typography.fontWeight.medium,
    '--font-weight-semibold': DESIGN_TOKENS.typography.fontWeight.semibold,
    '--font-weight-bold': DESIGN_TOKENS.typography.fontWeight.bold,
    '--line-height-tight': DESIGN_TOKENS.typography.lineHeight.tight,
    '--line-height-normal': DESIGN_TOKENS.typography.lineHeight.normal,
    '--line-height-relaxed': DESIGN_TOKENS.typography.lineHeight.relaxed,
    '--radius-sm': DESIGN_TOKENS.borderRadius.sm,
    '--radius-md': DESIGN_TOKENS.borderRadius.md,
    '--radius-lg': DESIGN_TOKENS.borderRadius.lg,
    '--shadow-sm': DESIGN_TOKENS.shadows.sm,
    '--shadow-md': DESIGN_TOKENS.shadows.md,
    '--shadow-lg': DESIGN_TOKENS.shadows.lg,
    '--shadow-focus': DESIGN_TOKENS.shadows.focus,
    '--transition-fast': DESIGN_TOKENS.transitions.fast,
    '--transition-normal': DESIGN_TOKENS.transitions.normal,
    '--transition-slow': DESIGN_TOKENS.transitions.slow,
    '--z-index-base': DESIGN_TOKENS.zIndex.base,
    '--z-index-dropdown': DESIGN_TOKENS.zIndex.dropdown,
    '--z-index-sticky': DESIGN_TOKENS.zIndex.sticky,
    '--z-index-fixed': DESIGN_TOKENS.zIndex.fixed,
    '--z-index-modal': DESIGN_TOKENS.zIndex.modal
  };

  let css = ':root {\n';
  for (const [key, value] of Object.entries(variables)) {
    css += `  ${key}: ${value};\n`;
  }
  css += '}';

  return css;
}

module.exports = {
  DESIGN_TOKENS,
  getCssVariables
};
