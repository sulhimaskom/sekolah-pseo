/**
 * Shared footer component.
 * Extracted to eliminate duplicate footer HTML across all page templates.
 *
 * Usage:
 *   generateFooterHtml({ siteName: 'Sekolah PSEO' })
 *   generateFooterHtml({ siteName: T.SITE_NAME, extraContent: '<p class="footer-links">...</p>' })
 *
 * The comparison tray (FEAT-005) is injected after the footer so it is present
 * on every page type and survives navigation between static pages.
 */

'use strict';

const { generateComparisonTrayHtml, generateComparisonScript } = require('./comparison');

/**
 * Generate a consistent footer HTML block, followed by the shared comparison
 * tray widget and its client script.
 *
 * @param {Object} [options] - Footer configuration
 * @param {string} [options.siteName='Sekolah PSEO'] - Site name displayed in copyright
 * @param {string} [options.extraContent=''] - Additional HTML content injected after copyright line
 * @param {number} [options.year=new Date().getFullYear()] - Copyright year (injectable for deterministic tests)
 * @returns {string} Footer HTML string
 */
function generateFooterHtml(options = {}) {
  const siteName = options.siteName || 'Sekolah PSEO';
  const extraContent = options.extraContent || '';
  const year = options.year || new Date().getFullYear();

  return `
  <footer role="contentinfo">
    <p>&copy; ${year} ${siteName}. Data sekolah berasal dari Dapodik.</p>${extraContent}
  </footer>
  ${generateComparisonTrayHtml()}
  ${generateComparisonScript()}`;
}

module.exports = { generateFooterHtml };
