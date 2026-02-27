const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');
const CONFIG = require('../../../scripts/config');

/**
 * Filter schools by province
 * @param {Array<Object>} schools - Array of school data objects
 * @param {string} provinceName - Province name to filter by
 * @returns {Array<Object>} - Filtered schools for the province
 */
function filterSchoolsByProvince(schools, provinceName) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.filter(school => school.provinsi === provinceName);
}

/**
 * Aggregate school data by kabupaten/kota within a province
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Object>} - Array of kabupaten objects with school count
 */
function aggregateByKabupaten(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  const kabupatenMap = new Map();

  for (const school of schools) {
    if (!school.kab_kota) continue;

    const kabKotaName = school.kab_kota;
    if (!kabupatenMap.has(kabKotaName)) {
      kabupatenMap.set(kabKotaName, {
        name: kabKotaName,
        slug: slugify(kabKotaName),
        count: 0,
      });
    }

    const kabupaten = kabupatenMap.get(kabKotaName);
    kabupaten.count++;
  }

  // Sort by kabupaten name
  const kabupatenList = Array.from(kabupatenMap.values());
  kabupatenList.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return kabupatenList;
}

/**
 * Generate province page HTML
 * @param {string} provinceName - Province name
 * @param {Array<Object>} schools - Array of school data objects for this province
 * @returns {string} - Province page HTML
 */
function generateProvincePageHtml(provinceName, schools) {
  const provinceSchools = filterSchoolsByProvince(schools, provinceName);
  const provinceSlug = slugify(provinceName);
  const kabupatenList = aggregateByKabupaten(provinceSchools);
  const totalSchools = provinceSchools.length;
  const currentYear = new Date().getFullYear();

  const canonicalUrl = `${CONFIG.SITE_URL.replace(/\/$/, '')}/provinsi/${provinceSlug}/`;
  const metaDescription = `Daftar sekolah di Provinsi ${provinceName}. Temukan informasi lengkap tentang ${totalSchools.toLocaleString('id-ID')} sekolah dari berbagai jenjang pendidikan.`;

  const kabupatenLinks = kabupatenList
    .map(
      kab => `
          <li>
            <a href="/provinsi/${provinceSlug}/kabupaten/${kab.slug}/" class="province-link">
              <span class="province-name">${escapeHtml(kab.name)}</span>
              <span class="province-count">${kab.count.toLocaleString('id-ID')} sekolah</span>
            </a>
          </li>
        `
    )
    .join('');

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
  
  YV|  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
#VK|  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
#QH|  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
#QV|  <title>Daftar Sekolah di Provinsi ${escapeHtml(provinceName)} - Sekolah PSEO</title>
#VP|  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    <nav aria-label="Navigasi utama">
      <a href="/">Beranda</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(provinceName)}</span>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <div class="homepage-hero">
      <h1>Provinsi ${escapeHtml(provinceName)}</h1>
      <p class="hero-description">
        Jelajahi daftar sekolah-sekolah di Provinsi ${escapeHtml(provinceName)}. 
        Temukan informasi lengkap tentang NPSN, alamat, jenjang pendidikan, dan status sekolah.
      </p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">${totalSchools.toLocaleString('id-ID')}</span>
          <span class="stat-label">Total Sekolah</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${kabupatenList.length}</span>
          <span class="stat-label">Kabupaten/Kota</span>
        </div>
      </div>
    </div>

    <section aria-labelledby="kabupaten-heading">
      <h2 id="kabupaten-heading" class="section-title">Pilih Kabupaten/Kota</h2>
      <p class="section-description">Klik pada kabupaten/kota untuk melihat daftar sekolah di wilayah tersebut.</p>
      <ul class="province-list">
        ${kabupatenLinks}
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
  generateProvincePageHtml,
  filterSchoolsByProvince,
  aggregateByKabupaten,
};
