const { escapeHtml, formatStatus, generateMetaDescription } = require('../../../scripts/utils');
const { IntegrationError, ERROR_CODES } = require('../../../scripts/resilience');
const { REQUIRED_SCHOOL_FIELDS } = require('../../../scripts/data-schema');
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

// Hoisted static back-to-top script body — computed once at module load.
// Avoids rebuilding the template literal + 2 regex replaces + trim for every
// one of ~3474 school pages per full build.
const BACK_TO_TOP_SCRIPT_BODY = generateBackToTopScript()
  .replace('<script>', '')
  .replace('</script>', '')
  .trim();

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

  const missingFields = REQUIRED_SCHOOL_FIELDS.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new IntegrationError(
      `School object missing required fields: ${missingFields.join(', ')}`,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      { missingFields }
    );
  }

  const metaDescription = generateMetaDescription(school);
  const canonicalUrl = generateCanonicalUrl(relativePath);

  // F047: JSON-LD is a raw-text script context — HTML entities are NOT decoded
  // there, so escapeHtml() corrupted values (e.g. "SDN & B" -> "SDN &amp; B").
  // Emit via JSON.stringify and escape "<" as \u003c for script-context safety.
  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'School',
      name: school.nama,
      identifier: school.npsn,
      address: {
        '@type': 'PostalAddress',
        streetAddress: school.alamat || '',
        addressLocality: school.kecamatan || '',
        addressRegion: school.kab_kota || '',
        addressCountry: 'ID',
      },
      educationalLevel: school.bentuk_pendidikan || '',
    },
    null,
    2
  ).replace(/</g, '\\u003c');

  // FEAT-005: comparison payload for the shared tray — compact projection of
  // schema fields as raw JSON in a script context. Same F047 escaping rule as
  // jsonLd above; `url` lets the tray link back to the school page.
  const comparisonData = JSON.stringify({
    npsn: school.npsn,
    nama: school.nama,
    bentuk_pendidikan: school.bentuk_pendidikan,
    status: school.status,
    kecamatan: school.kecamatan,
    kab_kota: school.kab_kota,
    provinsi: school.provinsi,
    lat: school.lat || '',
    lon: school.lon || '',
    url: relativePath,
  }).replace(/</g, '\\u003c');

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
  ${jsonLd}
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

      <button type="button" class="btn-compare" aria-pressed="false">Bandingkan</button>
      
      <section aria-labelledby="school-details">
        <h2 id="school-details" class="sr-only">Detail Sekolah</h2>
        <dl class="school-details-list">
          <div class="details-group">
            <dt>${T.NPSN}</dt>
            <dd>
              <span id="npsn-value">${escapeHtml(school.npsn)}</span>
              <button class="btn-copy" aria-label="${T.COPY_NPSN}" data-copy-target="npsn-value">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="copy-feedback" role="status" aria-atomic="true">${T.COPIED}</span>
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

  <script type="application/json" id="school-data">${comparisonData}</script>
  
  <script>
    (function() {
      // Back to top (shared module)
      ${BACK_TO_TOP_SCRIPT_BODY}

      // Copy to clipboard functionality
      // Fallback (textarea + execCommand) keeps the button working over plain HTTP.
      function copyTextToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
          return navigator.clipboard.writeText(text);
        }
        return new Promise(function(resolve, reject) {
          var textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            var ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (ok) {
              resolve();
            } else {
              reject(new Error('execCommand copy returned false'));
            }
          } catch (err) {
            document.body.removeChild(textarea);
            reject(err);
          }
        });
      }

      var copyButtons = document.querySelectorAll('.btn-copy');
      copyButtons.forEach(function(btn) {
        var feedback = btn.querySelector('.copy-feedback');
        // F049: capture the default message once at setup — reading it at click
        // time returns '' because the previous timeout empties the region
        var defaultText = feedback ? feedback.textContent : 'Tersalin!';
        btn.addEventListener('click', function() {
          var targetId = btn.getAttribute('data-copy-target');
          var textToCopy = document.getElementById(targetId).textContent;

          copyTextToClipboard(textToCopy).then(function() {
            if (feedback) {
              feedback.textContent = defaultText;
              btn.classList.add('show');
            }
            setTimeout(function() {
              btn.classList.remove('show');
              // Empty the role="status" region so the next copy re-announces
              if (feedback) feedback.textContent = '';
            }, 2000);
          }).catch(function(err) {
            if (feedback) {
              feedback.textContent = 'Gagal menyalin';
              btn.classList.add('show');
              setTimeout(function() {
                btn.classList.remove('show');
                feedback.textContent = '';
              }, 2000);
            }
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
