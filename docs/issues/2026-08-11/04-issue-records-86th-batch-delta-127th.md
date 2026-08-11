# Issue Records — 86th Batch (Delta, 127th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 127th audit matrix on `86bac6f` (see `03-audit-report-2026-08-11-127th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 116th consecutive
denial). Per the 125-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 85th-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                     |
| ---- | ----------------- | ------ | --------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                      |
| F037 | security/P0       | HELD   | opencode.yml `issue_comment` trigger on public repo (CRITICAL)        |
| F038 | security/P0       | HELD   | architect-agent.yml `custom_prompt` heredoc interpolation (CRITICAL)  |
| F063 | ci/P1             | HELD   | orchestrator **10/10** failure — checkout auth (root cause confirmed) |
| F068 | ci/P2             | HELD   | **RE-OBSERVED** — pytest not installed in fresh env (see R-127-1)     |
| F002 | chore/P1          | HELD   | `gh issue create` denied (116th)                                      |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                      |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                           |
| F025 | feature/P1        | HELD   | live site not re-verifiable (egress blocked, HTTP 000)                |
| F004 | security/P2       | HELD   | 57 `secrets.*` refs / 10 unique names                                 |
| F007 | refactor/P2       | HELD   | 2045 lines across 6 workflow YAMLs                                    |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                  |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                             |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191) |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/` |

## New evidence / refinements (this run)

### R-127-1: F068 re-observed — pytest gate not reproducible (ci, P2)

- **Finding**: fresh sandbox runs `python3 -m pytest tests/` → `No module named
pytest` (exit 1). After `pip install -r requirements.txt` → 13/13 pass. The CI
  dependency on pytest is documented (`requirements.txt`) but not pre-provisioned in
  the audit sandbox, making the Python gate environment-dependent.
- **Impact**: Python gate is not reproducible from a clean environment without an
  undocumented install step; `tests/run_tests.py` fallback can mask this in CI.
- **Files affected**: `requirements.txt`, `tests/run_tests.py`, `.github/workflows/*`.
- **Suggested fix (deferred)**: add a pre-step to test jobs (`pip install -r
requirements.txt`), or drop the pytest path in favor of the stdlib
  `tests/run_tests.py` runner; document the Python gate prerequisite in
  `docs/testing.md`.
- **Labels**: `ci`, `P2`.

### R-127-2: F063 count escalated to 10/10 (ci, P1)

- **Finding**: 10th consecutive scheduled orchestrator failure (run `31448445441`,
  2026-08-11 01:09Z). Log: `fatal: could not read Username for 'https://github.com':
terminal prompts disabled` ×3 retries → git exit 128, at `actions/checkout`.
- **Diagnosis unchanged**: `secrets.GH_TOKEN` missing/malformed; replace with
  `secrets.GITHUB_TOKEN` (or remove the override) at
  `.github/workflows/orchestrator.yml` checkout + env. Same secret family drives
  F004's `GH_TOKEN` refs (3 occurrences).
- **Labels**: `ci`, `P1`.

### R-127-3: F005 drift stable at 88 (chore, P2)

- **Finding**: prettier flags 88 files; 0 are source. This run's records written
  Prettier-clean (verified: 126th 00/01/02 and 127th 03/04/05 all pass
  `prettier --check`), so the ledger holds with no growth.
- **Files affected**: `docs/issues/**` (88 files).
- **Suggested fix (deferred)**: extend `.prettierignore` with `docs/issues/`.
- **Labels**: `chore`, `P2`.

## Consolidated counts (86th batch delta)

- Total labeled findings active: **14 held + 2 resolved-maintained** (F026, F066).
- New records this batch: 3 (R-127-1..3) — one re-observation (F068) + two
  refinements; no new categories.
- No duplicate issues created (ledger consolidation rule applied; F-codes canon).
