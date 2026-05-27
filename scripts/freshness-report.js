/**
 * Data Freshness Report Generator
 *
 * Generates a static HTML report page showing data freshness and quality metrics.
 * The report is written to dist/freshness-report/index.html and can be served
 * alongside the rest of the static site.
 *
 * Usage:
 *   node scripts/freshness-report.js                    # Generate report
 *   node scripts/freshness-report.js --stdout           # Print HTML to stdout
 *   node scripts/freshness-report.js --json             # Print JSON report data
 */

'use strict';

const path = require('path');
const { getDataFreshness, getDataQualityMetrics } = require('./check-freshness');
const { safeWriteFile, safeMkdir } = require('./fs-safe');
const CONFIG = require('./config');
const { DESIGN_TOKENS } = require('../src/presenters/design-system');

const REPORT_DIR = path.join(CONFIG.DIST_DIR, 'freshness-report');
const REPORT_FILE = path.join(REPORT_DIR, 'index.html');

/**
 * Generate CSS for the report page using design tokens
 */
function generateStyles() {
  const c = DESIGN_TOKENS.colors;
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${c.background.secondary};
        color: ${c.text.primary};
        line-height: 1.6;
        padding: 2rem 1rem;
      }
      .container { max-width: 900px; margin: 0 auto; }
      h1 {
        font-size: 1.75rem;
        color: ${c.text.primary};
        margin-bottom: 0.5rem;
      }
      h2 {
        font-size: 1.25rem;
        color: ${c.text.secondary};
        margin: 1.5rem 0 0.75rem;
      }
      .subtitle {
        color: ${c.text.light};
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
      }
      .card {
        background: ${c.background.primary};
        border: 1px solid ${c.border};
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }
      .card-title {
        font-size: 0.875rem;
        color: ${c.text.light};
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }
      .card-value {
        font-size: 2rem;
        font-weight: 700;
        color: ${c.text.primary};
      }
      .card-label {
        font-size: 0.875rem;
        color: ${c.text.secondary};
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-fresh {
        background: ${c.badge.n.bg};
        color: ${c.badge.n.text};
      }
      .status-stale {
        background: #fef2f2;
        color: #991b1b;
      }
      .metric-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .metric-bar-track {
        flex: 1;
        height: 8px;
        background: ${c.background.accent};
        border-radius: 4px;
        overflow: hidden;
      }
      .metric-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .metric-bar-label {
        min-width: 100px;
        font-size: 0.875rem;
        color: ${c.text.secondary};
      }
      .metric-bar-value {
        min-width: 80px;
        text-align: right;
        font-size: 0.875rem;
        font-weight: 600;
        color: ${c.text.primary};
      }
      .footer {
        text-align: center;
        color: ${c.text.light};
        font-size: 0.75rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid ${c.border};
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: ${c.dark.background.secondary};
          color: ${c.dark.text.primary};
        }
        h1 { color: ${c.dark.text.primary}; }
        h2 { color: ${c.dark.text.secondary}; }
        .subtitle { color: ${c.dark.text.light}; }
        .card {
          background: ${c.dark.background.primary};
          border-color: #374151;
        }
        .card-value { color: ${c.dark.text.primary}; }
        .card-label { color: ${c.dark.text.secondary}; }
        .card-title { color: ${c.dark.text.light}; }
        .metric-bar-label { color: ${c.dark.text.secondary}; }
        .metric-bar-value { color: ${c.dark.text.primary}; }
        .metric-bar-track { background: ${c.dark.background.accent}; }
        .footer { color: ${c.dark.text.light}; border-top-color: #374151; }
      }
    </style>`;
}

/**
 * Generate the HTML report
 * @param {Object} freshness - Data freshness info from getDataFreshness()
 * @param {Object|null} quality - Data quality metrics from getDataQualityMetrics()
 * @returns {string} HTML string
 */
function generateHtml(freshness, quality) {
  const isFresh = freshness.isFresh;
  const statusClass = isFresh ? 'status-fresh' : 'status-stale';
  const statusText = isFresh ? 'Fresh' : 'Stale';

  let qualitySection = '';
  if (quality && quality.metrics) {
    const metrics = quality.metrics;
    qualitySection = `
      <h2>Data Quality Metrics</h2>
      <div class="card">
        <div class="card-label" style="margin-bottom:0.75rem;">
          Total Records: <strong>${quality.totalRecords}</strong>
        </div>
        ${Object.entries(metrics)
          .map(([key, val]) => {
            const pct = parseFloat(val.percentage);
            const barColor = pct >= 99 ? '#22c55e' : pct >= 90 ? '#eab308' : '#ef4444';
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            return `
              <div class="metric-bar">
                <span class="metric-bar-label">${label}</span>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill" style="width:${val.percentage}%;background:${barColor}"></div>
                </div>
                <span class="metric-bar-value">${val.percentage}%</span>
              </div>`;
          })
          .join('')}
      </div>`;
  }

  const title = 'Data Freshness Report';
  const siteUrl = CONFIG.SITE_URL || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Sekolah PSEO</title>
  <meta name="description" content="Data freshness and quality report for Sekolah PSEO school directory">
  ${generateStyles()}
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p class="subtitle">
      Generated on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </p>

    <div class="grid">
      <div class="card">
        <div class="card-title">Status</div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="card">
        <div class="card-title">Last Updated</div>
        <div class="card-value">${freshness.date || 'N/A'}</div>
        <div class="card-label">${freshness.daysAgo !== null ? `${freshness.daysAgo} days ago` : 'Unknown'}</div>
      </div>
      <div class="card">
        <div class="card-title">Schools</div>
        <div class="card-value">${freshness.recordCount.toLocaleString()}</div>
        <div class="card-label">Total records</div>
      </div>
      <div class="card">
        <div class="card-title">Threshold</div>
        <div class="card-value">${freshness.maxAgeDays} days</div>
        <div class="card-label">Max data age</div>
      </div>
    </div>

    ${qualitySection}

    <div class="footer">
      ${siteUrl ? `<a href="${siteUrl}">${siteUrl}</a> &mdash; ` : ''}
      Sekolah PSEO &mdash; Data Freshness Report
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate JSON report data
 * @returns {Object} Report data
 */
function getReportData() {
  const freshness = getDataFreshness();
  const quality = getDataQualityMetrics();
  return {
    ...freshness,
    quality,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--json')) {
    const data = getReportData();
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  const freshness = getDataFreshness();
  const quality = getDataQualityMetrics();

  if (!freshness.exists) {
    console.error('No schools.csv found. Run ETL first.');
    process.exit(1);
  }

  if (args.includes('--stdout')) {
    process.stdout.write(generateHtml(freshness, quality) + '\n');
    return;
  }

  await safeMkdir(REPORT_DIR, { recursive: true });
  const html = generateHtml(freshness, quality);
  await safeWriteFile(REPORT_FILE, html);
  console.log(`✅ Freshness report generated: ${REPORT_FILE}`);
  console.log(
    `   Status: ${freshness.isFresh ? 'Fresh' : 'Stale'} (${freshness.daysAgo} days old)`
  );
  console.log(`   Records: ${freshness.recordCount.toLocaleString()}`);
}

module.exports = { generateHtml, getReportData };

if (require.main === module) {
  main();
}
