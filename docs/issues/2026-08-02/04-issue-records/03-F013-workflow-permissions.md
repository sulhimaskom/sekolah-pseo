# ISSUE RECORD — F013: Workflow permission violations (12) — 5th+ regression

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — record persisted per repo convention (finding 002, 23rd consecutive block).
> **Labels**: `security`, `P1`
> **Evaluation date**: 2026-08-02
> **Files affected**: `.github/workflows/architect-agent.yml`, `on-push.yml`, `opencode.yml`, `orchestrator.yml`, `parallel.yml`

## Summary

`node scripts/check-workflow-security.js` reports **12 violations (2 CRITICAL + 10 HIGH)**
across 5 workflow files. These exact issues were fixed and re-fixed across 6 security
audit passes (SECURITY_AUDIT_NOTE.md) and have **regressed for the 5th+ time**.

## Evidence (fresh `--json` output this run)

| Severity | Rule                          | File                  |
| -------- | ----------------------------- | --------------------- |
| CRITICAL | DUPLICATE_API_KEY             | `on-push.yml`         |
| CRITICAL | DUPLICATE_API_KEY             | `parallel.yml`        |
| HIGH     | ID_TOKEN_WRITE                | `architect-agent.yml` |
| HIGH     | ACTIONS_WRITE_NON_MERGE       | `architect-agent.yml` |
| HIGH     | GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN | `architect-agent.yml` |
| HIGH     | ID_TOKEN_WRITE                | `opencode.yml`        |
| HIGH     | ACTIONS_WRITE_NON_MERGE       | `opencode.yml`        |
| HIGH     | ID_TOKEN_WRITE                | `orchestrator.yml`    |
| HIGH     | ACTIONS_WRITE_NON_MERGE       | `orchestrator.yml`    |
| HIGH     | GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN | `orchestrator.yml`    |
| HIGH     | ID_TOKEN_WRITE                | `parallel.yml`        |
| HIGH     | ACTIONS_WRITE_NON_MERGE       | `parallel.yml`        |

Root cause (documented in SECURITY_AUDIT_NOTE.md, 5th occurrence): fixes applied only
on the `agent` branch were overwritten when `main` merged into `agent`.

## Impact / Risk

- **High** — over-permissioned GH tokens (`id-token: write`, `actions: write`,
  `GH_TOKEN` instead of `GITHUB_TOKEN`) widen the supply-chain blast radius; duplicate
  `API_KEY` leaks the Gemini key alias into an unexpected consumer.

## Suggested resolution

1. Apply the documented fixes to `main` directly (not only `agent`).
2. Wire `scripts/check-workflow-security.js` into CI (`on-push.yml`/`on-pull.yml`) as a
   hard gate so regressions fail the build.
3. Delete or rebase the diverged `origin/agent` branch (25 behind, 1 ahead, stale since
   2026-07-27) to remove the overwrite vector.

## Domain score impact

- **B3 Security Practices** (54/100): −20 (2 CRITICAL) + −12 (5 HIGH)
- **D1 CI/CD Health** (61/100): contributes to −39
