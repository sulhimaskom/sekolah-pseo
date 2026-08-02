# F005 — Prettier Formatting Drift in `docs/issues/` (WORSENED to 27 files)

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: docs
**Priority**: P3
**Status**: OPEN

## Summary
`npm run format:check` reports **27 files** failing Prettier (up from 25 in the 27th run), all
under `docs/issues/2026-07-xx/` and `docs/issues/2026-08-xx/`. The audit/verification/docs files
the loop writes are not Prettier-formatted, and `format:check` only warns (no CI gate).

## Evidence (this run)
```
warn] docs/issues/2026-07-30/00-audit-report.md
warn] docs/issues/2026-08-02/03-audit-report-2026-08-02-25th.md
... 27 files total ...
Code style issues found in 27 files. Run Prettier with --write to fix.
```

## Impact
Docs formatting drift continuously grows. Every audit report adds unformatted markdown,
increasing the debt and weakening `format:check` as a meaningful signal.

## Suggested fix
Run `prettier --write` on markdown reports at write-time (add a docs-only formatting step), or
exclude `docs/issues/` and instead add a `docs` formatter gate on the CANONICAL docs (README,
docs/*.md). Fix the 27 files.

## Affected
docs/issues/**