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
  transition: all var(--transition-normal) ease-in-out;
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
#BN|/* Homepage styles */
.homepage-hero {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-accent) 100%);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-2xl);
}

.homepage-hero h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md);
}

.hero-description {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto var(--spacing-xl);
  line-height: var(--line-height-relaxed);
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm);
}

.section-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl);
}

.province-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
  list-style: none;
  padding: 0;
  margin: 0;
}

.province-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast) ease;
}

.province-link:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.province-link:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.province-link:focus:not(:focus-visible) {
  outline: none;
}

.province-link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.province-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.province-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-accent);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
}

/* School link badges (for kecamatan page) */
.school-link-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  align-items: center;


@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  .homepage-hero {
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .homepage-hero h1 {
    font-size: var(--font-size-2xl);
  }

  .hero-description {
    font-size: var(--font-size-base);
  }

  .hero-stats {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .province-list {
    grid-template-columns: 1fr;
  }
}

/* Dark mode support for homepage */
@media (prefers-color-scheme: dark) {
  .homepage-hero {
    background: linear-gradient(135deg, var(--color-dark-bg-secondary) 0%, var(--color-dark-bg-accent) 100%);
  }

  .homepage-hero h1 {
    color: var(--color-dark-text-primary);
  }

  .hero-description {
    color: var(--color-dark-text-secondary);
  }

  .stat-value {
    color: var(--color-primary-focus);
  }

  .stat-label {
    color: var(--color-dark-text-secondary);
  }

  .section-title {
    color: var(--color-dark-text-primary);
  }

  .section-description {
    color: var(--color-dark-text-secondary);
  }

  .province-link {
    background-color: var(--color-dark-bg-secondary);
    border-color: var(--color-dark-border);
  }

  .province-link:hover {
    border-color: var(--color-primary);
  }

  .province-name {
    color: var(--color-dark-text-primary);
  }

  .province-count {
    color: var(--color-dark-text-secondary);
    background-color: var(--color-dark-bg-accent);
  }
}

/* Back to top button */
.back-to-top {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal) ease;
  z-index: var(--z-index-fixed);
}

.back-to-top.visible {
  opacity: 1;
  visibility: visible;
}

.back-to-top:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.back-to-top:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.back-to-top:focus:not(:focus-visible) {
  outline: none;
}

.back-to-top:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.back-to-top svg {
  width: 24px;
  height: 24px;
}

@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  .back-to-top {
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    width: 40px;
    height: 40px;
  }

  .back-to-top svg {
    width: 20px;
    height: 20px;
  }
}

/* Dark mode support for back-to-top */
@media (prefers-color-scheme: dark) {
  .back-to-top {
    background-color: var(--color-primary-focus);
  }

  .back-to-top:hover {
    background-color: var(--color-primary);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .back-to-top:hover {
    transform: none;
  }
}

/* ===== Search Section Styles ===== */
.search-section {
  margin-bottom: var(--spacing-2xl);
}

.search-container {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.search-input-wrapper {
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast) ease, box-shadow var(--transition-fast) ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.search-input::placeholder {
  color: var(--color-text-light);
}

.filter-group {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: border-color var(--transition-fast) ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.search-results-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Search Results */
.search-results {
  margin-top: var(--spacing-lg);
}

.school-results-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
  list-style: none;
  padding: 0;
  margin: 0;
}

.school-result-item {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast) ease, box-shadow var(--transition-fast) ease;
}

.school-result-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.school-result-link {
  display: block;
  padding: var(--spacing-md);
  text-decoration: none;
  color: inherit;
}

.school-result-link:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.school-result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.school-result-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-tight);
}

.school-result-details {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.school-result-npsn {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.school-result-location {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
}

/* No Results Message */
.no-results {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.no-results p {
  margin: 0;
  font-size: var(--font-size-lg);
}

/* Noscript Notice */
.noscript-notice {
  background-color: var(--color-bg-accent);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Search Active State */
.search-section.search-active .province-list {
  opacity: 0.5;
}

/* Responsive Search Styles */
@media (max-width: ${DESIGN_TOKENS.breakpoints.sm}) {
  .search-container {
    padding: var(--spacing-md);
  }
  
  .filter-group {
    flex-direction: column;
  }
  
  .filter-item {
    min-width: 100%;
  }
  
  .school-results-list {
    grid-template-columns: 1fr;
  }
}

/* Dark Mode Search Styles */
@media (prefers-color-scheme: dark) {
  .search-container {
    background-color: var(--color-dark-bg-secondary);
  }
  
  .search-input,
  .filter-select {
    background-color: var(--color-dark-bg-primary);
    border-color: var(--color-dark-border);
    color: var(--color-dark-text-primary);
  }
  
  .search-input::placeholder {
    color: var(--color-dark-text-light);
  }
  
  .search-results-info {
    color: var(--color-dark-text-secondary);
  }
  
  .school-result-item {
    background-color: var(--color-dark-bg-secondary);
    border-color: var(--color-dark-border);
  }
  
  .school-result-name {
    color: var(--color-dark-text-primary);
  }
  
  .school-result-npsn {
    color: var(--color-dark-text-secondary);
  }
  
  .school-result-location {
    color: var(--color-dark-text-light);
  }
  
  .no-results {
    color: var(--color-dark-text-secondary);
  }
  
  .noscript-notice {
    background-color: var(--color-dark-bg-accent);
    border-color: var(--color-dark-border);
    color: var(--color-dark-text-secondary);
  }
}

/* Reduced Motion for Search */
@media (prefers-reduced-motion: reduce) {
  .search-input,
  .filter-select,
  .school-result-item {
    transition: none;
  }

  .back-to-top:hover {
    transform: none;
  }
TV}

/* 404 Error Page Styles */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.error-code {
  font-size: 6rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1;
  margin: 0;
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: var(--spacing-lg) 0 var(--spacing-md);
}

.error-message {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 500px;
  margin: 0 0 var(--spacing-xl);
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: all var(--transition-fast) ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.btn-secondary {
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.btn-secondary:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
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
