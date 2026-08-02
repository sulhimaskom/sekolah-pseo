# F005 — Prettier drift (stable at 48 files; repo format gate permanently red)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: docs
**Priority**: P3
**Status**: OPEN — stable at 48 files (not worsened this run)
**Skills used**: `obra-superpowers-systematic-debugging` (drift-rate analysis: 25 → 27 →
35 → 42 → 48 → 48; root cause = loop-generated records never run through Prettier before
commit)

## Summary

`npm run format:check` fails on **48 files** — every one under `docs/issues/`. Each ULW
loop run appends new markdown records that are never run through Prettier, so the count
monotonically increased through the 31st run. This run's records WERE Prettier-formatted
before commit (established discipline), keeping the count flat at 48.

## Evidence (33rd run)

```
$ npm run format:check
[warn] Code style issues found in 48 files. Run Prettier with --write to fix.
```

Trend: 27th: 25 · 28th: 27 · 29th: 35 · 30th: 42 · 31st: 48 · **33rd: 48 (flat)**

## Impact

- Repo-level format gate is permanently red → engineers ignore it → drift compounds.
- Violates the contract rule "all linting warnings are fixed".
- New records from future runs risk re-growing the count unless formatting is automated.

## Suggested fix

1. Add a `format:docs` step to the loop run lifecycle: run Prettier `--write` on newly
   written `docs/issues/**/*.md` before committing, OR
2. Add `docs/issues/` to `.prettierignore` if the intent is archival records (then
   `format:check` scope excludes them deliberately), OR
3. Add a pre-commit hook that prettifies staged markdown under `docs/issues/`.

## Affected

docs/issues/** (48 files), .prettierignore, package.json (format scripts).

## Status tracking

- 27th: 25 · 28th: 27 · 29th: 35 · 30th: 42 · 31st: 48
- **33rd run: 48 (stable — this run's own records formatted pre-commit)**
