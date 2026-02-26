const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');

/**
 * Extract unique values for filter dropdowns
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Object} - Object with unique provinces and types
 */
function extractFilterOptions(schools) {
  if (!Array.isArray(schools)) {
    return { provinces: [], types: [] };
  }

  const provinceSet = new Set();
  const typeSet = new Set();

  for (const school of schools) {
    if (school.provinsi) provinceSet.add(school.provinsi);
    if (school.bentuk_pendidikan) typeSet.add(school.bentuk_pendidikan);
  }

  return {
    provinces: Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'id')),
    types: Array.from(typeSet).sort((a, b) => a.localeCompare(b, 'id')),
  };
}

/**
 * Prepare minimal school data for client-side search
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Object>} - Array of school objects with search-relevant fields
 */
function prepareSchoolDataForSearch(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.map(school => ({
    npsn: school.npsn || '',
    nama: school.nama || '',
    bentuk: school.bentuk_pendidikan || '',
    status: school.status || '',
    alamat: school.alamat || '',
    kecamatan: school.kecamatan || '',
    kab_kota: school.kab_kota || '',
    provinsi: school.provinsi || '',
    slug: slugify(school.nama || ''),
    provinceSlug: slugify(school.provinsi || ''),
  }));
}

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
 * Generate filter options HTML for dropdowns
 * @param {Object} options - Filter options object
 * @returns {string} - HTML string for province options
 */
