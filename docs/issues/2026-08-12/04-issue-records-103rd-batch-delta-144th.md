# Issue Records — 103rd Batch (Delta, 144th verification, 2026-08-12)

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 143rd audit matrix on `df0575a`, re-executed fresh this run (see
`03-audit-report-2026-08-12-144th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 132nd consecutive
denial). Per the 143-run docs-only convention, findings are recorded in this ledger.

## Finding resolved this run

### F032 — sitemap `lastmod = today` for every URL (bug, P2) — RESOLVED via PR

- **Finding** (minted 38th run, held through the 143rd): `collectUrlsFromSchools`
  (scripts/sitemap.js) stamped `const now = new Date().toISOString().split('T')[0]`
  as `lastmod` on **every** URL — homepage, every province page, every school page.
- **Why it matters**:
  - **Non-determinism**: an unchanged dataset produced a different sitemap on
    every build run — daily output churn, meaningless `diff`s, cache-busting.
  - **Misleading freshness**: search engines were told every page was "modified
    today" while the underlying data was last updated 2026-07-20 — 23 days stale
    at evaluation time (F018). sitemaps.org defines `lastmod` as the date of
    last content modification, not sitemap generation.
- **Fix applied (Phase 2 hardening)**: `lastmod` now derives from the data's own
  freshness signal — the `updated_at` field (stamped by ETL at etl.js:106, in the
  CSV header per data-schema.js:149, mapped by `parseCsv` into each record):
  - **Aggregate pages** (homepage, province pages): the newest `updated_at`
    across all records — they change whenever any record changes.
  - **School pages**: the record's own `updated_at` — per-page truthfulness.
  - **Fallback**: generation date only when no record carries `updated_at`
    (legacy/test datasets without the field).
  - **Contract preserved**: an explicit `Array.isArray` guard (throwing the same
    `IntegrationError('schools must be an array')` with `ERROR_CODES.INVALID_INPUT`)
    was hoisted ahead of the new `.map()` so null/undefined input still fails with
    the documented error class, and the `getUniqueProvinces` guard later in the
    function remains the sole owner of province validation.
- **Empirical proof** (in-session): live probe
  `collectUrlsFromSchools(parseCsv(safeReadFile(data/schools.csv)))` returns 5
  URLs all carrying `lastmod: 2026-07-20` — the data's true date, identical
  across builds.
- **Post-fix verification**: eslint 0/0 · sitemap tests **34/34** (+3 new) ·
  full suite **1104 tests / 1100 pass / 0 fail / 4 skipped** · c8 coverage
  **95.28% stmt / 93.03% branch** (gates met; up from 95.27/92.95) · build PASS ·
  prettier clean on changed files · `git status` clean after the full suite.
- **Labels**: `bug`, `P2`.
- **Status**: **RESOLVED** — merged via PR #684 (commit `d587935`, squash).
- **Why fixable now**: the finding lives in `scripts/` — inside the loop token's
  `contents: write` grant for ordinary source paths (same analysis as
  F115–F118). No `.github/workflows/*` write (F050) or GitHub issue/PR metadata
  (F002) needed.

## Stability confirmation (no action — held findings)

All labeled findings from the 102nd batch remain HELD with unchanged evidence:

| ID   | Category/Priority | Status | Evidence this run                                                      |
| ---- | ----------------- | ------ | ---------------------------------------------------------------------- |
| F005 | docs/P2           | HELD   | prettier: 88 ledger files — **stable** (143rd records clean)           |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (45th obs)          |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (45th) |
| F063 | ci/P1             | HELD   | PR-event workflow runs land in `action_required`; schedule runs pass   |
| F002 | ci/P1             | HELD   | `gh issue create` denied (132nd)                                       |
| F018 | feature/P1        | HELD   | data STALE 23 days (threshold 7)                                       |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F025 | feature/P1        | HELD   | Pages `status: built`; root HTTP 404 + `.pages.dev` DNS unresolved     |
| F004 | security/P2       | HELD   | 57 `secrets.*` refs / 10 unique names (R-144-3)                        |
| F007 | refactor/P2       | HELD   | 2045 lines across workflow YAMLs                                       |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                   |
| F118 | bug/P2            | ✅     | maintained RESOLVED — tmp+rename writes re-verified; no residue        |
| F117 | security/P2       | ✅     | maintained RESOLVED — `sanitizeCsvField` re-verified                   |
| F116 | bug/P2            | ✅     | maintained RESOLVED — `--radius-full` token present                    |
| F115 | bug/P1            | ✅     | maintained RESOLVED — negative-numeric exemption re-verified           |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from docs/api.md             |
| F026 | bug/P2            | ✅     | maintained RESOLVED — `formatBytes` guard re-verified                  |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                              |
| F029 | test/P1           | ✅     | NOT observed — git status clean post-suite                             |
| F066 | bug/P2            | ✅     | maintained RESOLVED — pytest tempfile isolation re-verified            |

## New evidence / refinements (this run)

### R-144-2: F005 confirmed stable at 88 (third consecutive run)

The 143rd-run records (00/01/02) all pass `prettier --check` — the R-142-2
process note continues to hold. This run's records (03/04/05) were verified with
`prettier --check` and formatted before landing.

### R-144-3: F004 count stable at 57 refs / 10 unique names

`grep -rhEo "secrets\.[A-Z_]+" .github/workflows/*.yml` yields **57 refs / 10
unique names** — identical distribution to the 143rd run (GITHUB_TOKEN 14,
IFLOW_API_KEY 10, GEMINI_API_KEY 10, CLOUDFLARE_API_TOKEN 5,
CLOUDFLARE_ACCOUNT_ID 5, VITE_SUPABASE_KEY 4, GH_TOKEN 3, VITE_SUPABASE_URL 3,
SUPABASE_SECRET_KEY 2, SUPABASE_ANON_KEY 1). Workflows byte-identical; the
142nd-run count of 59 remains attributed to grep-method variance. Monitoring
continues.

### R-144-4: Follow-up queue (re-confirmed at source, below the mint bar)

| Area                | Pri | Evidence                                                                      |
| ------------------- | --- | ----------------------------------------------------------------------------- |
| footer CURRENT_YEAR | P3  | module-capture staleness (footer.js:13) — only remaining reachable queue item |
| empty catches       | —   | acceptable — documented skip-intent (PageBuilder, BuildOrchestrator)          |

## Cumulative finding-state note

F032 resolved — the **fifth consecutive source-level resolution**
(F115 → F116 → F117 → F118 → F032). No regression observed (baseline 1097 pass
vs post-fix 1100 pass with +3 new; coverage up). F005 stable at 88. The
failure-to-record path (F002) is unchanged, so findings continue to ship as
labeled ledger records rather than GitHub issues.
