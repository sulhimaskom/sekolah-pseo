# Test: Missing End-to-End and Integration Tests

**Category**: test | **Priority**: P2
**Evaluation Date**: 2026-07-12
**Audit Report**: docs/audit-report-2026-07-12.md

## Description

All 902 JavaScript tests and 13 Python tests are unit-level. There is no test that exercises the full pipeline or validates cross-module integration.

### Key Findings

1. **No full pipeline test**: No test runs CSV loading → ETL → build → sitemap generation → link validation as an integrated sequence.

2. **No cross-module contract tests**:
   - `PageBuilder` tested independently from `build-pages.js`
   - `sitemap.js` tested without real rendered content
   - `validate-links.js` tested without real generated HTML

3. **No `test:e2e` npm script** exists.

### Impact

- **Medium**: Integration bugs can slip through — changes in one module might break another module's expected contracts
- **Medium**: Refactoring confidence is lower without integration safety net

### Recommendations

1. Add `test:e2e` script: ETL on sample data → full build → sitemap → link validation → verify key outputs
2. Add cross-module contract tests (verify PageBuilder output consumable by sitemap generator)
3. Consider snapshot testing of generated HTML for regression detection
