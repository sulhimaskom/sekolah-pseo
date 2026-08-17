# Issue Records — 194th Batch (234th Verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: Phase 1 audit on `90c8919` (post-PR #787 merge) — full command
matrix + 2 parallel explore sub-agents + targeted verification probes.
**Batch**: 194th issue-records batch (233rd = 192nd, 193rd = security pass 13).

## New findings this batch

### F225 (refactor, P2) — ADR-0005 layer inversion: services depend on controller layer

**Observations**: `src/services/BuildOrchestrator.js:52-55` requires
`../../scripts/manifest`, `../../scripts/build-performance`,
`../../scripts/enrichment`, `../../scripts/sitemap` — the business/services
layer depends on the controller/scripts layer.
**Evidence**: BuildOrchestrator.js:52-55 (verified at `90c8919` AND at 233rd
basis `0540dee` — pre-existing, not introduced this window). ADR-0005
(`docs/adr/0005-layer-separation.md`) documents "Dependencies flow inward:
controllers → services → presenters, with `src/core/` as a neutral
foundation". `scripts/sitemap.js:22` → `src/services/PageBuilder` is inward
(allowed); the BuildOrchestrator → scripts/ edges are the inversion.
**Impact / Risk**: Layer-separation contract partially violated; services
cannot be reused/tested independently of controller scripts; TASK-094 (PR
#781) eliminated presentation↔controller coupling but left this
services↔controllers edge. Unblocked (source-level), but large blast radius
(4 import edges + test repointing).
**Score Rationale**: Code Quality / Modularity & SRP 15→13 (deducted 1).

### F226 (ci, P1) — Pull CI zero-failure window broke: 90-minute timeout failure

**Observations**: on-pull workflow run 32030053702 (started 2026-08-17T12:28Z)
completed **FAILURE, exit 124** (the `timeout -k 1m 90m opencode run` inner
deadline — 90-minute budget exhausted at 13:59Z). Last-10 window: 7 success +
1 failure + 1 in-progress + 1 action_required — the first failure in the F063
sequence since the 101st win began.
**Evidence**: `gh run view 32030053702 --log-failed` → `##[error]Process
completed with exit code 124.`; `gh run list --workflow=on-pull.yml --limit
12` (verified in-session). 233rd's record noted this run as "101st win
in-progress at 12:40Z" — it subsequently failed.
**Impact / Risk**: F063 status flips IMPROVING → REGRESSED. The zero-failure
window is a key delivery-health metric; a 90m opencode budget is routinely
exhaustible on heavy PR windows.
**Score Rationale**: System Quality / Stability 20→11; Delivery / CI/CD
Health 20→7.

### F227 (ci, P2) — No CI quality gates: workflows never run lint/build/test/audit

**Observations**: None of the 6 workflow files execute `npm run lint`,
`npm run build`, `npm test`, `npm audit`, or the coverage gate. The only npm
invocations in CI are `npm ci || true` (fail-open) at `parallel.yml:72,347`.
`check-workflow-security.js` (the F027 gate) is NOT wired into any workflow —
only the local husky hook enforces it. Critical CI steps use
`continue-on-error: true` (`on-pull.yml:44,51`).
**Evidence**: grep across `.github/workflows/*.yml` (verified in-session);
`parallel.yml:72,347`; `on-pull.yml:44,51`; `scripts/check-workflow-security.js:213`.
**Impact / Risk**: README "CI Verification" claims quality gates that do not
exist (see F228). Build/lint/test results are LLM-agent-reported, not CI
enforced — merges can land without machine verification.
**Score Rationale**: Delivery / CI/CD Health deduction (included in 20→7).

### F228 (docs, P3) — Docs/CI-claims drift + env parity gaps

**Observations**: (1) README "CI Verification" states on-push runs "quality
gate (lint + format check)" and on-pull includes "quality gate, build, dan
test" — no such steps exist. (2) SECURITY.md:48 claims "npm audit integration
in CI pipeline" — no audit step in any workflow. (3) CHANGELOG.md:42 claims
"Least-privilege CI workflow permissions" — contradicted by 12 live
violations (F037). (4) docs/deployment.md:64 references a non-existent
`.github/workflows/deploy.yml`. (5) 5 production env vars undocumented in
`.env.example`: `EXTERNAL_DATA_DIR` (fetch-data.js:39), `PERF_MAX_BUILD_TIME_MS`,
`PERF_MAX_MEMORY_BYTES`, `PERF_MIN_THROUGHPUT`, `PERF_MAX_FAILED_PAGES`
(build-performance.js:19-25). (6) F005 prettier count 103→105 (all ledger md).
**Evidence**: verified in-session (grep of workflows for npm/lint/audit,
config reads, prettier re-count).
**Impact / Risk**: DX misleading; env-parity failures at runtime; security
posture over-stated in docs.
**Score Rationale**: Experience / Documentation Accuracy 7→6.5; Delivery /
Config & Env Parity held with note.

## Open findings (held, updated this batch)

| ID   | Category    | Priority | Title                                                                                                           | State             |
| ---- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------- | ----------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL + 10 HIGH) — **fix ready on agent, push-blocked F050 (135th obs)** | HELD (fix staged) |
| F038 | ci          | P1       | Orchestrator workflow fails 8/8 (checkout exit 128, 52+ days)                                                   | HELD              |
| F063 | ci          | P1       | Pull CI hourly zero-failure window **BROKE** (12:28Z timeout, run 32030053702)                                  | **REGRESSED**     |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (222nd+ denial)                                              | HELD              |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows                                                 | HELD              |
| F005 | chore       | P2       | 105 docs/issues ledger files fail `prettier --check` (82nd obs, +2)                                             | HELD/FLAT         |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                              | HELD              |
| F018 | enhancement | P1       | Data freshness watchdog STALE (28+ days > 7 threshold)                                                          | HELD              |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                               | HELD              |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (Node 20 EOL since 2026-04)                                        | HELD              |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                           | HELD              |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–25)                                                           | HELD              |
| F225 | refactor    | P2       | ADR-0005 layer inversion: services depend on controller layer (BuildOrchestrator.js:52-55)                      | **NEW**           |
| F226 | ci          | P1       | Pull CI zero-failure window broke (90m timeout, run 32030053702)                                                | **NEW**           |
| F227 | ci          | P2       | No CI quality gates: lint/build/test/audit never run in workflows                                               | **NEW**           |
| F228 | docs        | P3       | Docs/CI-claims drift + env parity gaps (.env.example, README, SECURITY, CHANGELOG, deployment)                  | **NEW**           |

