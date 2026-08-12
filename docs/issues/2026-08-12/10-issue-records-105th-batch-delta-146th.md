# Issue Records — 105th Batch (Delta, 146th verification, 2026-08-12)

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 145th audit matrix on `f36c20d`, re-executed fresh this run (see
`09-audit-report-2026-08-12-146th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 134th consecutive
denial). Per the 145-run docs-only convention, findings are recorded in this ledger.

## This run: fully flat — no new findings, no resolutions, no regressions

A stable verification run. Every held finding was re-observed at the same evidence
level; every maintained resolution was re-verified clean. No code changes were
made — the worktree is clean on main (`f36c20d`).

## Stability confirmation (held findings)

| ID   | Category/Priority | Status       | Evidence this run                                                      |
| ---- | ----------------- | ------------ | ---------------------------------------------------------------------- |
| F005 | docs/P2           | HELD         | prettier: 88 ledger files — **stable 5th run** (0 source files)        |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — **CRITICAL** (47th obs)      |
| F038 | security/P0       | HELD         | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (47th) |
| F063 | ci/P1             | HELD         | PR-event workflow runs land in `action_required`; schedule runs pass   |
| F002 | ci/P1             | HELD         | `gh issue create` denied (134th)                                       |
| F018 | feature/P1        | HELD         | data STALE 23 days (threshold 7)                                       |
| F025 | feature/P1        | HELD         | Pages root HTTP 404; `.pages.dev` DNS unresolved                       |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F004 | security/P2       | HELD         | 57 `secrets.*` refs / 10 unique names (4th stable)                     |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                       |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                   |
| F019 | refactor/P3       | HELD         | tests/run_tests.py dup imports + dead block after return               |
| F014 | test/P1           | NOT OBSERVED | 3rd consecutive clean run — 1104/1100/0/4-skip                         |

## Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                                           |
| ---- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed (145th ledger recorded exit 0; measured 1) |
| F032 | bug/P2            | live probe: sitemap 5/5 URLs data-dated (`lastmod` from `updated_at`)                                           |
| F115 | bug/P1            | negative-numeric exemption intact (utils.js:252-257)                                                            |
| F116 | bug/P2            | `--radius-full` token present in dist/styles.css                                                                |
| F117 | security/P2       | client-side `sanitizeCsvField` present (homepage.js:518 ff.)                                                    |
| F118 | bug/P2            | tmp+rename writes re-verified; no `.tmp-` residue post-suite                                                    |
| F026 | bug/P2            | `Number.isFinite` guard at build-performance.js:191                                                             |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md                                                                            |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                                                   |
| F029 | test/P1           | NOT observed — git status clean post-suite; raw.csv header intact                                               |
| F066 | bug/P2            | pytest tempfile isolation re-verified (tests/run_tests.py)                                                      |

## New evidence / refinements (this run)

### R-146-1: F004 count stable at 57 refs / 10 unique names (4th consecutive)

`grep -rhEo "secrets\.[A-Z_]+" .github/workflows/*.yml` yields **57 refs / 10
unique names** — identical distribution to the 143rd–145th runs (GITHUB_TOKEN 14,
IFLOW_API_KEY 10, GEMINI_API_KEY 10, CLOUDFLARE_API_TOKEN 5, CLOUDFLARE_ACCOUNT_ID
5, VITE_SUPABASE_KEY 4, VITE_SUPABASE_URL 3, GH_TOKEN 3, SUPABASE_SECRET_KEY 2,
SUPABASE_ANON_KEY 1). Workflows byte-identical; grep-method stable for 4 runs.
Monitoring continues.

### R-146-2: Explore sweep — no untracked findings (triangulation)

Three `explore` subagents (scripts/ module quality; src/services+presenters
architecture; CI+security surfaces) returned comprehensive finding sets. Every
item maps 1:1 onto the tracked ledger:

- scripts/: F019 (run_tests.py dead block), F060 (pino arg-order), F021 (husky
  `2>/dev/null` swallowing the security-check gate), F030 (monitorBuild zeroed
  report before stop()), plus the F037–F044 security cluster and F007/F008 sprawl.
- src/: B1-style manifest all-or-nothing + orphan-unlink all-or-nothing map to the
  F046/F045 resilience cluster; schema-validation bypass maps to F035/F045 held
  items; rate-limiter bypass to F031; no new IDs warranted.
- CI/security: `SECURITY_AUDIT_NOTE.md` "fixes never applied" traces to
  F037–F044; floating-tag pinning, `id-token`/`actions` write, GH_TOKEN PAT,
  secrets-to-untrusted-triggers, zero quality-gate CI, Node 20 EOL drift — all
  already tracked (F037–F044, F013, F063, F064, F007). No new findings minted.

### R-146-3: F027 gate contract re-confirmed (ledger recording correction)

145th ledger recorded `check-workflow-security.js --json` as exit 0 ("expected
contract"). This run measured **exit 1 with the violations payload** — which IS the
maintained-F027 gate contract (JSON mode doubles as a CI gate; non-zero exit on
violations). The source (check-workflow-security.js:208-209) and the 37th–44th-run
records agree. No behavioral change; the 145th run's matrix entry was a recording
slip, now corrected in this ledger.

## Cumulative finding-state note

50 tracked findings: 25+ maintained RESOLVED (F001/F015/F016/F017/F026/F027/F028/
F029/F032/F066/F069/F074/F115/F116/F117/F118 + F-odd cluster) and 25 held
(F002/F004/F005/F007/F008/F011/F013/F014-latent/F018/F019/F025/F037–F044/F045–F049/
F050/F063/F064/F065). F014 has now been clean for 3 consecutive runs (monitoring
continues — latent, not minted). The failure-to-record path (F002) is unchanged,
so findings continue to ship as labeled ledger records rather than GitHub issues.
