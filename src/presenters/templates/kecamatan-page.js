const { escapeHtml, formatStatus } = require('../../core/utils');
const slugify = require('../../core/slugify');
const CONFIG = require('../../core/config');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { generateFooterHtml } = require('./shared/footer');
const { generateBreadcrumbHtml } = require('./shared/navigation');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');
const { T } = require('./shared/translations');

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
      const statusLabel = formatStatus(school.status);
      const statusClass = school.status === 'S' ? 'badge-s' : 'badge-n';

      return `
          <li>
            <a href="${schoolUrl}" class="province-link">
              <span class="province-name">${escapeHtml(school.nama)}</span>
              <div class="school-link-badges">
                <span class="badge badge-education">${escapeHtml(school.bentuk_pendidikan)}</span>
                <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
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
 * @param {boolean} [skipFilter=false] - When true, skip internal kecamatan filtering
 *        (schools are assumed to be pre-filtered to this kecamatan)
 * @returns {string} - Kecamatan page HTML
 */
function generateKecamatanPageHtml(
  provinceName,
  kabKotaName,
  kecamatanName,
  schools,
  skipFilter = false
) {
  const provinceSlug = slugify(provinceName);
  const kabKotaSlug = slugify(kabKotaName);
  const kecamatanSlug = slugify(kecamatanName);

  const kecamatanSchools = skipFilter
    ? schools
    : filterSchoolsByLocation(schools, provinceName, kabKotaName, kecamatanName);
  const totalSchools = kecamatanSchools.length;

  const canonicalUrl = `${CONFIG.SITE_URL.replace(/\/$/, '')}/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/kecamatan/${kecamatanSlug}/`;
  const metaDescription = `Daftar sekolah di Kecamatan ${kecamatanName}, ${kabKotaName}, Provinsi ${provinceName}. Temukan informasi lengkap tentang ${totalSchools.toLocaleString('id-ID')} sekolah.`;

  const schoolLinksHtml = generateSchoolLinksHtml(kecamatanSchools, provinceSlug, kabKotaSlug);

  return `${HTML_HEAD_PREFIX}
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <title>Daftar Sekolah di Kecamatan ${escapeHtml(kecamatanName)} - Sekolah PSEO</title>
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
    ${generateBreadcrumbHtml([
      { label: T.HOME, url: '/' },
      { label: escapeHtml(provinceName), url: `/provinsi/${provinceSlug}/` },
      {
        label: escapeHtml(kabKotaName),
        url: `/provinsi/${provinceSlug}/kabupaten/${kabKotaSlug}/`,
      },
      { label: escapeHtml(kecamatanName) },
    ])}
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
  
  ${generateFooterHtml()}
  
  ${generateBackToTopHtml()}
  ${generateBackToTopScript()}
</body>
</html>`;
}

module.exports = {
  generateKecamatanPageHtml,
  filterSchoolsByLocation,
  generateSchoolLinksHtml,
};
