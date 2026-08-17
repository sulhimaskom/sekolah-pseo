# Issue Records — 195th Batch (235th Verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: Phase 1 audit on `af9f516` (post-PR #791 merge; incl. PR #788
TASK-098/099 source changes) — full command matrix re-executed fresh +
targeted verification probes, all witnessed in-session. **Basis correction**:
initial pass ran on stale local ref `bfa0007`; re-verified on `af9f516` (see
`243-basis-correction-235th.md`).
**Batch**: 195th issue-records batch (234th = 194th).

## New findings this batch

**None.** Source delta since 234th = TASK-098/099 (wx fast path + NPSN
uniqueness, PR #788) — a quality improvement with tests, not a defect. Every
finding in the active ledger was re-verified HELD, maintained RESOLVED, or
status-updated (F063). The only observation changes this window:

### F004 status update (ci, P2) — secret-reference count drifted 59 → 61

**Observations**: `secrets.*` reference count across `.github/workflows/*.yml`

- `template.md` = **61 refs / 10 unique names** (234th: 59 refs / 10 names;
  +2 refs, no new names). Breakdown: GITHUB_TOKEN 14, IFLOW_API_KEY 12,
  GEMINI_API_KEY 10, GH_TOKEN 5, CLOUDFLARE_API_TOKEN 5,
  CLOUDFLARE_ACCOUNT_ID 5, VITE_SUPABASE_KEY 4, VITE_SUPABASE_URL 3,
  SUPABASE_SECRET_KEY 2, SUPABASE_ANON_KEY 1.
  **Evidence**: `grep -rEoh "secrets\.[A-Z_]+"` across workflow files
  (verified in-session).
  **Impact / Risk**: Monitoring item — over-scoped secret exposure surface
  (F044) growing slowly; no new unique secret names.
  **Score Rationale**: no score change this window (held); tracked for the
  F044/F037 remediation window.

### F063 status update (ci, P1) — IMPROVING (was REGRESSED in 234th)

**Observations**: on-pull workflow last-10 = 8 success + 1 failure (run
32030053702, the 234th-window 12:28Z timeout — no NEW failure since) + 1
in-progress (32038668961, started 14:20Z). The zero-failure window is
rebuilding.
**Evidence**: `gh run list --workflow=on-pull.yml --limit 10` + `gh run view
32038668961` (verified in-session).
**Impact / Risk**: Delivery-health metric recovering; the in-progress run is
the 90-minute opencode budget type and could still time out — watch next
window. Full restoration of the 101st-win streak not yet achieved.
**Score Rationale**: B/Stability 11→11.5, D/CI-CD Health 7→7.5 (+0.5 each).

### F002 probe inconclusive this window (ci, P1) — transient GitHub API 503

**Observations**: `POST /repos/sulhimaskom/sekolah-pseo/issues` returned
**HTTP 503 "No server is currently available"** on 3 attempts (15s + 10s
waits) — a GitHub-side outage window, not a permission verdict. Token scopes
unchanged (GITHUB_TOKEN, `github-actions[bot]`). The 222nd-record status
(token lacks `issues: write` → 403 createIssue) remains the operative
baseline.
**Evidence**: REST probe via curl (×3, all 503); GET repo returned 200 with
`permissions` all-false.
**Impact / Risk**: GitHub-native issue output remains blocked (F002 held);
transient outage prevented a fresh 403/200 confirmation this run.
**Score Rationale**: no score change; re-probe next window when API is
stable.

## Active findings ledger — status summary (235th basis)

| ID        | Finding                                                           | Category | Priority | Status (this run)                                          |
| --------- | ----------------------------------------------------------------- | -------- | -------- | ---------------------------------------------------------- |
| F002      | Loop token lacks `issues: write` (403 createIssue)                | ci       | P1       | HELD (probe inconclusive — API 503; 222nd-record baseline) |
| F004      | `secrets.*` over-scoping (F044 cluster)                           | security | P2       | **61 refs / 10 names (drift +2)**                          |
| F005      | Prettier drift — 104 ledger md, 0 source                          | docs     | P3       | HELD (83rd obs; −1 — ledger-239 reformatted)               |
| F007      | Workflow YAML overcomplexity (2045L)                              | refactor | P2       | HELD                                                       |
| F011      | No tags / no release process                                      | release  | P2       | HELD (0 tags)                                              |
| F014      | Parallel test-file race on DIST_DIR                               | test     | P1       | NOT observed (2/2 clean)                                   |
| F017      | Phantom `addNumbers()` in api.md                                  | docs     | P3       | **RESOLVED maintained** (0 refs)                           |
| F018      | Data freshness stale 28 days                                      | data     | P1       | HELD (28d, threshold 7)                                    |
| F019      | run_tests.py duplicate imports                                    | refactor | P3       | HELD                                                       |
| F025      | SITE_URL placeholder `https://example.com`                        | config   | P1       | HELD                                                       |
| F026      | formatBytes(NaN) → "NaN undefined"                                | bug      | P2       | **RESOLVED maintained** (NaN → "NaN")                      |
| F028      | brace-expansion high vuln                                         | security | P2       | **RESOLVED maintained** (0 vulns)                          |
| F029      | fetch-data.test.js corrupts tracked raw.csv                       | test     | P1       | NOT re-observed (clean tree)                               |
| F033      | --json output pino-wrapped (unusable raw)                         | dx       | P2       | HELD                                                       |
| F037      | Workflow security violations (2 CRITICAL + 10 HIGH)               | security | P0/P1    | HELD (**136th obs**; push-blocked F050)                    |
| F038      | Orchestrator workflow 8/8 failed                                  | ci       | P1       | HELD (**53 days**)                                         |
| F044      | Job-level secret over-scoping                                     | security | P2       | HELD (61 refs)                                             |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy) | bug/ref  | P2/P3    | ALL HELD (no source delta)                                 |
| F050      | Token lacks `workflows: write` — blocks workflow patches          | ci       | P1       | HELD (push-blocked F037 fix, 14 passes)                    |
| F063      | Pull CI zero-failure window                                       | ci       | P1       | **IMPROVING** (8 consecutive successes since 12:28Z break) |
| F064      | Node version drift (.nvmrc 22 / runtime 20 / CI 20)               | ci       | P2       | HELD                                                       |
| F225      | ADR-0005 layer inversion (services→controllers)                   | refactor | P2       | HELD (BuildOrchestrator.js:52-55)                          |
| F226      | 90m timeout failure event (12:28Z)                                | ci       | P1       | HELD (event logged; no recurrence)                         |
| F227      | No CI quality gates (lint/build/test/audit)                       | ci       | P2       | HELD                                                       |
| F228      | Docs/CI-claims drift + env parity gaps                            | docs     | P3       | HELD                                                       |

All other tracked findings (F001–F224 minus rows above) re-verified HELD or
maintained RESOLVED per the prior ledger; no regressions observed this
window. Source delta (TASK-098/099) is a tested improvement — no new code
findings; suite grew +9 to 1275 pass (coverage 97.34/93.62).
