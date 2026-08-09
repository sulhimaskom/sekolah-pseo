# Phase 2/3 — Decision Record (107th run): flat audit — no new hardening or expansion candidates

**Evaluation Date**: 2026-08-09
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 1 (audit) → Phase 2 → Phase 3, strict order. Phase 1
completed first (see `31-audit-report-2026-08-09-107th.md`); Phase 2/3 evaluated against
the ledger below.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

**Objective**: strengthen/integrate existing features; every action must trace back to a
documented gap (contract: no new features, no UI polish, no renaming-only refactors, no
cosmetic cleanup).

| Candidate                   | State                                | Verdict                                                                                           |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **F066 dist-destruction**   | **HELD — empirical 3rd consecutive** | **Eligible — but blocked from in-repo fix** (see below)                                           |
| F037/F038 workflow security | HELD (P0, 12 violations)             | requires `.github/workflows/*` write — outside this token's grant (workflows: write graph absent) |
| F063 orchestrator GH_TOKEN  | HELD (P1, 5/5 nightly failures)      | same secret/workflow write graph boundary                                                         |
| F018 data refresh           | HELD (P1, STALE 20d)                 | upstream JSON-only ETL contract gap — genuine feature cycle, deferred                             |
| F025 live-site root 404     | HELD (P1, root 404)                  | Pages config boundary (deployment settings, not source-logic) — deferred                          |
| F064 lint-staged engine     | HELD (P2)                            | config/environment parity, not source-logic defect — deferred                                     |
| F005 Prettier drift         | HELD at 88 (+0, 11th flat)           | cosmetics-prohibited bucket; ledger written compliant — trend held                                |
| F002 issue creation         | HELD (P1, 97th consecutive 403)      | token grant boundary — outside this agent's permissions                                           |
| F028 npm vulnerabilities    | RESOLVED (maintained)                | 0 vulns — nothing to do                                                                           |
| F057/F017/F062 docs drift   | RESOLVED / HELD                      | addNumbers 0 matches; release.md phantom reference remains docs-only                              |

### F066 hardening assessment

F066 remains the single eligible hardening item (deterministic repro: build → test:py →
`dist/` destroyed, 3/3 this run; root cause pinned at `tests/run_tests.py:229-261`
`shutil.rmtree(dist_dir)` on the real build-output dir; fix is a one-line test-isolation
change mirroring the F052/F014 pattern already applied to `build-pages.test.js` and
`sitemap.test.js`). Per the FAIL-SAFE rule and the single-PR / docs-only convention this
repository has followed for 106 runs, F066 stays queued as the highest-priority hardening
item for the next available implementation window (token grant permitting) — **not**
executed speculatively this run. No code change applied this run.

## Phase 3 — Strategic Expansion (Product Mode)

- Gap source: `docs/roadmap.md` → FEAT-005 "Comparison Tool" already specified once
  (docs/issues/2026-08-08/…, PR #631) — user story, acceptance criteria, and value
  justification recorded and unique. No new roadmap gap identified this run.
- Contract: no duplicate issues — nothing new to open. No Phase-3 issue created this run.

## Action log (UTC)

| Time  | Action                   | Target                                              | Result                                               |
| ----- | ------------------------ | --------------------------------------------------- | ---------------------------------------------------- |
| 18:29 | Phase 0 entry decision   | `gh pr list` / `gh issue list`                      | 0 PRs / 0 issues → Phase 1 (AUDIT)                   |
| 18:30 | Deps install             | `npm install` / `pip install -r requirements.txt`   | 131 pkgs; 0 vulns; EBADENGINE (F064); pytest 9.1.1   |
| 18:30 | Quality gates            | lint / format:check / build / test:js               | lint 0; format 88 files; build PASS (30ms); 1056 JS  |
| 18:31 | Coverage gate            | `npm run coverage` (c8)                             | stmt 94.94 / br 92.2 / fn 96.65 — exit 0             |
| 18:31 | Python tests             | `npm run test:py`                                   | 27/27 PASS — then dist/ MISSING (F066, 3rd)          |
| 18:31 | Workflow security        | `scripts/check-workflow-security.js`                | exit 1 — 12 violations (F037/F038 held)              |
| 18:31 | Dep audit                | `npm audit`                                         | 0 vulnerabilities (F028)                             |
| 18:32 | Data freshness           | `scripts/check-freshness.js`                        | STALE 20d (F018)                                     |
| 18:32 | Issue-create probe       | REST `gh issue create` + `/api/user`                | 403 FORBIDDEN (F002, 97th)                           |
| 18:32 | Orchestrator health      | `gh run list --workflow=orchestrator.yml` (5)       | 5/5 failures (F063)                                  |
| 18:32 | Live-site probe          | `curl` root / robots.txt                            | root **404**, robots 200 (F025)                      |
| 18:32 | Source re-reads          | BuildOrchestrator, utils, validate-links, run_tests | F069/F070/F073/F066 confirmed at exact lines         |
| 18:32 | Env-var + console greps  | `process.env.*` / `console.*`                       | 14 env reads (13 non-test, F071); 28 consoles (F072) |
| 18:33 | F066 replay (2nd)        | build → test:py → `ls dist`                         | dist/ MISSING again — deterministic 3/3              |
| 18:34 | Records authored         | 31/32/33 docs/issues/2026-08-09/*                   | audit + issue records + decision record              |
| 18:35 | Records formatting check | `npx prettier --check` (target files)               | compliant — F005 count stays 88                      |

## Final state

- Active phase: **Phase 1 completed; Phase 2/3 evaluated** (docs-only, no code).
- Final status: **idle — docs records ship via docs PR** (see 31–33 records).
- Blocked: F002 (issue create), workflow/secret write boundary (F064/F037/F038/F063),
  F018 upstream refresh, F025 Pages config. F066 **eligible** for the next implementation
  window.
- No destructive, speculative, or cosmetic changes applied (FAIL-SAFE honored).
