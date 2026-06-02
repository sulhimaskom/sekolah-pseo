#!/usr/bin/env node

/**
 * Data Quality Report Script
 *
 * Generates comprehensive data quality metrics for the school dataset,
 * as documented in the Architecture Blueprint (docs/blueprint.md).
 *
 * Metrics covered:
 *   - Field completeness per required field
 *   - Coordinate validity (valid, missing, out-of-bounds, zero)
 *   - NPSN uniqueness (duplicate detection)
 *   - Categorical distribution (by province, education type, status)
 *
 * Usage:
 *   node scripts/data-quality.js              # human-readable report
 *   node scripts/data-quality.js --json       # JSON output
 *   node scripts/data-quality.js --threshold  # exit 1 if quality below threshold
 *   node scripts/data-quality.js --verbose    # detailed per-record stats
 *
 * Exit codes:
 *   0 - quality meets thresholds (or thresholds not enforced)
 *   1 - quality below thresholds (only with --threshold)
 */

'use strict';

const fs = require('fs');
const CONFIG = require('./config');
const logger = require('./logger');
const { parseCsv } = require('./utils');

// ── Configuration ───────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['npsn', 'nama', 'bentuk_pendidikan', 'provinsi', 'kab_kota', 'kecamatan'];

const INDONESIA_BOUNDS = {
  LAT_MIN: -11,
  LAT_MAX: 6,
  LON_MIN: 95,
  LON_MAX: 141,
};

