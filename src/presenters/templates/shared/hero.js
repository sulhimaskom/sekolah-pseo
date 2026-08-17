/**
 * Shared hero section component.
 *
 * The hero block (`.homepage-hero` with an h1 title, description paragraph and
 * `.hero-stats` stat items) was duplicated verbatim across four templates —
 * homepage, province, kabupaten and kecamatan. Extracting it into a single
 * component keeps the four heroes structurally identical (same classes, same
 * landmark semantics) and removes the drift risk when one hero is edited but
 * the others are not.
 *
 * Usage:
 *   generateHeroHtml({
 *     title: 'Provinsi Jawa Barat',
 *     description: 'Jelajahi daftar sekolah-sekolah di Provinsi Jawa Barat.',
 *     stats: [
 *       { value: '123', label: 'Total Sekolah' },
 *       { value: '9', label: 'Kabupaten/Kota' },
 *     ],
 *   })
 *
 * Title, description, stat values and labels must be pre-escaped by the caller
 * (matching the footer.js / navigation.js convention).
 *
 * The first line carries no leading indentation — templates embed the result
 * via a `${generateHeroHtml(...)}` placeholder whose own indentation pads the
 * opening `<div>`, matching the hand-written markup the component replaces.
 */

'use strict';

/**
 * Generate a hero section HTML block.
 *
 * @param {Object} options - Hero configuration
 * @param {string} options.title - Hero heading (h1), pre-escaped
 * @param {string} options.description - Hero description text, pre-escaped
 * @param {Array<{value: string, label: string}>} [options.stats=[]] - Stat items rendered inside `.hero-stats`
 * @returns {string} Hero HTML string
 */
function generateHeroHtml({ title, description, stats = [] }) {
  const statItems = stats
    .map(
      stat => `        <div class="stat-item">
          <span class="stat-value">${stat.value}</span>
          <span class="stat-label">${stat.label}</span>
        </div>`
    )
    .join('\n');

  return `<div class="homepage-hero">
      <h1>${title}</h1>
      <p class="hero-description">
        ${description}
      </p>
      <div class="hero-stats">
${statItems}
      </div>
    </div>`;
}

module.exports = { generateHeroHtml };
