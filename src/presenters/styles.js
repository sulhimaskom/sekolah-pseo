const { getCssVariables, DESIGN_TOKENS } = require('./design-system');
const { safeWriteFile } = require('../../scripts/fs-safe');
const path = require('path');

function generateSchoolPageStyles() {
  return `${getCssVariables()}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

.skip-link {
  position: absolute;
  top: -3rem;
  left: var(--spacing-sm);
  background-color: var(--color-skip-link-background, #000);
  color: var(--color-skip-link-text, #fff);
  padding: var(--spacing-sm) var(--spacing-md);
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: var(--z-index-fixed);
  transition: top var(--transition-fast) ease-in-out;
  font-weight: var(--font-weight-medium);
}

.skip-link:focus {
  top: var(--spacing-sm);
  outline: var(--shadow-focus);
  box-shadow: var(--shadow-focus);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

header[role="banner"] {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  box-shadow: var(--shadow-sm);
}

nav[aria-label="Navigasi utama"] {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
}

nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast) ease;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

nav a:hover {
  color: var(--color-primary);
  background-color: var(--color-bg-accent);
}

nav a:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

nav a:focus:not(:focus-visible) {
  outline: none;
}

nav a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

nav span[aria-current="page"] {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-xs) var(--spacing-sm);
}

main[role="main"] {
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

article[aria-labelledby="school-name"] {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

article h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  margin: 0;
}

section[aria-labelledby="school-details"] {
  padding: var(--spacing-lg);
}

.school-details-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-md) var(--spacing-lg);
  margin: 0;
}

.school-details-list dt {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) 0;
}

.school-details-list dd {
  margin: 0;
  padding: var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  word-break: break-word;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
}

.badge-status {
  background-color: var(--color-badge-status-bg);
  color: var(--color-badge-status-text);
}

.badge-n {
  background-color: var(--color-badge-n-bg);
  color: var(--color-badge-n-text);
}

.badge-s {
  background-color: var(--color-badge-s-bg);
  color: var(--color-badge-s-text);
}

.badge-education {
  background-color: var(--color-badge-education-bg);
  color: var(--color-badge-education-text);
}

.empty-value {
  color: var(--color-text-light);
  font-style: italic;
}

.details-group {
  display: contents;
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.md}) {
  .details-group {
    display: contents;
  }
}

footer[role="contentinfo"] {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-2xl);
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.md}) {
  main[role="main"] {
    padding: var(--spacing-2xl) var(--spacing-xl);
  }

  article h1 {
    font-size: var(--font-size-4xl);
  }

  .school-details-list {
    gap: var(--spacing-md) var(--spacing-xl);
  }

  .school-details-list dt {
    font-size: var(--font-size-base);
  }

  .school-details-list dd {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: ${DESIGN_TOKENS.breakpoints.lg}) {
  .school-details-list {
    grid-template-columns: minmax(200px, auto) 1fr;
  }
}

@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  header[role="banner"] {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  main[role="main"] {
    padding: var(--spacing-md) var(--spacing-sm);
  }

  article h1 {
    font-size: var(--font-size-2xl);
  }

  section[aria-labelledby="school-details"] {
    padding: var(--spacing-md);
  }

  .school-details-list {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .school-details-list dt {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  html {
    color: var(--color-dark-text-primary);
    background-color: var(--color-dark-bg-primary);
  }

  body {
    background-color: var(--color-dark-bg-primary);
  }

  header[role="banner"] {
    background-color: var(--color-dark-bg-primary);
    border-bottom-color: var(--color-dark-border);
  }

  nav a {
    color: var(--color-dark-text-secondary);
  }

  nav a:hover {
    color: var(--color-primary);
    background-color: var(--color-dark-bg-accent);
  }

  nav span[aria-current="page"] {
    color: var(--color-dark-text-primary);
  }

  article[aria-labelledby="school-name"] {
    background-color: var(--color-dark-bg-secondary);
  }

  article h1 {
    color: var(--color-dark-text-primary);
    border-bottom-color: var(--color-dark-border);
  }

  .school-details-list dt {
    color: var(--color-dark-text-secondary);
  }

  .school-details-list dd {
    color: var(--color-dark-text-primary);
  }

  .badge-status {
    background-color: var(--color-dark-badge-status-bg);
    color: var(--color-dark-badge-status-text);
  }

  .badge-n {
    background-color: var(--color-dark-badge-n-bg);
    color: var(--color-dark-badge-n-text);
  }

  .badge-s {
    background-color: var(--color-dark-badge-s-bg);
    color: var(--color-dark-badge-s-text);
  }

  .badge-education {
    background-color: var(--color-dark-badge-education-bg);
    color: var(--color-dark-badge-education-text);
  }

  .empty-value {
    color: var(--color-dark-text-light);
  }

  footer[role="contentinfo"] {
    color: var(--color-dark-text-light);
    border-top-color: var(--color-dark-border);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  nav a:focus,
  .skip-link:focus {
    outline-width: 3px;
  }

  .school-details-list dt {
    font-weight: var(--font-weight-bold);
  }
}

/* Print styles */
@media print {
  * {
    background: white !important;
    color: black !important;
  }

  html, body {
    font-size: 12pt;
  }

  .skip-link {
    display: none !important;
  }

  header[role="banner"] {
    position: static;
    border-bottom: 1pt solid #000;
    box-shadow: none;
    padding: 0;
  }

  nav {
    display: none !important;
  }

  main[role="main"] {
    max-width: 100%;
    padding: 0;
    margin: 0;
  }

  article {
    box-shadow: none;
    border: 1pt solid #000;
  }

  article h1 {
    font-size: 18pt;
    border-bottom: 1pt solid #000;
  }

  .school-details-list {
    display: block;
  }

  .school-details-list dt,
  .school-details-list dd {
    display: inline;
  }

  .school-details-list dt::after {
    content: ": ";
  }

  .school-details-list dd::after {
    content: "; ";
    display: block;
    margin-bottom: 8pt;
  }

  .badge {
    border: 1pt solid #000;
    padding: 2pt 4pt;
    font-size: 10pt;
  }

  footer {
    border-top: 1pt solid #000;
    margin-top: 12pt;
    font-size: 10pt;
  }

  a {
    text-decoration: underline;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
  }

  @page {
    margin: 2cm;
  }
}
}
`;
}

async function writeExternalStylesFile(distDir) {
  const css = generateSchoolPageStyles();
  const outputPath = path.join(distDir, 'styles.css');
  await safeWriteFile(outputPath, css);
  return outputPath;
}

module.exports = {
  generateSchoolPageStyles,
  writeExternalStylesFile,
};
