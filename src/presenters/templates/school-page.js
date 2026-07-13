const { escapeHtml, formatStatus, generateMetaDescription } = require('../../../scripts/utils');
const { IntegrationError, ERROR_CODES } = require('../../../scripts/resilience');
const CONFIG = require('../../../scripts/config');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { generateFooterHtml } = require('./shared/footer');
const { generateBreadcrumbHtml } = require('./shared/navigation');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');

// Pre-escape static CONFIG.TEXT values to avoid ~38K redundant escapeHtml calls
// during full build (each escapeHtml does 5 regex replacements)
const T = Object.fromEntries(
  Object.entries(CONFIG.TEXT).map(([key, value]) => [key, escapeHtml(value)])
);

/**
 * Generate canonical URL for the school page
 * @param {string} relativePath - Relative path to the HTML file
 * @returns {string} - Full canonical URL
 */
function generateCanonicalUrl(relativePath) {
  const baseUrl = CONFIG.SITE_URL.replace(/\/$/, '');
  return `${baseUrl}/${relativePath}`;
}

/**
 * Generate HTML for the enrichment section of a school page.
 * Displays data from enrichment sources (e.g., Wikipedia) when available.
 * Returns empty string if no enrichment data is present.
 *
 * @param {Object} enrichment - Enrichment data object keyed by source
 * @returns {string} HTML for the enrichment section
 */
function generateEnrichmentSection(enrichment) {
  if (!enrichment || typeof enrichment !== 'object') {
    return '';
  }

  const parts = [];

  // Wikipedia enrichment
  if (enrichment.wikipedia && enrichment.wikipedia.wikipediaUrl) {
    const wiki = enrichment.wikipedia;
    parts.push(`
      <section aria-labelledby="enrichment-wikipedia" class="enrichment-section">
        <h2 id="enrichment-wikipedia">Informasi Tambahan</h2>
        <div class="enrichment-card">
          ${wiki.wikipediaExtract ? `<p class="enrichment-extract">${escapeHtml(wiki.wikipediaExtract)}</p>` : ''}
          <p class="enrichment-source">
            Sumber: <a href="${escapeHtml(wiki.wikipediaUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(wiki.wikipediaTitle || 'Wikipedia')}</a>
            <span class="enrichment-badge">Wikipedia</span>
          </p>
        </div>
      </section>`);
  }

  return parts.join('\n');
}

function generateSchoolPageHtml(school, relativePath, enrichment) {
  if (!school || typeof school !== 'object') {
    throw new IntegrationError('Invalid school object provided', ERROR_CODES.INVALID_INPUT, {
      field: 'school',
      expectedType: 'object',
    });
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new IntegrationError(
      `School object missing required fields: ${missingFields.join(', ')}`,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      { missingFields }
    );
  }

  const metaDescription = generateMetaDescription(school);
  const canonicalUrl = generateCanonicalUrl(relativePath);

  return `${HTML_HEAD_PREFIX}
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <title>${escapeHtml(school.nama)}</title>
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
    ${generateBreadcrumbHtml([{ label: T.HOME, url: '/' }, { label: escapeHtml(school.nama) }])}
  </header>
  
  <main id="main-content" role="main">
    <article aria-labelledby="school-name">
      <h1 id="school-name">${escapeHtml(school.nama)}</h1>
      
      <section aria-labelledby="school-details">
        <h2 id="school-details" class="sr-only">Detail Sekolah</h2>
        <dl class="school-details-list">
          <div class="details-group">
            <dt>${T.NPSN}</dt>
            <dd>
              <span id="npsn-value">${escapeHtml(school.npsn)}</span>
              <button class="btn-copy" aria-label="${T.COPY_NPSN}" data-copy-target="npsn-value">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="copy-feedback">${T.COPIED}</span>
              </button>
            </dd>
            
            <dt>${T.LEVEL}</dt>
            <dd><span class="badge badge-education">${escapeHtml(school.bentuk_pendidikan)}</span></dd>
            
            <dt>${T.STATUS}</dt>
            <dd><span class="badge badge-status badge-${escapeHtml(school.status).toLowerCase()}">${escapeHtml(formatStatus(school.status))}</span></dd>
          </div>
          
          <div class="details-group">
            <dt>${T.ADDRESS}</dt>
            <dd>${escapeHtml(school.alamat)}</dd>
            
            <dt>${T.PROVINCE}</dt>
            <dd>${escapeHtml(school.provinsi)}</dd>
            
            <dt>${T.CITY_REGENCY}</dt>
            <dd>${escapeHtml(school.kab_kota)}</dd>
            
            <dt>${T.DISTRICT}</dt>
            <dd>${escapeHtml(school.kecamatan)}</dd>
          </div>
        </dl>
      </section>

      ${enrichment ? generateEnrichmentSection(enrichment) : ''}
    </article>
  </main>
  
  ${generateFooterHtml({ siteName: T.SITE_NAME })}
  
  ${generateBackToTopHtml()}
  
  <script>
    (function() {
      // Back to top (shared module)
      ${generateBackToTopScript().replace('<script>', '').replace('</script>', '').trim()}

      // Copy to clipboard functionality
      var copyButtons = document.querySelectorAll('.btn-copy');
      copyButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var targetId = btn.getAttribute('data-copy-target');
          var textToCopy = document.getElementById(targetId).textContent;

          navigator.clipboard.writeText(textToCopy).then(function() {
            btn.classList.add('show');
            setTimeout(function() {
              btn.classList.remove('show');
            }, 2000);
          }).catch(function(err) {
            console.error('Gagal menyalin teks: ', err);
          });
        });
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  generateSchoolPageHtml,
  generateCanonicalUrl,
  generateEnrichmentSection,
};
