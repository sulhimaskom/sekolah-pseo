# Phase 2 - Hardening: Missing Cross-Module Data Contracts

**Category**: refactor | **Priority**: P2
**Evaluation Date**: 2026-07-06
**Phase**: Phase 2 (Feature Hardening & Integration)

## Description

There are no formal data contracts between modules that exchange structured data. While JSDoc comments describe parameter types, there is no runtime validation of cross-module data shapes, which allows contract drift to go undetected until runtime failure.

### Affected Integration Points

1. **CSV Parser → PageBuilder**: `parseCsv()` returns arrays of objects, but there's no validation that the output shape matches what `buildSchoolPageData()` expects (REQUIRED_SCHOOL_FIELDS validation is inside, not at the boundary)

2. **PageBuilder → HTML Templates**: `buildSchoolPageData()` returns `{relativePath, content}`, but downstream consumers expect specific DOM structure in `content` — no contract validation

3. **Manifest → Build Controller**: `loadManifest()` returns state that the build controller implicitly trusts — no schema validation that manifest format matches expectations

4. **Enrichment Data Provider → PageBuilder**: `loadEnrichmentData()` returns enrichment objects with no shape validation before being passed to templates

### Impact
- **Medium**: Contract violations are only caught at runtime, not at build/test time
- **Low**: Currently mitigated by high test coverage, but risk grows as codebase expands
- **Medium**: Onboarding new contributors increases chance of contract mismatch

### Evidence
- `scripts/utils.js`: `parseCsv()` returns generic objects with no output schema
- `src/services/PageBuilder.js`: Validates input but not output contract
- `scripts/manifest.js`: `loadManifest()` returns parsed JSON with no validation
- `scripts/enrichment.js`: Returns enrichment data without shape guarantees

### Recommendations
1. Add JSDoc `@typedef` definitions for all shared data structures (School, Province, Enrichment, Manifest)
2. Consider runtime validation at module boundaries using a lightweight validator
3. Add integration tests that verify cross-module data contracts (output of A matches input of B)
4. Consider TypeScript JSDoc mode (`// @ts-check`) for gradual type safety without build step
