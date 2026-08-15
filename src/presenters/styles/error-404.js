'use strict';

// 404 error page styles.
module.exports = `/* 404 Error Page Styles */
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
