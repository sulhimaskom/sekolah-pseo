# New Findings F030–F036 — Deep Source Audit (38th verification run, 2026-08-04)

**Source**: First-ever full deep audit of `scripts/` and `src/` via 4 parallel
explore agents (scripts code audit, src/ architecture audit, workflow security
audit, tests/DX audit), outputs cross-checked against tracked F001–F029, and every
new candidate re-verified with direct file reads this run.

All 7 findings are labeled (category + priority) and ready for bulk GitHub issue
creation the moment F002 (token lacks `issues: write`) is resolved.

---

## F030 — `monitorBuild` returns a zeroed report (bug, P2)

- **Location**: `scripts/build-performance.js:334-358`
- **Evidence** (verified this run):
  - `monitorBuild` builds `report` at line 344 via `tracker.generateReport()` and
    returns it, but `tracker.stop()` — which sets `endTime`/`endMemory` — runs only
    in the `finally` block at line 346.
  - `getElapsedMs()` (line 100) returns `0` when `!this.endTime`; `getPeakRss()`
    (line 128) returns `0` when `!this.endMemory`. Therefore the **returned** report
    always contains `elapsedMs: 0`, `throughput: 0`, `peakRss: '0 B'`, and
    `elapsedFormatted: '0ms'`. Only the side-effect log (`logReport()` in `finally`)
    shows correct values.
  - Tests mask the defect: every `monitorBuild` test passes `MIN_THROUGHPUT: 0`
    (build-performance.test.js:439, 462), so the always-zero throughput never trips
    a budget violation.
  - Mitigating factor (verified): `build-pages.js` does **not** import
    `build-performance` (0 references) — the bug is currently test-visible only, not
    in the production build path.
- **Impact**: any caller that consumes `monitorBuild`'s return value receives
  fabricated performance data (0ms / 0 pages/sec / 0B RSS) while the log lies
  correctly.
- **Fix**: move report generation after `tracker.stop()`, or have `stop()` return
  the report; assert non-zero `elapsedMs` in tests.

---

## F031 — `computeSchoolHash` omits enrichment → stale incremental pages (bug, P1)

- **Location**: `scripts/manifest.js:120-142`; `src/presenters/templates/school-page.js:41-50`
- **Evidence** (verified this run):
  - `computeSchoolHash` hashes only 8 fields: `npsn, nama, bentuk_pendidikan, status,
    alamat, kecamatan, kab_kota, provinsi`. The comment explicitly excludes
    `kelurahan` and `lat`/`lon` as "not displayed in school page template".
  - **But** the school page template *does* render enrichment:
    `generateEnrichmentSection(enrichment)` (school-page.js:41-50) outputs a
    Wikipedia section (`enrichment.wikipedia.wikipediaUrl`).
  - `BuildOrchestrator.js` loads enrichment (`loadEnrichmentData()`, line 335) and
    passes `enrichmentMap` into `writeSchoolPage` (lines 276-277) — so enrichment
    content is live build input that is **absent** from the hash.
  - Consequence: if enrichment data changes (e.g. a Wikipedia URL is added/removed)
    while the 8 hashed fields stay identical, `getChangedSchools` reports the school
    unchanged → the page is **not rebuilt** → stale enrichment served in incremental
    builds.
- **Impact**: silent content staleness in `build:incremental`; contradicts the
  TASK-073 fix intent (manifest.js:31-35) which hardened the hash against
  boundary collisions but did not expand its field set.
- **Fix**: include all template-affecting inputs (enrichment presence/URL) in the
  hash, or version the hash when template/enrichment behavior changes.

---

## F032 — Sitemap `lastmod = today` for every URL (chore, P2)

- **Location**: `scripts/sitemap.js:87-114`
- **Evidence** (verified this run): `collectUrlsFromSchools` computes
  `const now = new Date().toISOString().split('T')[0]` once and stamps **every**
  URL — homepage, every province page, and every school page — with `lastmod: now`.
- **Impact**: sitemap output is non-deterministic (changes daily even when content
  does not); search engines see a full-content refresh signal every build; defeats
  the project's determinism goal (F014-adjacent) and makes generated artifacts
  churn in CI/git.
- **Fix**: derive `lastmod` from the actual data timestamp (e.g. `schools.csv`
  freshness or per-record `updated_at`), or drop `lastmod` when unavailable.

---

## F033 — `check-freshness --json` emits pino-wrapped output, not raw JSON (bug, P2)

