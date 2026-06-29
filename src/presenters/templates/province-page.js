const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');
const CONFIG = require('../../../scripts/config');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');

// Hoisted constant - computed once at module load, not per province page
const CURRENT_YEAR = new Date().getFullYear();

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
 * @param {Array<Object>} schools - Array of school data objects
 * @param {boolean} [skipFilter=false] - When true, skip internal filterSchoolsByProvince
 *        (schools are assumed to be pre-filtered to this province)
 * @returns {string} - Province page HTML
 */
function generateProvincePageHtml(provinceName, schools, skipFilter = false) {
  const provinceSchools = skipFilter ? schools : filterSchoolsByProvince(schools, provinceName);
  const provinceSlug = slugify(provinceName);
  const kabupatenList = aggregateByKabupaten(provinceSchools);
  const totalSchools = provinceSchools.length;

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

  return `${HTML_HEAD_PREFIX}
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <title>Daftar Sekolah di Provinsi ${escapeHtml(provinceName)} - Sekolah PSEO</title>
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="Daftar Sekolah di Provinsi ${escapeHtml(provinceName)} - Sekolah PSEO" />
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
    <p>&copy; ${CURRENT_YEAR} Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
  </footer>
  
  ${generateBackToTopHtml()}
  ${generateBackToTopScript()}
</body>
</html>`;
}

module.exports = {
  generateProvincePageHtml,
  filterSchoolsByProvince,
  aggregateByKabupaten,
};
