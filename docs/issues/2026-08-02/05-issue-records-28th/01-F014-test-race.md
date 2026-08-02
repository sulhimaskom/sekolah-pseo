# F014 — Parallel Test-File Race on `CONFIG.DIST_DIR` (makes CI flaky)

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: test
**Priority**: P1
**Status**: OPEN

## Summary
`npm run test:js` executes all test files concurrently via Node's test runner. Multiple tests
write to the same `CONFIG.DIST_DIR` (dist/), racing on the shared directory. Observed this run:
**3/6 full-suite runs failed** with `ERR_ASSERTION`.

## Evidence (this run)
```
not ok 2 - generates dist files via sharedPagesPromise
  error: 'index.html should exist after sharedPagesPromise resolves'
  code: 'ERR_ASSERTION'
  location: scripts/build-orchestrator.test.js:178:3
not ok 17 - prepareBuildEnvironment (subtestsFailed)
```

## Impact
CI gate is nondeterministic — the same commit can pass or fail. Undermines determinism and
trust in the test suite.

## Suggested fix
Serialize tests that mutate shared `dist/` (node --test-test-concurrency=1 or isolate each
suite in a unique temp dir) so parallel files do not race.

## Affected
scripts/build-orchestrator.test.js, scripts/*.test.js (write to shared dist/)