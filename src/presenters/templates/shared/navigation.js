/**
 * Shared breadcrumb navigation component.
 * Extracted to eliminate duplicate breadcrumb pattern across all page templates.
 *
 * Usage:
 *   generateBreadcrumbHtml([
 *     { label: 'Beranda', url: '/' },
 *     { label: 'Province Name' }
 *   ])
 *
 * The last item is rendered as the current page (span with aria-current="page").
 * All other items are rendered as links.
 *
 * Labels and URLs must be pre-escaped by the caller.
 */

'use strict';

/**
 * Generate a breadcrumb navigation HTML block.
 *
 * @param {Array<{label: string, url?: string}>} items - Breadcrumb items.
 *   Last item should omit `url` to render as current page with aria-current="page".
 *   Labels must be HTML-escaped by the caller.
 * @returns {string} Navigation HTML string (empty string if items is empty/invalid)
 */
function generateBreadcrumbHtml(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const parts = items.map((item, index) => {
    if (index === items.length - 1) {
      return `      <span aria-current="page">${item.label}</span>`;
    }
    return `      <a href="${item.url || '/'}">${item.label}</a>`;
  });

  return `
  <nav aria-label="Navigasi utama">
${parts.join('<span aria-hidden="true"> / </span>\n')}
  </nav>`;
}

module.exports = { generateBreadcrumbHtml };
