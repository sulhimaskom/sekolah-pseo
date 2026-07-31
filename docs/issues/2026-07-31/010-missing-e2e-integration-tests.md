# Missing E2E / Integration Tests for the Full Pipeline

**Category**: test
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/010-missing-e2e-integration-tests.md

## Problem Statement

Unit coverage is strong for JS modules (95.32% statements) but there is **no end-to-end test** exercising the full pipeline: `ETL → build → sitemap → validate-links → freshness`, nor any test that generated HTML renders correctly with real data. The floating-promise bug in fetch-data.js (Issue 001) is exactly the class of defect unit tests miss: correct in isolation, broken at integration boundaries.

## Evidence

- `npm run test:js` — 1030 unit tests, 0 integration/E2E suites
- No test references `scripts/build-pages.js` end-to-end or runs `npm run build` + `npm run validate-links` + `npm run sitemap` in sequence
- BuildOrchestrator/PageBuilder are unit-tested in isolation (96.26% / 98.18% coverage) but never exercised through the real CLI entrypoints

## Impact

- Integration defects (arg parsing, env wiring, file-path assumptions, async flows) escape to production
- No regression safety net for the documented pipeline (`README.md` "Alur Data" diagram)

## Suggested Fix

1. Add `tests/e2e/` (or `scripts/e2e.test.js`) that runs the real pipeline against a fixture CSV:
   - `node scripts/etl.js` (or seeded data) → assert schools.csv
   - `node scripts/build-pages.js` → assert dist/index.html + school pages
   - `node scripts/sitemap.js` → assert sitemap XML
   - `node scripts/validate-links.js` → assert 0 broken links
2. Wire into CI as `test:e2e`
3. Assert generated HTML contains expected schema/accessibility markers (uses existing school-page test helpers)

## Related

- `docs/issues/2026-07-13/006-missing-e2e-integration-tests.md`
