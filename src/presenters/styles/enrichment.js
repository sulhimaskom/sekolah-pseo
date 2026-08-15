'use strict';

const { DESIGN_TOKENS } = require('../design-system');

// Enrichment section styles (enrichment cards/grid on school pages).
module.exports = `/* Enrichment section styles */
.enrichment-section {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.enrichment-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.enrichment-extract {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.enrichment-source {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.enrichment-source a {
  color: var(--color-link);
  text-decoration: none;
}

.enrichment-source a:hover {
  text-decoration: underline;
}

.enrichment-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
}

.empty-value {
  color: var(--color-text-light);
  font-style: italic;
}

.details-group {
  display: contents;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  margin-left: var(--spacing-sm);
  background-color: var(--color-bg-accent);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  position: relative;
  vertical-align: middle;
}

.btn-copy:hover {
  background-color: var(--color-border);
  color: var(--color-primary);
}

.btn-copy:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.copy-feedback {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-0.5rem) scale(0.9);
  background-color: var(--color-text-primary);
  color: var(--color-bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-fast) ease, transform var(--transition-fast) cubic-bezier(0.34, 1.56, 0.64, 1), visibility var(--transition-fast);
  pointer-events: none;
  box-shadow: var(--shadow-md);
  z-index: var(--z-index-dropdown);
}

.btn-copy.show .copy-feedback {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-0.25rem) scale(1);
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.md}) {
  .details-group {
    display: contents;
  }
}

footer[role="contentinfo"] {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-2xl);
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.md}) {
  main[role="main"] {
    padding: var(--spacing-2xl) var(--spacing-xl);
  }

  article h1 {
    font-size: var(--font-size-4xl);
  }

  .school-details-list {
    gap: var(--spacing-md) var(--spacing-xl);
  }

  .school-details-list dt {
    font-size: var(--font-size-base);
  }

  .school-details-list dd {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.lg}) {
  .school-details-list {
    grid-template-columns: minmax(200px, auto) 1fr;
  }
}

@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  header[role="banner"] {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  main[role="main"] {
    padding: var(--spacing-md) var(--spacing-sm);
  }

  article h1 {
    font-size: var(--font-size-2xl);
  }

  section[aria-labelledby="school-details"] {
    padding: var(--spacing-md);
  }

  .school-details-list {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .school-details-list dt {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
}

`;
