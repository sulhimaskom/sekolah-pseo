# F005 — Prettier drift (WORSENED to 42 files)

**Evaluation Date**: 2026-08-02 (30th run)
**Category**: docs
**Priority**: P3
**Status**: OPEN — **WORSENED (42 files, was 35)**

## Summary
`npm run format:check` fails on **42 files** — every one under `docs/issues/`. Each ULW
loop run appends new markdown records that are never run through Prettier, so the count
monotonically increases run over run:
- 27th run: 25 files
- 28th run: 27 files
- 29th run: 35 files
- **30th run: 42 files** (26× 2026-08-02, 13× 2026-08-01, 3× 2026-07-30)

## Evidence (this run)
```
$ npm run format:check
Code style issues found in 42 files. Run Prettier with --write to fix.
```

## Impact
- Repo-level format gate is permanently red → engineers ignore it → drift compounds.
- Violates the contract rule "all linting warnings are fixed".
- Self-inflicted: each run's output docs are the source of new drift.

## Suggested fix
1. Add a `format:docs` step to the loop run lifecycle: run Prettier with `--write` on
   newly written `docs/issues/**/*.md` before committing, OR
2. Add `docs/issues/` to `.prettierignore` **if** the intent is archival records (then
   `format:check` scope excludes them deliberately), OR
3. Add a pre-commit hook that prettifies staged markdown under `docs/issues/`.

## Affected
docs/issues/** (42 files), .prettierignore, package.json (format scripts)
