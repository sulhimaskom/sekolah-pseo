/*
 * Simple slugify utility. Converts arbitrary strings (e.g. school names) into
 * URL‑safe slugs. This version handles basic ASCII transliteration and
 * replacement. For more advanced usage consider a library such as `slugify`
 * from npm.
 */

const CONFIG = require('./config');
const slugCache = new Map();
const MAX_CACHE_SIZE = CONFIG.CACHE_DEFAULTS.MAX_CACHE_SIZE;

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

  // Check cache first
  if (slugCache.has(input)) {
    return slugCache.get(input);
  }

  // Compute slug
  const normalized = input.toString().normalize('NFD');
  const slug =
    normalized
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'untitled';

  // Store in cache with size limit
  if (slugCache.size >= MAX_CACHE_SIZE) {
    const firstKey = slugCache.keys().next().value;
    slugCache.delete(firstKey);
  }
  slugCache.set(input, slug);

  return slug;
}

module.exports = slugify;
