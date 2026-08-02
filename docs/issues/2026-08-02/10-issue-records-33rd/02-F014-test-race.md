# F014 — Parallel test-file race on `CONFIG.DIST_DIR` (NOT observed this run; root cause unchanged)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: test
**Priority**: P1
**Status**: OPEN — latent; not observed 3/3 full-suite runs this run, root cause intact
**Skills used**: `obra-superpowers-systematic-debugging` (observation-rate analysis across
runs: 27th 1/5, 28th 2/5, 29th 3/11, 30th 2/5, 31st 1/6 — flaky, not deterministic)

## Summary

`npm run test:js` runs all test files concurrently under Node's test runner. Five test
files write to the same real `CONFIG.DIST_DIR` (`dist/`), racing on the shared directory:
`build-orchestrator.test.js`, `build-pages.test.js`, `config.test.js`, `sitemap.test.js`,
`validate-links.test.js`. Observed failure signature (31st run):

```
not ok 17 - prepareBuildEnvironment (subtestsFailed)
  error: '1 subtest failed'
  location: scripts/build-orchestrator.test.js:153:1
```

## Evidence (33rd run)

```
$ for i in 1 2 3; do npm run test:js 2>&1 | grep -E '^# (pass|fail)'; done
# pass 1032 / # fail 0
# pass 1032 / # fail 0
# pass 1032 / # fail 0
```

**3/3 clean this run** — observation rate is genuinely nondeterministic (1/5 … 3/6 across
runs 27–31). The race window still exists: the shared-pages writer
(build-orchestrator.test.js:153–198) awaits a promise that writes `index.html` /
`schools.json` into the real dist/ while concurrent suites delete/recreate the same
directory.

## Impact

CI gate is nondeterministic — the same commit can pass or fail across runs. Undermines
trust in the test suite; a single observed failure this run would have triggered the −15
Testability penalty. Drives A1/A6/A10/B1 latent deductions.

## Suggested fix

1. Serialize suites that mutate shared `dist/`: `node --test --test-concurrency=1`, OR
2. Isolate per-suite temp output dirs: add an output-directory override to the
   shared-pages writer and point build-orchestrator.test.js at a fresh temp dir, OR
3. Move the `prepareBuildEnvironment` integration suite to a serial `test:ci` stage.

## Affected

scripts/build-orchestrator.test.js:153–198 (primary), scripts/build-pages.test.js,
scripts/config.test.js, scripts/sitemap.test.js, scripts/validate-links.test.js.

## Status tracking

- 27th run: 1/5 OBSERVED · 28th: 2/5 · 29th: 3/11 · 30th: 2/5 · 31st: 1/6
- **33rd run: 0/3 OBSERVED (latent, root cause unchanged)**
