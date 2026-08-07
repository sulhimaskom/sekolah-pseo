# F005 (UPDATE) — Prettier drift worsened: 62 → 64 files

- **ID**: F005
- **Category**: docs
- **Priority**: P3
- **Status**: WORSENED (65th run, 2026-08-07) — 64 files, +2 vs 64th
- **Reported**: 2026-08-07

## Summary

`npm run format:check` now reports **64 files** with Prettier style issues,
up from 62 at the 64th run. The drift is growing.

## Evidence

- `npm run format:check` → `[warn]` on 64 files; "Code style issues found in 64 files."
- 64th run recorded 62 files (F005 "HELD at 62").
- Drift is concentrated in `docs/issues/` records (each audit run adds docs
  files that are not Prettier-formatted before commit).

## Impact

- Violates the project's own quality gate (`format:check` fails → the repo's
  stated quality bar is unmet on main).
- Each run adds new unformatted docs, so the count only grows.

## Recommendation

Run `npx prettier --write docs/issues/2026-08-07/` (and the new 65th-run
records) before the docs commit; ideally wire `prettier --write` into the
docs-commit path so every verification run ships formatted records.
