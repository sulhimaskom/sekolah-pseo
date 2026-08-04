# F014 — Parallel Test-File Race on `CONFIG.DIST_DIR` (RESOLVED, 43rd run)

**Evaluation Date**: 2026-08-04 (43rd run)
**Category**: test
**Priority**: P1
**Status**: **RESOLVED** — fixed in-loop, verified 5/5 paired + 3/3 full-suite

## Summary

`npm run test:js` executes all test files concurrently via Node's test runner. Two
suites race on the shared `CONFIG.DIST_DIR` (`dist/`): `build-pages.test.js` removes
the directory in its `test.before` hook, while `build-orchestrator.test.js`'s
`prepareBuildEnvironment` smoke tests `mkdir` and write into it. When the runner
schedules both files in parallel child processes, the `rm` collides with the `mkdir`
→ intermittent `ENOENT` failures (this run: 1 of 5 full-suite runs; 3 of 4 paired
runs).

## Evidence (this run)

```
Full suite (5 runs):  run 1 → 1 fail (mkdir dist/ ENOENT @ build-orchestrator.test.js:157)
                      runs 2–5 → 1049 pass / 0 fail
Paired repro (4 runs): build-pages + build-orchestrator → 3 of 4 failed
Failure: IntegrationError "Failed to create directory .../dist" (FILE_WRITE_ERROR,
         originalError ENOENT mkdir) at fs-safe.js:176 ← ensureDistDir ←
         prepareBuildEnvironment ← build-orchestrator.test.js:157
```

## Root cause

- `scripts/build-pages.test.js:45-54` — `test.before` runs
  `fs.rm(CONFIG.DIST_DIR, { recursive: true, force: true })` to clear stale artifacts.
- `scripts/build-orchestrator.test.js:153-198` — `prepareBuildEnvironment` smoke
  tests call `ensureDistDir()` (mkdir) then assert `dist/index.html` /
  `dist/schools.json` exist.
- Node's test runner spawns one child process per test file; the two processes
  operate on the same on-disk `dist/` concurrently. Whichever runs the `rm` after the
  other's `mkdir` breaks the other's subsequent `access` assertions.

Previously documented: `docs/issues/2026-08-02/05-issue-records-28th/01-F014-test-race.md`
(3 of 6 runs failed, ERR_ASSERTION), `docs/issues/2026-08-04/01-F014-test-race-reobserved.md`
(37th run, variable test count).

## Fix (minimal, test-only)

`scripts/build-orchestrator.test.js` now redirects `CONFIG.DIST_DIR` to a per-process
temp directory **before** requiring `BuildOrchestrator` (which captures
`CONFIG.DIST_DIR` at module load):

```js
// F014 fix: node --test runs test files in parallel child processes;
// build-pages.test.js removes CONFIG.DIST_DIR in its before-hook, racing with
// the prepareBuildEnvironment smoke tests below (observed mkdir dist/ ENOENT,
// 3 of 4 paired runs failed). Redirect DIST_DIR per-process BEFORE requiring
// BuildOrchestrator — it captures CONFIG.DIST_DIR at module load.
const CONFIG = require('./config');
CONFIG.DIST_DIR = path.join(os.tmpdir(), `build-orchestrator-test-${process.pid}`);
```

This is a 8-line test-only change (1 file, +8/−1). No source code touched. The
`prepareBuildEnvironment` smoke tests still exercise the full shared-pages pipeline
(homepage, search data, province pages, styles, robots) — only the output directory
is isolated, which is exactly the property that makes the suite deterministic.

## Verification

| Check                                    | Result                                     |
| ---------------------------------------- | ------------------------------------------ |
| Paired runs (build-pages + orchestrator) | ✅ **5/5 pass** (was 1–2/5)                |
| Full suite `npm run test:js` ×3          | ✅ 1053 tests / 1049 pass / 0 fail (×3)    |
| `npm run lint`                           | ✅ 0 errors, 0 warnings                    |
| Prettier on changed file                 | ✅ clean                                   |
| `npm run test:js:coverage`               | ✅ 95.23% stmt / 92.56% branch (unchanged) |
| Python `tests/run_tests.py`              | ✅ 27/27 pass                              |

## Impact

- CI gate is now deterministic for this failure class — the same commit will no
  longer pass or fail depending on test-file scheduling.
- Removes one of the two P1 test-hygiene items from the ledger (F029 was the other;
  maintained RESOLVED this run).

## Status change

| Run       | Status                                                           |
| --------- | ---------------------------------------------------------------- |
| 28th      | OBSERVED (3/6 runs failed)                                       |
| 37th      | RE-OBSERVED (1/5 runs failed)                                    |
| 38th–42nd | intermittently re-observed                                       |
| **43rd**  | **RE-OBSERVED (1/5) then RESOLVED (fix + verification in-loop)** |
