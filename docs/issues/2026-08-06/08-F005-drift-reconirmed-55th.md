# F005 — Prettier Drift Reconfirmation (55th run, 2026-08-06)

- **Finding**: F005 — Prettier code-style drift across `docs/issues/`.
- **Evaluation Date**: 2026-08-06 (55th verification)
- **Category**: docs
- **Priority**: P3
- **Score impact**: A. Consistency −1, C. Documentation Accuracy −1 → composite −0.2
- **Status**: HELD — **drift growing (59 → 61 files)**

## Evidence

```
$ npx prettier --check .
Code style issues found in 61 files. Run Prettier with --write to fix.
```

- **61 files fail** `prettier --check` (was 59 in the 54th run). All 61 under
  `docs/issues/`; zero source/`.md` elsewhere.
- Growth source: the 54th run's own docs
  (`docs/issues/2026-08-06/03-run-report-2026-08-06-54th.md` and
  `04-audit-report-2026-08-06-54th.md`) were committed unformatted.
- The root cause is **self-inflicted drift**: each run appends an unformatted
  markdown report to `docs/issues/`, permanently raising the prettier failure
  count. This run's reports (06-run, 07-audit, 08-F005) are committed
  prettier-clean to break the cycle — the count should hold at 61 next run.

## Impact / Risk

- `docs/` is not production code, so the functional impact is nil.
- However, F005 feeds the **Consistency** criterion (A, weight 5) and
  **Documentation Accuracy** criterion (C, weight 14); unlimited growth
  steadily erodes both domain scores. It also permanently fails the
  `format:check` / CI quality-gate signal, masking future real drift.
- Drift is unbounded: every run adds one or two unformatted files.

## Score Rationale

- A. Consistency: 61 → 60 (−1) at 61 files.
- C. Documentation Accuracy: 52 → 51 (−1) at 61 files.
- Composite: 73.4 → 73.2 (−0.2), sole mover this run.

## Recommended Fix (deferred)

Run `npx prettier --write docs/issues/` (or add a `prettier --write` step to
the doc-generation path) to zero the count and restore the two criterion
scores. Deliberately **not** performed in this read-only Phase 1; propose as a
Phase 2/3 chore once an issue/PR for it can be shipped.
