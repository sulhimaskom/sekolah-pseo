# Basis Correction Record (235th verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Severity**: Medium — audit correctness, no code impact, no data loss
**Related**: `240-audit-report-2026-08-17-235th.md`,
`241-issue-records-195th-batch-delta-235th.md`,
`242-phase2-3-decision-235th.md` (all corrected in place via PR #792)

## What happened

1. Phase 0 probe (14:34Z) reported 0 open PRs / 0 open issues, and the local
   tracking ref `origin/main` pointed at `bfa0007` (the 234th-run records
   commit). The Phase 1 audit ran against `bfa0007`, concluding "zero source
   delta since 234th".
2. **That conclusion was wrong.** The true remote `main` had advanced to
   `63dd5e9` **before** this run's Phase 0 probe:
   - `08d714c` (PR #788, merged **14:27Z**): **TASK-098** —
     `src/core/fs-safe.js` exclusive-create fast path (`wx`, ~28% faster CI
     writes) + **TASK-099** — `scripts/etl.js` NPSN primary-key uniqueness
     constraint (keep-first, reject dupes), + 2 test files (+118 lines).
   - `63dd5e9` (PR #790, merged ~14:30Z): 234th-run action-log completion +
     ledger-239 prettier reformat.
3. The local tracking ref was stale because the working clone had not
   fetched between the 234th-run completion and this run's audit — a
   clone-sync gap, not a malicious or destructive event. The initial ledger
   (240/241/242, PR #791) was merged onto the true main (`af9f516`) — the
   merge itself was clean (3 docs files, 328 insertions, squash), but the
   audit figures it carried (1266 pass, 97.45/93.62 coverage, 105 F005
   files, "zero source delta") described the stale basis, not `af9f516`.

## Corrected evidence (all re-verified fresh on `af9f516`)

| Metric                | Initial (stale `bfa0007`)      | **Corrected (`af9f516`)**                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Source delta vs 234th | none claimed                   | **TASK-098/099** (fs-safe.js +57, etl.js +68, 2 test files +118)        |
| JS suite              | 1266 pass / 0 fail / 4 skipped | **1275 pass / 0 fail / 4 skipped** (+9 — TASK-098/099 tests)            |
| Coverage              | 97.45 / 93.62 / 99.57          | **97.34 / 93.62 / 99.57** (Δ stmt −0.11 — new code edges, still >80/75) |
| F005 prettier count   | 105 files                      | **104 files** (−1 — ledger-239 reformatted by PR #790)                  |
| Composite             | 70.3                           | **70.4** (B/Performance +0.5 for TASK-098; B 72.5→73.0)                 |
| F063                  | IMPROVING                      | IMPROVING (unchanged — CI probes are remote, not basis-dependent)       |
| All other findings    | held                           | held (re-verified on corrected basis; none affected by TASK-098/099)    |

## Root cause

The clone's `refs/remotes/origin/main` was not refreshed before auditing.
`git status` reports "up to date" against the local tracking ref, which was
stale relative to the true remote. The audit treated the local ref as truth
without a `git fetch` + `git ls-remote` cross-check.

## Preventative action (logged)

- **This run**: after detecting the discrepancy (via `git ls-remote` at
  start + `git fetch` post-merge), the full command matrix was re-executed on
  the corrected basis `af9f516` and all three ledger records (240/241/242)
  were corrected in place with the values above; this correction record
  (243) documents the incident.
- **Going forward**: Phase 1 audits will open with `git fetch origin` +
  `git rev-parse origin/main` verification of the tracking ref before
  scoring, eliminating the stale-basis failure class.

## No data loss

The PR #791 squash merge (`af9f516`) contains the complete true-main history
(08d714c + 63dd5e9 + 3 ledger files). No files were deleted, reverted, or
overwritten. The corrections are additive edits to the ledger records plus
this record.
