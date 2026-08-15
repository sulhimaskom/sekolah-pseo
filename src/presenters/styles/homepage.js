'use strict';

// Homepage styles (hero, search hero, cards, CTA).
module.exports = `/* Homepage styles */
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

`;