const DEFAULT_THRESHOLDS = {
  MIN_COMPLETENESS_PCT: 90,
  MAX_DUPLICATE_NPSN: 0,
  MIN_COORDINATE_PCT: 50,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a value is non-empty.
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Validate a coordinate value.
 * @param {string|number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function isValidCoordinate(value, min, max) {
  if (value === null || value === undefined || value === '') return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (num === 0) return false; // zero typically means unset
  return num >= min && num <= max;
}

/**
 * Format a percentage value.
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
function pct(value, total) {
  if (total === 0) return '0.0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

// ── Quality Analysis ────────────────────────────────────────────────────────

/**
 * Compute comprehensive quality metrics for the school dataset.
 * @param {Array<Object>} schools - Parsed school records
 * @returns {Object} qualityReport
 */
function analyzeQuality(schools) {
  const total = schools.length;
  const report = {
    summary: {
      totalSchools: total,
      overallScore: 0,
    },
    fieldCompleteness: {},
    coordinates: {
      valid: 0,
      missing: 0,
      zero: 0,
      outOfBounds: 0,
      total: 0,
    },
    npsnUniqueness: {
      unique: 0,
      duplicates: 0,
      duplicateCount: 0,
      duplicateNpsns: [],
    },
    categoricalDistribution: {
      provinces: {},
      educationTypes: {},
      statuses: {},
    },
  };

  if (total === 0) {
    report.summary.overallScore = 0;
    return report;
  }

  // ── Field Completeness ──────────────────────────────────────────────
  for (const field of REQUIRED_FIELDS) {
    let present = 0;
    for (const school of schools) {
      if (isNonEmpty(school[field])) present++;
    }
    report.fieldCompleteness[field] = {
      present,
      missing: total - present,
      completenessPct: parseFloat(((present / total) * 100).toFixed(1)),
    };
  }

  // ── Coordinate Validity ─────────────────────────────────────────────
  for (const school of schools) {
    const lat = school.lat;
    const lon = school.lon;

    report.coordinates.total++;

    if (!isNonEmpty(lat) && !isNonEmpty(lon)) {
      report.coordinates.missing++;
    } else if (parseFloat(lat) === 0 || parseFloat(lon) === 0) {
      report.coordinates.zero++;
    } else if (
      isValidCoordinate(lat, INDONESIA_BOUNDS.LAT_MIN, INDONESIA_BOUNDS.LAT_MAX) &&
      isValidCoordinate(lon, INDONESIA_BOUNDS.LON_MIN, INDONESIA_BOUNDS.LON_MAX)
    ) {
      report.coordinates.valid++;
    } else {
      report.coordinates.outOfBounds++;
    }
  }

  // ── NPSN Uniqueness ─────────────────────────────────────────────────
  const npsnMap = new Map();
  for (const school of schools) {
    const npsn = String(school.npsn || '').trim();
    if (npsn) {
      npsnMap.set(npsn, (npsnMap.get(npsn) || 0) + 1);
    }
  }

  for (const [npsn, count] of npsnMap) {
    if (count === 1) {
      report.npsnUniqueness.unique++;
    } else {
      report.npsnUniqueness.duplicates++;
      report.npsnUniqueness.duplicateCount += count;
      report.npsnUniqueness.duplicateNpsns.push({ npsn, count });
    }
  }

  // ── Categorical Distribution ────────────────────────────────────────
  for (const school of schools) {
    // Province
    const prov = school.provinsi || '(unknown)';
    report.categoricalDistribution.provinces[prov] =
      (report.categoricalDistribution.provinces[prov] || 0) + 1;

    // Education type
    const type = school.bentuk_pendidikan || '(unknown)';
    report.categoricalDistribution.educationTypes[type] =
      (report.categoricalDistribution.educationTypes[type] || 0) + 1;

    // Status (Negeri/Swasta)
    const status = school.status
      ? school.status === 'N'
        ? 'Negeri'
        : school.status === 'S'
          ? 'Swasta'
          : school.status
      : '(unknown)';
    report.categoricalDistribution.statuses[status] =
      (report.categoricalDistribution.statuses[status] || 0) + 1;
  }

  // ── Overall Score ───────────────────────────────────────────────────
  // Composite score: average of completeness, coordinate validity, NPSN uniqueness
  let completenessScore = 0;
  for (const field of REQUIRED_FIELDS) {
    completenessScore += report.fieldCompleteness[field].completenessPct;
  }
  completenessScore /= REQUIRED_FIELDS.length;

  const coordinateScore = total > 0 ? (report.coordinates.valid / total) * 100 : 0;
  const uniquenessScore =
    report.npsnUniqueness.duplicates === 0
      ? 100
      : Math.max(0, 100 - (report.npsnUniqueness.duplicateCount / total) * 100);

  report.summary.overallScore = parseFloat(
    (completenessScore * 0.4 + coordinateScore * 0.3 + uniquenessScore * 0.3).toFixed(1)
  );

  return report;
}

/**
 * Check if quality report meets thresholds.
 * @param {Object} report
 * @param {Object} thresholds
 * @returns {Object} { passed: boolean, failures: string[] }
 */
function checkThresholds(report, thresholds = DEFAULT_THRESHOLDS) {
  const failures = [];

  for (const field of REQUIRED_FIELDS) {
    const comp = report.fieldCompleteness[field];
    if (comp && comp.completenessPct < thresholds.MIN_COMPLETENESS_PCT) {
      failures.push(
        `Field "${field}" completeness ${comp.completenessPct}% < ${thresholds.MIN_COMPLETENESS_PCT}%`
      );
    }
  }

  const coordPct =
    report.summary.totalSchools > 0
      ? (report.coordinates.valid / report.summary.totalSchools) * 100
      : 0;
  if (coordPct < thresholds.MIN_COORDINATE_PCT) {
    failures.push(
      `Coordinate validity ${coordPct.toFixed(1)}% < ${thresholds.MIN_COORDINATE_PCT}%`
    );
  }

  if (report.npsnUniqueness.duplicates > thresholds.MAX_DUPLICATE_NPSN) {
    failures.push(
      `Found ${report.npsnUniqueness.duplicates} duplicate NPSN groups (threshold: ${thresholds.MAX_DUPLICATE_NPSN})`
    );
  }

  return { passed: failures.length === 0, failures };
}

// ── Output Formatters ───────────────────────────────────────────────────────

/**
 * Format report as human-readable string.
 * @param {Object} report
 * @returns {string}
 */
function formatHuman(report) {
  const s = report.summary;
  const lines = ['\n═══════════════════════════════════════════'];
  lines.push('  DATA QUALITY REPORT');
  lines.push('═══════════════════════════════════════════\n');
  lines.push(`  Total schools: ${s.totalSchools}`);
  lines.push(`  Overall quality score: ${s.overallScore}/100\n`);

  lines.push('  ── Field Completeness ──');
  for (const [field, stats] of Object.entries(report.fieldCompleteness)) {
    const bar = createBar(stats.completenessPct, 40);
    lines.push(`  ${field.padEnd(22)} ${stats.completenessPct.toString().padStart(5)}% ${bar}`);
  }

  lines.push('\n  ── Coordinate Validity ──');
  const c = report.coordinates;
  lines.push(`  Valid          ${c.valid.toString().padStart(6)}  ${pct(c.valid, c.total)}`);
  lines.push(`  Missing        ${c.missing.toString().padStart(6)}  ${pct(c.missing, c.total)}`);
  lines.push(`  Zero           ${c.zero.toString().padStart(6)}  ${pct(c.zero, c.total)}`);
  lines.push(
    `  Out of bounds  ${c.outOfBounds.toString().padStart(6)}  ${pct(c.outOfBounds, c.total)}`
  );

  lines.push('\n  ── NPSN Uniqueness ──');
  const n = report.npsnUniqueness;
  lines.push(`  Unique NPSNs: ${n.unique}`);
  if (n.duplicates > 0) {
    lines.push(`  Duplicate NPSN groups: ${n.duplicates}`);
    lines.push(`  Records with duplicate NPSN: ${n.duplicateCount}`);
    for (const dup of n.duplicateNpsns.slice(0, 10)) {
      lines.push(`    NPSN ${dup.npsn} → ${dup.count} records`);
    }
    if (n.duplicateNpsns.length > 10) {
      lines.push(`    ... and ${n.duplicateNpsns.length - 10} more`);
    }
  } else {
    lines.push('  ✅ No duplicate NPSNs found');
  }

  lines.push('\n  ── Categorical Distribution ──');
  lines.push(`  Provinces: ${Object.keys(report.categoricalDistribution.provinces).length}`);
  lines.push(
    `  Education types: ${Object.keys(report.categoricalDistribution.educationTypes).join(', ')}`
  );

  const statuses = report.categoricalDistribution.statuses;
  const statusLines = Object.entries(statuses)
    .map(([k, v]) => `    ${k.padEnd(12)} ${v.toString().padStart(6)} (${pct(v, s.totalSchools)})`)
    .join('\n');
  lines.push(`  Statuses:\n${statusLines}`);

  lines.push('\n═══════════════════════════════════════════\n');
  return lines.join('\n');
}

/**
 * Create a simple ASCII bar.
 * @param {number} pctValue
 * @param {number} width
 * @returns {string}
 */
function createBar(pctValue, width) {
  const filled = Math.round((pctValue / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

/**
 * Format report as JSON.
 * @param {Object} report
 * @returns {string}
 */
function formatJson(report) {
  return JSON.stringify(report, null, 2);
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const useJson = args.includes('--json');
  const enforceThreshold = args.includes('--threshold');
  const verbose = args.includes('--verbose');

  const csvPath = CONFIG.SCHOOLS_CSV_PATH;

  if (!fs.existsSync(csvPath)) {
    logger.error({ path: csvPath }, 'Schools CSV not found. Run ETL first.');
    process.exit(1);
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const schools = parseCsv(csvData);

  logger.info({ recordCount: schools.length }, 'Analyzing data quality');

  const report = analyzeQuality(schools);

  if (useJson) {
    console.log(formatJson(report));
  } else {
    console.log(formatHuman(report));
    if (verbose) {
      console.log('  ── Verbose Stats ──');
      console.log(`  Fields analyzed: ${REQUIRED_FIELDS.length}`);
      console.log('  Categorical dimensions: province, education type, status');
      console.log(
        `  Coordinate bounds: lat [${INDONESIA_BOUNDS.LAT_MIN}, ${INDONESIA_BOUNDS.LAT_MAX}], lon [${INDONESIA_BOUNDS.LON_MIN}, ${INDONESIA_BOUNDS.LON_MAX}]`
      );
      console.log('');
    }
  }

  if (enforceThreshold) {
    const result = checkThresholds(report);
    if (!result.passed) {
      logger.warn({ failures: result.failures }, 'Quality thresholds not met');
      console.error('\n  ❌ Quality thresholds FAILED:');
      for (const failure of result.failures) {
        console.error(`    • ${failure}`);
      }
      console.error('');
      process.exit(1);
    }
    if (!useJson) {
      console.log('  ✅ All quality thresholds met.\n');
    }
  }
}

main();
