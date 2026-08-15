'use strict';

const { getCssVariables } = require('./design-system');

const base = require('./styles/base');
const enrichment = require('./styles/enrichment');
const darkMode = require('./styles/dark-mode');
const print = require('./styles/print');
const homepage = require('./styles/homepage');
const badges = require('./styles/badges');
const homepageDark = require('./styles/homepage-dark');
const backToTop = require('./styles/back-to-top');
const search = require('./styles/search');
const error404 = require('./styles/error-404');
const comparison = require('./styles/comparison');

// Memoized CSS string — the CSS is static (design tokens never change at runtime),
// so we compute it once and cache it. This eliminates the template literal
// evaluation and string allocation on every build call.
//
// The stylesheet is composed from per-feature section modules under
// ./styles/ (see F008). Section order here defines the cascade order — do not
// reorder without checking the section comments for override intent.
let _cachedCss = null;

function generateSchoolPageStyles() {
  if (_cachedCss !== null) {
    return _cachedCss;
  }

  const css = `${getCssVariables()}

${base}${enrichment}${darkMode}${print}${homepage}${badges}${homepageDark}${backToTop}${search}${error404}${comparison}`;

  _cachedCss = css;
  return css;
}

module.exports = {
  generateSchoolPageStyles,
};
