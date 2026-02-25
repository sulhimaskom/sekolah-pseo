const { escapeHtml, formatStatus } = require('../../../scripts/utils');

function generateSchoolPageHtml(school) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>${escapeHtml(school.nama)}</title>
  <link rel="stylesheet" href="/styles.css">
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
  <style>
    .btn-copy {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      background-color: var(--color-bg-accent);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: all var(--transition-fast) ease;
      margin-left: var(--spacing-sm);
      vertical-align: middle;
    }
    .btn-copy:hover {
      background-color: var(--color-bg-primary);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    .btn-copy:active {
      transform: translateY(1px);
    }
    .btn-copy:focus {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
    .btn-copy.success {
      background-color: #dcfce7;
      color: #166534;
      border-color: #166534;
    }
  </style>
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
            <dd>
              <span id="npsn-value">${escapeHtml(school.npsn)}</span>
              <button onclick="copyNpsn()" class="btn-copy" aria-label="Salin NPSN" id="copy-button">
                Salin
              </button>
            </dd>
            
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
    <p>&copy; 2026 Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
  </footer>

  <script>
    function copyNpsn() {
      const npsn = document.getElementById('npsn-value').innerText;
      const btn = document.getElementById('copy-button');

      navigator.clipboard.writeText(npsn).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Tersalin!';
        btn.classList.add('success');

        setTimeout(() => {
          btn.innerText = originalText;
          btn.classList.remove('success');
        }, 2000);
      }).catch(err => {
        console.error('Gagal menyalin: ', err);
      });
    }
  </script>
</body>
</html>`;
}

module.exports = {
  generateSchoolPageHtml
};
