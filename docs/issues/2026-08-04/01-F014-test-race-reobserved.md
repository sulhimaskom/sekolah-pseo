# F014 — Parallel Test-File Race on `CONFIG.DIST_DIR` (RE-OBSERVED, 37th run)

**Evaluation Date**: 2026-08-04 (37th run)
**Category**: test
**Priority**: P1
**Status**: OPEN — RE-OBSERVED (1 of 5 full-suite runs failed)

## Summary

`npm run test:js` executes all test files concurrently via Node's test runner.
Multiple tests write to the same `CONFIG.DIST_DIR` (dist/), racing on the shared
directory. This run the race was **directly observed**: run 1 executed **1054 tests
with 1 failure**, while runs 2–5 each executed **1053 tests with 0 failures** — the
variable test count is itself evidence of the nondeterministic scheduling.

## Evidence (this run)

```
Run 1: # tests 1054  # pass 1049  # fail 1   # skipped 4
Run 2: # tests 1053  # pass 1049  # fail 0   # skipped 4
Run 3: # tests 1053  # pass 1049  # fail 0   # skipped 4
Run 4: # tests 1053  # pass 1049  # fail 0   # skipped 4
Run 5: # tests 1053  # pass 1049  # fail 0   # skipped 4
```

## Root cause

Parallel test files mutate the shared `dist/` directory (`CONFIG.DIST_DIR`). Node's
test runner schedules files concurrently; when one suite's fixture removal/rebuild
collides with another suite's assertion, `ERR_ASSERTION` failures appear
intermittently. The failure class was previously documented in
`docs/issues/2026-08-02/05-issue-records-28th/01-F014-test-race.md` (3 of 6 runs
failed with `ERR_ASSERTION` at `scripts/build-orchestrator.test.js:178`).

## Impact / Risk

- CI gate is nondeterministic — the same commit can pass or fail (observed 20%
  failure rate this run, 50% in the 28th run).
- Undermines determinism and trust in the test suite; blocks green-CI merge
  guarantees.

## Suggested resolution

- Serialize suites that mutate shared `dist/`: `node --test-test-concurrency=1`, or
- Isolate each suite in a unique temp dir (inject `CONFIG.DIST_DIR` per-suite), or
- Gate the CI test step on `--test-concurrency=1` for the build-orchestrator suite.

## Affected

`scripts/build-orchestrator.test.js`, `scripts/*.test.js` (write to shared dist/)
