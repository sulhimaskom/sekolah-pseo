# Phase 2/3 — Decision Record (142nd run): F117 hardened via source-level PR

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase 1
(audit, completed — see `48-audit-report-2026-08-11-142nd.md` and
`49-issue-records-101st-batch-*.md`) → Phase 2 → Phase 3, strict order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate                | State                     | Verdict                                                                     |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------- |
| **F117 CSV injection**   | **NEW → RESOLVED**        | **implemented + regression-tested + merged via PR #680** (commit `d71a085`) |
| F115/F066/F069/F074/F026 | RESOLVED set (maintained) | re-verified clean this run — no action                                      |
| F005 Prettier drift      | HELD → corrected 88       | R-142-2: 141st records 45–47 reformatted; ledger 91→88 stable               |
| F037/F038 workflow sec   | HELD (P0, 43rd obs)       | requires `.github/workflows/*` write — outside token grant (F050)           |
| F063/F068/F021/F076      | HELD (P1/P2)              | workflow/pre-commit write boundaries; orchestrator failures persist         |
| F002 issue creation      | HELD (P1, 130th)          | token grant boundary — outside agent permissions                            |
| F018/F025                | HELD (P1)                 | genuine feature cycles, deferred by contract                                |
| writeCsv / unlink window | queue, P2/P2              | next hardening candidates — fs-safe.js atomicity (deferred, see §5)         |

**Executed (F117)**: the client-side `downloadCsv` in `src/presenters/templates/
homepage.js` quoted every exported field but never applied the OWASP CSV
formula-injection guard that the server-side `escapeCsvField` (scripts/utils.js)
provides. A school named `=SUM(1,2)` or `@evil` exported an executable formula
cell, which spreadsheet apps evaluate on open (formula injection). Fix = a
client-side `sanitizeCsvField` mirroring the server contract exactly (leading
`=`/`+`/`-`/`@`/tab prefixed with `'`; negative numeric literals exempt — the F115
coordinate contract), applied to all 8 exported fields, with 4 vm-isolated
regression tests added to `scripts/homepage.test.js`. End-to-end emission
verified at the artifact level: `=SUM(1,2)` → `'=SUM(1,2)`, `@evil` → `'@evil`,
`-jalan` → `'-jalan`. Post-fix: full suite 1097 tests / 1093 pass / 0 fail /
4 skipped; coverage 95.21/92.93 (gates met); eslint 0/0; prettier clean; build
PASS.

**Why implementable now**: same token-grant analysis as F115/F116 — the loop
token's `contents: write` extends to ordinary source paths (`src/`, `scripts/`).
F117 lives in `src/` → inside the grant → third consecutive source-level
resolution. Remaining held items all need either `.github/workflows/*` write
(F050) or GitHub issue/PR metadata creation (F002), both outside this token's
grant boundaries.

## Phase 3 — Strategic Expansion (Product Mode)

**State**: NO_CANDIDATE_THIS_RUN — same assessment as 140th/141st. Roadmap Phase 2
(FEAT-003 interactive map, FEAT-006 "near me", FEAT-007 regional dashboards) and
FEAT-005 comparison remain planned (launch window 2026-09) and unblocked in the
documentation; historical Phase 3 proposals for FEAT-003/FEAT-005/FEAT-007 are
already recorded in the ledger. No capability gap exists that this run's Phase 2
hardening (F117) does not already reduce — client export integrity is a
precondition for any export-heavy capability. Issue-creation denial (F002) would
prevent recording a Phase 3 issue via GitHub anyway; any future capability work
must land via a code PR in a token-granted window.

## Log

| Timestamp         | Action                | Target                                                          | Result                                                                                                                    |
| ----------------- | --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-11 23:33Z | Phase 0 probe         | `gh pr list` / `gh issue list`                                  | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                              |
| 2026-08-11 23:34Z | full audit matrix     | lint/build/test/coverage/prettier/sec/freshness                 | lint 0/0 · build PASS · JS 1093/1089/4 skip · pytest 27/27 · cov 95.21/92.93 · prettier 91 ledger files (F005)            |
| 2026-08-11 23:34Z | security + probes     | `check-workflow-security.js` / `gh issue create`                | 12 violations (43rd) · createIssue denied (130th, F002)                                                                   |
| 2026-08-11 23:35Z | source queue audit    | R-141-3 items (fs-safe/homepage downloadCsv/footer/sitemap)     | all re-confirmed at source; **F117 confirmed** in live `dist/index.html` (raw `'"' + (s.a                                 |     | '') + '"'`) |
| 2026-08-11 23:36Z | F117 fix + tests      | src/presenters/templates/homepage.js + scripts/homepage.test.js | `sanitizeCsvField` added + applied to 8 fields; 4 vm-isolated regression tests added                                      |
| 2026-08-11 23:38Z | escape verification   | emitted `dist/index.html` regex                                 | template-literal `\d` loss caught (emitted `d+`); double-escaped, re-verified byte-level                                  |
| 2026-08-11 23:38Z | post-fix verification | full suite + build + lint + prettier + coverage                 | 1097 tests / 0 fail · coverage 95.21/92.93 · build PASS · eslint 0/0 · prettier clean                                     |
| 2026-08-11 23:39Z | fix committed         | feature branch `fix/csv-injection-client-export`                | commit `4c561a1` — atomic fix + tests; PR #680 created (labels `security`, `P2`)                                          |
| 2026-08-11 23:39Z | PR #680 + merge       | fix branch → main                                               | per PR-handler conditions: mergeable, build PASS, tests PASS, lint 0/0, prettier clean → squash-merged (commit `d71a085`) |
| 2026-08-11 23:40Z | sync + branch cleanup | main pull; remote feature branch                                | main @ `d71a085`; remote branch deleted post-merge                                                                        |
| 2026-08-11 23:41Z | records written       | docs/issues/2026-08-11/ (48/49/50) + 45/46/47 reformat          | delta audit + 101st-batch issue records (F117 NEW→RESOLVED) + this decision; F005 corrected 91→88                         |

## Final state

- **Active phase**: Phase 1 (AUDIT MODE) — completed with one resolution. Phase 2
  executed the F117 hardening PR (#680). Phase 3 evaluated — no candidate.
- **State**: idle — F117 fixed and merged; composite stable at 69.5 (24th
  consecutive; F117 minted and resolved pre-scoring, no score delta); F005 ledger
  corrected to 88. Awaiting next scheduled run.
