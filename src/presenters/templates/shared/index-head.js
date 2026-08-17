/**
 * Shared <head> block for index pages (province, kabupaten, kecamatan).
 *
 * The description / title / canonical / Open Graph block plus the stylesheet
 * link was duplicated verbatim across the three index templates. Extracting it
 * keeps the SEO meta block consistent (title, description and canonical URL
 * always stay in sync between the plain tags and their og: counterparts) and
 * removes the duplication from every index template.
 *
 * Usage:
 *   generateIndexPageHead({
 *     title: 'Daftar Sekolah di Provinsi Jawa Barat - Sekolah PSEO',
 *     description: 'Daftar sekolah di Provinsi Jawa Barat. …',
 *     canonicalUrl: 'https://example.com/provinsi/jawa-barat/',
 *   })
 *
 * All values must be pre-escaped by the caller (matching the footer.js /
 * navigation.js convention).
 */

'use strict';

/**
 * Generate the <head> block shared by index pages (after HTML_HEAD_PREFIX).
 *
 * @param {Object} options - Head configuration
 * @param {string} options.title - Page title (used for <title> and og:title), pre-escaped
 * @param {string} options.description - Meta description (used for description and og:description), pre-escaped
 * @param {string} options.canonicalUrl - Canonical URL (used for canonical and og:url), pre-escaped
 * @returns {string} Head block HTML string
 */
function generateIndexPageHead({ title, description, canonicalUrl }) {
  return `  <meta name="description" content="${description}" />
  <title>${title}</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />

  <link rel="stylesheet" href="/styles.css">`;
}

module.exports = { generateIndexPageHead };
