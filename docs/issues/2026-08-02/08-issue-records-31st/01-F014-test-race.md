# F014 — Parallel Test-File Race on `CONFIG.DIST_DIR` (OBSERVED 1/6 this run)

**Evaluation Date**: 2026-08-02 (31st run)
**Category**: test
**Priority**: P1
**Status**: OPEN — **OBSERVED 1/6 full-suite runs this run**

## Summary

`npm run test:js` executes all test files concurrently via Node's test runner. Multiple tests
write to the same `CONFIG.DIST_DIR` (dist/), racing on the shared directory. Observed this run:
**1/6 full-suite runs failed** with `ERR_ASSERTION`.

## Evidence (this run)

```
not ok 17 - prepareBuildEnvironment (subtestsFailed)
  error: '1 subtest failed'
  location: scripts/build-orchestrator.test.js:153:1
  failureType: 'subtestsFailed'
```

Root-cause path re-isolated: `prepareBuildEnvironment` integration test
(build-orchestrator.test.js:153–198) awaits `sharedPagesPromise` which writes `index.html` /
`schools.json` into the real `CONFIG.DIST_DIR`. Concurrent test files (build-pages.test.js,
config.test.js, sitemap.test.js, validate-links.test.js) mutate the same directory
(delete/recreate/overwrite) while the suite asserts file existence → intermittent
`ERR_ASSERTION: index.html should exist after sharedPagesPromise resolves`.

Sequence this run: run 1 ❌ (1 fail), runs 2–6 ✅ clean. Nondeterministic across identical
commits — same root cause as 27th–30th runs (observation rate varies 1/6–3/6).

## Impact

CI gate is nondeterministic — the same commit can pass or fail. Undermines determinism and
trust in the test suite. Directly drives the A1/A6/A10 and B1 deductions this run.

## Suggested fix

1. Serialize tests that mutate shared `dist/`: run node test with
   `--test-concurrency=1` OR set `--test-isolation=process`, OR
2. Isolate each suite in a unique temp dir: make the shared-pages writer accept an output
   directory override and have build-orchestrator.test.js point it at a fresh temp dir, OR
3. Move the `prepareBuildEnvironment` integration suite to `test:ci` (serial) and keep unit
   suites parallel.

## Affected

scripts/build-orchestrator.test.js:153–198 (primary), scripts/build-pages.test.js,
scripts/config.test.js, scripts/sitemap.test.js, scripts/validate-links.test.js (write to
shared dist/), package.json (test:js script)

## Status tracking

- 27th run: OBSERVED 2/5
- 28th run: OBSERVED 3/6
- 29th run: OBSERVED 1/6
- 30th run: OBSERVED 2/6
- **31st run: OBSERVED 1/6**
