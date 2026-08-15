'use strict';

// Dark mode support (prefers-color-scheme) for base school-page styles.
module.exports = `/* Dark mode support */
@media (prefers-color-scheme: dark) {
  html {
    color: var(--color-dark-text-primary);
    background-color: var(--color-dark-bg-primary);
  }

  body {
    background-color: var(--color-dark-bg-primary);
  }

  header[role="banner"] {
    background-color: var(--color-dark-bg-primary);
    border-bottom-color: var(--color-dark-border);
  }

  nav a {
    color: var(--color-dark-text-secondary);
  }

  nav a:hover {
    color: var(--color-primary);
    background-color: var(--color-dark-bg-accent);
  }

  nav span[aria-current="page"] {
    color: var(--color-dark-text-primary);
  }

  article[aria-labelledby="school-name"] {
    background-color: var(--color-dark-bg-secondary);
  }

  article h1 {
    color: var(--color-dark-text-primary);
    border-bottom-color: var(--color-dark-border);
  }

  .school-details-list dt {
    color: var(--color-dark-text-secondary);
  }

  .school-details-list dd {
    color: var(--color-dark-text-primary);
  }

  .badge-status {
    background-color: var(--color-dark-badge-status-bg);
    color: var(--color-dark-badge-status-text);
  }

  .badge-n {
    background-color: var(--color-dark-badge-n-bg);
    color: var(--color-dark-badge-n-text);
  }

  .badge-s {
    background-color: var(--color-dark-badge-s-bg);
    color: var(--color-dark-badge-s-text);
  }

  .badge-education {
    background-color: var(--color-dark-badge-education-bg);
    color: var(--color-dark-badge-education-text);
  }

  .empty-value {
    color: var(--color-dark-text-light);
  }

  footer[role="contentinfo"] {
    color: var(--color-dark-text-light);
    border-top-color: var(--color-dark-border);
  }

  .enrichment-card {
    background-color: var(--color-dark-bg-secondary);
    border-color: var(--color-dark-border);
  }

  .enrichment-extract {
    color: var(--color-dark-text-primary);
  }

  .enrichment-source {
    color: var(--color-dark-text-secondary);
  }

  .enrichment-source a {
    color: var(--color-dark-link);
  }

  .enrichment-badge {
    background-color: var(--color-dark-accent);
    color: var(--color-dark-text-inverse);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  nav a:focus,
  .skip-link:focus {
    outline-width: 3px;
  }

  .school-details-list dt {
    font-weight: var(--font-weight-bold);
  }
}

`;
