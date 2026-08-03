# F023 — Validator logic duplication: RESOLVED as filed (35th run)

**Evaluation Date**: 2026-08-02 (35th run)
**Category**: refactor
**Priority**: P3 (demoted from active to resolved)
**Status**: RESOLVED — premise no longer holds (verified 35th run)
**Skills used**: `explore` subagent (full git-history scan for `validate-repo-url.js`);
direct `git log --all --diff-filter` verification

## Summary

F023 as originally filed claimed validator logic duplication between a standalone
`validate-repo-url.js` module and `scripts/fetch-data.js`. This run's investigation
found that **a file named `validate-repo-url.js` has never existed** in the repository —
not in the working tree, not in any commit, not in any branch (verified via
`git log --all --pretty=format: --name-only | grep validate-repo` → 0 hits).

## Evidence (35th run)

```
$ git log --all --oneline --name-only --diff-filter=A | grep -B2 -i "validate-repo"
  (no output — file never added in any commit)

$ git log --all --pretty=format: --name-only | sort -u | grep -i "validate-repo"
  (no output — no such path in any tree)

$ grep -rn "validate-repo-url" scripts/ src/ package.json
  (no output — no reference anywhere in code)
```

All repository-URL validation lives **solely** in `scripts/fetch-data.js`:

- `validateRepoUrl` (lines 59-112) — exported at `:384`, tested in
  `scripts/fetch-data.test.js` (277-349, 509-561)
- `validateBranchName` (lines 121-152) — exported at `:385`
- `SHELL_METACHARACTER_REGEX` (`:38`) — the F015 defense

The only occurrences of the string `validate-repo-url` are in the audit/issue docs
themselves (34th/33rd run records referencing this finding).

## Status change rationale

- **RESOLVED as filed**: there is no second module duplicating the validator; the
  duplication premise is factually void.
- **Residual note (design preference, not a defect)**: the 34th run's rephrasing "no
  shared validation module" remains true — `validateRepoUrl`/`validateBranchName` live
  inside `fetch-data.js` rather than a dedicated `src/services/validators.js`. This is
  an architecture choice, not duplication; no action required unless the module grows.

## Impact

Removes one entry from the active findings ledger. No code change was made (read-only
verification per Phase 1).

## File affected

- `scripts/fetch-data.js` (single source of validator logic — confirmed, no change)
