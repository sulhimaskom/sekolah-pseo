/**
 * Shared footer component.
 * Extracted to eliminate duplicate footer HTML across all page templates.
 *
 * Usage:
 *   generateFooterHtml({ siteName: 'Sekolah PSEO' })
 *   generateFooterHtml({ siteName: T.SITE_NAME, extraContent: '<p class="footer-links">...</p>' })
 */

'use strict';

// Hoisted constant - computed once at module load
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Generate a consistent footer HTML block.
 *
 * @param {Object} [options] - Footer configuration
 * @param {string} [options.siteName='Sekolah PSEO'] - Site name displayed in copyright
 * @param {string} [options.extraContent=''] - Additional HTML content injected after copyright line
 * @returns {string} Footer HTML string
 */
function generateFooterHtml(options = {}) {
  const siteName = options.siteName || 'Sekolah PSEO';
  const extraContent = options.extraContent || '';

  return `
  <footer role="contentinfo">
    <p>&copy; ${CURRENT_YEAR} ${siteName}. Data sekolah berasal dari Dapodik.</p>${extraContent}
  </footer>`;
}

module.exports = { generateFooterHtml };
