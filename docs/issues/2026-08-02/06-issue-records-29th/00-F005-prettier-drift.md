# F005 — Prettier violations in docs/issues (WORSENED to 35 files)

**Evaluation Date**: 2026-08-02 (29th run)
**Category**: docs
**Priority**: P3
**Status**: OPEN — **WORSENED (27 → 35 files)**

## Summary
`npm run format:check` now fails on **35 files** (up from 27 in the 28th run, +8 this cycle).
All failing files live under `docs/issues/`. Every ulw-loop run appends new markdown records,
and none of them are formatted with Prettier — the drift is self-inflicted by the loop's own
output pipeline and compounds every cycle.

## Evidence (this run)
```
FMT_REAL_EXIT=1
Code style issues found in 35 files. Run Prettier with --write to fix.
```
Failing files include:
- docs/issues/2026-08-02/00-audit-report.md … 10-audit-report (new)
- docs/issues/2026-08-02/05-issue-records-28th/*.md
- docs/issues/2026-08-01/*.md, docs/issues/2026-07-30/*.md, docs/issues/2026-07-31/*.md

## Impact
- `npm run format:check` is a CI gate; it is now red, so the gate provides no signal.
- Drift is monotonic: every audit run adds unformatted files → score degrades every cycle.

## Suggested fix
1. Add `"format:check": "prettier --check ."` → change to check only enforced paths
   (`prettier --check "docs/issues/**"` would still fail), OR
2. Format the `docs/issues/` tree once and add a lint-staged rule so loop-generated markdown
   is auto-formatted on commit, OR
3. Exclude `docs/issues/**` from `format:check` (`.prettierignore`) and enforce Prettier only
   on source/docs that matter — documenting that audit records are generated artifacts.
4. Make the ulw-loop output pipeline run `prettier --write` on the files it writes before
   committing (root cause fix — stop the loop from re-polluting its own docs).

## Affected
docs/issues/** (35 files), .prettierignore / lint-staged.config.js / package.json
