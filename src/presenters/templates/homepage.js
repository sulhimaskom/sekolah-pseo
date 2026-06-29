const { escapeHtml } = require('../../../scripts/utils');
const slugify = require('../../../scripts/slugify');
const { getSchoolRelativePath } = require('../../services/PageBuilder');
const { generateBackToTopHtml, generateBackToTopScript } = require('./shared/back-to-top');
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');

// Hoisted constant - computed once at module load
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Extract unique values for filter dropdowns
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Object} - Object with unique provinces and types
 */
function extractFilterOptions(schools) {
  if (!Array.isArray(schools)) {
    return { provinces: [], types: [], statuses: [] };
  }

  const provinceSet = new Set();
  const typeSet = new Set();
  const statusSet = new Set();

  for (const school of schools) {
    if (school.provinsi) provinceSet.add(school.provinsi);
    if (school.bentuk_pendidikan) typeSet.add(school.bentuk_pendidikan);
    if (school.status) statusSet.add(school.status);
  }

  return {
    provinces: Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'id')),
    types: Array.from(typeSet).sort((a, b) => a.localeCompare(b, 'id')),
    statuses: Array.from(statusSet).sort(),
  };
}

/**
 * Prepare minimal school data for client-side search
 * @param {Array<Object>} schools - Array of school data objects
 * @returns {Array<Array<string>>} - Array of school data arrays (flat array format saves ~13% payload)
 *
 * Array index map (compact flat array eliminates per-object key overhead):
 *   [0] = n (npsn)
 *   [1] = a (nama)
 *   [2] = b (bentuk_pendidikan)
 *   [3] = s (status)
 *   [4] = al (alamat)
 *   [5] = kc (kecamatan)
 *   [6] = kk (kab_kota)
 *   [7] = p (provinsi)
 *   [8] = u (schoolUrl)
 */
