# ISSUE RECORD — F002: Loop runner token lacks issues:write (22nd consecutive block)

> **Status**: GitHub issue creation BLOCKED (403) — this record is the fallback per repo convention.
> **Labels**: `ci`, `P1`
> **Evaluation date**: 2026-08-02
> **Files affected**: `.github/workflows/on-pull.yml`, `.github/workflows/on-push.yml`

## Summary

The autonomous loop's `GITHUB_TOKEN` has `permission: none` for this repository. Every
Phase 1/2/3 run since 2026-07-01 has been unable to create GitHub issues. This run:

- `gh issue create --title "TEST-PERMISSION-CHECK-2026-08-02"` →
  `GraphQL: Resource not accessible by integration (createIssue)` (403)
- `gh api .../collaborators/github-actions[bot]/permission` → `{"permission":"none"}`

## Impact / Risk

- **High** — the loop's mandated output (GitHub issues for findings) is impossible;
  findings accumulate as markdown and are never tracked in the issue tracker, so
  remediation velocity is zero (25 runs, 0 issue-driven fixes).

## Suggested resolution (from docs/issues/2026-08-01/01-root-cause-correction.md)

1. Add `issues: write` (and `workflows: write` for self-fixing workflows) to the
   `permissions:` block of `on-pull.yml` / `on-push.yml`, OR
2. Supply a fine-grained PAT with `Issues: write` to the workflow environment.

Requires **human/org action** — the loop cannot self-grant tokens.
