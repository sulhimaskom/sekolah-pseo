# Issue Records — 99th Batch (Delta, 140th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 139th audit matrix on `04abf33` (see `42-audit-report-2026-08-11-140th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 128th consecutive
denial). Per the 139-run docs-only convention, findings are recorded in this ledger.

## New finding minted this run

### F115 — escapeCsvField corrupts negative numeric coordinates (bug, P1) — RESOLVED via PR

- **Finding**: `scripts/utils.js` `escapeCsvField()` prefixes every value whose
  first character is `-` with a single quote as formula-injection protection.
  Negative **numeric literals** (e.g. latitude `-6.2088`) are not formulas —
  spreadsheets parse them as numbers — but the guard mangles them into
  `'-6.2088`. Any consumer parsing the exported CSV with `parseFloat()` receives
  `NaN`: silent data corruption on the `etl.js → writeCsv → data/schools.csv`
  export path.
- **Empirical proof** (in-session, three independent confirmations):
  - `escapeCsvField('-6.2088')` → `'-6.2088`; `parseFloat("'-6.2088")` → `NaN`
    (positive `106.8456` passes through clean).
  - Live `writeCsv` round-trip of `data/schools.csv` produced `lat='-6.2088` /
    `lat='-6.9175` on output (rows 1–2), i.e. **the corruption exists in the real
    export path today**.
  - Both current sample schools have negative latitudes; Indonesia is predominantly
    south of the equator, so this affects the majority of real-world rows.
- **Files affected**: `scripts/utils.js` (guard), `scripts/utils.test.js` +
  `scripts/etl-run.test.js` (tests; the etl-run test asserted the _corrupted_
  output `'-6.2000` and was updated to the correct `-6.2000`).
- **Fix applied (Phase 2 hardening)**: numeric-literal exemption
  `/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/` returns numeric values un-prefixed; the
  formula-injection prefix is preserved for genuine formula-like strings
  (`-1-1`, `-2*3`, `-SUM(A1:B1)`, `- 5`, `=SUM(1,2)`, `+1+1`, `@CONCAT`, `\t`).
  All 14 probe cases verified in-session; regression tests added.
- **Post-fix verification**: eslint 0/0 · full suite **1093 tests / 1089 pass /
  0 fail / 4 skipped** · c8 coverage 95.2% stmt / 92.93% branch (gates met) ·
  build PASS · prettier clean on changed files.
- **Labels**: `bug`, `P1`.
- **Status**: **RESOLVED** — merged via PR (commit `07da491` on
  `fix/escape-csv-negative-coordinates`).
- **Why fixable now (unlike held items)**: F050 blocks `.github/workflows/*`
  writes and F002 blocks issue/PR metadata creation, but the loop's token has
  demonstrable `contents: write` for ordinary source paths (proven by docs PRs
  #672–675 and earlier source PRs #490/#365). F115 lives in `scripts/`, so it was
  inside the token grant — the first source-level resolution in many runs.

## Stability confirmation (no action — held findings)

All labeled findings from the 97th/98th batches remain HELD with byte-identical
evidence:

| ID   | Category/Priority | Status | Evidence this run                                                      |
| ---- | ----------------- | ------ | ---------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                       |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (41st)              |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (41st) |
| F063 | ci/P1             | HELD   | orchestrator 7/7 sampled failure incl. 2026-08-11 — checkout auth      |
| F002 | chore/P1          | HELD   | `gh issue create` denied (128th)                                       |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                       |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F025 | feature/P1        | HELD   | live site root HTTP 404; robots 200; Pages "built" (egress gap)        |
| F004 | security/P2       | HELD   | `secrets.*` refs across workflow envs                                  |
| F007 | refactor/P2       | HELD   | 2045 lines across 6 workflow YAMLs                                     |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                   |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md        |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                              |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)  |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`  |

## New evidence / refinements (this run)

### R-140-2: explore-subagent source audit — follow-up queue (various, P2/P3)

First full depth audit of `src/` (presenters + services) and `scripts/` in the
modern era surfaced medium/low observations for the future hardening queue. No
finding IDs minted (below the mint bar; each needs empirical confirmation before
scoring). Queue for a later implementation window:

| Area                              | Observation                                                                | Pri |
| --------------------------------- | -------------------------------------------------------------------------- | --- |
| `scripts/utils.js` `writeCsv`     | non-atomic write (tmp file not used); crash mid-write can truncate output  | P2  |
| `scripts/fs-safe.js`              | `fastWriteFile` unlink-then-write window (brief data-loss gap)             | P2  |
| `src/presenters/design-system.js` | `--radius-full` token used by styles.js but not emitted — visual bug       | P2  |
| client-side downloadCsv           | unguarded for formula injection (server-side guard bypassed via JS export) | P2  |
| PageBuilder/BuildOrchestrator     | empty catch blocks swallow errors silently                                 | P2  |
| footer CURRENT_YEAR               | module-load capture — stale year if page cached across New Year            | P3  |
| sitemap lastmod                   | uses generation date, not data date — misleading                           | P3  |

## Cumulative finding-state note

One new ID minted this run (F115) and **resolved in the same run** — the first
source-level resolution since the hardening era. No regression observed. F005
remains the sole drift item (docs-ledger Prettier debt, 0 source files). The
failure-to-record path (F002) is unchanged, so findings continue to ship as labeled
ledger records rather than GitHub issues.
