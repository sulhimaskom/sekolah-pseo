# Issue Records — 102nd Batch (Delta, 143rd verification, 2026-08-12)

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 142nd audit matrix on `d2acd07`, re-executed fresh this run (see
`00-audit-report-2026-08-12-143rd.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 131st consecutive
denial). Per the 142-run docs-only convention, findings are recorded in this ledger.

## New finding minted this run

### F118 — non-atomic file writes in `fs-safe.js` (bug, P2) — RESOLVED via PR

- **Finding**: `scripts/fs-safe.js` had two non-atomic write paths:
  - `safeWriteFile` (line 78) wrote directly via `fs.writeFile`. A crash or a
    failed write mid-stream leaves a **torn/corrupt file**. All durable artifacts
    funnel through it: `writeCsv` → `data/schools.csv` (ETL), sitemap XML,
    robots.txt, `styles.css`, `schools.json` + gzip, freshness reports.
  - `fastWriteFile` (line 122) **unlinked the target before writing**
    (unlink+write perf optimization, benchmarked 562ms vs 876ms). This creates a
    window where the file does not exist (concurrent readers see ENOENT) and, if
    the write fails after the unlink, the **previous file is lost entirely**.
    Every one of the 3474+ bulk page writes in `BuildOrchestrator` uses it.
- **Empirical proof** (in-session): direct source reads of fs-safe.js:78/122–132
  (unlink `.catch(ENOENT)` then `fs.writeFile`); behavioral test at the artifact
  level — a write targeting an existing directory (rename → EISDIR) previously
  would have destroyed the target; post-fix it fails cleanly with no temp residue.
- **Fix applied (Phase 2 hardening)**: both functions now write to a unique
  same-directory temp file (`${filePath}.tmp-${process.pid}-${++writeSequence}`)
  then `fs.rename` over the target — rename(2) on the same filesystem is atomic,
  so readers never observe a torn file and a crash mid-write leaves the previous
  file intact. On failure the temp file is best-effort unlinked before the error
  propagates. `fastWriteFile` stays lightweight (no retry/timeout/circuit
  breaker) and keeps the documented perf rationale (new inode creation is
  faster than overwrite; rename adds no data copy).
- **Post-fix verification**: eslint 0/0 · full suite **1101 tests / 1097 pass /
  0 fail / 4 skipped** (fs-safe 36/36, +4 new) · c8 coverage 95.27% stmt /
  92.95% branch (gates met; up from 95.21/92.93) · build PASS · prettier clean
  on changed files · `git status` clean after the full suite (F029 not observed).
- **Labels**: `bug`, `P2`.
- **Status**: **RESOLVED** — merged via PR #682 (commit `d238475`, squash).
- **Why fixable now**: the finding lives in `scripts/` — inside the loop token's
  `contents: write` grant for ordinary source paths (same analysis as
  F115/F116/F117). No `.github/workflows/*` write (F050) or GitHub issue/PR
  metadata (F002) needed.

## Stability confirmation (no action — held findings)

All labeled findings from the 101st batch remain HELD with unchanged evidence:

| ID   | Category/Priority | Status | Evidence this run                                                                 |
| ---- | ----------------- | ------ | --------------------------------------------------------------------------------- |
| F005 | docs/P2           | HELD   | prettier: 88 ledger files — **stable** (142nd records clean)                      |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (44th obs)                     |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (44th)            |
| F063 | ci/P1             | HELD   | PR-event workflow runs land in `action_required`; schedule runs pass              |
| F002 | ci/P1             | HELD   | `gh issue create` denied (131st)                                                  |
| F018 | feature/P1        | HELD   | data STALE 23 days (threshold 7)                                                  |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                                       |
| F025 | feature/P1        | HELD   | live site: `.pages.dev` DNS unresolvable; GH Pages root HTTP 404                  |
| F004 | security/P2       | HELD   | 57 `secrets.*` refs / 10 unique names (R-143-3, count-method variance)            |
| F007 | refactor/P2       | HELD   | 2045 lines across workflow YAMLs                                                  |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                               |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                              |
| F117 | security/P2       | ✅     | maintained RESOLVED — `sanitizeCsvField` in homepage.js (9 refs) + tests (6 refs) |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md                   |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                                         |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)             |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`             |
| F115 | bug/P1            | ✅     | RESOLVED — `escapeCsvField` negative-numeric exemption re-verified                |
| F116 | bug/P2            | ✅     | RESOLVED — `--radius-full` token present in `dist/styles.css`                     |

## New evidence / refinements (this run)

### R-143-2: F005 confirmed stable at 88

The 142nd-run records (48/49/50) all pass `prettier --check` — the R-142-2
correction held. This run's records (00/01/02) were verified with
`prettier --check` and formatted before landing, per the process note. Ledger
flat for the second consecutive run with zero source files.

### R-143-3: F004 count-method variance (57 vs 59)

`grep -rhEo "secrets\.[A-Z_]+" .github/workflows/*.yml` yields **57 refs / 10
unique names** (GITHUB_TOKEN 14, IFLOW_API_KEY 10, GEMINI_API_KEY 10,
CLOUDFLARE_API_TOKEN 5, CLOUDFLARE_ACCOUNT_ID 5, VITE_SUPABASE_KEY 4, GH_TOKEN 3,
VITE_SUPABASE_URL 3, SUPABASE_SECRET_KEY 2, SUPABASE_ANON_KEY 1). The 142nd run
counted 59 (IFLOW_API_KEY 11, GH_TOKEN 4); workflows are byte-identical to that
run (F037/F038 held — no workflow file changed), so the −2 is grep-method
variance, not a real secret-surface change. Monitoring continues.

### R-143-4: Follow-up queue (re-confirmed at source, below the mint bar)

| Area                | Pri | Evidence                                                             |
| ------------------- | --- | -------------------------------------------------------------------- |
| footer CURRENT_YEAR | P3  | module-capture staleness (footer.js:13)                              |
| sitemap lastmod     | P3  | generation date, not data date (sitemap.js:93/100)                   |
| empty catches       | —   | acceptable — documented skip-intent (PageBuilder, BuildOrchestrator) |

## Cumulative finding-state note

One new ID minted this run (F118) and **resolved in the same run** — the fourth
consecutive source-level resolution (F115 → F116 → F117 → F118). No regression
observed (baseline 1093 pass vs post-fix 1097 pass with +4 new; coverage up).
F005 stable at 88. The failure-to-record path (F002) is unchanged, so findings
continue to ship as labeled ledger records rather than GitHub issues.
