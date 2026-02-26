const { escapeHtml, formatStatus } = require('../../../scripts/utils');
const CONFIG = require('../../../scripts/config');

/**
 * Generate meta description for SEO
 * @param {Object} school - School data object
 * @returns {string} - SEO meta description
 */
function generateMetaDescription(school) {
  const { nama, bentuk_pendidikan, kab_kota, kecamatan } = school;
  const parts = [];

  if (nama) parts.push(nama);
  if (bentuk_pendidikan) parts.push(bentuk_pendidikan);
  if (kab_kota) parts.push(`di ${kab_kota}`);
  if (kecamatan) parts.push(`Kec. ${kecamatan}`);

  const description = parts.join(' - ');
  // Truncate to optimal length for SEO (150-160 chars)
  return description.length > 155 ? description.substring(0, 152) + '...' : description;
}

/**
 * Generate canonical URL for the school page
 * @param {string} relativePath - Relative path to the HTML file
 * @returns {string} - Full canonical URL
 */
function generateCanonicalUrl(relativePath) {
  const baseUrl = CONFIG.SITE_URL.replace(/\/$/, '');
  return `${baseUrl}/${relativePath}`;
}

function generateSchoolPageHtml(school, relativePath) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const metaDescription = generateMetaDescription(school);
  const canonicalUrl = generateCanonicalUrl(relativePath);
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">
  <title>${escapeHtml(school.nama)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

  <link rel="stylesheet" href="/styles.css">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(school.nama)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "School",
    "name": "${escapeHtml(school.nama)}",
    "identifier": "${escapeHtml(school.npsn)}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "${escapeHtml(school.alamat)}",
      "addressLocality": "${escapeHtml(school.kecamatan)}",
      "addressRegion": "${escapeHtml(school.kab_kota)}",
      "addressCountry": "ID"
    },
    "educationalLevel": "${escapeHtml(school.bentuk_pendidikan)}"
  }
  </script>
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    <nav aria-label="Navigasi utama">
      <a href="/">Beranda</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(school.nama)}</span>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <article aria-labelledby="school-name">
      <h1 id="school-name">${escapeHtml(school.nama)}</h1>
      
      <section aria-labelledby="school-details">
        <h2 id="school-details" class="sr-only">Detail Sekolah</h2>
        <dl class="school-details-list">
          <div class="details-group">
            <dt>NPSN</dt>
            <dd>${escapeHtml(school.npsn)}</dd>
            
            <dt>Jenjang</dt>
            <dd><span class="badge badge-education">${escapeHtml(school.bentuk_pendidikan)}</span></dd>
            
            <dt>Status</dt>
            <dd><span class="badge badge-status badge-${escapeHtml(school.status).toLowerCase()}">${escapeHtml(formatStatus(school.status))}</span></dd>
          </div>
          
          <div class="details-group">
            <dt>Alamat</dt>
            <dd>${escapeHtml(school.alamat)}</dd>
            
            <dt>Provinsi</dt>
            <dd>${escapeHtml(school.provinsi)}</dd>
            
            <dt>Kabupaten/Kota</dt>
            <dd>${escapeHtml(school.kab_kota)}</dd>
            
            <dt>Kecamatan</dt>
            <dd>${escapeHtml(school.kecamatan)}</dd>
          </div>
        </dl>
      </section>
    </article>
  </main>
  
  <footer role="contentinfo">
    <p>&copy; ${currentYear} Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
  </footer>
  
  <button class="back-to-top" aria-label="Kembali ke atas">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  </button>
  
  <script>
    (function() {
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
  </script>
</body>
</html>`;
}

module.exports = {
  generateSchoolPageHtml,
  generateMetaDescription,
  generateCanonicalUrl,
};
