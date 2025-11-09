/*
 * Simple slugify utility. Converts arbitrary strings (e.g. school names) into
 * URL‑safe slugs. This version handles basic ASCII transliteration and
 * replacement. For more advanced usage consider a library such as `slugify`
 * from npm.
 */

/**
 * Convert a string into a slug suitable for use in URLs. Steps:
 *  - Convert to lowercase
 *  - Replace accented characters with basic equivalents
 *  - Replace non‑alphanumeric characters with hyphens
 *  - Collapse multiple hyphens
 *  - Trim hyphens from start/end
 *
 * @param {string} input
 * @returns {string}
 */
function slugify(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Handle empty string case
  if (input.trim() === '') {
    return '';
  }
  
  // Cache the result of normalize to avoid repeated calls
  const normalized = input.toString().normalize('NFD');
  
  return normalized
    .replace(/\p{Diacritic}/gu, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'untitled';
}

module.exports = slugify;
