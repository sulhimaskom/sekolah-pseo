# F005 / F008 / F018 — Drift Worsening (37th run)

**Evaluation Date**: 2026-08-04 (37th run)
**Categories / Priorities**: docs P3 (F005), refactor P2 (F008), bug P1 (F018)
**Status**: OPEN — all three worsened this run

## Summary

Three tracked findings degraded between the 36th and 37th runs. None is a new root
cause — each is a monotonic drift in an existing, documented issue.

---

## F005 — Prettier drift: 49 → 53 files (docs ledger only)

**Evidence**: `npx prettier --check .` → "Code style issues found in **53 files**"
(was 49 at the 36th run). Full warning list contains exclusively `docs/issues/`
ledger markdown files (53/53); source tree verified clean:

```
npx prettier --check "src/**/*.js" "scripts/*.js" "*.js" "*.json"
→ All matched files use Prettier code style!
```

**Impact**: CI format gate (`on-push.yml` quality gate) remains red for docs-only
PRs unless the ledger is formatted; meta-drift accumulates with each run's records.

**Suggested fix**: run `npx prettier --write` on `docs/issues/` (single mechanical
commit) and add a `prettier --check docs/issues` step to the ledger workflow.

---

## F008 — styles.js oversized: 1275 → 1296 lines

**Evidence**: `wc -l src/presenters/styles.js` → **1296** (was 1275).

**Impact**: single-file CSS-generator module continues to grow (+21 lines/run);
maintainability and reviewability degrade; contradicts Modularity/SRP scoring.

**Suggested fix**: split design tokens / shared primitives / page-specific sections
into separate modules (see docs/audit findings F008 lineage).

---

## F018 — data/schools.csv STALE: 14 → 15 days

**Evidence**: `npm run check-freshness` → Last Update **2026-07-20 (15 days ago)**,
2 records, Status STALE (threshold 7 days). The data-regression baseline (3474 → 2
records) is unchanged.

**Impact**: generated site serves outdated school data; the freshness gate is red
every run. This is the highest-priority bug finding (P1) and the primary blocker on
data-driven page accuracy.

**Suggested fix**: restore the full dataset via the ETL pipeline
(`npm run etl` / `npm run fetch-data`) with the documented source URL, then verify
record count and freshness threshold.

---

## Combined recommendation

These three items are independent, mechanical, low-blast-radius fixes suitable for
the next maintenance PR: (1) prettier-write the ledger, (2) split styles.js, and
(3) refresh schools.csv. F018 is P1 and should be prioritized.
