# F063 — F054 "root cause fixed in 63rd" claim is FALSE: orchestrator.yml unchanged since 2025-11-20, still failing daily

- **ID**: F063
- **Category**: ci
- **Priority**: P1
- **Status**: NEW (65th run, 2026-08-07) — verified by git history + run logs
- **Reported**: 2026-08-07

## Summary

The 63rd verification run (PR #595) claimed F054 was "HELD (root cause fixed in
63rd)" — **this claim is false**. `git log` shows **no commit has ever modified
the `GH_TOKEN` lines** in `.github/workflows/orchestrator.yml`: the file is
unchanged since `49c0fef` (2025-11-20, "Add orchestrator agent workflow"). The
orchestrator still injects `secrets.GH_TOKEN` (empty) at lines 33/41, and the
workflow **failed again this morning (2026-08-07 02:18 UTC, run 31140797725)** with the exact root-cause error:

```
fatal: could not read Username for 'https://github.com': terminal prompts disabled
The process '/usr/bin/git' failed with exit code 128
```

## Evidence

- `git log --oneline --all -- .github/workflows/orchestrator.yml` → only
  4 commits total; newest is a checkout-bump; the `GH_TOKEN` lines date from
  the initial 2025-11-20 commit.
- `git log -1 -S "secrets.GH_TOKEN" -- .github/workflows/orchestrator.yml` →
  `49c0fef` (2025-11-20). **No fix commit exists.**
- `.github/workflows/orchestrator.yml:33` `GH_TOKEN: ${{ secrets.GH_TOKEN }}`,
  `:41` `token: ${{ secrets.GH_TOKEN }}` — identical to creation.
- `gh run view 31140797725 --log-failed` → auth error, exit 128 (2026-08-07).
- `gh run list --workflow=orchestrator.yml` → 3 consecutive failures
  (08-05, 08-06, 08-07).

## Impact

- **The ledger's resolution-tracking is unreliable**: F054 was reported as
  having a fixed root cause, and downstream runs (64th) carried that status
  forward without re-verifying the file. A fix claim entered the ledger with
  zero code evidence.
- The daily orchestrator agent workflow — the repo's primary autonomous
  maintenance loop — has been dead for 74 days and counting.

## Recommendation

1. The actual 3-line fix is known and tiny: `orchestrator.yml:33/41` and
   `architect-agent.yml:37` use `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN`.
   (Requires `workflows:write`, F050-blocked for the loop token.)
2. **Process fix (no token needed)**: before any finding is marked RESOLVED,
   require a diff/commit SHA in the finding record. "Fixed" without a commit
   reference must be rejected — this run proves the failure mode.
3. F054's ledger status should be corrected from "root cause fixed" back to
   "UNFIXED — no commit exists".

## Related

- F054 (dead orchestrator, 74 days) — this finding corrects its status.
- F002 / F050 (loop token limitations) — why the fix cannot be applied by the loop.
