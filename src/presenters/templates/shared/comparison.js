/**
 * Shared school comparison tray (FEAT-005).
 * Pure front-end composition — no external dependencies.
 *
 * Each school page embeds its own data as a <script type="application/json"
 * id="school-data"> payload. A "Bandingkan" button on the school page adds
 * that school to a comparison tray persisted in localStorage (max 3). The
 * tray is injected via the shared footer so it is present on every page type
 * and survives navigation between static pages.
 *
 * Usage:
 *   generateComparisonTrayHtml()   -> <aside> tray widget
 *   generateComparisonScript()     -> <script> client logic (localStorage,
 *                                     add/remove/limit-3, side-by-side table)
 *
 * Mirrors the back-to-top.js generator pattern (Html + Script pair).
 */

'use strict';

const COMPARISON_STORAGE_KEY = 'sekolah-pseo:comparison:v1';
const COMPARISON_MAX = 3;

/** Metrics compared side-by-side, in display order. */
const COMPARISON_METRICS = [
  { key: 'npsn', label: 'NPSN' },
  { key: 'status', label: 'Status' },
  { key: 'bentuk_pendidikan', label: 'Jenjang' },
  { key: 'kecamatan', label: 'Kecamatan' },
  { key: 'kab_kota', label: 'Kabupaten/Kota' },
  { key: 'provinsi', label: 'Provinsi' },
  { key: 'koordinat', label: 'Koordinat' },
];

/**
 * Generate the comparison tray widget HTML (hidden until schools are added).
 * @returns {string} Tray markup
 */
function generateComparisonTrayHtml() {
  return `
  <aside class="comparison-tray" id="comparison-tray" role="region" aria-label="Perbandingan sekolah" hidden>
    <div class="comparison-tray-header">
      <h2 class="comparison-tray-title">Bandingkan Sekolah</h2>
      <button type="button" class="comparison-tray-toggle" id="comparison-toggle"
        aria-expanded="false" aria-controls="comparison-panel" hidden>
        Lihat Perbandingan
      </button>
    </div>
    <ul class="comparison-tray-list" id="comparison-tray-list"></ul>
    <p class="comparison-tray-status" id="comparison-tray-status" role="status" aria-live="polite"></p>
    <div class="comparison-panel" id="comparison-panel" hidden>
      <div class="comparison-table-wrap" tabindex="0">
        <table class="comparison-table">
          <thead id="comparison-thead"></thead>
          <tbody id="comparison-tbody"></tbody>
        </table>
      </div>
    </div>
  </aside>`;
}

/**
 * Generate the client-side comparison script.
 * - restores the tray from localStorage on load
 * - wires .btn-compare buttons on school pages (adds the current #school-data)
 * - rejects duplicates, blocks a 4th selection, allows removal
 * - renders a side-by-side table (visible for >= 2 selections)
 *
 * All school-derived strings are rendered via textContent (never innerHTML)
 * to prevent XSS. localStorage failures fall back to session-only behavior.
 * @returns {string} Script markup
 */