- **Location**: `scripts/check-freshness.js:174-190`
- **Evidence** (verified this run): `const jsonOutput = args.includes('--json')`
  (line 174) then `logger.info(JSON.stringify(result, null, 2))` (line 188) — the
  JSON is embedded in a pino log line (`{"level":30,...,"msg":"{...raw json...}"}`),
  so downstream parsers must unwrap `msg`.
- **Impact**: `--json` mode is not machine-usable as documented (README shows raw
  `node scripts/check-freshness.js --json`); inconsistent with `data-quality:json`.
- **Fix**: write raw JSON to stdout via `process.stdout.write` when `--json` is set.

---

## F034 — `retry()` destroys original error identity (bug, P2)

- **Location**: `scripts/resilience.js:213-247`
- **Evidence** (verified this run): in `retry()`, when the final attempt fails
  **or** `shouldRetry(error)` is false, the original error is re-wrapped as a new
  `IntegrationError(..., ERROR_CODES.RETRY_EXHAUSTED, { lastError, lastErrorCode })`
  (lines 230-240). The original `error.code` (e.g. `ENOENT`, `EEXIST`) is preserved
  only as a detail string, not as the thrown error's `code`.
- **Impact**: callers branching on `error.code` (verified pattern in
  `scripts/fs-safe.js` and `data-reporting` modules) receive `RETRY_EXHAUSTED`
  instead of the root cause; the agent that audited this also confirmed the broken
  branch behavior by execution.
- **Fix**: when `shouldRetry` returns false, re-throw the **original** error;
  reserve `RETRY_EXHAUSTED` for genuine retry exhaustion.

---

## F035 — Dead `school.provinceSlug` fallback in homepage (bug, P3)

- **Location**: `src/presenters/templates/homepage.js:431`
- **Evidence** (verified this run): `a.href = school.u || '/provinsi/' +
  school.provinceSlug + '/';` — but search data entries are arrays produced by
  `prepareSchoolDataForSearch` (PageBuilder.js:245-264) whose index 8 is always
  `'/' + relPath` (the `u` field is always truthy), and no `provinceSlug` property
  exists on school objects. The fallback is dead code that would generate
  `/provinsi/undefined/` if it ever fired.
- **Impact**: latent broken-link generator; misleading code for future editors.
- **Fix**: remove the fallback or reference the correct field (`school.p` +
  slugify) if a fallback is truly needed.

---

## F036 — Layering inversion: templates import from `scripts/` (refactor, P2)

- **Location**: `src/presenters/templates/{homepage,province-page,school-page}.js`
- **Evidence** (verified this run): 9 cross-layer requires from `src/presenters/
  templates/` into `../../../scripts/` — e.g. homepage.js:1-3 imports `escapeHtml`,
  `CONFIG`, `slugify`; school-page.js:1-3 imports `escapeHtml`, `formatStatus`,
  `generateMetaDescription`, `IntegrationError`, `ERROR_CODES`, `CONFIG`.
- **Impact**: the presentation layer depends on the script layer (and on
  `scripts/resilience.js`), inverting the intended layering
  (`src/` services/presenters → `scripts/`), coupling template rendering to
  utility internals and making the "presentation depends on pipeline" relationship
  implicit.
- **Fix**: move shared helpers (`escapeHtml`, `formatStatus`, `slugify`, config
  access) into a neutral shared module or the `src/` layer, or formally bless
  `scripts/` as the shared utility layer in docs/architecture.

---

## Candidate findings from agents NOT tracked this run

The audits surfaced additional P3 cleanup items that map to existing tracked
findings or are too low-signal for separate tracking; recorded here for the record:
- Duplicate `escapeHtml` client-side implementation (homepage.js:382) — overlap with F035.
- Dead `aggregateByProvince`/`extractFilterOptions` duplicates in homepage.js (per
  src audit) — P3, fold into F036-era cleanup.
- Duplicated back-to-top script body (template vs `shared/back-to-top.js`) — P3.
- `run_tests.py` duplicate imports + dead code after `return` (per scripts audit) —
  F019 re-confirmed, no new ID.
- `monitorBuild` `throwOnViolation` always throws when `totalPages > 0` under
  default `MIN_THROUGHPUT` (per scripts audit) — folded into F030.
- Workflow security items (per security audit) all map to F004/F013/F021/F027/F028 —
  no new IDs.
- Tests/DX items (per tests audit) all map to F014/F029/F009/F022 — no new IDs.

## Status

All 7 findings open. No fixes applied this run (AUDIT MODE, read-only). Suggested
fix ordering by impact: **F031 (P1)** → **F030 (P2)** → **F034 (P2)** → **F033 (P2)**
→ **F032 (P2)** → **F036 (P2)** → **F035 (P3)**.
