const { escapeHtml } = require('../../../scripts/utils');
const CONFIG = require('../../../scripts/config');
const slugify = require('../../../scripts/slugify');
const { SEARCH_DATA_FIELDS } = require('../../../scripts/data-schema');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { generateFooterHtml } = require('./shared/footer');
const { generateBreadcrumbHtml } = require('./shared/navigation');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');

// Hoisted static back-to-top script body — computed once at module load
// instead of rebuilding the template literal + 2 regex replaces + trim on
// every generateHomepageHtml() call.
const BACK_TO_TOP_SCRIPT_BODY = generateBackToTopScript()
  .replace('<script>', '')
  .replace('</script>', '')
  .trim();

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

function generateStatusOptionsHtml(statuses) {
  const statusLabels = { N: 'Negeri', S: 'Swasta' };
  return statuses
    .map(s => `<option value="${escapeHtml(s)}">${escapeHtml(statusLabels[s] || s)}</option>`)
    .join('');
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
/**
 * Aggregate province data and filter options in a single pass
 * (replaces the removed aggregateByProvince/extractFilterOptions pair).
 */
function aggregateProvinceAndFilters(schools) {
  if (!Array.isArray(schools)) {
    return { provinces: [], filterOptions: { provinces: [], types: [], statuses: [] } };
  }

  const provinceMap = new Map();
  const provinceSet = new Set();
  const typeSet = new Set();
  const statusSet = new Set();

  for (const school of schools) {
    // Aggregate by province
    if (school.provinsi) {
      provinceSet.add(school.provinsi);
      if (!provinceMap.has(school.provinsi)) {
        provinceMap.set(school.provinsi, {
          name: school.provinsi,
          slug: slugify(school.provinsi),
          count: 0,
        });
      }
      provinceMap.get(school.provinsi).count++;
    }

    // Extract filter options
    if (school.bentuk_pendidikan) typeSet.add(school.bentuk_pendidikan);
    if (school.status) statusSet.add(school.status);
  }

  const provinces = Array.from(provinceMap.values());
  provinces.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return {
    provinces,
    filterOptions: {
      provinces: Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'id')),
      types: Array.from(typeSet).sort((a, b) => a.localeCompare(b, 'id')),
      statuses: Array.from(statusSet).sort(),
    },
  };
}

