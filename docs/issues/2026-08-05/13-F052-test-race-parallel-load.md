# F052 — Parallel-load test race on shared repo paths (build-pages + enrichment)

**Evaluation date**: 2026-08-05 (51st ULW verification run)
**Category**: `test`
**Priority**: `P2`
**Status**: OPEN (new finding, 1st run)

## Summary

`scripts/build-pages.test.js` and `scripts/enrichment.test.js` mutate **real
repository paths** (`dist/`, `.build-manifest.json`, `data/enrichment.json`)
during test execution. Node 20's `node --test scripts/*.test.js` runs test files
in **parallel worker processes by default**, so these shared-path writes race
across files — and the race becomes observable under load, producing false test
failures.

## Evidence

Reproduced on 2026-08-05 with 3 concurrent `npm run test:js` invocations +
`npm run format:check` (identical to the first-run conditions where a single
flaky failure was first observed):

```
LOAD RUN 1: # tests 1055, # pass 1046, # fail 5, # skipped 4
```

Failing tests (all `failureType: testCodeFailure` / cross-file races):

| Test                                                               | File                      | Error                                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------------------------------- |
| `buildIncremental runs without error when manifest exists`         | `build-pages.test.js:334` | `FILE_READ_ERROR: Failed to read file .../.build-manifest.json` |
| `exportSchoolsCsv creates dist/data/ directory if missing`         | `build-pages.test.js:462` | `ENOTEMPTY: directory not empty, rmdir .../dist`                |
| `generateProvincePages generates province pages for each province` | `build-pages.test.js:635` | `ERR_ASSERTION: jawa-barat province page should exist`          |
| `saveEnrichmentData and loadEnrichmentData` (subtest)              | `enrichment.test.js:263`  | round-trip assert: `loaded['00001']` falsy                      |
| `persists enrichment data that can be loaded back` (subtest)       | `enrichment.test.js:357`  | subtest failure                                                 |

Root cause — shared real-path mutation:

- `build-pages.test.js:51` `before()` → `fs.rm(CONFIG.DIST_DIR, {recursive:true})` and `:56` → removes `.build-manifest.json` at `CONFIG.ROOT_DIR` (the repo root). Many tests then write/read `CONFIG.DIST_DIR` (real `dist/`) directly (lines 230, 320, 324, 329, 343, 350, 361, 368, 385–402, 431).
- `enrichment.test.js:290` writes `data/enrichment.json` via the module's real `ENRICHMENT_DATA_PATH`; `:351/:384/:412/:427` `unlinkSync` it mid-suite.

Under a solo `npm run test:js` the suite passes cleanly (1051/0/4, verified 8
consecutive runs) because the races are timing-dependent; under concurrent load
they surface. The codebase already contains the correct isolation pattern —
`build-orchestrator.test.js:15` overrides `CONFIG.DIST_DIR = os.tmpdir()/...`
per-process, and `build-pages.test.js:414` temp-isolates one `ensureDistDir`
test — but it is applied inconsistently.

## Files affected

- `scripts/build-pages.test.js` (before-hook + ~20 direct `CONFIG.DIST_DIR` uses)
- `scripts/enrichment.test.js` (real `ENRICHMENT_DATA_PATH` writes/`unlinkSync`)

## Impact / Risk

- **Test determinism** (A. Determinism): suite outcome depends on wall-clock
  timing + machine load; same commit can pass or fail.
- **Testability** (A. Testability): false failures erode trust and can block CI
  or mask real regressions.
- **CI/CD health** (D. CI/CD Health): flaky gate; CI runners under parallel load
  (or multiple workflow jobs) can hit the same race.
- No production-runtime impact — the defect is confined to the test suite.

## Score rationale

- A. Determinism 74 → 73 (−1): non-deterministic pass/fail under load.
- A. Testability 70 → 69 (−1): suite can fail without a production defect.
- B. Stability 74 → 73 (−1): CI/test-tree stability regression class (mirror of
  F051's +2; this applies −1 since solo runs remain green).
- D. CI/CD Health 53 → 52 (−1): flaky-test gate risk.

## Suggested remediation (Phase 2 candidate)

1. Override `CONFIG.DIST_DIR` to a per-process `os.tmpdir()` dir at the top of
   `build-pages.test.js` (pattern already proven in `build-orchestrator.test.js:15`).
2. Point `enrichment.test.js` at a temp `ENRICHMENT_DATA_PATH` (module already
   accepts the path via `require('./enrichment')` destructuring) instead of the
   real `data/enrichment.json`.
3. Keep the fix minimal/atomic; no production code changes required.
