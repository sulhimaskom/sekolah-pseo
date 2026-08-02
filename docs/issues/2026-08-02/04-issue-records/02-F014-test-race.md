# ISSUE RECORD — F014: Parallel test-file race on dist/ (flaky CI)

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — record persisted per repo convention (finding 002, 23rd consecutive block). Re-verified in 26th run (2026-08-02): **NOT OBSERVED (0/5)** — 5 consecutive clean full-suite runs (1026 pass / 0 fail / 4 skip each); cleanest session since 19th run. Race window remains latent at `build-orchestrator.test.js:178`.
> **Labels**: `test`, `P1`
> **Evaluation date**: 2026-08-02
> **File affected**: `scripts/build-orchestrator.test.js` (line 178), `src/services/BuildOrchestrator.js`

## Summary

`generates dist files via sharedPagesPromise` intermittently fails because Node's test
runner executes test files in parallel processes, and multiple suites write/clean the
shared `dist/` directory concurrently. The assertion
`index.html should exist after sharedPagesPromise resolves` races against another
suite's `dist/` cleanup.

## Evidence (fresh this run — 5 full-suite runs)

| Run | Result |
| --- | ------ |
| RUN 1 | ✅ pass |
| RUN 2 | ❌ `ERR_ASSERTION` — `index.html should exist after sharedPagesPromise resolves` |
| RUN 3 | ✅ pass |
| RUN 4 | ❌ `ERR_ASSERTION` (same) |
| RUN 5 | ✅ pass |

**OBSERVED 2/5 runs** — worst frequency this week (prior runs: 1/6, 0/3, 5/13, 3/11, 1/6).
Also reproduced the F001 floating promise (test file-load order affects `fetch-data.js`).

## Impact / Risk

- **High** — CI is non-deterministic; `npm test` exits 1 ~40% of the time, eroding
  trust in the pipeline and masking genuine failures. Applies **−15 test failure penalty**.

## Suggested resolution

1. Make each test suite use an isolated temp output directory (`fs.mkdtemp(os.tmpdir())`)
   instead of the shared `CONFIG.DIST_DIR`.
2. Add a `--test-isolation` / serial execution option for suites that share `dist/`, or
   partition the `dist/` path per process (e.g., `dist-${process.pid}`).
3. Add an await/barrier so `prepareBuildEnvironment()` fully settles `dist/` writes
   before the assertion.
4. Address F001 (`fetch-data.js:338` un-awaited `main()`) which interacts with
   process-level side effects.

## Domain score impact

- **A10 Determinism** (70/100): −30
- **A1 Correctness** (82/100): −8
- **B1 Stability** (78/100): −12
- **A6 Testability** (82/100): **−15 global test-failure penalty**
- **C9 Build/Test Feedback** (95/100): −5
