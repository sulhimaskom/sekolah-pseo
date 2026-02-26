const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');

/**

/**
 * Aggregate school data by province
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Object>} - Array of province objects with school count
 */
function aggregateByProvince(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  const provinceMap = new Map();

  for (const school of schools) {
    if (!school.provinsi) continue;

    const provinsiName = school.provinsi;
    if (!provinceMap.has(provinsiName)) {
      provinceMap.set(provinsiName, {
        name: provinsiName,
        slug: slugify(provinsiName),
        count: 0,
      });
    }

    const province = provinceMap.get(provinsiName);
    province.count++;
  }

  // Sort by province name
  const provinces = Array.from(provinceMap.values());
  provinces.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return provinces;
}

/**
 * Generate homepage HTML
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {string} - Homepage HTML
 */
function generateHomepageHtml(schools) {
  const provinces = aggregateByProvince(schools);
  const totalSchools = schools.length;
  const currentYear = new Date().getFullYear();

  const provinceLinks = provinces
    .map(
      province => `
          <li>
            <a href="/provinsi/${province.slug}/" class="province-link">
              <span class="province-name">${escapeHtml(province.name)}</span>
              <span class="province-count">${province.count.toLocaleString('id-ID')} sekolah</span>
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
  <meta name="description" content="Direktori lengkap sekolah-sekolah di Indonesia. Temukan informasi NPSN, alamat, jenjang, dan status sekolah di seluruh Indonesia." />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>Sekolah PSEO - Direktori Sekolah Indonesia</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="/" />
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    <nav aria-label="Navigasi utama">
      <span aria-current="page">Beranda</span>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <div class="homepage-hero">
      <h1>Sekolah PSEO</h1>
      <p class="hero-description">
        Direktori lengkap sekolah-sekolah di Indonesia. Temukan informasi lengkap tentang 
        NPSN, alamat, jenjang pendidikan, dan status sekolah di seluruh Indonesia.
      </p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">${totalSchools.toLocaleString('id-ID')}</span>
          <span class="stat-label">Total Sekolah</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${provinces.length}</span>
          <span class="stat-label">Provinsi</span>
        </div>
      </div>
    </div>

    <section aria-labelledby="provinces-heading">
      <h2 id="provinces-heading" class="section-title">Pilih Provinsi</h2>
      <p class="section-description">Klik pada provinsi untuk melihat daftar sekolah di wilayah tersebut.</p>
      <ul class="province-list">
        ${provinceLinks}
      </ul>
    </section>
  </main>
  
  <footer role="contentinfo">
    <p>&copy; ${currentYear} Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
  </footer>
  
  <button class="back-to-top" aria-label="Kembali ke atas" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
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
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  generateHomepageHtml,
  aggregateByProvince,
};
