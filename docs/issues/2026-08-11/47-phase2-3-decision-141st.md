# Phase 2/3 — Decision Record (141st run): F116 hardened via source-level PR

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase 1
(audit, completed — see `45-audit-report-2026-08-11-141st.md` and
`46-issue-records-100th-batch-*.md`) → Phase 2 → Phase 3, strict order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate                | State                     | Verdict                                                                |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------- |
| **F116 radius-full**     | **NEW → RESOLVED**        | **implemented + regression-tested + merged via PR #678** (commit `2ae75d7`) |
| F115/F066/F069/F074/F026 | RESOLVED set (maintained) | re-verified clean this run — no action                                 |
| F005 Prettier drift      | HELD stable at 88         | this run's records written clean — ledger holds                        |
| F037/F038 workflow sec   | HELD (P0, 42nd obs)       | requires `.github/workflows/*` write — outside token grant (F050)      |
| F063/F068/F021/F076      | HELD (P1/P2)              | workflow/pre-commit write boundaries; F063 10/10, root cause solid     |
| F002 issue creation      | HELD (P1, 129th)          | token grant boundary — outside agent permissions                       |
| F018/F025                | HELD (P1)                 | genuine feature cycles, deferred by contract                           |

**Executed (F116)**: `getCssVariables()` in `design-system.js` emitted
`--radius-sm/md/lg` but not `--radius-full`, while `styles.js` consumed
`var(--radius-full)` in 4 rules (pills, badges, primary button). The generated
`dist/styles.css` shipped **4 references to an undefined custom property** →
`border-radius` fell back to 0 → pill components rendered as squares on every
generated page. Fix = emit `--radius-full: 9999px` after `--radius-lg` (the value
was already declared in `DESIGN_TOKENS.borderRadius.full`) + regression assertion
in `scripts/design-system.test.js`. Post-fix: build artifact defines the token
(`--radius-full: 9999px`); full suite 1093 tests / 1089 pass / 0 fail / 4 skipped;
coverage 95.2/92.93 (gates met); eslint 0/0; prettier clean on changed files.

**Why implementable now**: same token-grant analysis as F115 — the loop token's
`contents: write` extends to ordinary source paths (`src/`, `scripts/`), proven
again by docs PRs #672–677 and source PRs #676/#678. F116 lives in `src/` → inside
the grant → second consecutive source-level resolution. Remaining held items all
need either `.github/workflows/*` write (F050) or GitHub issue/PR metadata creation
(F002), both outside this token's graph.

## Phase 3 — Strategic Expansion (Product Mode)

**State**: NO_CANDIDATE_THIS_RUN — same assessment as 140th: roadmap/blueprint
capabilities (FEAT-003 map, FEAT-006 near-me, FEAT-007 dashboards, FEAT-005 compare)
remain planned and unblocked; no capability gap that Phase 2 hardening does not
already cover; issue-creation denial (F002) would prevent recording a Phase 3 issue
via GitHub anyway; any future capability work must land via a code PR in a
token-granted window.

## Log

| Timestamp         | Action                  | Target                                                              | Result                                                                                                       |
| ----------------- | ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-08-11 22:34Z | Phase 0 probe           | `gh pr list` / `gh issue list`                                      | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                 |
| 2026-08-11 22:35Z | full audit matrix       | lint/build/test/coverage/prettier/sec/freshness                     | lint 0/0 · build PASS · JS 1093/1089/4 skip · pytest 27/27 · cov 95.2/92.93 · prettier 88 ledger files       |
| 2026-08-11 22:35Z | security + probes       | `check-workflow-security.js` / `gh issue create` / `gh run list`    | 12 violations (42nd) · createIssue denied (129th, F002) · orchestrator 10/10 failure (F063)                  |
| 2026-08-11 22:36Z | source queue audit      | R-140-2 items (writeCsv/fs-safe/downloadCsv/footer/sitemap)         | all re-confirmed at source; **F116 confirmed** in live `dist/styles.css` (4 refs, 0 defs)                    |
| 2026-08-11 22:37Z | F116 fix + test         | src/presenters/design-system.js + scripts/design-system.test.js     | emit `--radius-full` after `--radius-lg`; regression assertion added                                       |
| 2026-08-11 22:38Z | post-fix verification   | full suite + build + lint + prettier                                | 1093 tests / 0 fail · coverage 95.2/92.93 · build PASS (`--radius-full: 9999px`) · eslint 0/0 · prettier clean |
| 2026-08-11 22:38Z | fix committed           | feature branch `fix/design-system-radius-full-token`                | commit `0fbe56d` — atomic fix + test                                                                        |
| 2026-08-11 22:38Z | PR #678 + merge         | fix branch → main                                                   | per PR-handler conditions: build PASS, tests PASS, lint 0/0, prettier clean → merged (commit `2ae75d7`)     |
| 2026-08-11 22:39Z | sync + branch cleanup   | main pull; local feature branch                                     | main @ `2ae75d7`; feature branch deleted post-merge                                                          |
| 2026-08-11 22:40Z | records written         | docs/issues/2026-08-11/ (45/46/47)                                  | delta audit + 100th-batch issue records (F116 NEW→RESOLVED) + this decision                                 |

## Final state

- **Active phase**: Phase 1 (AUDIT MODE) — completed with one resolution. Phase 2
  executed the F116 hardening PR (#678). Phase 3 evaluated — no candidate.
- **State**: idle — F116 fixed and merged; composite stable at 69.5 (23rd
  consecutive; F116 minted and resolved pre-scoring, no score delta). Awaiting next
  scheduled run.