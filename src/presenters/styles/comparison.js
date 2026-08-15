'use strict';

// School comparison tray and side-by-side table (FEAT-005).
module.exports = `/* ── School comparison tray (FEAT-005) ─────────────────────────────── */
.btn-compare {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.btn-compare:hover {
  background-color: var(--color-primary);
  color: #fff;
}

.btn-compare:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.btn-compare[aria-pressed='true'] {
  background-color: var(--color-primary);
  color: #fff;
}

.comparison-tray {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-fixed);
  max-height: 50vh;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

.comparison-tray[hidden] {
  display: none;
}

.comparison-tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.comparison-tray-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.comparison-tray-toggle {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.comparison-tray-toggle:hover {
  background-color: var(--color-primary);
  color: #fff;
}

.comparison-tray-toggle:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.comparison-tray-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  list-style: none;
  margin: var(--spacing-sm) 0 0;
  padding: 0;
}

.comparison-tray-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-accent);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

.comparison-tray-name {
  color: var(--color-link);
  text-decoration: none;
}

.comparison-tray-name:hover {
  text-decoration: underline;
}

.comparison-tray-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.comparison-tray-remove:hover {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

.comparison-tray-remove:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.comparison-tray-status {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.comparison-panel {
  margin-top: var(--spacing-md);
}

.comparison-panel[hidden] {
  display: none;
}

.comparison-table-wrap {
  overflow-x: auto;
}

.comparison-table-wrap:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.comparison-table th,
.comparison-table td {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.comparison-table thead th {
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.comparison-table tbody th {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .comparison-tray {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .comparison-table {
    min-width: 480px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .comparison-tray,
  .btn-compare,
  .comparison-tray-toggle,
  .comparison-tray-remove {
    transition: none;
  }
}

@media (prefers-color-scheme: dark) {
  .btn-compare,
  .comparison-tray-toggle {
    border-color: var(--color-dark-link);
    color: var(--color-dark-link);
  }

  .comparison-tray {
    background-color: var(--color-dark-bg-secondary);
    border-top-color: var(--color-dark-border);
  }

  .comparison-tray-title {
    color: var(--color-dark-text-primary);
  }

  .comparison-tray-name {
    color: var(--color-dark-link);
  }

  .comparison-tray-remove {
    color: var(--color-dark-text-secondary);
  }

  .comparison-tray-status {
    color: var(--color-dark-text-secondary);
  }

  .comparison-tray-item {
    background-color: var(--color-dark-bg-accent);
    border-color: var(--color-dark-border);
  }

  .comparison-table th,
  .comparison-table td {
    border-color: var(--color-dark-border);
  }

  .comparison-table thead th {
    background-color: var(--color-dark-bg-accent);
    color: var(--color-dark-text-primary);
  }

  .comparison-table tbody th {
    color: var(--color-dark-text-secondary);
  }
}
`;