function generateComparisonScript() {
  return `
  <script>
    (function() {
      'use strict';
      var STORAGE_KEY = ${JSON.stringify(COMPARISON_STORAGE_KEY)};
      var MAX_SCHOOLS = ${COMPARISON_MAX};

      var tray = document.getElementById('comparison-tray');
      if (!tray) return;

      var trayList = document.getElementById('comparison-tray-list');
      var trayStatus = document.getElementById('comparison-tray-status');
      var toggleBtn = document.getElementById('comparison-toggle');
      var panel = document.getElementById('comparison-panel');
      var thead = document.getElementById('comparison-thead');
      var tbody = document.getElementById('comparison-tbody');

      var METRICS = ${JSON.stringify(COMPARISON_METRICS)};

      function loadTray() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return [];
          var parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }

      function saveTray(items) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
          // localStorage unavailable (private mode / quota) — session-only tray
        }
      }

      function formatStatus(status) {
        if (!status) return 'Tidak Diketahui';
        var normalized = String(status).trim().toUpperCase();
        if (normalized === 'N') return 'Negeri';
        if (normalized === 'S') return 'Swasta';
        return status;
      }

      function formatCoordinates(school) {
        if (school.lat && school.lon) return school.lat + ', ' + school.lon;
        return '\u2014';
      }

      function getSchoolValue(school, metricKey) {
        if (metricKey === 'status') return formatStatus(school.status);
        if (metricKey === 'koordinat') return formatCoordinates(school);
        return school[metricKey] || '\u2014';
      }

      function getCurrentSchool() {
        var dataEl = document.getElementById('school-data');
        if (!dataEl) return null;
        try {
          return JSON.parse(dataEl.textContent);
        } catch (e) {
          return null;
        }
      }

      function announce(message) {
        trayStatus.textContent = message;
      }

      function renderTable(items) {
        if (items.length < 2) {
          panel.hidden = true;
          toggleBtn.hidden = true;
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.textContent = 'Lihat Perbandingan';
          return;
        }

        thead.innerHTML = '';
        var headRow = document.createElement('tr');
        var cornerTh = document.createElement('th');
        cornerTh.scope = 'col';
        cornerTh.textContent = 'Kriteria';
        headRow.appendChild(cornerTh);
        items.forEach(function(school) {
          var th = document.createElement('th');
          th.scope = 'col';
          th.textContent = school.nama;
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        tbody.innerHTML = '';
        METRICS.forEach(function(metric) {
          var tr = document.createElement('tr');
          var labelTh = document.createElement('th');
          labelTh.scope = 'row';
          labelTh.textContent = metric.label;
          tr.appendChild(labelTh);
          items.forEach(function(school) {
            var td = document.createElement('td');
            td.textContent = getSchoolValue(school, metric.key);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }

      function syncCompareButtons(items) {
        var current = getCurrentSchool();
        document.querySelectorAll('.btn-compare').forEach(function(btn) {
          if (!current) {
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = 'Bandingkan';
            return;
          }
          var inTray = items.some(function(s) { return s.npsn === current.npsn; });
          btn.setAttribute('aria-pressed', inTray ? 'true' : 'false');
          btn.textContent = inTray ? 'Dibandingkan' : 'Bandingkan';
        });
      }

      function render() {
        var items = loadTray();

        trayList.innerHTML = '';
        items.forEach(function(school) {
          var li = document.createElement('li');
          li.className = 'comparison-tray-item';

          var name = document.createElement('a');
          name.className = 'comparison-tray-name';
          name.href = school.url || '#';
          name.textContent = school.nama;

          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'comparison-tray-remove';
          remove.setAttribute('aria-label', 'Hapus ' + school.nama + ' dari perbandingan');
          remove.textContent = '\u00d7';
          remove.addEventListener('click', function() {
            var next = loadTray().filter(function(s) { return s.npsn !== school.npsn; });
            saveTray(next);
            render();
            announce(school.nama + ' dihapus dari perbandingan.');
          });

          li.appendChild(name);
          li.appendChild(remove);
          trayList.appendChild(li);
        });

        var visible = items.length > 0;
        tray.hidden = !visible;
        if (!visible) {
          renderTable([]);
          syncCompareButtons([]);
          return;
        }
        renderTable(items);
        syncCompareButtons(items);
      }

      toggleBtn.addEventListener('click', function() {
        var expanded = !panel.hidden;
        panel.hidden = expanded;
        toggleBtn.setAttribute('aria-expanded', String(!expanded));
        toggleBtn.textContent = expanded ? 'Lihat Perbandingan' : 'Sembunyikan Perbandingan';
      });

      document.querySelectorAll('.btn-compare').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var school = getCurrentSchool();
          if (!school) {
            announce('Data sekolah tidak tersedia.');
            return;
          }
          var items = loadTray();
          var exists = items.some(function(s) { return s.npsn === school.npsn; });
          if (exists) {
            announce(school.nama + ' sudah ada dalam perbandingan.');
            return;
          }
          if (items.length >= MAX_SCHOOLS) {
            announce('Maksimal ' + MAX_SCHOOLS + ' sekolah dapat dibandingkan.');
            return;
          }
          items.push(school);
          saveTray(items);
          render();
          announce(school.nama + ' ditambahkan ke perbandingan.');
        });
      });

      render();
    })();
  </script>`;
}

module.exports = {
  generateComparisonTrayHtml,
  generateComparisonScript,
  COMPARISON_STORAGE_KEY,
  COMPARISON_MAX,
  COMPARISON_METRICS,
};
