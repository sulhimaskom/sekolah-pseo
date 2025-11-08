/*
 * Simple slugify utility. Converts arbitrary strings (e.g. school names) into
 * URL‑safe slugs. This version handles basic ASCII transliteration and
 * replacement. For more advanced usage consider a library such as `slugify`
 * from npm.
 */

// Cache for slugify results to improve performance
const slugifyCache = new Map();

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
  // Handle non-string inputs
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  // Check cache first
  if (slugifyCache.has(input)) {
    return slugifyCache.get(input);
  }
  
  const result = input
    .toString()
    .normalize('NFD') // split accented characters into base + diacritic
    .replace(/\p{Diacritic}/gu, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '');
  
  // Cache the result (limit cache size to prevent memory issues)
  if (slugifyCache.size < 10000) {
    slugifyCache.set(input, result);
  }
  
  return result;
}

module.exports = slugify;
