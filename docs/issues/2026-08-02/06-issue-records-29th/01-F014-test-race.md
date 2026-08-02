# F014 — Parallel Test-File Race on `CONFIG.DIST_DIR` (OBSERVED 1/6, root cause isolated)

**Evaluation Date**: 2026-08-02 (29th run)
**Category**: test
**Priority**: P1
**Status**: OPEN — **OBSERVED this run (1/6)**

## Summary
`npm run test:js` executes all test files concurrently via Node's test runner (default
concurrency). **Root cause isolated this run**: at least **5 test files write to the real
`CONFIG.DIST_DIR`** (dist/), not an isolated temp dir:

- scripts/build-orchestrator.test.js (`generates dist files via sharedPagesPromise` — calls
  `prepareBuildEnvironment()` which writes homepage/schools.json/styles.css/robots.txt to dist)
- scripts/build-pages.test.js
- scripts/config.test.js
- scripts/sitemap.test.js
- scripts/validate-links.test.js

When two of these overlap, one test's assertions read files while another test (or the
preceding full-suite run's leftover state) is mid-write → `ERR_ASSERTION`.

## Evidence (this run — 6 fresh sequential runs)
```
RUN 1: EXIT=0 # fail 0
RUN 2: EXIT=0 # fail 0
RUN 3: EXIT=1     not ok 2 - generates dist files via sharedPagesPromise       code: 'ERR_ASSERTION'
RUN 4: EXIT=0 # fail 0
RUN 5: EXIT=0 # fail 0
RUN 6: EXIT=0 # fail 0
```
**1/6 full-suite runs failed.** Failure signature:
```
not ok 2 - generates dist files via sharedPagesPromise
  error: 'index.html should exist after sharedPagesPromise resolves'
  code: 'ERR_ASSERTION'
  location: scripts/build-orchestrator.test.js:178:3
```

## Independent corroboration (this run)
Running `npm run build` + `npm run lint` + `npm run test:js` in parallel (as this session did
during evidence gathering) produced a **corrupted dist/** — missing index.html/styles.css/
robots.txt and containing jawa-timur/surabaya pages that do not exist in `data/schools.csv`.
This confirms the shared-dist race has real impact on build output integrity, not just tests.

## Impact
- CI gate is nondeterministic — same commit can pass or fail.
- Corrupts the real `dist/` build output when tests run concurrently with a build.

## Suggested fix
- Give tests an isolated scratch dir: set `CONFIG.DIST_DIR` override (or inject a `distDir`
  parameter into `prepareBuildEnvironment`/build steps) so tests never touch the real dist/.
- Or serialize suites that mutate shared state: `node --test --test-concurrency=1 scripts/*.test.js`.
- Add `beforeEach` cleanup of the isolated dir to guarantee determinism.

## Affected
scripts/build-orchestrator.test.js:178, scripts/build-pages.test.js, scripts/config.test.js,
scripts/sitemap.test.js, scripts/validate-links.test.js, src/services/BuildOrchestrator.js
