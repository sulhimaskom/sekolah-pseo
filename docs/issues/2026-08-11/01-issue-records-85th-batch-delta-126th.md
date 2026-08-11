# Issue Records — 85th Batch (Delta, 126th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 126th audit matrix on `7752dfc` (see `00-audit-report-2026-08-11-126th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 115th consecutive
denial). Per the 124-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 83rd-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                     |
| ---- | ----------------- | ------ | --------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                      |
| F037 | security/P0       | HELD   | opencode.yml `issue_comment` trigger on public repo (CRITICAL)        |
| F038 | security/P0       | HELD   | architect-agent.yml `custom_prompt` heredoc interpolation (CRITICAL)  |
| F063 | ci/P1             | HELD   | orchestrator 9/9 failure — checkout auth (root cause narrowed)        |
| F002 | chore/P1          | HELD   | `gh issue create` denied (115th)                                      |
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

### R-126-1: F063 root cause narrowed (ci, P1)

- **Finding**: orchestrator workflow (`oc - orchestrator`) fails at checkout, not at
  the opencode step. Log: `fatal: could not read Username for 'https://github.com':
terminal prompts disabled` ×3 retries.
- **Diagnosis**: `secrets.GH_TOKEN` (used at orchestrator.yml checkout + env) is
  missing/unset or invalid for `actions/checkout@v7` HTTP auth. GitHub Actions normally
  uses the ambient `GITHUB_TOKEN`; the explicit `GH_TOKEN` override without a PAT breaks
  checkout. Same root cause likely affects the F004 `GH_TOKEN` family (3 refs across
  orchestrator.yml, on-push.yml, on-pull.yml).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}` (or remove the override) in orchestrator
  checkout; align remaining `GH_TOKEN` refs to `GITHUB_TOKEN`.
- **Labels**: `ci`, `P1`.

### R-126-2: F005 drift stable at 88 (chore, P2)

- **Finding**: prettier still flags 88 files; **0 are source** (`scripts/`, `src/`,
  configs all clean). All drift is in the `docs/issues/` ledger (historical audit
  records + verification reports, which intentionally mix CJK/Indonesian/ASCII text).
- **Files affected**: `docs/issues/**` (88 files).
- **Suggested fix (deferred)**: extend `.prettierignore` with `docs/issues/` and keep
  the format gate scoped to source+configs (current CI does NOT run prettier on `docs/`
  — no live gate is failing; F005 is a latent drift debt).
- **Labels**: `chore`, `P2`.

### R-126-3: F018 freshness trending (feature, P1)

- **Finding**: `data/schools.csv` last update 2026-07-20 — now 22 days stale
  (threshold 7). Record count only 2 (sample dataset, per repo design).
- **Files affected**: `data/schools.csv`, `scripts/check-freshness.js` config.
- **Suggested fix (deferred — genuine feature cycle, ledgered)**: schedule the
  `fetch-data`/`etl` pipeline on a cadence; verify source `external/raw.csv` availability.
- **Labels**: `feature`, `P1`.

## Consolidated counts (85th batch delta)

- Total labeled findings active: **13 held + 2 resolved-maintained** (F026, F066).
- New records this batch: 3 (R-126-1..3) — all refinements, no new categories.
- No duplicate issues created (ledger consolidation rule applied; F-codes canon).
