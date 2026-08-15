'use strict';

const { DESIGN_TOKENS } = require('../design-system');

// Search section: search bar, autocomplete dropdown, results, no-results, noscript, responsive, dark mode, reduced motion and forced-colors.
module.exports = `/* ===== Search Section Styles ===== */
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
  position: relative;
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

/* Search Autocomplete Dropdown */
.search-autocomplete {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  max-height: 400px;
  overflow-y: auto;
}

.autocomplete-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.autocomplete-item:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.autocomplete-item:hover,
.autocomplete-item-active {
  background-color: var(--color-bg-secondary);
  /* Inset accent so the active option isn't indicated by color alone */
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.autocomplete-item-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.autocomplete-item-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  white-space: nowrap;
}

.search-results-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.download-csv-btn {
  font-size: var(--font-size-sm);
  padding: 0.25rem 0.75rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity var(--transition-fast);
  white-space: nowrap;
}

.download-csv-btn:hover,
.download-csv-btn:focus {
  opacity: 0.85;
}

.download-csv-btn:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
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

  .search-autocomplete {
    background-color: var(--color-dark-bg-primary);
    border-color: var(--color-dark-border);
  }

  .autocomplete-item {
    border-bottom-color: var(--color-dark-border);
  }

  .autocomplete-item:hover,
  .autocomplete-item-active {
    background-color: var(--color-dark-bg-secondary);
  }

  .autocomplete-item-name {
    color: var(--color-dark-text-primary);
  }

  .autocomplete-item-meta {
    color: var(--color-dark-text-light);
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
}

/* Forced-colors (Windows High Contrast) focus visibility.
   box-shadow / border-color focus indicators are suppressed in forced-colors
   mode, so the search controls fall back to outlines here. */
@media (forced-colors: active) {
  .search-input:focus,
  .filter-select:focus,
  .download-csv-btn:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .autocomplete-item-active {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}

`;
