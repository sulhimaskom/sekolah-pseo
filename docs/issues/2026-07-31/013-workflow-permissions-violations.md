# Workflow Security Checker Reports 12 Violations Across 5 Workflows — Guard is Non-Blocking

**Category**: security
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/013-workflow-permissions-violations.md

## Problem Statement

The repository ships its own security regression checker, `scripts/check-workflow-security.js`, and wires it into `.husky/pre-commit`. Running it reports **12 violations across 5 workflows** — including 2 CRITICAL duplicate-secret findings. The pre-commit hook suppresses the result (`2>/dev/null || echo "⚠️ skipped"`), so violations never block commits and CI never enforces them.

## Violations (from `node scripts/check-workflow-security.js`)

| #   | Severity | Rule                                                      | File                   |
| --- | -------- | --------------------------------------------------------- | ---------------------- |
| 1   | HIGH     | `id-token: write` in non-OIDC workflow                    | architect-agent.yml:13 |
| 2   | HIGH     | `actions: write` in non-merge workflow                    | architect-agent.yml:17 |
| 3   | HIGH     | `secrets.GH_TOKEN` used instead of `secrets.GITHUB_TOKEN` | architect-agent.yml    |
| 4   | CRITICAL | `API_KEY` duplicates `GEMINI_API_KEY`                     | on-push.yml            |
| 5   | HIGH     | `id-token: write` in non-OIDC workflow                    | opencode.yml:18        |
| 6   | HIGH     | `actions: write` in non-merge workflow                    | opencode.yml:22        |
| 7   | HIGH     | `id-token: write` in non-OIDC workflow                    | orchestrator.yml:9     |
| 8   | HIGH     | `actions: write` in non-merge workflow                    | orchestrator.yml:13    |
| 9   | HIGH     | `secrets.GH_TOKEN` used instead of `secrets.GITHUB_TOKEN` | orchestrator.yml (×2)  |
| 10  | CRITICAL | `API_KEY` duplicates `GEMINI_API_KEY`                     | parallel.yml           |
| 11  | HIGH     | `id-token: write` in non-OIDC workflow                    | parallel.yml:16        |
| 12  | HIGH     | `actions: write` in non-merge workflow                    | parallel.yml:15        |

## Impact

- **Overprivileged CI**: `id-token: write` and `actions: write` grant OIDC token minting / workflow-management rights to non-merge workflows — unnecessary attack surface if the workflows only run opencode loops.
- **Broken orchestrator**: `orchestrator.yml` depends on `secrets.GH_TOKEN` which is not set for the schedule-triggered run → `fatal: could not read Username for 'https://github.com'` (verified in run `30598126267`, 2026-07-31T02:06Z, failure after 36s). The GITHUB_TOKEN from the runner env is available and correct to use.
- **False sense of security**: the guard exists but its result is discarded in the hook, so it is effectively decorative.

## Suggested Fix

1. Remove `id-token: write` and `actions: write` from architect-agent.yml, opencode.yml, orchestrator.yml, parallel.yml unless the workflow actually performs OIDC or merges PRs.
2. Replace `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN` in architect-agent.yml and orchestrator.yml.
3. Remove `API_KEY` (and other duplicate aliases) from on-push.yml and parallel.yml env blocks; reference `GEMINI_API_KEY` directly.
4. Make `.husky/pre-commit` fail the commit when the security check reports violations (remove the `|| echo` swallow) — or wire the check into CI as a hard gate.
5. Re-run `node scripts/check-workflow-security.js` → expect 0 violations.

## Evidence

- `node scripts/check-workflow-security.js` → `❌ Found 12 violation(s):` (full list above)
- `.husky/pre-commit` → `node scripts/check-workflow-security.js 2>/dev/null || echo "⚠️  Workflow security check skipped ..."`
- `gh run view 30598126267 --log-failed` → `##[error]fatal: could not read Username for 'https://github.com': terminal prompts disabled` (exit 128) — orchestrator scheduled run failed 2026-07-31T02:06:54Z
- `.github/workflows/orchestrator.yml:9,13` permissions; `orchestrator.yml` env uses `secrets.GH_TOKEN`
