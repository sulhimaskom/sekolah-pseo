# Phase 2 — Feature Hardening Finding: F017 phantom `addNumbers` API documentation (81st run)

**Evaluation Date**: 2026-08-08
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Domain**: A. Code Quality (Readability/Documentation Accuracy); C. Experience Quality (Doc Accuracy, DX)

## Finding

`docs/api.md` documents a non-existent `addNumbers(a, b)` function (lines 554–577) with
Parameters/Returns/Throws/Usage sections, but no such function exists in the codebase:

- `grep -rn "addNumbers" src/ scripts/` → **0 matches** (verified this run)
- `scripts/utils.js` `module.exports` (lines 421–435) exposes `parseCsv`, `escapeHtml`,
  `clearEscapeHtmlCache`, `escapeCsvField`, `walkDirectory`, `writeCsv`, `formatStatus`,
  `formatEmptyValue`, `hasCoordinateData`, `terminate`, `processConcurrently`,
  `processInBatches`, `generateMetaDescription`, `fileExists` — **no `addNumbers`**
- No test file references it (`grep -rn "addNumbers" tests/ scripts/*.test.js` → 0)

The `escapeHtml`/`clearEscapeHtmlCache`/`walkDirectory` sections are real (present in
`utils.js`), so this is a localized phantom entry, not a section-wide error.

## Impact

Documentation Accuracy (Criterion C.7, weight 14) and DX: a developer following the API
reference would call a function that does not exist, getting `TypeError: addNumbers is not
a function`. It also inflates the doc surface, masking the actual exported API.

## Fix (atomic, non-cosmetic — aligns documentation with documented intent)

Remove the phantom `#### addNumbers(a, b)` block (lines 554–577) from `docs/api.md`,
leaving the adjacent `clearEscapeHtmlCache` and `walkDirectory` sections intact.

Files affected:

- `docs/api.md`

## Verification

- `grep -rn "addNumbers" docs/api.md src/ scripts/` → 0 matches after edit
- `npx prettier --check docs/api.md` → clean
- No JS/Python test references the function, so no test impact (full suite re-run green)

## Status

FIXED in PR for the 81st run (see docs record). No GitHub issue created — F002 blocks
`issues: write` (403 createIssue, 77th consecutive); record ships as labeled docs.
