'use strict';

// Dark mode support for homepage styles.
module.exports = `/* Dark mode support for homepage */
@media (prefers-color-scheme: dark) {
  .homepage-hero {
    background: linear-gradient(135deg, var(--color-dark-bg-secondary) 0%, var(--color-dark-bg-accent) 100%);
  }

  .homepage-hero h1 {
    color: var(--color-dark-text-primary);
  }

  .hero-description {
    color: var(--color-dark-text-secondary);
  }

  .stat-value {
    color: var(--color-primary-focus);
  }

  .stat-label {
    color: var(--color-dark-text-secondary);
  }

  .section-title {
    color: var(--color-dark-text-primary);
  }

  .section-description {
    color: var(--color-dark-text-secondary);
  }

  .province-link {
    background-color: var(--color-dark-bg-secondary);
    border-color: var(--color-dark-border);
  }

  .province-link:hover {
    border-color: var(--color-primary);
  }

  .province-name {
    color: var(--color-dark-text-primary);
  }

  .province-count {
    color: var(--color-dark-text-secondary);
    background-color: var(--color-dark-bg-accent);
  }
}

`;