function prepareSchoolDataForSearch(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.map(school => {
    // Compute the relative path once and reuse for URL
    // getSchoolRelativePath returns 'provinsi/.../npsn-slug.html'
    // client-side schoolUrl needs '/provinsi/.../npsn-slug.html'
    const relPath = getSchoolRelativePath(school);
    // Flat array format eliminates per-object key overhead (~39 bytes/school saved)
    // Client-side code converts back to named properties after loading
    return [
      school.npsn || '', // [0] n (npsn)
      school.nama || '', // [1] a (nama)
      school.bentuk_pendidikan || '', // [2] b (bentuk_pendidikan)
      school.status || '', // [3] s (status)
      school.alamat || '', // [4] al (alamat)
      school.kecamatan || '', // [5] kc (kecamatan)
      school.kab_kota || '', // [6] kk (kab_kota)
      school.provinsi || '', // [7] p (provinsi)
      '/' + relPath, // [8] u (schoolUrl)
    ];
  });
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
 * Aggregate province data and filter options in a single pass.
 * Combines aggregateByProvince() and extractFilterOptions() to
 * eliminate one full-school iteration during homepage generation.
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
  const { provinces, filterOptions } = aggregateProvinceAndFilters(schools);
  const provinceOptionsHtml = generateProvinceOptionsHtml(filterOptions.provinces);
  const typeOptionsHtml = generateTypeOptionsHtml(filterOptions.types);
  const statusOptionsHtml = generateStatusOptionsHtml(filterOptions.statuses);

  const totalSchools = schools.length;

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

          <div class="filter-item">
            <label for="status-filter" class="sr-only">Filter berdasarkan status</label>
            <select id="status-filter" class="filter-select">
              <option value="">Semua Status</option>
              ${statusOptionsHtml}
            </select>
          </div>
        </div>
        
        <div class="search-results-info" aria-live="polite">
          <span id="result-count">Menampilkan ${totalSchools.toLocaleString('id-ID')} sekolah</span>
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
    <p>&copy; ${CURRENT_YEAR} Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
    <p class="footer-links"><a href="/data/schools.csv" download>Unduh Data Sekolah (CSV)</a></p>
  </footer>
  
  ${generateBackToTopHtml()}
  
  <script>
    (function() {
      'use strict';
      
      // ===== Back to Top (shared module) =====
      ${generateBackToTopScript().replace('<script>', '').replace('</script>', '').trim()}
      
      // ===== School Search Functionality =====
      var schools = null;
      var searchLoaded = false;
      
      // Lazy-load school search data from external JSON file
      // Reduces initial HTML payload from 1.3MB to ~14KB
      // The data is stored as flat arrays for compactness (~13% smaller payload)
      // Convert to named properties after loading for maintainable client code
      fetch('/schools.json').then(function(r) {
        if (!r.ok) throw new Error('Failed to load search data');
        return r.json();
      }).then(function(d) {
        // Convert from compact flat array format to named properties
        // Array index map: [0]=npsn, [1]=nama, [2]=bentuk, [3]=status,
        //                  [4]=alamat, [5]=kecamatan, [6]=kab_kota,
        //                  [7]=provinsi, [8]=url
        if (d.length > 0 && Array.isArray(d[0])) {
          schools = d.map(function(s) {
            return { n: s[0], a: s[1], b: s[2], s: s[3], al: s[4], kc: s[5], kk: s[6], p: s[7], u: s[8] };
          });
        } else {
          // Backward compatibility: support legacy object format
          schools = d;
        }
        searchLoaded = true;
        // Re-run search if input already has value
        if (searchInput && (searchInput.value || provinceFilter.value || typeFilter.value || statusFilter.value)) {
          handleSearch();
        }
      }).catch(function() {
        // Search will remain disabled
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
          // Text search
          if (q) {
            var searchText = (school.a + ' ' + school.n + ' ' + school.al + ' ' + school.kk + ' ' + school.kc).toLowerCase();
            if (searchText.indexOf(q) === -1) {
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
      
      // Update search results display
      function updateSearchResults(results) {
        var count = results.length;
        var total = schools.length;
        
        var csvBtn = document.getElementById('download-csv');
        
        if (isSearching) {
          resultCountEl.textContent = 'Menampilkan ' + count.toLocaleString('id-ID') + ' dari ' + total.toLocaleString('id-ID') + ' sekolah';
          
          if (count > 0) {
            // Use DOM API instead of innerHTML for safer rendering
            searchResultsListEl.innerHTML = '';
            results.forEach(function(school) {
              searchResultsListEl.appendChild(createSchoolResultElement(school));
            });
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
        // Guard: data not loaded yet
        if (!schools) {
          resultCountEl.textContent = 'Memuat data...';
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
      
      function downloadCsv() {
        if (!schools || !isSearching) return;
          var query = searchInput.value;
          var province = provinceFilter.value;
          var type = typeFilter.value;
          var status = statusFilter.value;

          var results = filterSchools(query, province, type, status);
        
        if (results.length === 0) return;
        
        var csv = 'NPSN,Nama,Status,Jenjang,Provinsi,Kabupaten/Kota,Kecamatan,Alamat\n';
        
        results.forEach(function(s) {
          var npsn = '"' + (s.n || '') + '"';
          var nama = '"' + (s.a || '').replace(/"/g, '""') + '"';
          var status = '"' + (s.s === 'S' ? 'Swasta' : 'Negeri') + '"';
          var bentuk = '"' + (s.b || '') + '"';
          var provinsi = '"' + (s.p || '').replace(/"/g, '""') + '"';
          var kabkota = '"' + (s.kk || '').replace(/"/g, '""') + '"';
          var kecamatan = '"' + (s.kc || '').replace(/"/g, '""') + '"';
          var alamat = '"' + (s.al || '').replace(/"/g, '""') + '"';
          csv += [npsn, nama, status, bentuk, provinsi, kabkota, kecamatan, alamat].join(',') + '\n';
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
        // "/" to focus search
        if (e.key === '/' && document.activeElement !== searchInput) {
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
        
        // "Escape" to clear search and close
        if (e.key === 'Escape') {
          clearAutocomplete();
          if (document.activeElement === searchInput) {
            searchInput.blur();
          }
          searchInput.value = '';
          provinceFilter.value = '';
          typeFilter.value = '';
          statusFilter.value = '';
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
  aggregateProvinceAndFilters,
  prepareSchoolDataForSearch,
  extractFilterOptions,
};
