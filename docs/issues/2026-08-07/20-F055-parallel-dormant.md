# F055 — parallel.yml dormant 5.5 months (scheduled workflow silent)

- **ID**: F055
- **Category**: ci
- **Priority**: P2
- **Status**: NEW (64th run, 2026-08-07)
- **Reported**: 2026-08-07

## Summary

`parallel.yml` (scheduled agent workflow) has been **dormant since 2026-02-27** —
no runs for 5.5 months — despite the schedule cron `0 */4 * * *` still present in
the file. 18 runs total in history, last run 5.5 months ago.

## Evidence

- `.github/workflows/parallel.yml` — `schedule: cron: '0 */4 * * *'` still present.
- Run history (via GitHub API, this run): last run 2026-02-27; zero runs since.
- Confirmed by two independent audit lanes this run (code-quality agent +
  system-quality agent) and by prior 63rd-run run-history probes.

## Root Cause (hypothesized)

Either the workflow was disabled in the GitHub UI (Actions tab → workflow →
"Disable workflow"), or the `concurrency` group with another workflow is
suppressing it, or the repo-level schedule was paused. Cannot be confirmed
read-only (no workflow:write to re-enable / inspect settings).

## Impact

A scheduled maintenance/verification workflow has been silently dead for 5.5
months. If it was intended to run the agent loop or freshness checks, the
automation has been absent since Feb. Low immediate blast radius (no production
surface), but a silent-silence signal that the CI surface is not self-healing.

## Recommendation

- Confirm enablement status in GitHub UI (needs workflow:write, F050-blocked).
- If enabled-but-silent: check `concurrency` config and schedule visibility.
- Either re-enable the schedule or remove the dead cron and document the
  workflow as manual-only, so the repo stops claiming a 4-hourly automation
  that does not run.

## Related

- F053 (pull-run cancellations) — CI-surface reliability cluster.
- F054 (orchestrator dead 73 days) — sibling scheduled-workflow outage.
