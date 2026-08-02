# F018 — Undocumented Data Regression: `schools.csv` 3474 → 1 school

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: bug
**Priority**: P1
**Status**: OPEN

## Summary
`data/schools.csv` is truncated from 3,474 schools to 1 school. Commit `151a07f` (PR #498)
reduced the file 3,475 → 2 lines with no documented rationale. The site now builds only **2
school pages** and **2 province pages**.

## Evidence (this run)
```
wc -l data/schools.csv -> 2
wc -l external/raw.csv  -> 3
npm run build -> "Total pages: 2", "Generated 2 school pages", "Generated 2 province pages"
```

## Impact
- Production site shows nearly no content (SEO project cannot function with 1 school).
- Scale/performance behavior (3,474 pages → 7,252 pps historically) is entirely unexercised by
  CI, masking latent regressions (affects B2/B4).
- Contradicts documented intent (blueprint/roadmap) of a full Indonesian school directory.

## Suggested fix
Restore the full dataset (from the pre-truncation commit or external source) and add a CI check
asserting `data/schools.csv` row count >= a documented minimum, so truncation cannot silently
land on `main` again.

## Affected
`data/schools.csv` (commit 151a07f)