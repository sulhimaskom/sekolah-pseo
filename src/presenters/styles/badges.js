'use strict';

const { DESIGN_TOKENS } = require('../design-system');

// School link badges (kecamatan page).
module.exports = `/* School link badges (for kecamatan page) */
.school-link-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  .homepage-hero {
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .homepage-hero h1 {
    font-size: var(--font-size-2xl);
  }

  .hero-description {
    font-size: var(--font-size-base);
  }

  .hero-stats {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .province-list {
    grid-template-columns: 1fr;
  }
}

`;
