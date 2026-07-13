# Missing E2E / Integration Tests

**Category**: test
**Priority**: P2
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/006-missing-e2e-integration-tests.md

## Problem Statement

There are no end-to-end or integration tests for the full pipeline (ETL → Build → Validate). All 963 JS tests are unit tests run in isolation with mocked file systems.

## Impact

- **Medium**: Integration bugs (e.g., CSV format changes, file path mismatches, template rendering regressions) are only caught at build time
- **No pipeline-level validation**: A change that breaks ETL but passes unit tests will only be discovered during build

## Evidence

- All JS tests are file-level .test.js files with mocked dependencies
- No test validates the full pipeline: `node scripts/etl.js && node scripts/build-pages.js && node scripts/validate-links.js`
- The `npm test` script runs JS and Python separately

## Recommended Actions

1. Add an integration test that runs the full pipeline on a small test dataset
2. Create a small fixture CSV with 5-10 schools covering edge cases
3. Run ETL → Build → Validate → Assert expected HTML output
4. Add to CI pipeline as a smoke test
