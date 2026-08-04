# F029 — fetch-data.test.js Corrupts Tracked `external/raw.csv` (RESOLVED, 43rd run)

**Evaluation Date**: 2026-08-04 (43rd run)
**Category**: test
**Priority**: P1
**Status**: **RESOLVED** — PR #566 fix verified effective (maintained, 2nd clean run)

## Summary

`scripts/fetch-data.test.js`'s cache-fallback tests previously wrote `col1\nval1`
content into the tracked `external/raw.csv` during `npm run test:js`, leaving the
working tree dirty and the tracked data file corrupted. Fix PR #566 ("test no longer
overwrites tracked external/raw.csv via --output temp path") landed in the 42nd run;
this run verifies it holds.

## Evidence (this run)

- `npm run test:js` ×3 full-suite + `node --test scripts/fetch-data.test.js` (65/65
  pass): post-run `git status --short` → **empty** every time.
- `external/raw.csv` content verified intact (header + 2 school rows; no `col1\nval1`
  residue).
- Source re-check: `scripts/fetch-data.test.js` now passes `--output` to temp paths
  (lines 454-459, 511-515) so the cache-fallback copy never touches the tracked file;
  remaining `raw.csv` references in the file are temp-dir paths only.

## Impact

- `npm run test:js` no longer mutates tracked data — clean tree after every run,
  removing the "restore via git checkout" step previous runs required.
- Together with F014 (fixed this run), both P1 test-hygiene items are now resolved.

## Status change

| Run       | Status                          |
| --------- | ------------------------------- |
| 37th      | OBSERVED (corrupts raw.csv)     |
| 38th–41st | RE-OBSERVED                     |
| 42nd      | RE-OBSERVED, then PR #566 fix   |
| **43rd**  | **MAINTAINED RESOLVED** (clean) |
