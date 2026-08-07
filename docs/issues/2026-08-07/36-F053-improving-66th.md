# F053 — Scheduled pull-run failures: IMPROVING (66th)

- **Evaluation Date**: 2026-08-07
- **Category**: ci
- **Priority**: P2
- **Status**: IMPROVING — 10/10 recent on-pull scheduled runs success
  (was: failures/cancellations through the 57th run; 9/10 at the 65th)
- **File affected**: `.github/workflows/on-pull.yml` (schedule cron `0 * * * *`)

## Domain Score Table (relevant)

| Domain                  | 65th | 66th | Criterion affected |
| ----------------------- | ---- | ---- | ------------------ |
| D. Delivery & Evolution | 58.2 | 58.2 | CI/CD Health       |

## Criteria-level breakdown

| Criterion        | Weight | Score | Rationale                                                             |
| ---------------- | ------ | ----- | --------------------------------------------------------------------- |
| D1. CI/CD Health | 20     | 46    | improvement offset by F063/F064/F065/F055/F037/F038 — no net movement |

## Observations

`gh run list --event schedule --limit 12` on 2026-08-07 (66th run):

| Outcome | Count | Detail                                                             |
| ------- | ----- | ------------------------------------------------------------------ |
| success | 10    | all `pull` workflow runs (03:43 → 15:48 UTC window)                |
| failure | 1     | `oc - orchestrator` run 31140797725 — **F063**, different workflow |

The `pull` CI surface itself has been healthy for days: the 57th run's
consecutive cancellations have not recurred, and the 65th run's single
remaining failure source (9/10) is now attributable purely to the
orchestrator (F063), not to `on-pull.yml`.

## Evidence

- `gh run list --event schedule --limit 12` — 10 successes (31145240711,
  31150708981, 31156172191, 31163301485, 31167804194, 31171278938,
  31174936404, 31179563766, 31185961888, 31194460624) + 1 orchestrator
  failure (31140797725).
- One run (31194460624, 15:48) in_progress at audit time — this 66th run.

## Impact / Risk

Low. The on-pull scheduled loop — the repo's autonomous maintenance driver —
is operating. Risk remains that a future infra/queue failure recurs with no
alerting (no heartbeat check exists), which is the residual half of this
finding.

## Score Rationale

- Positive signal noted; CI/CD Health score held at 46 because the
  orchestrator failure (F063) and the ledger's workflow-security cluster
  (F037/F038/F064/F065) continue to dominate the criterion. No net movement.

## Suggested resolution (residual, not implemented — read-only audit)

1. Consider a "loop heartbeat" scheduled check that alerts when a scheduled
   `pull` run does not complete within N hours (only remaining gap).
2. Candidate for RESOLVED status after 2+ weeks of sustained success.
