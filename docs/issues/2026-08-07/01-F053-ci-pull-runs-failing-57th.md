# F053 — Scheduled `pull` workflow runs failing/cancelled

- **Evaluation Date**: 2026-08-07
- **Category**: ci
- **Priority**: P1
- **Status**: NEW (57th run)
- **File affected**: `.github/workflows/on-pull.yml` (schedule cron `0 * * * *`)

## Domain Score Table (relevant)

| Domain                  | 56th | 57th | Criterion affected |
| ----------------------- | ---- | ---- | ------------------ |
| B. System Quality       | 72.8 | 72.0 | Stability          |
| D. Delivery & Evolution | 63.7 | 59.3 | CI/CD Health       |

## Criteria-level breakdown

| Criterion        | Weight | Score | Rationale                                                                      |
| ---------------- | ------ | ----- | ------------------------------------------------------------------------------ |
| B1. Stability    | 20     | 72    | −2: two consecutive scheduled CI runs cancelled ~15m50s with no steps executed |
| D1. CI/CD Health | 20     | 49    | −4: F053 NEW plus existing F037/F038/F013/F002/F025                            |

## Observations

Two consecutive hourly-scheduled `pull` workflow runs failed on 2026-08-06:

| Run ID      | Created (UTC) | Duration | Conclusion | Detail                                              |
| ----------- | ------------- | -------- | ---------- | --------------------------------------------------- |
| 31118335506 | 16:01:44      | 15m50s   | failure    | job `pull` conclusion `cancelled`, steps list empty |
| 31125770424 | 18:20:40      | 15m50s   | failure    | job `pull` conclusion `cancelled`, steps list empty |

A third scheduled run (2026-08-07 00:36:35, run 31135241555) is in_progress — this
57th verification run itself. Prior runs (01:55, 05:12, 08:21, 11:13, 13:47) all
succeeded, so the failures are recent and consecutive, not chronic.

## Evidence

- `gh run list --event schedule --limit 8`: `failure 16:01`, `failure 18:20`
  after 5 consecutive successes.
- `gh run view <id> --json jobs`: `{"conclusion":"cancelled","name":"pull","steps":[]}`
  — job cancelled before any step logged output.
- `gh run view <id> --json`: `cancelled_by: null`, `conclusion: failure`.
- `gh run view <id> --log-failed` → no failed-step output found (no steps ran).
- `.github/workflows/on-pull.yml:16-18` — concurrency group `oc-agent`,
  `cancel-in-progress: false`; job `timeout-minutes: 120`. A 15m50s duration is
  NOT the 120-minute timeout; it resembles runner-level cancellation (queue or
  infra), not a job-timeout or script failure.

## Impact / Risk

The scheduled loop is the repo's primary autonomous-maintenance driver. Two
consecutive cancelled runs mean the automation surface silently went dark for
~4 hours on 2026-08-06. If the runner fleet (ubuntu-24.04-arm) or queue has an
availability problem, the loop will keep failing until infra recovers — with no
alerting (no failure notification exists; the only signal is `gh run list`).

## Score Rationale

- **B1 Stability −2**: CI instability observed directly (2 consecutive cancelled
  runs). No code-level instability (F014/F052 maintained clean), so deduction
  limited to the CI surface.
- **D1 CI/CD Health −4**: on top of the existing 56th-run deductions
  (F037/F038 18th-run, F013, F002, F025), F053 is a new P1 CI-reliability
  finding. CI is no longer "runs green" — 2 of the last 3 scheduled runs
  failed.

## Suggested resolution (not implemented — read-only audit)

1. Check `gh run list` for a broader failure window; pull run-level logs via
   the checks API (`GET /repos/{owner}/{repo}/actions/runs/{id}/attempts/1/logs`)
   once accessible.
2. If runner-availability is the cause: add a retry/`schedule` fallback or
   switch `runs-on` to a stable queue; add a scheduled "loop heartbeat" check
   that alerts when a scheduled run does not complete within N hours.
3. If cancellation is caused by job-level cancellation semantics, re-audit the
   `concurrency` group and the `turnstyle` wait step (on-pull.yml:34-40).
