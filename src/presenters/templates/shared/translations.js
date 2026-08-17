/**
 * Shared pre-escaped translations object (`T`).
 *
 * All page templates access UI text through the same pre-escaped `T` object so
 * the access pattern stays consistent across templates (REFACTOR-009).
 *
 * Values are escaped ONCE at module load instead of at every use site — the
 * school-page template previously pre-escaped CONFIG.TEXT locally, while the
 * homepage wrapped each `CONFIG.TEXT` access in `escapeHtml()` at use-site.
 * Escaping once avoids ~38K redundant escapeHtml calls during a full build
 * (each escapeHtml does 5 regex replacements).
 *
 * New keys added to `CONFIG.TEXT` are automatically available in every template
 * as `T.<KEY>` (already HTML-escaped).
 */

'use strict';

const { escapeHtml } = require('../../../core/utils');
const CONFIG = require('../../../core/config');

// Pre-escape static CONFIG.TEXT values once at module load.
const T = Object.fromEntries(
  Object.entries(CONFIG.TEXT).map(([key, value]) => [key, escapeHtml(value)])
);

// Templates share this module-level instance across all page renders — freeze it
// so accidental mutation cannot leak between pages.
Object.freeze(T);

module.exports = { T };