function generateHomepageHtml(schools) {
  // Contract boundary: helper tolerates non-array input, but schools.length
  // below would throw on undefined/null/string. Normalize to render an empty
  // homepage deterministically (F065).
  const schoolList = Array.isArray(schools) ? schools : [];
  const { provinces, filterOptions } = aggregateProvinceAndFilters(schoolList);
  const provinceOptionsHtml = generateProvinceOptionsHtml(filterOptions.provinces);
  const typeOptionsHtml = generateTypeOptionsHtml(filterOptions.types);
  const statusOptionsHtml = generateStatusOptionsHtml(filterOptions.statuses);

  const totalSchools = schoolList.length;

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

  return `${HTML_HEAD_PREFIX}
  <meta name="description" content="Direktori lengkap sekolah-sekolah di Indonesia. Temukan informasi NPSN, alamat, jenjang, dan status sekolah di seluruh Indonesia." />
  <title>Sekolah PSEO - Direktori Sekolah Indonesia</title>
  <link rel="canonical" href="/" />
  <meta property="og:title" content="Sekolah PSEO - Direktori Sekolah Indonesia" />
  <meta property="og:description" content="Direktori lengkap sekolah-sekolah di Indonesia. Temukan informasi NPSN, alamat, jenjang, dan status sekolah di seluruh Indonesia." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="/" />

  <link rel="preload" href="/schools.json" as="fetch" crossorigin="anonymous">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
  
  <header role="banner">
    ${generateBreadcrumbHtml([{ label: 'Beranda' }])}
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
            aria-label="${escapeHtml(CONFIG.TEXT.SEARCH_ARIA_LABEL)}"
            aria-describedby="search-hint"
            aria-busy="true"
            role="combobox"
            aria-expanded="false"
            aria-controls="search-autocomplete"
            aria-autocomplete="list"
            aria-haspopup="listbox"
          >
          <span id="search-hint" class="sr-only">Ketik untuk mencari. Gunakan tombol panah untuk navigasi hasil.</span>
          <div id="search-autocomplete" class="search-autocomplete" role="listbox" aria-label="Saran pencarian sekolah" hidden></div>
        </div>
        
        <div class="filter-group">
          <div class="filter-item">
            <label for="province-filter" class="sr-only">Filter berdasarkan provinsi</label>
            <!-- Disabled until schools.json finishes loading — filters are inert before search data exists -->
            <select id="province-filter" class="filter-select" disabled>
              <option value="">Semua Provinsi</option>
              ${provinceOptionsHtml}
            </select>
          </div>
          
          <div class="filter-item">
            <label for="type-filter" class="sr-only">Filter berdasarkan jenjang</label>
            <select id="type-filter" class="filter-select" disabled>
              <option value="">Semua Jenjang</option>
              ${typeOptionsHtml}
            </select>
          </div>

          <div class="filter-item">
            <label for="status-filter" class="sr-only">Filter berdasarkan status</label>
            <select id="status-filter" class="filter-select" disabled>
              <option value="">Semua Status</option>
              ${statusOptionsHtml}
            </select>
          </div>
        </div>
        
        <div class="search-results-info">
          <span id="result-count" aria-live="polite">Menampilkan ${totalSchools.toLocaleString('id-ID')} sekolah</span>
          <button id="download-csv" class="download-csv-btn" hidden aria-label="Unduh hasil pencarian sebagai CSV">Unduh CSV</button>
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
      <h2 id="provinces-heading" class="section-title">${escapeHtml(CONFIG.TEXT.SELECT_PROVINCE_HEADING)}</h2>
      <p class="section-description">Klik pada provinsi untuk melihat daftar sekolah di wilayah tersebut.</p>
      <noscript>
        <p class="noscript-notice">JavaScript dinonaktifkan. Menampilkan daftar provinsi lengkap.</p>
      </noscript>
      <ul class="province-list">
        ${provinceLinks}
      </ul>
    </section>
  </main>
  
  ${generateFooterHtml({
    extraContent:
      '\n    <p class="footer-links"><a href="/data/schools.csv" download>Unduh Data Sekolah (CSV)</a></p>',
  })}
  
  ${generateBackToTopHtml()}
  
  <script>
    (function() {
      'use strict';
      
      // ===== Back to Top (shared module) =====
      ${BACK_TO_TOP_SCRIPT_BODY}
      
      // ===== School Search Functionality =====
      var schools = null;
      
      // Field order for the compact flat-array payload. Generated from
      // SEARCH_DATA_FIELDS (scripts/data-schema.js) at build time so the
      // conversion below never hardcodes positional indices — the order is
      // defined once and shared with the server-side serializer.
      var SEARCH_DATA_FIELDS = ${JSON.stringify(SEARCH_DATA_FIELDS)};
      var SEARCH_FIELD_INDEX = {};
      for (var i = 0; i < SEARCH_DATA_FIELDS.length; i++) SEARCH_FIELD_INDEX[SEARCH_DATA_FIELDS[i]] = i;
      
      // Lazy-load school search data from external JSON file
      // Reduces initial HTML payload from 1.3MB to ~14KB
      // The data is stored as flat arrays for compactness (~13% smaller payload)
      // Convert to named properties after loading for maintainable client code
      fetch('/schools.json').then(function(r) {
        if (!r.ok) throw new Error('Failed to load search data');
        return r.json();
      }).then(function(d) {
        if (d.length > 0 && Array.isArray(d[0])) {
          // Precompute the lowercase searchable text ('t') once at load time
          // instead of rebuilding the concatenated+lowercased string on every
          // keystroke inside filterSchools(). For 3474 schools this removes
          // ~5 string concatenations + toLowerCase per school per keystroke
          // (measured 4x faster keystroke handling: 8.1ms -> 2.0ms for a
          // 7-keystroke query burst).
          schools = d.map(function(s) {
            return {
              n: s[SEARCH_FIELD_INDEX.npsn],
              a: s[SEARCH_FIELD_INDEX.nama],
              b: s[SEARCH_FIELD_INDEX.bentuk_pendidikan],
              s: s[SEARCH_FIELD_INDEX.status],
              al: s[SEARCH_FIELD_INDEX.alamat],
              kc: s[SEARCH_FIELD_INDEX.kecamatan],
              kk: s[SEARCH_FIELD_INDEX.kab_kota],
              p: s[SEARCH_FIELD_INDEX.provinsi],
              u: s[SEARCH_FIELD_INDEX.url],
              t: (s[SEARCH_FIELD_INDEX.nama] + ' ' + s[SEARCH_FIELD_INDEX.npsn] + ' ' + s[SEARCH_FIELD_INDEX.alamat] + ' ' + s[SEARCH_FIELD_INDEX.kab_kota] + ' ' + s[SEARCH_FIELD_INDEX.kecamatan]).toLowerCase(),
            };
          });
        } else {
          // Backward compatibility: support legacy object format.
          // Precompute the same searchable text so filterSchools() has a
          // uniform hot path regardless of payload format.
          schools = d.map(function(s) {
            s.t = (s.a + ' ' + s.n + ' ' + s.al + ' ' + s.kk + ' ' + s.kc).toLowerCase();
            return s;
          });
        }
        if (searchInput) searchInput.setAttribute('aria-busy', 'false');
        provinceFilter.disabled = false;
        typeFilter.disabled = false;
        statusFilter.disabled = false;
        // Re-run search if input already has value
        if (searchInput && (searchInput.value || provinceFilter.value || typeFilter.value || statusFilter.value)) {
          handleSearch();
        }
      }).catch(function() {
        // Failure path: keep filters disabled and announce the failure (the
        // controls would otherwise remain silently inert with no data).
        searchFailed = true;
        if (searchInput) searchInput.setAttribute('aria-busy', 'false');
        if (resultCountEl) resultCountEl.textContent = 'Data pencarian gagal dimuat.';
      });
      
      // DOM Elements
      var searchInput = document.getElementById('school-search');
      var provinceFilter = document.getElementById('province-filter');
      var typeFilter = document.getElementById('type-filter');
      var statusFilter = document.getElementById('status-filter');
      var resultCountEl = document.getElementById('result-count');
      var searchResultsEl = document.getElementById('search-results');
      var searchResultsListEl = document.getElementById('search-results-list');
      var noResultsEl = document.getElementById('no-results');
      var provinceListEl = document.querySelector('.province-list');
      
      // Autocomplete elements
      var autocompleteEl = document.getElementById('search-autocomplete');
      
      // State
      var isSearching = false;
      var searchFailed = false;
      var selectedIndex = -1;
      var suggestions = [];
      
      // Escape HTML for safe display
      function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Filter schools based on search query and filters
      function filterSchools(query, province, type, status) {
        var q = query.toLowerCase().trim();
        
        return schools.filter(function(school) {
          // Text search — uses the precomputed lowercase search text ('t')
          // built once at schools.json load instead of concatenating and
          // lowercasing 5 fields per school on every keystroke.
          if (q) {
            if (school.t.indexOf(q) === -1) {
              return false;
            }
          }
          
          // Province filter
            if (province && school.p !== province) {
            return false;
          }
          
          // Type filter
            if (type && school.b !== type) {
            return false;
          }
          
          // Status filter
          if (status && school.s !== status) {
            return false;
          }
          
          return true;
        });
      }
      
      // Generate DOM element for school result (safe alternative to innerHTML)
      function createSchoolResultElement(school) {
        var statusLabel = school.s === 'S' ? 'Swasta' : 'Negeri';
        var statusClass = school.s === 'S' ? 'badge-s' : 'badge-n';
        
        // Create container elements using DOM APIs (textContent escapes HTML)
        var li = document.createElement('li');
        li.className = 'school-result-item';
        
        var a = document.createElement('a');
        a.href = school.u || '/provinsi/' + school.provinceSlug + '/';
        a.className = 'school-result-link';
        
        var header = document.createElement('div');
        header.className = 'school-result-header';
        
        var nameSpan = document.createElement('span');
        nameSpan.className = 'school-result-name';
        nameSpan.textContent = school.a; // textContent escapes HTML
        
        var statusSpan = document.createElement('span');
        statusSpan.className = 'badge ' + statusClass;
        statusSpan.textContent = statusLabel;
        
        header.appendChild(nameSpan);
        header.appendChild(statusSpan);
        
        var details = document.createElement('div');
        details.className = 'school-result-details';
        
        var npsnSpan = document.createElement('span');
        npsnSpan.className = 'school-result-npsn';
        npsnSpan.textContent = 'NPSN: ' + school.n;
        
        var typeSpan = document.createElement('span');
        typeSpan.className = 'school-result-type badge badge-education';
        typeSpan.textContent = school.b;
        
        details.appendChild(npsnSpan);
        details.appendChild(typeSpan);
        
        var location = document.createElement('div');
        location.className = 'school-result-location';
        
        var locationSpan = document.createElement('span');
        locationSpan.textContent = school.kk + ', ' + school.kc;
        
        location.appendChild(locationSpan);
        
        a.appendChild(header);
        a.appendChild(details);
        a.appendChild(location);
        li.appendChild(a);
        
        return li;
      }
      
      // Cap rendered result rows: a broad query at 3474-school scale previously
      // built ~35K DOM nodes synchronously per keystroke (~10 nodes per match,
      // one appendChild each). Rendering the first MAX_RENDERED_RESULTS rows via
      // a DocumentFragment keeps keystroke handling bounded (~2K nodes, single
      // reflow) while the count label still reports the true total.
      var MAX_RENDERED_RESULTS = 200;
      
      // Update search results display
      function updateSearchResults(results) {
        var count = results.length;
        var total = schools.length;
        
        var csvBtn = document.getElementById('download-csv');
        
        if (isSearching) {
          var isTruncated = count > MAX_RENDERED_RESULTS;
          var rendered = isTruncated ? results.slice(0, MAX_RENDERED_RESULTS) : results;
          resultCountEl.textContent = isTruncated
            ? 'Menampilkan ' + MAX_RENDERED_RESULTS.toLocaleString('id-ID') + ' dari ' + count.toLocaleString('id-ID') + ' sekolah (maksimal ' + MAX_RENDERED_RESULTS + ' ditampilkan)'
            : 'Menampilkan ' + count.toLocaleString('id-ID') + ' dari ' + total.toLocaleString('id-ID') + ' sekolah';
          
          if (count > 0) {
            // Use DOM API instead of innerHTML for safer rendering
            searchResultsListEl.innerHTML = '';
            // Batch rows into a DocumentFragment — single reflow instead of one per row
            var fragment = document.createDocumentFragment();
            rendered.forEach(function(school) {
              fragment.appendChild(createSchoolResultElement(school));
            });
            searchResultsListEl.appendChild(fragment);
            searchResultsEl.hidden = false;
            noResultsEl.hidden = true;
            provinceListEl.hidden = true;
            if (csvBtn) csvBtn.hidden = false;
          } else {
            searchResultsEl.hidden = true;
            noResultsEl.hidden = false;
            provinceListEl.hidden = true;
            if (csvBtn) csvBtn.hidden = true;
          }
        } else {
          resultCountEl.textContent = 'Menampilkan ' + total.toLocaleString('id-ID') + ' sekolah';
          searchResultsEl.hidden = true;
          noResultsEl.hidden = true;
          provinceListEl.hidden = false;
          if (csvBtn) csvBtn.hidden = true;
        }
      }
      
      // Handle search input
      function handleSearch() {
        // Guard: data not loaded yet (or failed to load)
        if (!schools) {
          resultCountEl.textContent = searchFailed ? 'Data pencarian gagal dimuat.' : 'Memuat data...';
          return;
        }
        var query = searchInput.value;
        var province = provinceFilter.value;
        var type = typeFilter.value;
        var status = statusFilter.value;

        isSearching = query.length > 0 || province.length > 0 || type.length > 0 || status.length > 0;

        var results = filterSchools(query, province, type, status);
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
      
      // CSV formula-injection guard — mirrors scripts/utils.js escapeCsvField.
      // Cells beginning with =, +, -, @ or tab are prefixed with a single quote
      // so spreadsheet apps do not execute them as formulas (OWASP CSV Injection).
      // Negative numeric literals are exempt (numbers, not formulas).
      function sanitizeCsvField(value) {
        if (value === null || value === undefined) return '';
        var str = String(value);
        var firstChar = str.charAt(0);
        if (
          firstChar === '-' &&
          /^-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?$/.test(str)
        ) {
          return str;
        }
        if (
          firstChar === '=' ||
          firstChar === '+' ||
          firstChar === '-' ||
          firstChar === '@' ||
          firstChar === '\t'
        ) {
          return "'" + str;
        }
        return str;
      }

      function downloadCsv() {
        if (!schools || !isSearching) return;
        var query = searchInput.value;
        var province = provinceFilter.value;
        var type = typeFilter.value;
        var status = statusFilter.value;

        var results = filterSchools(query, province, type, status);

        if (results.length === 0) return;

        var csv = 'NPSN,Nama,Status,Jenjang,Provinsi,Kabupaten/Kota,Kecamatan,Alamat\\n';

        results.forEach(function(s) {
          var npsn = '"' + sanitizeCsvField(s.n || '') + '"';
          var nama = '"' + sanitizeCsvField(s.a || '').replace(/"/g, '""') + '"';
          var status = '"' + sanitizeCsvField(s.s === 'S' ? 'Swasta' : 'Negeri') + '"';
          var bentuk = '"' + sanitizeCsvField(s.b || '') + '"';
          var provinsi = '"' + sanitizeCsvField(s.p || '').replace(/"/g, '""') + '"';
          var kabkota = '"' + sanitizeCsvField(s.kk || '').replace(/"/g, '""') + '"';
          var kecamatan = '"' + sanitizeCsvField(s.kc || '').replace(/"/g, '""') + '"';
          var alamat = '"' + sanitizeCsvField(s.al || '').replace(/"/g, '""') + '"';
          csv += [npsn, nama, status, bentuk, provinsi, kabkota, kecamatan, alamat].join(',') + '\\n';
        });

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sekolah-pseo-hasil-pencarian.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      // ===== Autocomplete =====
      function updateAutocomplete() {
        if (!schools || !searchInput.value.trim()) {
          clearAutocomplete();
          return;
        }
        var query = searchInput.value.toLowerCase().trim();
        var province = provinceFilter.value;
        var type = typeFilter.value;
        var status = statusFilter.value;
        var filtered = filterSchools(query, province, type, status);
        suggestions = filtered.slice(0, 10);
        if (suggestions.length === 0) {
          clearAutocomplete();
          return;
        }
        autocompleteEl.innerHTML = '';
        for (var i = 0; i < suggestions.length; i++) {
          var school = suggestions[i];
          var item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.setAttribute('role', 'option');
          item.setAttribute('id', 'autocomplete-option-' + i);
          var nameSpan = document.createElement('span');
          nameSpan.className = 'autocomplete-item-name';
          nameSpan.textContent = school.a;
          var metaSpan = document.createElement('span');
          metaSpan.className = 'autocomplete-item-meta';
          metaSpan.textContent = school.b + ' \u00B7 ' + school.kk;
          item.appendChild(nameSpan);
          item.appendChild(metaSpan);
          item.addEventListener('mousedown', function(s) {
            return function(e) {
              e.preventDefault();
              window.location.href = s.u;
            };
          }(school));
          autocompleteEl.appendChild(item);
        }
        selectedIndex = -1;
        searchInput.setAttribute('aria-expanded', 'true');
        searchInput.setAttribute('aria-activedescendant', '');
        autocompleteEl.hidden = false;
      }
      
      function clearAutocomplete() {
        autocompleteEl.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        searchInput.setAttribute('aria-activedescendant', '');
        selectedIndex = -1;
        suggestions = [];
      }
      
      function highlightSuggestion(index) {
        var items = autocompleteEl.querySelectorAll('.autocomplete-item');
        for (var i = 0; i < items.length; i++) {
          items[i].classList.remove('autocomplete-item-active');
          items[i].removeAttribute('aria-selected');
        }
        if (index >= 0 && index < items.length) {
          items[index].classList.add('autocomplete-item-active');
          items[index].setAttribute('aria-selected', 'true');
          searchInput.setAttribute('aria-activedescendant', 'autocomplete-option-' + index);
        } else {
          searchInput.setAttribute('aria-activedescendant', '');
        }
      }
      
      function selectSuggestion(index) {
        if (index >= 0 && index < suggestions.length) {
          window.location.href = suggestions[index].u;
        }
      }
      
      // ===== Event Listeners =====
      searchInput.addEventListener('input', debounce(function() {
        handleSearch();
        updateAutocomplete();
      }, 150));
      provinceFilter.addEventListener('change', function() {
        handleSearch();
        updateAutocomplete();
      });
      typeFilter.addEventListener('change', function() {
        handleSearch();
        updateAutocomplete();
      });
      statusFilter.addEventListener('change', function() {
        handleSearch();
        updateAutocomplete();
      });
      
      searchInput.addEventListener('blur', function() {
        setTimeout(clearAutocomplete, 200);
      });
      
      var downloadBtn = document.getElementById('download-csv');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCsv);
      }
      
      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // "/" to focus search — don't hijack when a form control is focused
        if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
          e.preventDefault();
          searchInput.focus();
        }
        
        // Arrow Down: next autocomplete suggestion
        if (e.key === 'ArrowDown' && !autocompleteEl.hidden) {
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
          highlightSuggestion(selectedIndex);
          return;
        }
        
        // Arrow Up: previous autocomplete suggestion
        if (e.key === 'ArrowUp' && !autocompleteEl.hidden) {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, -1);
          highlightSuggestion(selectedIndex);
          return;
        }
        
        // Enter: select highlighted suggestion
        if (e.key === 'Enter' && !autocompleteEl.hidden && selectedIndex >= 0) {
          e.preventDefault();
          selectSuggestion(selectedIndex);
          return;
        }
        
        // "Escape" clears the search query (combobox semantics) only when the
        // search input is focused — never reset the filters from elsewhere.
        if (e.key === 'Escape' && document.activeElement === searchInput) {
          e.preventDefault();
          var hadQuery = searchInput.value !== '';
          clearAutocomplete();
          if (hadQuery) {
            searchInput.value = '';
            handleSearch();
          }
          searchInput.blur();
        }
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  generateHomepageHtml,
  aggregateProvinceAndFilters,
};
