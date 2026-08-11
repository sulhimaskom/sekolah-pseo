# Issue Records — 101st Batch (Delta, 142nd verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 141st audit matrix on `09ed201`, re-executed fresh this run (see
`48-audit-report-2026-08-11-142nd.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 130th consecutive
denial). Per the 141-run docs-only convention, findings are recorded in this ledger.

## New finding minted this run

### F117 — client-side `downloadCsv` bypasses CSV formula-injection guard (security, P2) — RESOLVED via PR

- **Finding**: `src/presenters/templates/homepage.js` embeds a client-side
  `downloadCsv` (lines 514–548) that exports the filtered search results as CSV.
  Every field was double-quoted, but **no formula-injection guard was applied**,
  unlike the server-side `escapeCsvField` (scripts/utils.js:246) which prefixes
  leading `=`, `+`, `-`, `@`, tab with a single quote (OWASP CSV Injection; the
  guard restored for the negative-numeric case in F115). A school whose row data
  begins with a formula trigger (e.g. `=SUM(1,2)`, `@evil`, `+cmd|' /C calc`)
  therefore exported an **executable formula cell**: spreadsheet applications
  (Excel, LibreOffice, Google Sheets) evaluate such cells on open — formula
  injection / CSV injection.
- **Empirical proof** (in-session, at the artifact level):
  - Pre-fix `dist/index.html` showed raw concatenation `'"' + (s.a || '') + '"'`
    with no sanitizer call on any of the 8 exported fields.
  - End-to-end vm simulation of the emitted `downloadCsv` row builder produced
    `"=SUM(1,2)"` and `"@evil"` cells verbatim (unguarded).
  - Post-fix the same simulation emits `"'=SUM(1,2)"`, `"'@evil"`, `"'-jalan"`.
- **Files affected**: `src/presenters/templates/homepage.js` (`sanitizeCsvField`
  added to the embedded search script + applied to all 8 exported fields in
  `downloadCsv`; function-body indentation normalized, no behavior change);
  `scripts/homepage.test.js` (4 vm-isolated regression tests).
- **Fix applied (Phase 2 hardening)**: a client-side `sanitizeCsvField` that
  mirrors the server contract exactly — null/undefined → `''`, negative numeric
  literals exempt (`/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/`, the F115 coordinate
  contract), leading `=`/`+`/`-`/`@`/tab prefixed with `'`, everything else
  unchanged. Template-literal escaping verified in the emitted artifact
  (`\d` round-trips; caught and fixed in-session, then re-verified byte-level in
  `dist/index.html`).
- **Post-fix verification**: eslint 0/0 · full suite **1097 tests / 1093 pass /
  0 fail / 4 skipped** · c8 coverage 95.21% stmt / 92.93% branch (gates met) ·
  build PASS · prettier clean on changed files · emitted regex byte-verified.
- **Labels**: `security`, `P2`.
- **Status**: **RESOLVED** — merged via PR #680 (commit `d71a085`, squash).
- **Why fixable now**: the finding lives in `src/` — inside the loop token's
  `contents: write` grant for ordinary source paths (same analysis as F115/F116).
  No `.github/workflows/*` write (F050) or GitHub issue/PR metadata (F002) needed.

## Stability confirmation (no action — held findings)

All labeled findings from the 100th batch remain HELD with unchanged evidence:

| ID   | Category/Priority | Status | Evidence this run                                                      |
| ---- | ----------------- | ------ | ---------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 ledger files after R-142-2 correction — 0 source          |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (43rd obs)          |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (43rd) |
| F063 | ci/P1             | HELD   | orchestrator workflow failures persist — checkout auth                 |
| F002 | chore/P1          | HELD   | `gh issue create` denied (130th)                                       |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                       |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F025 | feature/P1        | HELD   | live site: `.pages.dev` DNS unresolvable; GH Pages root HTTP 404       |
| F004 | security/P2       | HELD   | 59 `secrets.*` refs / 10 unique names (R-142-3, +2 refs)               |
| F007 | refactor/P2       | HELD   | 2045+ lines across workflow YAMLs (3363 incl. action metadata)         |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                   |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md        |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                              |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)  |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`  |
| F115 | bug/P1            | ✅     | RESOLVED — `escapeCsvField` negative-numeric exemption re-verified     |
| F116 | bug/P2            | ✅     | RESOLVED — `--radius-full` token present in `dist/styles.css`          |

## New evidence / refinements (this run)

### R-142-2: F005 corrected — 141st-run record claim violation

The 141st report stated its records (45/46/47) were "written clean" and the ledger
"holds"; `prettier --check` in this run flagged all three (F005 88 → 91). The
records were reformatted in this run's docs PR and this run's records (48/49/50)
were written Prettier-clean, returning the ledger to 88 stable with zero source
files. Process note: each run must verify its own records with
`npx prettier --check docs/issues/<date>/<n>-*` before landing.

### R-142-3: Follow-up queue (re-confirmed at source, below the mint bar)

| Area                          | Pri | Evidence                                                                    |
| ----------------------------- | --- | --------------------------------------------------------------------------- |
| `writeCsv` non-atomic write   | P2  | `safeWriteFile` direct `fs.writeFile`, no tmp+rename (fs-safe.js:78)        |
| `fastWriteFile` unlink window | P2  | unlink-then-write gap documented (fs-safe.js:114–128)                       |
| empty catches                 | —   | acceptable — documented skip-intent (PageBuilder.js:111, BuildOrchestrator) |
| footer CURRENT_YEAR           | P3  | module-capture staleness (footer.js:13)                                     |
| sitemap lastmod               | P3  | generation date, not data date (sitemap.js:93/100)                          |

## Cumulative finding-state note

One new ID minted this run (F117) and **resolved in the same run** — the third
consecutive source-level resolution (F115 → F116 → F117). No regression observed
(baseline 1093 tests vs post-fix 1093 pass with +4 new). F005 returns to 88 stable
after the R-142-2 correction. The failure-to-record path (F002) is unchanged, so
findings continue to ship as labeled ledger records rather than GitHub issues.
