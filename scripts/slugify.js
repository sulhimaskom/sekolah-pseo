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
  // Handle null and undefined inputs
  if (input === null || input === undefined) {
    return '';
  }
  
  // Handle non-string inputs by returning empty string (as per test expectation)
  if (typeof input !== 'string') {
    return '';
  }
  
  // Handle empty string case
  if (input.trim() === '') {
    return '';
  }
  
  try {
    // Cache the result of normalize to avoid repeated calls
    const normalized = input.toString().normalize('NFD');
    
    return normalized
      .replace(/\p{Diacritic}/gu, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'untitled';
  } catch (error) {
    // Fallback for environments that don't support normalize or regex features
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'untitled';
  }
}

module.exports = slugify;
