# ISSUE RECORD — F002 RECONFIRMED: workflow-file fix cannot be pushed (CI retry fix blocked)

> **Status**: GitHub issue creation BLOCKED (403) — fallback record per repo convention.
> **Labels**: `ci`, `P1`
> **Evaluation date**: 2026-08-03
> **Files affected**: `.github/workflows/on-pull.yml`, `.github/workflows/on-push.yml`

## Summary

Reconfirmed the F002 circular blocker while fixing a real CI failure. The hourly
`pull` schedule run (30806136631, 2026-08-03T10:34Z) failed with a **transient model
API 503** (`Streaming response failed: [503] The request queue is full`) at 5m26s —
first failure in 15+ scheduled runs. Root cause: the `On-Pull` step ran a bare
`timeout -k 1m 90m opencode run ...` with **zero retry logic**, so any transient
infrastructure error failed the whole run.

## Fix Prepared (correct, verified, un-pushable)

The fix wraps the `On-Pull` step in a bounded retry loop (max 3 attempts, 30s/60s
backoff, retry only fast failures < 900s elapsed — long-running failures are genuine
and would exceed the 120-min job timeout). Verified locally:

| Check             | Result                                      |
| ----------------- | ------------------------------------------- |
| YAML parse        | ✅ on-pull.yml valid                        |
| Bash syntax       | ✅ extracted script passes `bash -n`        |
| Retry behavior    | ✅ transient→success (attempt 2); permanent fail after 3 attempts |
| Workflow Security | ✅ 6/6 files, 0 violations                  |
| Prettier / ESLint | ✅ clean                                    |
| JS Tests / Build  | ✅ 1047/1047 pass; 2 pages, 0 failed        |

Commit: `fix/ci-onpull-retry` (branch preserved locally).

## Evidence Chain (this run)

| Step | Command                     | Result                                                                 |
| ---- | --------------------------- | ---------------------------------------------------------------------- |
| 1    | `gh run view 30806136631`   | `On-Pull` step failed 5m26s — `[503] The request queue is full`        |
| 2    | `git push origin agent`     | `refusing to allow a GitHub App to create or update workflow .github/workflows/on-pull.yml without workflows permission` |
| 3    | `git diff origin/agent main -- .github/workflows/` | **empty** — confirms origin/agent and main share identical (unfixed) workflow files |
| 4    | `git push origin docs/task076` (docs-only) | ✅ **succeeded** — token CAN push non-workflow content |

Step 4 is the decisive proof: the push failure is **strictly** the GitHub App
`workflows`-permission restriction on `.github/workflows/*`, not a general token
problem. Same root cause as TASK-022…TASK-071 (11 prior regression cycles): fixes
committed on `agent` were never pushable, so they never reached `main`.

## Required Human/Org Action (exact, minimal — unchanged from F002)

Edit `.github/workflows/on-pull.yml` and `.github/workflows/on-push.yml` via the
GitHub web UI or a PAT with `workflows: write`:

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write        # ← add
  workflows: write     # ← add (allows workflow-file fixes to be pushed)
```

Alternative: supply a fine-grained PAT (`GH_TOKEN`) with `repo` + `workflows: write`
to the loop job.

After the permission lands, push `fix/ci-onpull-retry` (or merge PR from it) so the
retry hardening reaches `main` and the hourly `pull` run stops failing on transient
503s.

## Impact If Not Fixed

- Every transient model-API hiccup fails the hourly `pull` run.
- All workflow-file fixes (security + CI hardening) remain permanently un-landable,
  perpetuating the regression cycle.
