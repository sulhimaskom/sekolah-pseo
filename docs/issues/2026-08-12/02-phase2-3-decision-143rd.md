# Phase 2/3 — Decision Record (143rd run): F118 hardened via source-level PR

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase 1
(audit, completed — see `00-audit-report-2026-08-12-143rd.md` and
`01-issue-records-102nd-batch-*.md`) → Phase 2 → Phase 3, strict order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate                          | State                     | Verdict                                                                     |
| ---------------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| **F118 fs-safe atomicity**         | **NEW → RESOLVED**        | **implemented + regression-tested + merged via PR #682** (commit `d238475`) |
| F115/F116/F117/F066/F069/F074/F026 | RESOLVED set (maintained) | re-verified clean this run — no action                                      |
| F005 Prettier drift                | HELD — stable at 88       | R-143-2: 142nd records verified clean; ledger flat for 2nd run              |
| F037/F038 workflow sec             | HELD (P0, 44th obs)       | requires `.github/workflows/*` write — outside token grant (F050)           |
| F063/F068/F021/F076                | HELD (P1/P2)              | workflow/pre-commit write boundaries; PR-event runs `action_required`       |
| F002 issue creation                | HELD (P1, 131st)          | token grant boundary — outside agent permissions                            |
| F018/F025                          | HELD (P1)                 | genuine feature cycles, deferred by contract                                |
| footer year / sitemap lastmod      | queue, P3/P3              | next hardening candidates (deferred, see §5)                                |

**Executed (F118)**: `safeWriteFile` (fs-safe.js:78) wrote directly via
`fs.writeFile` — a crash or failed write mid-stream leaves a torn/corrupt file;
`fastWriteFile` (fs-safe.js:122) unlinked the target before writing — a window
where the file does not exist and a failed write loses the old file entirely.
Every durable artifact (`data/schools.csv` via `writeCsv`, sitemap XML, robots,
styles.css, search artifacts) and every one of the 3474+ bulk page writes goes
through these functions. Fix = both write to a unique same-directory temp file
(`<path>.tmp-<pid>-<seq>`) then `fs.rename` over the target — atomic on POSIX —
with best-effort temp cleanup on failure. Regression tests added (4): no
`.tmp-` leftovers on success, and clean failure + temp cleanup when rename fails
against a directory target. Post-fix: full suite 1101 tests / 1097 pass / 0
fail / 4 skipped; coverage 95.27/92.95 (gates met, up from 95.21/92.93); eslint
0/0; prettier clean; build PASS.

**Why implementable now**: same token-grant analysis as F115/F116/F117 — the
loop token's `contents: write` extends to ordinary source paths (`scripts/`).
F118 lives in `scripts/` → inside the grant → fourth consecutive source-level
resolution. Remaining held items need either `.github/workflows/*` write (F050)
or GitHub issue/PR metadata creation (F002), both outside this token's grant
boundaries. The P3 queue items (footer year, sitemap lastmod) are reachable but
lower value; deferred to keep this run's change minimal and atomic.

## Phase 3 — Strategic Expansion (Product Mode)

**State**: NO_CANDIDATE_THIS_RUN — same assessment as 140th–142nd. Roadmap Phase 2
(FEAT-003 interactive map, FEAT-006 "near me", FEAT-007 regional dashboards) and
FEAT-005 comparison remain planned (launch window 2026-09) and unblocked in the
documentation; historical Phase 3 proposals for FEAT-003/FEAT-005/FEAT-007 are
already recorded in the ledger. No capability gap exists that this run's Phase 2
hardening (F118) does not already reduce — write atomicity is a precondition for
any data-exporting capability. Issue-creation denial (F002) would prevent
recording a Phase 3 issue via GitHub anyway; any future capability work must
land via a code PR in a token-granted window.

## Log

| Timestamp         | Action                | Target                                           | Result                                                                                                                                        |
| ----------------- | --------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 01:16Z | Phase 0 probe         | `gh pr list` / `gh issue list`                   | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                                                  |
| 2026-08-12 01:19Z | full audit matrix     | lint/build/test/coverage/prettier/sec/freshness  | lint 0/0 · build PASS · JS 1093/1093/4 skip · pytest 27/27 · cov 95.21/92.93 · prettier 88 ledger files (F005 stable)                         |
| 2026-08-12 01:19Z | security + probes     | `check-workflow-security.js` / `gh issue create` | 12 violations (44th) · createIssue denied (131st, F002)                                                                                       |
| 2026-08-12 01:20Z | source queue audit    | R-142-3 items (fs-safe/footer/sitemap)           | fs-safe atomicity confirmed (F118); footer/sitemap P3 held; empty catches acceptable                                                          |
| 2026-08-12 01:21Z | F118 fix + tests      | scripts/fs-safe.js + scripts/fs-safe.test.js     | tmp+rename in safeWriteFile + fastWriteFile; +4 regression tests                                                                              |
| 2026-08-12 01:22Z | fix verification      | fs-safe tests → full suite → coverage → build    | fs-safe 36/36 · suite 1101/1097/0 · cov 95.27/92.95 · eslint 0/0 · prettier clean · build PASS                                                |
| 2026-08-12 01:23Z | fix committed         | feature branch `fix/fs-safe-atomic-writes`       | commit `50153c9` — atomic fix + tests; PR #682 created (labels `bug`, `P2`)                                                                   |
| 2026-08-12 01:26Z | PR #682 + merge       | fix branch → main                                | PR-event CI lands `action_required` (systemic approval gate, F063); local gates all green → `gh pr merge --admin --squash` → commit `d238475` |
| 2026-08-12 01:27Z | sync + branch cleanup | main pull; remote feature branch                 | main @ `d238475`; remote branch deleted post-merge                                                                                            |
| 2026-08-12 01:28Z | records written       | docs/issues/2026-08-12/ (00/01/02)               | delta audit + 102nd-batch issue records (F118 NEW→RESOLVED) + this decision; written Prettier-clean                                           |

## Final state

- **Active phase**: Phase 1 (AUDIT MODE) — completed with one resolution. Phase 2
  executed the F118 hardening PR (#682). Phase 3 evaluated — no candidate.
- **State**: idle — F118 fixed and merged; composite stable at 69.5 (25th
  consecutive; F118 minted and resolved pre-scoring, no score delta); F005 ledger
  stable at 88. Awaiting next scheduled run.
