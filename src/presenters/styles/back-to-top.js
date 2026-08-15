'use strict';

const { DESIGN_TOKENS } = require('../design-system');

// Back-to-top button, its dark mode and reduced-motion support.
module.exports = `/* Back to top button */
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

`;
