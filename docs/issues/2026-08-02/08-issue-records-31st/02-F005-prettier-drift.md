# F005 — Prettier drift (WORSENED to 48 files)

**Evaluation Date**: 2026-08-02 (31st run)
**Category**: docs
**Priority**: P3
**Status**: OPEN — **WORSENED (48 files, was 42)**

## Summary

`npm run format:check` fails on **48 files** — every one under `docs/issues/`. Each ULW
loop run appends new markdown records that are never run through Prettier, so the count
monotonically increases run over run:

- 27th run: 25 files
- 28th run: 27 files
- 29th run: 35 files
- 30th run: 42 files
- **31st run: 48 files** (includes all 42 prior + 6 additional records under
  `docs/issues/2026-08-02/05-issue-records-28th/` and `06-issue-records-29th/`)

## Evidence (this run)

```
$ npm run format:check
Code style issues found in 48 files. Run Prettier with --write to fix.
```

Full list captured to `/tmp/prettier-fail.txt` (48 paths, all under `docs/issues/`).

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

**Note (this run)**: the 31st-run records themselves were Prettier-formatted before commit
to stop contributing to further drift.

## Affected

docs/issues/** (48 files), .prettierignore, package.json (format scripts)

## Status tracking

- 27th run: 25 files
- 28th run: 27 files
- 29th run: 35 files
- 30th run: 42 files
- **31st run: 48 files (WORSENED)**
