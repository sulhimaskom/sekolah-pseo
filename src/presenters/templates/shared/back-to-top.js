/**
 * Shared back-to-top button HTML and scroll functionality.
 * Extracted to eliminate duplication across school-page, province-page, and homepage templates.
 */

function generateBackToTopHtml() {
  return `
  <button class="back-to-top" aria-label="Kembali ke atas">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  </button>`;
}

function generateBackToTopScript() {
  return `
  <script>
    (function() {
      'use strict';
      var backToTop = document.querySelector('.back-to-top');
      if (!backToTop) return;

      function handleScroll() {
        if (window.scrollY > 300) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }

      function scrollToTop() {
        var behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top: 0, behavior: behavior });
      }

      backToTop.addEventListener('click', scrollToTop);
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    })();
  </script>`;
}

module.exports = {
  generateBackToTopHtml,
  generateBackToTopScript,
};
