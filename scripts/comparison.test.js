const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  generateComparisonTrayHtml,
  generateComparisonScript,
  COMPARISON_STORAGE_KEY,
  COMPARISON_MAX,
  COMPARISON_METRICS,
} = require('../src/presenters/templates/shared/comparison');

describe('generateComparisonTrayHtml', () => {
  it('renders a hidden region labelled for the comparison tray', () => {
    const html = generateComparisonTrayHtml();
    assert.ok(html.includes('<aside class="comparison-tray"'));
    assert.ok(html.includes('id="comparison-tray"'));
    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label="Perbandingan sekolah"'));
    assert.ok(html.includes('hidden'));
  });

  it('includes the toggle button wired to the comparison panel', () => {
    const html = generateComparisonTrayHtml();
    assert.ok(html.includes('id="comparison-toggle"'));
    assert.ok(html.includes('aria-controls="comparison-panel"'));
    assert.ok(html.includes('aria-expanded="false"'));
  });

  it('includes a live region for add/remove announcements', () => {
    const html = generateComparisonTrayHtml();
    assert.ok(html.includes('id="comparison-tray-status"'));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-live="polite"'));
  });

  it('includes the side-by-side table containers', () => {
    const html = generateComparisonTrayHtml();
    assert.ok(html.includes('id="comparison-thead"'));
    assert.ok(html.includes('id="comparison-tbody"'));
    assert.ok(html.includes('class="comparison-table"'));
  });
});

describe('generateComparisonScript', () => {
  it('embeds the localStorage storage key', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes(JSON.stringify(COMPARISON_STORAGE_KEY)));
    assert.ok(script.includes('localStorage.getItem'));
    assert.ok(script.includes('localStorage.setItem'));
  });

  it('enforces the max-3 comparison cap', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes(`MAX_SCHOOLS = ${COMPARISON_MAX}`));
    assert.ok(script.includes("'Maksimal ' + MAX_SCHOOLS + ' sekolah"));
  });

  it('rejects duplicate selections and blocks a 4th school', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes('sudah ada dalam perbandingan'));
    assert.ok(script.includes('items.length >= MAX_SCHOOLS'));
  });

  it('renders all comparison metrics from the shared list', () => {
    const script = generateComparisonScript();
    for (const metric of COMPARISON_METRICS) {
      assert.ok(script.includes(metric.label), `missing metric label: ${metric.label}`);
    }
  });

  it('reads the current school from the embedded #school-data payload', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes("getElementById('school-data')"));
    assert.ok(script.includes('JSON.parse(dataEl.textContent)'));
  });

  it('renders school-derived strings via textContent to prevent XSS', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes('td.textContent = getSchoolValue'));
    assert.ok(script.includes('th.textContent = school.nama'));
    assert.ok(script.includes('name.textContent = school.nama'));
  });

  it('formats status and coordinates for display', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes("if (normalized === 'N') return 'Negeri'"));
    assert.ok(script.includes("if (normalized === 'S') return 'Swasta'"));
    assert.ok(
      script.includes("if (school.lat && school.lon) return school.lat + ', ' + school.lon")
    );
  });

  it('wires .btn-compare buttons and updates their pressed state', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes("querySelectorAll('.btn-compare')"));
    assert.ok(script.includes('aria-pressed'));
    assert.ok(script.includes("btn.textContent = inTray ? 'Dibandingkan' : 'Bandingkan'"));
  });

  it('falls back safely when localStorage is unavailable', () => {
    const script = generateComparisonScript();
    assert.ok(script.includes('catch (e) {'));
    assert.ok(script.includes('return [];'));
  });
});
