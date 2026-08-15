# Issue Records — 157th Batch (Delta, 198th verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 197th audit matrix on `fa686ae`, re-executed fresh this run (see
`128-audit-report-2026-08-15-198th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **186th
consecutive denial**, freshly probed this run). Per the 196-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit + **Phase 2 execution (F008 styles.js split — RESOLVED)** — composite 69.65 → **70.4 (+0.75)**, first source-level delta since the 195th run; F008 1576→41-line composer + 11 modules (byte-identical output verified), coverage UP 95.57/93.07, all 1121 JS + 27 py tests green; pull CI window 10/4/1 with a NEW 46th-window infra failure (20:14Z `Endpoint is unavailable`), F063 WATCH; F037 99th obs, F038 38d, F002 186th, F005 99/46th, F018 26d, F029 NOT re-observed

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                              | State           |
| ---- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                          | HELD (99th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 38 days)                                                                     | HELD (38 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (186th denial)                                                                  | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                         | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (46th flat, held)                                                              | HELD/FLAT       |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                 | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)                                                                  | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                  | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                              | HELD            |
| F063 | ci          | P1       | pull CI hourly — 10/4/1; 43rd + **46th-window `Endpoint is unavailable`** + 44th/45th opencode timeout (exit 124, all infra-class) | WATCH           |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                              | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                                                                              | HELD            |

## RESOLVED this run

| ID       | Category     | Priority | Title                                                           | State                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------ | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **F008** | **refactor** | **P1**   | **src/presenters/styles.js 1576 lines — oversized source file** | **RESOLVED (198th run)** — 41-line composer + 11 section modules under `src/presenters/styles/`; byte-identical output verified vs git-HEAD original (35107 chars), full suite green (1121 JS + 27 py, 0 fail), coverage UP to 95.57/93.07, lint 0/0, prettier clean, zero new deps. Closes the 196th-run P1 escalation and the codebase's last oversized-source-file finding. |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                           | State                               |
| ---- | -------- | -------- | --------------------------------------------------------------- | ----------------------------------- |
| F067 | security | P1       | husky pre-commit gate swallow (`.husky/pre-commit`)             | RESOLVED                            |
| F065 | security | P2       | config validatePath sibling-prefix escape                       | RESOLVED                            |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0, this run re-confirmed) | RESOLVED                            |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security)          | RESOLVED                            |
| F027 | ci       | P2       | CI check attribution for docs PRs                               | RESOLVED                            |
| F017 | docs     | P2       | stale docs drift (setup/api)                                    | RESOLVED                            |
| F032 | security | P2       | secrets over-exposure in source tree                            | RESOLVED                            |
| F029 | test     | P1       | fetch-data.test.js corrupts tracked `external/raw.csv`          | RESOLVED (NOT re-observed this run) |

## Labels applied per contract §4

Category labels used: `security` (F037, F044, F067, F065, F028, F032),
`refactor` (F008, F007, F019), `ci` (F038, F063, F026, F027),
`enhancement` (F018), `chore` (F002, F005, F011, F025, F064), `test` (F029),
`docs` (F017). Priority labels: P0 (F037), P1 (F038, F002, F008, F018, F025,
F063, F028, F067, F029), P2 (F044, F005, F065, F007, F064, F026, F027, F017,
F032), P3 (F011, F019). Exactly one category and one priority per finding.

## Run delta summary (198th vs 197th)

- **Composite**: 69.65 → **70.4** (**+0.75**) — first source-level delta since
  the 195th run, driven by F008 RESOLVED.
- **F008**: 1576-line monolith → **41-line composer + 11 modules** (**RESOLVED**,
  P1 closed). Byte-identical output; coverage 95.54 → **95.57** stmt, 93.01 →
  **93.07** branch.
- **F063**: pull CI last-15 now **10 success + 4 failure + 1 in-progress** —
  NEW 46th-window failure at **20:14Z** (`Endpoint is unavailable`, run
  31906137151, died 88s into On-Pull, exit 1, no partial work). All 4 failures
  infra-class; no code regressions.
- **F037**: 98th → **99th observation** (12 violations, unchanged).
- **F038**: held at **38 days** (10/10 checkout failures; last run 00:50Z).
- **F002**: 185th → **186th consecutive denial** (issue creation still blocked).
- **F005**: 99 files, 45th → **46th consecutive flat** (all docs/issues; all
  source incl. new styles/ modules prettier-clean).
- **F018**: STALE **26 days** (held at 26, no further drift).
- **F004**: **59 refs / 10 unique** (57 yml + 2 template) — stable, no drift.
- **F029**: NOT re-observed (working tree clean after full suite; only the
  intended F008 change set present).
- **Tests**: 1121 JS + 27 Python, 0 fail; coverage 95.57/93.07 — above gate.

## F008 resolution detail (the run's Phase 2 execution)

The 197th run queued F008 as the "top unblocked source-level P1 candidate" and
recommended execution in the next executable window (`127-phase2-3-decision-197th
.md`). This run executed it:

- **Composer** (`src/presenters/styles.js`, 41L): requires 11 section modules,
  joins them after `getCssVariables()` in documented cascade order; memoization
  preserved.
- **Modules** (`src/presenters/styles/`): base 188L, enrichment 186L, search
  370L, comparison 261L, dark-mode 123L, homepage 120L, back-to-top 90L, print
  90L, error-404 85L, homepage-dark 53L, badges 37L.
- **Verification**: byte-identity vs git-HEAD original (35107 chars, checked
  twice — before and after prettier), full suite re-run green, coverage UP,
  lint 0/0, prettier clean, 0 new dependencies, `git status` confirms only the
  intended change set. The extraction was performed with a deterministic
  byte-exact slice script (not a subagent) and verified by construction.

## F063 detail (WATCH — one new infra observation)

The 46th-window run (31906137151, 20:14Z) failed **88 seconds** into the
On-Pull step: log shows `Error: Upstream request failed: Endpoint is
unavailable` at 20:15:55, `##[error]Process completed with exit code 1`. Unlike
the 44th/45th-window failures (opencode killed at the 90m budget after
completing work), this run performed **no work and created no PR** — clean
infra-class failure. The 43rd window (11:12Z) was the same `Endpoint is
unavailable` class. Zero code regressions in any of the 4 window failures; F063
stays WATCH with no repo-side action warranted.
