# ISSUE RECORD — F018: schools.csv data regression 3474→1 school (undocumented)

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — record persisted per repo convention (finding 002, 23rd consecutive block). Re-verified ✅ in 26th run (2026-08-02): `wc -l data/schools.csv` → still 2; `git show HEAD~20:data/schools.csv | wc -l` → 3475; build still outputs 2 pages.
> **Labels**: `bug`, `P1`
> **Evaluation date**: 2026-08-02
> **File affected**: `data/schools.csv`, `external/raw.csv`

## Summary

`data/schools.csv` was truncated from **3474 schools** (3475 lines) to **1 school**
(2 lines) in commit `151a07f` (PR #498, "REVIEW: Add 5 code review improvement tasks
to backlog", 2026-07-20). The site build output dropped from 3474 pages to **2 pages**.
No rationale is documented in the commit message, PR, or docs.

## Evidence

- `git show 151a07f --stat` → `data/schools.csv | 3478 +---` (3475→2 lines)
- `git show HEAD~20:data/schools.csv | wc -l` → 3475
- `wc -l data/schools.csv` → 2 (header + 1 school)
- `wc -l external/raw.csv` → 3 (header + 2 schools, unused by build)
- `npm run build` → "Generated 2 province pages", "Generated 2 school pages"
- Historical audits (2026-07-13, 2026-07-20) documented 3474-page builds

## Impact / Risk

- **If unintentional**: silent production data regression — the site went from covering
  the national dataset to a single school with no alert.
- **If intentional** (CI speed): undocumented — future contributors assume 1-school
  dataset is the real scope; large-scale performance path (3474 pages) is no longer
  exercised in CI, so regressions go undetected.

## Suggested resolution

1. Confirm intent with the repo owner (is the truncation deliberate?).
2. If deliberate: document the decision in `docs/blueprint.md` / `docs/data.md`, restore
   the real dataset for production builds, and keep a small fixture dataset for CI.
3. If accidental: restore the full dataset from git history (`git show HEAD~20:data/schools.csv`).
4. Add a data-volume smoke check to CI (e.g., fail if `schools.csv` has < N rows) to
   prevent silent truncation regressions.

## Domain score impact

- **D4 Migration Safety** (70/100): −30 for this undocumented regression
- **B2 Performance Efficiency** (90/100): −10 scale behavior unverified
- **B4 Scalability Readiness** (82/100): −18 scale path not CI-exercised
