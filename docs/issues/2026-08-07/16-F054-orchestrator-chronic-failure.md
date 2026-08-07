# F054 — Orchestrator workflow dead 73 consecutive days (`secrets.GH_TOKEN` empty)

- **Evaluation Date**: 2026-08-07
- **Category**: ci
- **Priority**: P1
- **Status**: NEW (63rd run)
- **File affected**: `.github/workflows/orchestrator.yml` (also `architect-agent.yml`)

## Domain Score Table (relevant)

| Domain                  | 62nd | 63rd | Criterion affected |
| ----------------------- | ---- | ---- | ------------------ |
| B. System Quality       | 72.6 | 72.2 | Stability          |
| D. Delivery & Evolution | 59.5 | 58.9 | CI/CD Health       |

## Criteria-level breakdown

| Criterion        | Weight | Score | Rationale                                                                        |
| ---------------- | ------ | ----- | -------------------------------------------------------------------------------- |
| B1. Stability    | 20     | 76    | −2: the repo's primary autonomous-maintenance driver has failed 73 days straight |
| D1. CI/CD Health | 20     | 50    | −3: chronic dead workflow on top of F037/F038/F013/F002/F025                     |

## Observations

The `oc - orchestrator` workflow (`.github/workflows/orchestrator.yml`, daily
00:00 UTC schedule) has **failed on 73 consecutive daily runs from 2026-05-27
through 2026-08-07 — zero successes in its full 100-run history** (the first 26
runs were `cancelled`, Apr–May; every run since 05-27 is `failure`).

The failure is at the **Checkout step**:

```
X Checkout
X could not read Username for 'https://github.com': terminal prompts disabled
X The process '/usr/bin/git' failed with exit code 128
```

Root cause: `orchestrator.yml:41` passes `token: ${{ secrets.GH_TOKEN }}` to
`actions/checkout@v7`. The `GH_TOKEN` secret is **empty or invalid**, so the
checkout falls back to anonymous HTTPS and git aborts. This is the **F013
violation class `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN` escalated from a static
lint finding to a proven, chronic runtime failure.**

The 55th run (2026-08-06) observed this once and dismissed it as
"orchestrator failure @ 01:55Z at Checkout (transient, not code)". It is not
transient — it is a 73-day outage.

### Working vs dead token usage

| Workflow                | Token                  | Runtime status                                                   |
| ----------------------- | ---------------------- | ---------------------------------------------------------------- |
| on-pull.yml             | `secrets.GITHUB_TOKEN` | ✅ succeeding hourly                                             |
| parallel.yml            | `secrets.GITHUB_TOKEN` | ✅ succeeded                                                     |
| opencode.yml            | `github.token`         | ✅ ran                                                           |
| **orchestrator.yml**    | `secrets.GH_TOKEN`     | ❌ **dead 73 days**                                              |
| **architect-agent.yml** | `secrets.GH_TOKEN`     | ❌ last ran 2025-11-20 (workflow_dispatch only; same token risk) |

## Evidence

- `gh run list --workflow=orchestrator.yml --limit 100`: 26 `cancelled`
  (Apr–May) + **73 consecutive `failure` (2026-05-27 → 2026-08-07)**; `grep
success` count = 0.
- `gh run view 31140797725 --log-failed`: `##[error]fatal: could not read
Username for 'https://github.com': terminal prompts disabled`; `The process
'/usr/bin/git' failed with exit code 128` (×3) at Checkout.
- `.github/workflows/orchestrator.yml:33,41` — `GH_TOKEN: ${{
secrets.GH_TOKEN }}` and `token: ${{ secrets.GH_TOKEN }}` (env + checkout).
- `.github/workflows/architect-agent.yml:37` — same `secrets.GH_TOKEN` env.
- `.github/workflows/on-pull.yml:27,47` — `secrets.GITHUB_TOKEN` (works).
- `gh run list --workflow=architect-agent.yml --limit 6` — last activity
  2025-11-20 (workflow_dispatch), never scheduled, same dead-token pattern.
- `gh secret list` — **403 Resource not accessible** (loop token lacks
  `secrets` read; F002 family) — secret value state confirmed only
  indirectly via the checkout failure.

## Impact / Risk

The orchestrator workflow is the repo's scheduled autonomous-maintenance
driver (daily). For 73 days it has silently failed before executing any
logic, with **no alerting** — the only detection is a manual `gh run list`.
The loop has been operating as if an agent were running daily when none has
run since May 27. The dead `GH_TOKEN` also exists in `architect-agent.yml`,
so any future trigger of that workflow fails identically.

## Score Rationale

- **B1 Stability −2**: the longest single CI surface outage in the ledger
  (73 days) is a direct, evidence-backed stability failure.
- **D1 CI/CD Health −3**: on top of the existing deductions (F037/F038 25th,
  F013 12 violations, F002 60th, F025, F053), a primary workflow has been
  dead for 73 days. This is the second-biggest CI deduction after the
  F037/F038 cluster.

## Suggested resolution (not implemented — read-only audit)

1. Replace `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN` (or `github.token`)
   in `orchestrator.yml:33,41` and `architect-agent.yml:37` — the same fix
   class F013 already demands, now with direct runtime proof.
2. Requires `workflows: write` (F050) to push — **org-level grant needed**
   for the loop to remediate; or a human with write access applies the
   3-line change.
3. Add a scheduled "loop heartbeat" check that alerts when a scheduled run
   does not complete within N hours (also suggested for F053).
