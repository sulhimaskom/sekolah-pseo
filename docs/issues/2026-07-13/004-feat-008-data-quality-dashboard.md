# Phase 3 — Strategic Expansion: FEAT-008 Data Quality HTML Dashboard

**Category**: feature | **Priority**: P2
**Evaluation Date**: 2026-07-13
**Phase**: Phase 3 (Strategic Expansion)

## User Story

As a **data steward or site maintainer**, I want a **visual data quality dashboard** generated during each build so that I can immediately see data quality trends, spot regressions, and prioritize data cleanup without running CLI commands or parsing JSON.

## Current Gap

The `data-quality.js` script produces structured JSON output and a text report. There is no visual/HTML representation. Checking data quality requires:
1. Running a CLI command with specific flags
2. Parsing JSON output manually
3. No historical trend tracking across builds

This is documented in `docs/blueprint.md` (data quality section) but the output format is limited to CLI.

## Proposed Solution

Add a `generateQualityDashboard()` function that consumes the existing `data-quality.js --json` output and produces a standalone HTML page (`dist/quality/index.html`) with:

1. **Overall Quality Score** — Single percentage with color coding (green/yellow/red)
2. **Field Completeness** — Bar chart per required field showing fill rate
3. **Coordinate Quality** — Pie/bar showing valid vs missing vs zero vs out-of-bounds
4. **NPSN Duplicates** — Warning section if any duplicates found
5. **Top Issues** — Prioritized list of quality problems
6. **Trend** — If previous dashboard exists, diff against it for trend arrows

## Acceptance Criteria

1. `npm run data-quality:html` generates `dist/quality/index.html`
2. Dashboard loads in browser with no JS errors
3. All data is server-rendered (no client-side JS needed for basic view)
4. Metrics match `data-quality.js --json` output exactly
5. Color coding: ≥95% green, ≥80% yellow, <80% red
6. No new npm dependencies
7. `data-quality.test.js` updated with dashboard generation tests
8. Build pipeline includes dashboard generation (opt-in)

## Value Justification

- **High leverage**: Reuses existing `data-quality.js` metrics engine (412 lines, well-tested)
- **Low cost**: Pure HTML/CSS generation, no JS framework, no new dependencies
- **High impact**: Makes quality data accessible to non-technical stakeholders
- **Builds on existing code**: All data pipelines, metrics, and aggregation already exist
- **Dual use**: Useful both in CI (generated artifact) and local development

## Implementation Sketch

```javascript
// scripts/data-quality-html.js
function generateQualityDashboard(metrics) {
  const score = calculateOverallScore(metrics);
  return `<!DOCTYPE html>
<html lang="id">
<head><title>Data Quality Dashboard</title>
<style>
  /* Inline CSS, no external dependencies */
  .score-green { color: #16a34a; }
  .score-yellow { color: #ca8a04; }
  .score-red { color: #dc2626; }
</style></head>
<body>
  <header>
    <h1>Data Quality Dashboard</h1>
    <time>${metrics.timestamp}</time>
  </header>
  <!-- Metrics rendered as server-generated HTML -->
</body></html>`;
}
```

## Files Affected

- `scripts/data-quality-html.js` (new) — HTML report generator
- `scripts/data-quality.test.js` (update) — Add HTML generation tests
- `package.json` (update) — Add `data-quality:html` script

## Verification

```bash
npm run data-quality:html
# → dist/quality/index.html generated
# Open in browser to verify
```