## Resolved-maintained (re-verified this batch)

| ID   | Category | Priority | Title                                                       | State                      |
| ---- | -------- | -------- | ----------------------------------------------------------- | -------------------------- |
| F008 | refactor | P1       | src/presenters/styles.js oversized source file              | RESOLVED (maintained)      |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0, re-confirmed)      | RESOLVED                   |
| F029 | test     | P1       | fetch-data.test.js corrupts tracked `external/raw.csv`      | RESOLVED (not re-observed) |
| F065 | security | P2       | config validatePath sibling-prefix escape                   | RESOLVED (maintained)      |
| F067 | security | P1       | husky pre-commit gate swallow                               | RESOLVED (maintained)      |
| F096 | test     | P2       | TASK-096 logger pino null-sink fix (flaky ERR_TEST_FAILURE) | RESOLVED (landed PR #787)  |

## Batch delta summary (193rd → 194th)

- JS suite: 1234 → **1266 pass** (+32); coverage 97.39/93.44 → **97.45/93.62**
- Prettier ledger drift: 103 → **105 files** (F005 82nd obs)
- Pull CI: zero-failure window **BROKEN** (F063 IMPROVING → REGRESSED)
- New findings: **F225, F226, F227, F228**
- GitHub issue creation: still denied (F002, 222nd+ denial) — ledger remains the canonical tracker
