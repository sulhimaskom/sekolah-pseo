# Flake Fix Record — data-quality.test.js runner IPC corruption (233rd run conclusion, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: Post-merge verification of PR #782/#783 on `main` (`4be3146`), then
the flake diagnosis and fix on `f27dbb9` (PR #785).
**Convention**: GitHub issue creation is denied for this integration token
(F002 — `GraphQL: Resource not accessible by integration (createIssue)`,
**222nd consecutive denial**, freshly probed this run). Per the 221-run
docs-only convention, findings are recorded in this ledger. Each entry carries
the mandated category + priority labels (contract §4).

## This record: intermittent JS suite failure — `Unable to deserialize cloned

data due to invalid or unsupported version` (node:internal/test_runner/runner)

Observed during post-merge verification on `4be3146`: the full JS suite
(1270 tests) failed intermittently (~15–30% of runs; 1–6 failures per run,
varying) with `ERR_TEST_FAILURE` thrown in the **parent** test runner
(`node:internal/test_runner/runner:358:20`, `#proccessRawBuffer` →
`deserializer.readHeader()`). The affected file reported by the runner was
not stable, so the flake was chased deterministically:

1. **Not TASK-095**: suite without `check-workflow-security.test.js` ran
   10/10 clean, but `data-quality.test.js` alone failed 4/10 and reproduced at
   `a73fecb` (3/10) and `0540dee` (4/10) — pre-existing, predates TASK-094 and
   TASK-095. `data-quality.test.js` is byte-identical to `0540dee`.
2. **Not the child spawns**: the `spawnSync` children in
   `check-workflow-security.test.js` inheriting the IPC fd was tested and
   reverted (no change; 6/20).
3. **Not pino**: `LOG_LEVEL=silent` is not a valid level (falls through to
   `info`); `LOG_LEVEL=fatal` (valid) did not change the failure rate.
4. **Root cause isolated**: tests that **mock `console.log`** (json, default,
   missing) ran 10/10 clean; tests that **do not** (verbose, threshold-pass,
   threshold-fail) failed 7/10. `formatHuman(report)` writes box-drawing
   characters (`═`, U+2550) to real stdout while `main()` runs async.

## Root cause (confirmed against upstream)

Node 20's test runner child writes v8-serialized protocol frames **and** raw
stdout to the same pipe. The parent's `#proccessRawBuffer` strips non-serialized
bytes only before the first header per call; stdout text landing between frames
is read as the next frame's length using **signed 32-bit arithmetic**
(`<< 24 | << 16 | << 8 |`). When the first length byte is `>= 0x80` (box-drawing
U+2550 is 0xE2 0x95 0x90), the length goes negative, the
`rawBufferSize < fullMessageSize` guard never breaks, and
`deserializer.readHeader()` throws `Unable to deserialize cloned data due to
invalid or unsupported version`.

- **Upstream issue**: nodejs/node#64061 (signed read in `#proccessRawBuffer`);
  stale-bot closed without a fix; reopen requested.
- **Upstream fix**: PR #64706 (`>>> 0` unsigned conversion) merged 2026-07-26 —
  **only in v26.7.0**. Not backported to v24.x/v22.x; **Node 20 is EOL
  (2026-04-30) and will never receive it**.
- **Workarounds available on Node 20**: keep test-child stdout free of raw
  unframed output (the fix below). `--test-isolation=none` exists only on
  Node 22+.

## Fix (PR #785, merged to `main` `f27dbb9`)

Mock `console.log` in the three `main()` tests (verbose, threshold-pass,
threshold-fail) in `scripts/data-quality.test.js`, matching the existing
pattern already used by the json/default/missing tests. Box-drawing output no
longer reaches the protocol pipe.

## Verification (post-merge, `main` `f27dbb9`)

- Failing subset (threshold/verbose): 7/10 fail → **0/15 fail**
- Full suite: **0/15 fail** (was ~15–30% flake rate)
- ESLint 0 errors; Prettier clean; build PASS (budgets met)
- pytest 13/13 unaffected (JS-only change)

## Final state of the 233rd run

- Phase 0 re-probe after PR #785: **0 open PRs, 0 open issues**.
- Remote branches: only `main` (stale `agent` branch, whose pre-squash merge
  commit `210855d` was already squashed into `009514e`, deleted).
- Working tree clean; repository green and buildable.
- Final state: **IDLE** (no actionable PRs/issues; awaiting next scheduled
  on-pull trigger or human review).

## Fail-safe check (contract)

The flake was diagnosed with deterministic experiments (baseline worktrees at
`0540dee`/`a73fecb`, subset isolation, invalid-hypothesis elimination) rather
than shotgun changes; the revert of the rejected `spawnSync` stdio experiment
was verified via `git diff` against the merged baseline before the accepted fix
was shipped. No work lost, no regressions introduced (full suite 0/15).
