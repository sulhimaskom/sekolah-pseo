# Issue Records — 100th Batch (Delta, 141st verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 140th audit matrix on `b77ca15` (see `42-audit-report-2026-08-11-140th.md`),
re-executed fresh this run (see `45-audit-report-2026-08-11-141st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 129th consecutive
denial). Per the 140-run docs-only convention, findings are recorded in this ledger.

## New finding minted this run

### F116 — `--radius-full` CSS token consumed but never emitted (bug, P2) — RESOLVED via PR

- **Finding**: `src/presenters/design-system.js` declares
  `DESIGN_TOKENS.borderRadius.full = '9999px'` (line 94) and
  `src/presenters/styles.js` consumes `var(--radius-full)` in **4 rules**
  (lines 175, 243, 699, 790: status pills, education badge, primary button),
  but `getCssVariables()` only emitted `--radius-sm/md/lg`
  (design-system.js:171–173) — `--radius-full` was never emitted.
  `border-radius: var(--radius-full)` therefore references an **undefined custom
  property** in the generated artifact: the computed value is invalid and browsers
  fall back to `border-radius: 0`, rendering pills/badges/buttons as squares on
  every generated page.
- **Empirical proof** (in-session, at the artifact level):
  - `getCssVariables()` output: `--radius-full:` absent.
  - Live `npm run build` artifact `dist/styles.css`: **4 occurrences of
    `var(--radius-full)`, 0 definitions** (verified via grep).
  - Post-fix rerun: `dist/styles.css` contains `--radius-full: 9999px` (1 def +
    4 usages = 5 refs); `getCssVariables()` emits the token.
- **Files affected**: `src/presenters/design-system.js` (emit token after
  `--radius-lg`); `scripts/design-system.test.js` (regression assertion in
  `includes border radius variables`).
- **Fix applied (Phase 2 hardening)**: single-line token emission + one
  regression assertion. The contract is now: every `radius` token declared in
  `DESIGN_TOKENS.borderRadius` is emitted by `getCssVariables()`.
- **Post-fix verification**: eslint 0/0 · full suite **1093 tests / 1089 pass /
  0 fail / 4 skipped** · c8 coverage 95.2% stmt / 92.93% branch (gates met) ·
  build PASS (`--radius-full: 9999px` present) · prettier clean on changed files.
- **Labels**: `bug`, `P2`.
- **Status**: **RESOLVED** — merged via PR #678 (commit `2ae75d7` on
  `fix/design-system-radius-full-token`).
- **Why fixable now**: same token-grant analysis as F115 — the loop token has
  `contents: write` for ordinary source paths (`src/`, `scripts/`); the finding
  lives in `src/`, inside the grant. No `.github/workflows/*` write (F050) or
  GitHub issue/PR metadata (F002) was needed.

## Stability confirmation (no action — held findings)

All labeled findings from the 99th batch remain HELD with unchanged evidence:

| ID   | Category/Priority | Status | Evidence this run                                                          |
| ---- | ----------------- | ------ | -------------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                           |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (42nd obs)              |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (42nd obs) |
| F063 | ci/P1             | HELD   | orchestrator 10/10 sampled failure incl. 2026-08-11 — checkout auth        |
| F002 | chore/P1          | HELD   | `gh issue create` denied (129th)                                           |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                           |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                                |
| F025 | feature/P1        | HELD   | live site: `.pages.dev` DNS unresolvable; GH Pages root HTTP 404           |
| F004 | security/P2       | HELD   | 57 `secrets.*` refs / 10 unique names across workflow envs                 |
| F007 | refactor/P2       | HELD   | 2045 lines across 6 workflow YAMLs                                         |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                        |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                       |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md            |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                                  |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)      |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`      |
| F115 | bug/P1            | ✅     | RESOLVED — `escapeCsvField` negative-numeric exemption re-verified         |

## New evidence / refinements (this run)

### R-141-2: F025 refinement — canonical URL identified

`sekolah-pseo.pages.dev` no longer resolves (curl 000, DNS-level). GitHub Pages
API reports the active site as `https://sulhimaskom.github.io/sekolah-pseo/`
(status "built", source branch `main`), but that root returns **HTTP 404**.
F025 (live-site egress gap) holds with refined evidence.

### R-141-3: Follow-up queue (re-confirmed at source, below the mint bar)

| Area                              | Pri | Evidence                                                                    |
| --------------------------------- | --- | --------------------------------------------------------------------------- |
| `writeCsv` non-atomic write       | P2  | `safeWriteFile` direct `fs.writeFile`, no tmp+rename (fs-safe.js:78)        |
| `fastWriteFile` unlink window     | P2  | unlink-then-write gap documented (fs-safe.js:114–128)                       |
| client-side downloadCsv           | P2  | homepage.js:514 client export unguarded for formula injection               |
| empty catches                     | —   | acceptable — documented skip-intent (PageBuilder.js:111, BuildOrchestrator) |
| footer CURRENT_YEAR               | P3  | module-capture staleness (footer.js:13)                                     |
| sitemap lastmod                   | P3  | generation date, not data date (sitemap.js:93/100)                          |

## Cumulative finding-state note

One new ID minted this run (F116) and **resolved in the same run** — the second
source-level resolution in consecutive runs (F115 → F116). No regression observed
(baseline and post-fix suites identical: 1093 tests / 1089 pass / 4 skipped).
F005 remains the sole drift item (docs-ledger Prettier debt, 0 source files). The
failure-to-record path (F002) is unchanged, so findings continue to ship as labeled
ledger records rather than GitHub issues.