function generateProvinceOptionsHtml(provinces) {
  return provinces.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

/**
 * Generate type options HTML for dropdowns
 * @param {Array<string>} types - Array of school types
 * @returns {string} - HTML string for type options
 */
function generateTypeOptionsHtml(types) {
  return types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

/**
 * Generate homepage HTML
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {string} - Homepage HTML
 */
/**
 * Generate homepage HTML
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {string} - Homepage HTML
 */
function generateHomepageHtml(schools) {
  const provinces = aggregateByProvince(schools);
  const filterOptions = extractFilterOptions(schools);
  // Escape script tags to prevent XSS in JSON data
  let safeSchoolDataJson = JSON.stringify(prepareSchoolDataForSearch(schools));
  safeSchoolDataJson = safeSchoolDataJson.replace(/<script/gi, '<\\script');
  safeSchoolDataJson = safeSchoolDataJson.replace(/<\/script>/gi, '<\\/script>');
  const provinceOptionsHtml = generateProvinceOptionsHtml(filterOptions.provinces);
  const typeOptionsHtml = generateTypeOptionsHtml(filterOptions.types);

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
  <meta http-equiv="Permissions-Policy" content="accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()">
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
  <meta http-equiv="Cross-Origin-Resource-Policy" content="same-origin">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">
  <title>Sekolah PSEO - Direktori Sekolah Indonesia</title>
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

    <!-- Search Section -->
    <section aria-labelledby="search-heading" class="search-section">
      <h2 id="search-heading" class="sr-only">Pencarian Sekolah</h2>
      <div class="search-container">
        <div class="search-input-wrapper">
          <label for="school-search" class="sr-only">Cari sekolah</label>
          <input 
            type="search" 
            id="school-search" 
            class="search-input" 
            placeholder="Cari sekolah... (Tekan / untuk fokus)"
            aria-describedby="search-hint"
          >
          <span id="search-hint" class="sr-only">Ketik untuk mencari. Gunakan tombol panah untuk navigasi hasil.</span>
        </div>
        
        <div class="filter-group">
          <div class="filter-item">
            <label for="province-filter" class="sr-only">Filter berdasarkan provinsi</label>
            <select id="province-filter" class="filter-select">
              <option value="">Semua Provinsi</option>
              ${provinceOptionsHtml}
            </select>
          </div>
          
          <div class="filter-item">
            <label for="type-filter" class="sr-only">Filter berdasarkan jenjang</label>
            <select id="type-filter" class="filter-select">
              <option value="">Semua Jenjang</option>
              ${typeOptionsHtml}
            </select>
          </div>
        </div>
        
        <div class="search-results-info" aria-live="polite">
          <span id="result-count">Menampilkan ${totalSchools.toLocaleString('id-ID')} sekolah</span>
        </div>
      </div>
      
      <!-- Search Results (hidden by default, shown when searching) -->
      <div id="search-results" class="search-results" hidden>
        <ul id="search-results-list" class="school-results-list"></ul>
      </div>
      
      <!-- No results message -->
      <div id="no-results" class="no-results" hidden>
        <p>Tidak ada sekolah yang sesuai dengan pencarian Anda.</p>
      </div>
    </section>

    <section aria-labelledby="provinces-heading">
      <h2 id="provinces-heading" class="section-title">Pilih Provinsi</h2>
      <p class="section-description">Klik pada provinsi untuk melihat daftar sekolah di wilayah tersebut.</p>
      <noscript>
        <p class="noscript-notice">JavaScript dinonaktifkan. Menampilkan daftar provinsi lengkap.</p>
      </noscript>
      <ul class="province-list">
        ${provinceLinks}
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
  
  <!-- Embedded school data for client-side search -->
  <script id="school-data" type="application/json">${safeSchoolDataJson}</script>
  
  <script>
    (function() {
      'use strict';
      
      // ===== Back to Top Functionality =====
      var backToTop = document.querySelector('.back-to-top');
      if (backToTop) {
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
      }
      
      // ===== School Search Functionality =====
      var schoolDataElement = document.getElementById('school-data');
      if (!schoolDataElement) return;
      
      var schools = JSON.parse(schoolDataElement.textContent);
      if (!schools || schools.length === 0) return;
      
      // DOM Elements
      var searchInput = document.getElementById('school-search');
      var provinceFilter = document.getElementById('province-filter');
      var typeFilter = document.getElementById('type-filter');
      var resultCountEl = document.getElementById('result-count');
      var searchResultsEl = document.getElementById('search-results');
      var searchResultsListEl = document.getElementById('search-results-list');
      var noResultsEl = document.getElementById('no-results');
      var provinceListEl = document.querySelector('.province-list');
      
      // State
      var isSearching = false;
      
      // Escape HTML for safe display
      function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Filter schools based on search query and filters
      function filterSchools(query, province, type) {
        var q = query.toLowerCase().trim();
        
        return schools.filter(function(school) {
          // Text search
          if (q) {
            var searchText = (school.nama + ' ' + school.npsn + ' ' + school.alamat + ' ' + school.kab_kota + ' ' + school.kecamatan).toLowerCase();
            if (searchText.indexOf(q) === -1) {
              return false;
            }
          }
          
          // Province filter
          if (province && school.provinsi !== province) {
            return false;
          }
          
          // Type filter
          if (type && school.bentuk !== type) {
            return false;
          }
          
          return true;
        });
      }
      
      // Generate school result item HTML
      function generateSchoolResultHtml(school) {
        var statusLabel = school.status === 'S' ? 'Swasta' : 'Negeri';
        var statusClass = school.status === 'S' ? 'badge-s' : 'badge-n';
        
        return '<li class="school-result-item">' +
          '<a href="/provinsi/' + escapeHtml(school.provinceSlug) + '/" class="school-result-link">' +
            '<div class="school-result-header">' +
              '<span class="school-result-name">' + escapeHtml(school.nama) + '</span>' +
              '<span class="badge ' + statusClass + '">' + escapeHtml(statusLabel) + '</span>' +
            '</div>' +
            '<div class="school-result-details">' +
              '<span class="school-result-npsn">NPSN: ' + escapeHtml(school.npsn) + '</span>' +
              '<span class="school-result-type badge badge-education">' + escapeHtml(school.bentuk) + '</span>' +
            '</div>' +
            '<div class="school-result-location">' +
              '<span>' + escapeHtml(school.kab_kota) + ', ' + escapeHtml(school.kecamatan) + '</span>' +
            '</div>' +
          '</a>' +
        '</li>';
      }
      
      // Update search results display
      function updateSearchResults(results) {
        var count = results.length;
        var total = schools.length;
        
        if (isSearching) {
          resultCountEl.textContent = 'Menampilkan ' + count.toLocaleString('id-ID') + ' dari ' + total.toLocaleString('id-ID') + ' sekolah';
          
          if (count > 0) {
            searchResultsListEl.innerHTML = results.map(generateSchoolResultHtml).join('');
            searchResultsEl.hidden = false;
            noResultsEl.hidden = true;
            provinceListEl.hidden = true;
          } else {
            searchResultsEl.hidden = true;
            noResultsEl.hidden = false;
            provinceListEl.hidden = true;
          }
        } else {
          resultCountEl.textContent = 'Menampilkan ' + total.toLocaleString('id-ID') + ' sekolah';
          searchResultsEl.hidden = true;
          noResultsEl.hidden = true;
          provinceListEl.hidden = false;
        }
      }
      
      // Handle search input
      function handleSearch() {
        var query = searchInput.value;
        var province = provinceFilter.value;
        var type = typeFilter.value;
        
        isSearching = query.length > 0 || province.length > 0 || type.length > 0;
        
        var results = filterSchools(query, province, type);
        updateSearchResults(results);
      }
      
      // Debounce function for search input
      function debounce(func, wait) {
        var timeout;
        return function() {
          var context = this;
          var args = arguments;
          clearTimeout(timeout);
          timeout = setTimeout(function() {
            func.apply(context, args);
          }, wait);
        };
      }
      
      // Event listeners
      searchInput.addEventListener('input', debounce(handleSearch, 150));
      provinceFilter.addEventListener('change', handleSearch);
      typeFilter.addEventListener('change', handleSearch);
      
      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // "/" to focus search
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        
        // "Escape" to clear search and close
        if (e.key === 'Escape') {
          if (document.activeElement === searchInput) {
            searchInput.blur();
          }
          searchInput.value = '';
          provinceFilter.value = '';
          typeFilter.value = '';
          isSearching = false;
          handleSearch();
        }
      });
      
      // Show search section when user starts typing (accessibility)
      searchInput.addEventListener('focus', function() {
        document.querySelector('.search-section').classList.add('search-active');
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  generateHomepageHtml,
  aggregateByProvince,
};
