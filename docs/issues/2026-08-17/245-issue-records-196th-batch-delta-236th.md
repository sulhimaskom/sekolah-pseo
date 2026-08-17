# Issue Records — 196th Batch Delta (236th run, 2026-08-17)

**Ledger**: 196th batch delta. **Trigger**: Phase 0 → 3 PRs → PR Handler Mode (merged #792/#794/#795) → re-probe 0 PRs / 0 issues → Phase 1 audit (236th).

**F002 status**: HTTP 403 conclusive — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (236th basis)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE** this run (probe previously inconclusive via API 503) |
| F004    | security | P2       | **CORRECTED** | **59 refs / 10 names** — 235th's "61" was a measurement artifact (identical method at `af9f516` yields 59; +0 vs 234th, not +2). Breakdown: GITHUB_TOKEN 14, IFLOW_API_KEY 11, GEMINI_API_KEY 10, CLOUDFLARE_API_TOKEN 5, CLOUDFLARE_ACCOUNT_ID 5, VITE_SUPABASE_KEY 4, GH_TOKEN 4, VITE_SUPABASE_URL 3, SUPABASE_SECRET_KEY 2, SUPABASE_ANON_KEY 1 |
| F005    | docs     | P3       | **REGRESSED** | **106 files** (84th obs; **+2** — blueprint.md + task.md introduced by TASK-102/103 merges; see **F230**); 103 are ledger; 0 source files |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process |
| F014    | test     | P1       | NOT OBSERVED | 2/2 test runs clean (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 28 days (threshold 7) |
| F019    | refactor | P3       | HELD   | tests/run_tests.py duplicate imports (6 modules twice) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN/Infinity/0.5 tests green |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **137th obs**, push-blocked F050 (14th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow 8/8 failed — **54 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — corrected to 59 refs |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (TASK-097/102) |
| F063    | ci       | P1       | **REGRESSED** | on-pull: 3 failures in last 12 (12:28Z, 15:17Z, **16:18Z NEW**) — window broken; see F229 |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI node 20 (Node 20 EOL) |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open |
| F228    | docs     | P3       | HELD   | README/SECURITY.md/deployment.md claims false |
| **F229** | **ci**   | **P1**   | **NEW** | **TASK-102 workflow fix commit `0056ad8` UNREACHABLE** — documented fix does not exist; flake ACTIVE (3rd failure 16:18Z) |
| **F230** | **docs** | **P3**   | **NEW** | **F005 +2** — blueprint.md + task.md prettier violations from TASK-102/103 merges |

## New findings detail

### F229 (NEW, ci, P1) — TASK-102 workflow fix is missing; documented fix unreachable

**Observations**: PR #794 body and `docs/blueprint.md` (TASK-102 row, merged to main) claim the opencode-install 429 fix was "committed on `agent` as `0056ad8`". Verification:
- `git rev-list --all` → **0 matches** for `0056ad8`; no branch, tag, or dangling commit reaches it (`git fsck` clean of that object).
- The remote `agent` branch, fetched before merge/deletion (head `3d7da91`), never contained `0056ad8` — its commit list ends at the merge of main.
- `on-pull.yml` on main still runs: `curl -fsSL https://opencode.ai/install | bash` — **no pipefail, no retry, no binary-existence check**.
- The 16:18Z on-pull failure (run 32045001307, exit 127 `opencode: No such file or directory`) confirms the flake is **ACTIVE** — this is a 3rd occurrence not documented in TASK-102 (which covered 12:28Z + 15:17Z).

**Impact / Risk**: HIGH. The hourly scheduled `pull` workflow continues to fail intermittently (3× in the last 6 hours). The documented fix is fictional — anyone reading TASK-102 docs would believe the CI health issue is resolved. The `agent` branch deletion (via PR #792 merge) means any local-only fix on that branch is now gone.

**Evidence**:
- `git cat-file -t 0056ad8` → fatal: not a valid object name
- `git rev-list --all | grep 0056ad8` → 0
- `.github/workflows/on-pull.yml` Install OpenCode CLI step (unchanged)
- Run 32045001307 job logs: `timeout: failed to run command 'opencode': No such file or directory` → `##[error]Process completed with exit code 127.`

**Root cause hypothesis**: the fix was authored on a local `agent` checkout but never pushed (F050 push-block), then the branch was deleted at merge. The commit existed only in the author's local clone.

**Suggested resolution**: Re-create the pipefail/retry/binary-check hardening for all 9 install sites across 6 workflows, commit to a dedicated branch (e.g. `fix/opencode-install-429`), and deliver via a workflows-enabled token (F050). Track as TASK-104.

### F230 (NEW, docs, P3) — F005 grew +2: blueprint.md + task.md prettier violations

**Observations**: `docs/blueprint.md` (TASK-102 Decisions Log row, line 363) and `docs/task.md` (TASK-102 verification table, lines 35-44) fail `prettier --check`. Both were prettier-clean at the 235th basis (`af9f516` — verified by checkout). The violation: table rows containing pipe characters inside inline code spans (e.g. `curl -fsSL https://opencode.ai/install | bash`) — prettier's markdown table formatter cannot align these and reports the file as unformatted. Introduced by PR #794 (TASK-102 docs) and partially #795 (TASK-103).

**Impact / Risk**: LOW-MEDIUM. F005 count rose 104→106. Active (non-ledger) docs are now in the prettier-failure set — this is the first F005 growth in non-ledger files since the finding was tracked. `npm run format` would mangle the code spans (prettier re-wraps and breaks the inline-code pipes), so automated fixing is NOT safe — manual restructuring (escape pipes or reword) is required.

**Evidence**: `npx prettier --check docs/blueprint.md docs/task.md` at `af9f516` → clean; at `1768a54` → fails. `npx prettier docs/blueprint.md | diff` shows the formatter would corrupt inline-code pipe characters.

**Suggested resolution**: Restructure the TASK-102/103 table rows to avoid pipes inside inline code (e.g. use `\|` or reword to "curl … | bash" outside a table cell), then re-run `prettier --check`. Minor, P3 — can fold into a docs-consistency pass or the next doc-alignment task.