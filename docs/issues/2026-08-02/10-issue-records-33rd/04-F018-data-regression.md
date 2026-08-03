# F018 — schools.csv data regression 3474→2 records, STALE 13 days (re-verified)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: bug
**Priority**: P1
**Status**: OPEN — RE-CONFIRMED
**Skills used**: `obra-superpowers-systematic-debugging` (data-state verification via
freshness gate + record count, independent of build output)

## Summary

`data/schools.csv` contains **2 records** instead of the historic 3474. The freshness gate
reports STALE: last update 2026-07-20, 13 days > 7-day threshold. Build now produces only
2 school pages. F001 (floating promise in fetch-data.js) means `npm run fetch-data`
cannot restore the dataset — it always falls back to cache, so this regression is
self-reinforcing.

## Evidence (33rd run)

```
$ npm run check-freshness
{"msg":"Last Update: 2026-07-20 (13 days ago)"}
{"msg":"Record Count: 2"}
{"msg":"Status: ⚠️ STALE"}
{"error":"Data is stale! Last update was 13 days ago (threshold: 7 days)"}
```

## Impact

- Production site serves 2 of ~3474 schools; province drill-down pages are empty shells.
- SEO surface (the project's entire purpose — PSEO) collapses.
- Interaction with F001: even a successful ETL cannot replace the dataset via the CLI.

## Suggested fix

1. Fix F001 first (make `main()` await `fetchFromGitHub`) so the CLI can actually load data.
2. Re-run ETL against the external source to restore the full dataset.
3. Add a CI gate asserting a minimum record count (e.g. >1000) so a regression like this
   fails loudly, not silently.

## Affected

data/schools.csv, scripts/etl.js, scripts/fetch-data.js (root cause F001), package.json
(freshness thresholds), CI workflows (missing record-count gate).

## Status tracking

- 28th run: NEW (2 records) · 29th–31st: RE-VERIFIED (2 records, STALE)
- **33rd run: RE-VERIFIED (2 records, STALE 13 days)**
