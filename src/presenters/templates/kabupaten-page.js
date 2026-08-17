const { escapeHtml } = require('../../core/utils');
const slugify = require('../../core/slugify');
const CONFIG = require('../../core/config');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { generateFooterHtml } = require('./shared/footer');
const { generateBreadcrumbHtml } = require('./shared/navigation');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');
const { T } = require('./shared/translations');

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
 * @param {boolean} [skipFilter=false] - When true, skip internal kabupaten filtering
 *        (schools are assumed to be pre-filtered to this kabupaten)
 * @returns {string} - Kabupaten page HTML
 */
function generateKabupatenPageHtml(provinceName, kabKotaName, schools, skipFilter = false) {
  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);

  const kabupatenSchools = skipFilter
    ? schools
    : filterSchoolsByProvinceAndKabupaten(schools, provinceName, kabKotaName);
  const kecamatanList = aggregateByKecamatan(kabupatenSchools);
  const totalSchools = kabupatenSchools.length;

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

  return `${HTML_HEAD_PREFIX}
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <title>Daftar Sekolah di ${escapeHtml(kabKotaName)} - Sekolah PSEO</title>
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="Daftar Sekolah di ${escapeHtml(kabKotaName)} - Sekolah PSEO" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    ${generateBreadcrumbHtml([
      { label: T.HOME, url: '/' },
      { label: escapeHtml(provinceName), url: `/provinsi/${provinceSlug}/` },
      { label: escapeHtml(kabKotaName) },
    ])}
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
  
  ${generateFooterHtml()}
  
  ${generateBackToTopHtml()}
  ${generateBackToTopScript()}
</body>
</html>`;
}

module.exports = {
  generateKabupatenPageHtml,
  filterSchoolsByProvinceAndKabupaten,
  aggregateByKecamatan,
};
