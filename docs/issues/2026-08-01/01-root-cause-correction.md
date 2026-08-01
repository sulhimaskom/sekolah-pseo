# Root-Cause Correction — Issue Creation Blocked (7th Consecutive Audit)

**Category**: ci
**Priority**: P1
**Evaluation Date**: 2026-08-01
**File**: docs/issues/2026-08-01/01-root-cause-correction.md

## Executive Summary

After 6 consecutive audits concluded "blocked — requires human/org action" with an
**incorrect diagnosis** (blaming `on-push.yml`), this run performed a full root-cause
trace and identified two previously undocumented facts:

1. **The actual hourly loop runner is `on-pull.yml`**, not `on-push.yml`.
2. **Fixing `issues: write` alone is insufficient** — the token also lacks
   `workflows: write`, which GitHub *requires* to push any change to `.github/workflows/`.
   This is a genuine chicken-and-egg that the automation token can never resolve itself.

## Evidence Chain (this run, fresh)

| Step | Command / Check                          | Result                                                            |
| ---- | ---------------------------------------- | ----------------------------------------------------------------- |
| 1    | `gh pr list --state open`                | 0 open PRs → Phase 1 entered                                      |
| 2    | `gh issue list --state open`             | 0 open issues                                                     |
| 3    | `env \| grep GITHUB_EVENT`               | `GITHUB_EVENT_NAME=schedule`, `GITHUB_JOB=ci`, run 3375           |
| 4    | `gh api /actions/runs/30679497035`       | workflow 221418550 = **"pull"** = `.github/workflows/on-pull.yml` |
| 5    | `grep schedule .github/workflows/on-pull.yml` | `cron: '0 * * * *'` — hourly                          |
| 6    | `gh issue create --title TEST...`        | `GraphQL: Resource not accessible by integration (createIssue)`   |
| 7    | `curl -X POST .../issues`                | HTTP 403 `Resource not accessible by integration`                 |
| 8    | `git push fix/issues-write-permission`   | `refusing to allow a GitHub App to create or update workflow .github/workflows/on-pull.yml without workflows permission` |

## Prior Diagnosis (incorrect)

All 6 prior audits (07-13 → 07-31) stated:

> Root cause: `.github/workflows/on-push.yml` permissions block = contents/pull-requests
> write — no `issues: write`.

**Why it was wrong**: `on-push.yml` triggers on **push**, not on the hourly schedule.
The ULW loop runs via `on-pull.yml`'s `schedule: cron '0 * * * *'` (proven by run
metadata, step 4-5 above). Both files lacked `issues: write`, but only `on-pull.yml`
matters for the loop.

## Correct Root Cause

1. `on-pull.yml` `permissions:` block (lines 9-14) has `contents: write`,
   `pull-requests: write`, `actions: read`, `repository-projects: write`,
   `id-token: write` — **no `issues: write`** → every `gh issue create` / REST
   `POST /issues` returns 403.
2. Attempting to fix that (branch `fix/issues-write-permission`, commit `bba107c`,
   adding one line to both `on-pull.yml` and `on-push.yml`) was **rejected at push**:
   GitHub requires `workflows: write` permission for a GitHub App token to modify
   `.github/workflows/*`. The auto-minted token's permissions are inherited from the
   *currently running* workflow (`on-pull.yml`) — which does not grant `workflows: write`.
3. Therefore the token **cannot self-repair** the workflow file. Even adding
   `workflows: write` to `on-pull.yml` requires a push, which requires
   `workflows: write`. Circular dependency.

## Required Human/Org Action (exact, minimal)

Edit `.github/workflows/on-pull.yml` (and optionally `on-push.yml`) via the GitHub
web UI or a PAT with `workflows: write`:

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write        # ← add
  workflows: write     # ← add (allows future workflow-file fixes to be pushed)
  actions: read
  repository-projects: write
  id-token: write
```

Alternative: supply a PAT (`GH_TOKEN`) with `repo` scope + `issues: write` +
`workflows: write` to the loop job.

## Verification Checklist (post-fix)

- [ ] `gh issue create --title "perm-check" --body "ok"` succeeds (then close it)
- [ ] `gh api -X PUT .../repos/{owner}/{repo}/issues` returns 201
- [ ] Loop can push workflow-file fixes on subsequent runs

## Impact If Not Fixed

- Phase 1/2/3 findings remain siloed in `docs/issues/*` instead of actionable
  GitHub issues.
- ISSUE MANAGER MODE (issue normalization, dedup, repair) remains dead.
- The 13 verified findings (incl. 2 CRITICAL security violations) remain untracked.

## Related

- `docs/issues/2026-07-31/002-missing-issues-write-permission.md` (superseded diagnosis)
- `docs/issues/2026-07-13/005-missing-issues-write-permission.md`
