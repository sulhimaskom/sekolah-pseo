# Phase 2/3 — Decision Record (140th run): F115 hardened via source-level PR

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase 1
(audit, completed — see `42-audit-report-2026-08-11-140th.md` and
`43-issue-records-99th-batch-*.md`) → Phase 2 → Phase 3, strict order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate               | State                     | Verdict                                                                |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------- |
| **F115 escapeCsvField** | **NEW → RESOLVED**        | **implemented + regression-tested + merged via PR** (commit `07da491`) |
| F066/F069/F074/F026     | RESOLVED set (maintained) | re-verified clean this run — no action                                 |
| F005 Prettier drift     | HELD stable at 88         | this run's records written clean — ledger holds                        |
| F037/F038 workflow sec  | HELD (P0, 41st obs)       | requires `.github/workflows/*` write — outside token grant (F050)      |
| F063/F068/F021/F076     | HELD (P1/P2)              | workflow/pre-commit write boundaries; F063 7/7, root cause solid       |
| F002 issue creation     | HELD (P1, 128th)          | token grant boundary — outside agent permissions                       |
| F073 (P2, bug)          | HELD — eligible hardening | blocked for now by token grant (issue/PR metadata — F002)              |
| F018/F025               | HELD (P1)                 | genuine feature cycles, deferred by contract                           |

**Executed (F115)**: `escapeCsvField()` prefixed every `-`-leading value with a
single quote (formula-injection guard), corrupting negative numeric coordinates
(`-6.2088` → `'-6.2088` → `parseFloat` NaN) on the live `etl.js → writeCsv →
data/schools.csv` export path. Fix = numeric-literal exemption
(`/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/` returns numeric values un-prefixed) while
preserving the guard for formula-like strings (`-1-1`, `-2*3`, `=SUM(...)`, `+`,
`@`, tab). Regression tests added; the etl-run test that asserted the _corrupted_
output was corrected. Post-fix: eslint 0/0 · full suite 1093 tests / 1089 pass /
0 fail / 4 skipped · coverage 95.2/92.93 (gates met) · build PASS · prettier clean.

**Why implementable now**: F050 blocks `.github/workflows/*` writes and F002 blocks
issue/PR metadata, but the loop token's `contents: write` extends to ordinary source
paths (proven by docs PRs #672–675 and the historical source PRs #490/#365). F115
lives in `scripts/` → inside the token grant → first source-level resolution since
the hardening era. Remaining held items stay queued: they all need either
`.github/workflows/*` write (F050) or GitHub issue/PR metadata creation (F002),
both outside this token's graph.

## Phase 3 — Strategic Expansion (Product Mode)

**State**: NO_CANDIDATE_THIS_RUN — same assessment as 128th–139th: roadmap/blueprint
capabilities (FEAT-003 map, FEAT-006 near-me, FEAT-007 dashboards, FEAT-005 compare)
remain planned and unblocked; no capability gap that Phase 2 hardening does not
already cover; issue-creation denial (F002) would prevent recording a Phase 3 issue
via GitHub anyway; any future capability work must land via a code PR in a
token-granted window.

## Log

| Timestamp         | Action                  | Target                                                              | Result                                                                                                             |
| ----------------- | ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2026-08-11 21:35Z | Phase 0 probe           | `gh pr list` / `gh issue list`                                      | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                       |
| 2026-08-11 21:36Z | full audit matrix       | lint/build/test/coverage/prettier/sec                               | lint 0/0 · build PASS · JS 1091 tests/1087 pass/4 skip · pytest 27/27 · cov 95.19/92.91 · prettier 88 ledger files |
| 2026-08-11 21:40Z | security + freshness    | `check-workflow-security.js` / `check-freshness.js` / `gh run list` | 12 violations (41st) · STALE 22d (F018) · orchestrator 7/7 (F063)                                                  |
| 2026-08-11 21:41Z | F002 probe              | `gh issue create`                                                   | GraphQL createIssue denied — blocked (128th)                                                                       |
| 2026-08-11 21:45Z | source audit (delegate) | 2× explore (src/, scripts/)                                         | surfaced F115 (escapeCsvField negative-numeric corruption) + medium-obs queue (R-140-2)                            |
| 2026-08-11 21:46Z | F115 verification       | empirical probes + writeCsv round-trip                              | `'-6.2088` → NaN proven; live export row `lat='-6.2088`                                                            |
| 2026-08-11 21:50Z | F115 fix + tests        | scripts/utils.js + 2 test files                                     | numeric-literal exemption; regression tests; etl-run assertion corrected                                           |
| 2026-08-11 21:52Z | post-fix verification   | full suite + build + lint + prettier                                | 1093 tests / 0 fail · coverage 95.2/92.93 · build PASS · eslint 0/0 · prettier clean                               |
| 2026-08-11 21:53Z | fix committed           | feature branch `fix/escape-csv-negative-coordinates`                | commit `07da491` — atomic fix + tests                                                                              |
| 2026-08-11 21:55Z | records written         | docs/issues/2026-08-11/ (42/43/44)                                  | delta audit + 99th-batch issue records (F115 NEW→RESOLVED) + this decision                                         |
| 2026-08-11 21:56Z | PR + merge              | fix branch → main                                                   | per PR-handler conditions: build PASS, tests PASS, lint 0/0, prettier clean on changed files                       |

## Final state

- **Active phase**: Phase 1 (AUDIT MODE) — completed with one resolution. Phase 2
  executed the F115 hardening PR. Phase 3 evaluated — no candidate.
- **State**: idle — F115 fixed and merged; composite stable at 69.5 (22nd
  consecutive; F115 was minted and resolved pre-scoring, so no score delta).
  Awaiting next scheduled run.
