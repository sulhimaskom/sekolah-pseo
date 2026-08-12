# Issue Records — 104th Batch (Delta, 145th verification, 2026-08-12)

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 144th audit matrix on `11cbfda`, re-executed fresh this run (see
`06-audit-report-2026-08-12-145th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 133rd consecutive
denial). Per the 144-run docs-only convention, findings are recorded in this ledger.

## This run: fully flat — no new findings, no resolutions, no regressions

A stable verification run. Every held finding was re-observed at the same evidence
level; every maintained resolution was re-verified clean. No code changes were
made — the worktree is clean on main (`11cbfda`).

## Stability confirmation (held findings)

| ID   | Category/Priority | Status       | Evidence this run                                                      |
| ---- | ----------------- | ------------ | ---------------------------------------------------------------------- |
| F005 | docs/P2           | HELD         | prettier: 88 ledger files — **stable** (144th records clean)           |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — **CRITICAL** (46th obs)      |
| F038 | security/P0       | HELD         | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (46th) |
| F063 | ci/P1             | HELD         | PR-event workflow runs land in `action_required`; schedule runs pass   |
| F002 | ci/P1             | HELD         | `gh issue create` denied (133rd)                                       |
| F018 | feature/P1        | HELD         | data STALE 23 days (threshold 7)                                       |
| F025 | feature/P1        | HELD         | Pages `status: built`; root HTTP 404; `.pages.dev` DNS unresolved      |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F004 | security/P2       | HELD         | 57 `secrets.*` refs / 10 unique names (R-145-1)                        |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                       |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                   |
| F014 | test/P1           | NOT OBSERVED | 2nd consecutive clean run — 1104/1100/0/4-skip                         |

## Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                                          |
| ---- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| F032 | bug/P2            | live probe: `lastmod` from data `updated_at` — aggregate newest, per-school own, fallback; 5/5 URLs data-dated |
| F115 | bug/P1            | negative-numeric exemption intact (utils.js:252-257)                                                           |
| F116 | bug/P2            | `--radius-full` token present (5 hits in dist/styles.css)                                                      |
| F117 | security/P2       | client-side `sanitizeCsvField` present (homepage.js:518 ff.)                                                   |
| F118 | bug/P2            | tmp+rename writes re-verified; no `.tmp-` residue post-suite                                                   |
| F026 | bug/P2            | `Number.isFinite` guard at build-performance.js:191                                                            |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md                                                                           |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                                                  |
| F029 | test/P1           | NOT observed — git status clean post-suite; raw.csv header intact                                              |
| F066 | bug/P2            | pytest tempfile isolation re-verified (tests/run_tests.py)                                                     |

## New evidence / refinements (this run)

### R-145-1: F004 count stable at 57 refs / 10 unique names (3rd consecutive)

`grep -rhEo "secrets\.[A-Z_]+" .github/workflows/*.yml` yields **57 refs / 10
unique names** — identical distribution to the 143rd/144th runs (GITHUB_TOKEN 14,
IFLOW_API_KEY 10, GEMINI_API_KEY 10, CLOUDFLARE_API_TOKEN 5, CLOUDFLARE_ACCOUNT_ID
5, VITE_SUPABASE_KEY 4, GH_TOKEN 3, VITE_SUPABASE_URL 3, SUPABASE_SECRET_KEY 2,
SUPABASE_ANON_KEY 1). Workflows byte-identical; grep-method stable for 3 runs.
Monitoring continues.

### R-145-2: Footer CURRENT_YEAR — non-defect for static-build architecture, deferred

Analyzed the last reachable source queue item (footer.js:13, P3,
`const CURRENT_YEAR = new Date().getFullYear()` at module load). For a batch CLI
static-site generator, module-load time == render time == build time; render-time
evaluation would produce byte-identical output in every real execution path. A
permanent page build-year is the correct static-site semantics (content frozen at
build time). **No change warranted** — the item is closed as a non-defect, not
silently dropped. Footer test already evaluates the year dynamically.

### R-145-3: F027 JSON-mode contract maintained

`check-workflow-security.js --json` exits 0 with a violations payload — the
maintained-RESOLVED contract (JSON mode is a data fetch, not a gate). Exit 1 with
12 violations (2 CRITICAL + 10 HIGH) in text mode — the real gate signal.

## Cumulative finding-state note

50 tracked findings: 25+ maintained RESOLVED (F001/F015/F016/F017/F026/F027/F028/
F029/F032/F066/F069/F074/F115/F116/F117/F118 + F-odd cluster) and 25 held
(F002/F004/F005/F007/F008/F011/F013/F014-latent/F018/F025/F037–F044/F045–F049/
F050/F063/F064/F065). F014 has now been clean for 2 consecutive runs (monitoring
continues — latent, not minted). The failure-to-record path (F002) is unchanged,
so findings continue to ship as labeled ledger records rather than GitHub issues.
