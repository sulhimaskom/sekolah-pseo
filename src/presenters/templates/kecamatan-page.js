const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');
const CONFIG = require('../../../scripts/config');

/**
 * Filter schools by province, kabupaten/kota, and kecamatan
 * @param {Array<Object>} schools - Array of school data objects
 * @param {string} provinceName - Province name to filter by
 * @param {string} kabKotaName - Kabupaten/Kota name to filter by
 * @param {string} kecamatanName - Kecamatan name to filter by
 * @returns {Array<Object>} - Filtered schools
 */
function filterSchoolsByLocation(schools, provinceName, kabKotaName, kecamatanName) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.filter(
    school =>
      school.provinsi === provinceName &&
      school.kab_kota === kabKotaName &&
      school.kecamatan === kecamatanName
  );
}

/**
 * Generate school link HTML for a list of schools
 * @param {Array<Object>} schools - Array of school data objects
 * @param {string} provinceSlug - Province slug
 * @param {string} kabKotaSlug - Kabupaten/Kota slug
 * @returns {string} - HTML string for school links
 */
function generateSchoolLinksHtml(schools, provinceSlug, kabKotaSlug) {
  return schools
    .map(school => {
      const kecamatanSlug = slugify(school.kecamatan);
      const namaSlug = slugify(school.nama);
      const schoolUrl = `/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/kecamatan/${kecamatanSlug}/${school.npsn}-${namaSlug}.html`;
      const statusLabel = school.status === 'S' ? 'Swasta' : 'Negeri';
      const statusClass = school.status === 'S' ? 'badge-s' : 'badge-n';

      return `
          <li>
            <a href="${schoolUrl}" class="province-link">
              <span class="province-name">${escapeHtml(school.nama)}</span>
              <div class="school-link-badges">
                <span class="badge badge-education">${escapeHtml(school.bentuk_pendidikan)}</span>
                <span class="badge ${statusClass}">${statusLabel}</span>
              </div>
            </a>
          </li>
        `;
    })
    .join('');
}

/**
 * Generate kecamatan page HTML
 * @param {string} provinceName - Province name
 * @param {string} kabKotaName - Kabupaten/Kota name
 * @param {string} kecamatanName - Kecamatan name
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {string} - Kecamatan page HTML
 */
function generateKecamatanPageHtml(provinceName, kabKotaName, kecamatanName, schools) {
  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);
  const kecamatanSlug = slugify(kecamatanName);

  const kecamatanSchools = filterSchoolsByLocation(
    schools,
    provinceName,
    kabKotaName,
    kecamatanName
  );
  const totalSchools = kecamatanSchools.length;
  const currentYear = new Date().getFullYear();

  const canonicalUrl = `${CONFIG.SITE_URL.replace(/\/$/, '')}/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/kecamatan/${kecamatanSlug}/`;
  const metaDescription = `Daftar sekolah di Kecamatan ${kecamatanName}, ${kabKotaName}, Provinsi ${provinceName}. Temukan informasi lengkap tentang ${totalSchools.toLocaleString('id-ID')} sekolah.`;

  const schoolLinksHtml = generateSchoolLinksHtml(kecamatanSchools, provinceSlug, kabKotaSlug);

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
  <meta http-equiv="Permissions-Policy" content="accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()">
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
  <meta http-equiv="Cross-Origin-Resource-Policy" content="same-origin">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>Daftar Sekolah di Kecamatan ${escapeHtml(kecamatanName)} - Sekolah PSEO</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="Daftar Sekolah di Kecamatan ${escapeHtml(kecamatanName)} - Sekolah PSEO" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    <nav aria-label="Navigasi utama">
      <a href="/">Beranda</a>
      <span aria-hidden="true"> / </span>
      <a href="/provinsi/${provinceSlug}/">${escapeHtml(provinceName)}</a>
      <span aria-hidden="true"> / </span>
      <a href="/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/">${escapeHtml(kabKotaName)}</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(kecamatanName)}</span>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <div class="homepage-hero">
      <h1>Kecamatan ${escapeHtml(kecamatanName)}</h1>
      <p class="hero-description">
        Jelajahi daftar sekolah-sekolah di Kecamatan ${escapeHtml(kecamatanName)}, ${escapeHtml(kabKotaName)}, Provinsi ${escapeHtml(provinceName)}. 
        Temukan informasi lengkap tentang NPSN, alamat, jenjang pendidikan, dan status sekolah.
      </p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">${totalSchools.toLocaleString('id-ID')}</span>
          <span class="stat-label">Total Sekolah</span>
        </div>
      </div>
    </div>

    <section aria-labelledby="schools-heading">
      <h2 id="schools-heading" class="section-title">Daftar Sekolah</h2>
      <p class="section-description">Klik pada sekolah untuk melihat informasi lengkap.</p>
      <ul class="province-list">
        ${schoolLinksHtml}
      </ul>
    </section>
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
  generateKecamatanPageHtml,
  filterSchoolsByLocation,
};
