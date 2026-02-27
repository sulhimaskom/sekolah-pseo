const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');
const CONFIG = require('../../../scripts/config');

/**
 * Filter schools by province and kabupaten/kota
 * @param {Array<Object>} schools - Array of school data objects
 * @param {string} provinceName - Province name to filter by
 * @param {string} kabKotaName - Kabupaten/Kota name to filter by
 * @returns {Array<Object>} - Filtered schools for the province and kabupaten
 */
function filterSchoolsByProvinceAndKabupaten(schools, provinceName, kabKotaName) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.filter(
    school => school.provinsi === provinceName && school.kab_kota === kabKotaName
  );
}

/**
 * Aggregate school data by kecamatan within a kabupaten
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Object>} - Array of kecamatan objects with school count
 */
function aggregateByKecamatan(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  const kecamatanMap = new Map();

  for (const school of schools) {
    if (!school.kecamatan) continue;

    const kecamatanName = school.kecamatan;
    if (!kecamatanMap.has(kecamatanName)) {
      kecamatanMap.set(kecamatanName, {
        name: kecamatanName,
        slug: slugify(kecamatanName),
        count: 0,
      });
    }

    const kecamatan = kecamatanMap.get(kecamatanName);
    kecamatan.count++;
  }

  // Sort by kecamatan name
  const kecamatanList = Array.from(kecamatanMap.values());
  kecamatanList.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return kecamatanList;
}

/**
 * Generate kabupaten page HTML
 * @param {string} provinceName - Province name
 * @param {string} kabKotaName - Kabupaten/Kota name
 * @param {Array<Object>} schools - Array of school data objects for this province and kabupaten
 * @returns {string} - Kabupaten page HTML
 */
function generateKabupatenPageHtml(provinceName, kabKotaName, schools) {
  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);

  const kabupatenSchools = filterSchoolsByProvinceAndKabupaten(schools, provinceName, kabKotaName);
  const kecamatanList = aggregateByKecamatan(kabupatenSchools);
  const totalSchools = kabupatenSchools.length;
  const currentYear = new Date().getFullYear();

  const canonicalUrl = `${CONFIG.SITE_URL.replace(/\/$/, '')}/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/`;
  const metaDescription = `Daftar sekolah di ${kabKotaName}, Provinsi ${provinceName}. Temukan informasi lengkap tentang ${totalSchools.toLocaleString('id-ID')} sekolah dari berbagai jenjang pendidikan.`;

  const kecamatanLinks = kecamatanList
    .map(
      kec => `
          <li>
            <a href="/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/kecamatan/${kec.slug}/" class="province-link">
              <span class="province-name">${escapeHtml(kec.name)}</span>
              <span class="province-count">${kec.count.toLocaleString('id-ID')} sekolah</span>
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
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>Daftar Sekolah di ${escapeHtml(kabKotaName)} - Sekolah PSEO</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="/styles.css">
</head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="/styles.css">
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
      <span aria-current="page">${escapeHtml(kabKotaName)}</span>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <div class="homepage-hero">
      <h1>${escapeHtml(kabKotaName)}</h1>
      <p class="hero-description">
        Jelajahi daftar sekolah-sekolah di ${escapeHtml(kabKotaName)}, Provinsi ${escapeHtml(provinceName)}. 
        Temukan informasi lengkap tentang NPSN, alamat, jenjang pendidikan, dan status sekolah.
      </p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">${totalSchools.toLocaleString('id-ID')}</span>
          <span class="stat-label">Total Sekolah</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${kecamatanList.length}</span>
          <span class="stat-label">Kecamatan</span>
        </div>
      </div>
    </div>

    <section aria-labelledby="kecamatan-heading">
      <h2 id="kecamatan-heading" class="section-title">Pilih Kecamatan</h2>
      <p class="section-description">Klik pada kecamatan untuk melihat daftar sekolah di wilayah tersebut.</p>
      <ul class="province-list">
        ${kecamatanLinks}
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
  generateKabupatenPageHtml,
  filterSchoolsByProvinceAndKabupaten,
  aggregateByKecamatan,
};
