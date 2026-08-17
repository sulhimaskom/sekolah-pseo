# Issue Records — 197th Batch Delta (237th run, 2026-08-17)

**Ledger**: 197th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (237th).

**F002 status**: HTTP 403 conclusive (40th) — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (237th basis)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (40th)** |
| F004    | security | P2       | HELD   | **59 refs / 10 names** (workflows only; 61 incl. template.md) — zero growth, method-verified at both `1768a54` and `96d3e3a` |
| F005    | docs     | P3       | HELD   | **107 files** (85th obs): 106 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** (F230 fix held) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process |
| F014    | test     | P1       | NOT OBSERVED | 2/2 test runs clean (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 28 days (threshold 7) |
| F019    | refactor | P3       | **FIX THIS RUN (Phase 2)** | tests/run_tests.py duplicate imports — `sys/json/time/traceback/argparse/typing` (lines 13–18 vs 20–25) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **138th obs**, push-blocked F050 (15th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow 8/8 failed — **55 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 59 refs |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (15th push-block pass) |
| F063    | ci       | P1       | HELD   | on-pull: 3 failures in last 12 (12:28Z/15:17Z/16:18Z — all curl-429 install flakes); **no NEW failure since 16:18Z**; 2 successes after |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI node 20 (Node 20 EOL) |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open |
| F228    | docs     | P3       | HELD   | README/SECURITY.md/deployment.md claims false |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (2nd obs); on-pull.yml:63 unhardened install; 16:18Z log confirms curl 429 root cause |
| F230    | docs     | P3       | **RESOLVED** | blueprint.md/task.md prettier-clean at HEAD — PR #796 fix verified (2nd clean obs) |

## New findings detail

**None this window.** No new findings, no new regressions. F230 resolved via PR #796 (merged after 236th audit). F063 window static (no new failure). F004 zero growth. F026/F017 maintained RESOLVED.

## Suggested resolutions (ranked)

1. **F019 (P3, Phase 2 this run)**: remove the 6 duplicated import lines in `tests/run_tests.py` (keep lines 13–18, delete 20–25). Pure duplication elimination — traceable, atomic, verifiable (pytest must stay 27/27).
2. **F229/F063/F037/F038 (P1, BLOCKED)**: workflow hardening (pipefail/retry install, trigger gating, secret scoping, `--admin` removal) requires `workflows: write` — token lacks it (F050, 15th documented pass). Record and hold; deliverable only with a workflows-enabled token.
3. **F018 (P2)**: data 28d stale — requires ETL run with external API credentials; out of scope for this run's token.
4. **F228 (P3)**: docs-drift correction (README/SECURITY.md/deployment.md claims) — safe docs fix, deferred to a token-capable docs pass.

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 40th consecutive). Following the established repo pattern (runs 1–39, then 222nd-record convention), this run records findings as labeled docs records under `docs/issues/2026-08-17/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.