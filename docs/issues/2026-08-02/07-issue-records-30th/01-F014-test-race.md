# F014 — Parallel test-file race on shared DIST_DIR (OBSERVED 2/6, WORSENED)

**Evaluation Date**: 2026-08-02 (30th run)
**Category**: test
**Priority**: P1
**Status**: OPEN — **OBSERVED 2/6 runs (worsened from 1/6)**

## Summary
Node's built-in test runner executes test files in parallel. Five test files write to the
**real** `CONFIG.DIST_DIR` (repository `dist/`) concurrently:
- `scripts/build-orchestrator.test.js` (line 178–198, `generates dist files via
  sharedPagesPromise`)
- `scripts/build-pages.test.js`
- `scripts/config.test.js`
- `scripts/sitemap.test.js`
- `scripts/validate-links.test.js`

One test deletes/recreates `dist/` while another is mid-write → `ERR_ASSERTION` failures
are non-deterministic.

## Evidence (this run)
```
$ for i in 1..6: npm run test:js
RUN 1: 1030 tests, 1026 pass, 0 fail ✅
RUN 2: 1030 tests, 1026 pass, 0 fail ✅
RUN 3: 1030 tests, 1026 pass, 0 fail ✅
RUN 4: 1030 tests, 1025 pass, 1 fail ❌ (ERR_ASSERTION)
RUN 5: 1030 tests, 1026 pass, 0 fail ✅
RUN 6: 1030 tests, 1025 pass, 1 fail ❌ (ERR_ASSERTION, code: 'ERR_ASSERTION')
```
Observed **2/6** — worsening trend (28th: 3/6, 29th: 1/6).

## Impact
- Non-deterministic CI: the same commit passes/fails depending on scheduler timing.
- Global penalty: **−15 Test failure** applied to Code Quality this run.
- Flaky pipelines erode trust in the gate; real regressions may be masked.

## Suggested fix
1. Point test files at an isolated temp dist dir (`fs.mkdtempSync(os.tmpdir())`) via a
   test-only config override, OR
2. Run the suite serially with `--test-concurrency=1`, OR
3. Add a `.test` env/config path (`CONFIG.setForTest()`) that remaps `DIST_DIR` per test file.

## Affected
scripts/build-orchestrator.test.js, scripts/build-pages.test.js, scripts/config.test.js,
scripts/sitemap.test.js, scripts/validate-links.test.js, scripts/config.js
