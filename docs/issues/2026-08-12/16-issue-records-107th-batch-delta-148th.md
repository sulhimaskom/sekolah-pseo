# Issue Records — 107th Batch (Delta, 148th verification, 2026-08-12)

**Evaluation Date**: 2026-08-12
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 147th audit matrix on `ed86c66`, re-executed fresh this run (see
`15-audit-report-2026-08-12-148th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 136th consecutive
denial). Per the 147-run docs-only convention, findings are recorded in this ledger.

## This run: fully flat — no new findings, no resolutions, no regressions

A stable verification run. Every held finding was re-observed at the same evidence
level; every maintained resolution was re-verified clean. No code changes were
made — the worktree is clean on main (`ed86c66`).

## Stability confirmation (held findings)

| ID   | Category/Priority | Status       | Evidence this run                                                      |
| ---- | ----------------- | ------------ | ---------------------------------------------------------------------- |
| F005 | docs/P2           | HELD         | prettier: 88 ledger files — **stable 7th run** (0 source files)        |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — **CRITICAL** (49th obs)      |
| F038 | security/P0       | HELD         | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (49th) |
| F063 | ci/P1             | HELD         | PR-event workflow runs land in `action_required`; schedule runs pass   |
| F002 | ci/P1             | HELD         | `gh issue create` denied (136th)                                       |
| F018 | feature/P1        | HELD         | data STALE 23 days (threshold 7)                                       |
| F025 | feature/P1        | HELD         | SITE_URL placeholder `https://example.com` re-observed live            |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                            |
| F004 | security/P2       | HELD         | 57 `secrets.*` refs / 10 unique names (6th stable)                     |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                       |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                    |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                   |
| F019 | refactor/P3       | HELD         | tests/run_tests.py dup imports + dead block after return               |
| F014 | test/P1           | NOT OBSERVED | 5th consecutive clean run — 1104/1100/0/4-skip                         |

## Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                    |
| ---- | ----------------- | ---------------------------------------------------------------------------------------- |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                     |
| F032 | bug/P2            | live probe: sitemap 5/5 URLs data-dated (`lastmod` from `updated_at`, sitemap.js:98–123) |
| F115 | bug/P1            | negative-numeric exemption intact (utils.js:252–257)                                     |
| F116 | bug/P2            | `--radius-full` token present in src/presenters/styles.js (4 hits)                       |
| F117 | security/P2       | client-side `sanitizeCsvField` present (homepage.js:518 ff.)                             |
| F118 | bug/P2            | tmp+rename writes re-verified (fs-safe.js:89/137); no `.tmp-` residue post-suite         |
| F026 | bug/P2            | `Number.isFinite` guard at build-performance.js:191                                      |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md                                                     |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                            |
| F029 | test/P1           | NOT observed — git status clean post-suite; raw.csv header intact                        |
| F066 | bug/P2            | pytest tempfile isolation re-verified (tests/run_tests.py)                               |

## New evidence / refinements (this run)

### R-148-1: F004 count stable at 57 refs / 10 unique names (6th consecutive)

`grep -rhEo "secrets\.[A-Z_]+" .github/workflows/*.yml` yields **57 refs / 10
unique names** — identical distribution to the 143rd–147th runs (GITHUB_TOKEN 14,
IFLOW_API_KEY 10, GEMINI_API_KEY 10, CLOUDFLARE_API_TOKEN 5, CLOUDFLARE_ACCOUNT_ID
5, VITE_SUPABASE_KEY 4, VITE_SUPABASE_URL 3, GH_TOKEN 3, SUPABASE_SECRET_KEY 2,
SUPABASE_ANON_KEY 1). Workflows byte-identical; grep-method stable for 6 runs.
Monitoring continues.

### R-148-2: F014 race probe — 5th consecutive clean run

Two concurrent `npm run test:js` executions both completed 1104 tests / 1100 pass /
0 fail / 4 skipped with zero temp residue (`data/` tmp-file count 0) and a clean
`git status` post-suite. The latent parallel-DIST_DIR race remains unobserved;
monitoring continues per convention.

### R-148-3: Source re-verification — maintained resolutions intact

Direct source reads re-confirmed every maintained resolution this run:
F032 (sitemap.js:98–123 lastmod from `updated_at`), F115 (utils.js:252–257
negative-numeric exemption), F116 (`--radius-full` 4 hits in styles.js), F117
(homepage.js:518 sanitizeCsvField), F118 (fs-safe.js:89/137 tmp+rename atomic
writes), F026 (build-performance.js:191 Number.isFinite), F017 (addNumbers absent
from docs/api.md). No regression in any maintained item.

### R-148-4: Environment variance — pytest install required

`python3 -m pytest` was not runnable out-of-the-box this run (`No module named
pytest`); `pip install pytest` restored the 13/13 pytest suite. requirements.txt
declares `pytest>=7.0.0` — runner-environment difference, not a repo regression.

## Cumulative finding-state note

50 tracked findings: 25+ maintained RESOLVED (F001/F015/F016/F017/F026/F027/F028/
F029/F032/F066/F069/F074/F115/F116/F117/F118 + F-odd cluster) and 25 held
(F002/F004/F005/F007/F008/F011/F013/F014-latent/F018/F019/F025/F037–F044/F045–F049/
F050/F063/F064/F065). F014 has now been clean for 5 consecutive runs (monitoring
continues — latent, not minted). The failure-to-record path (F002) is unchanged,
so findings continue to ship as labeled ledger records rather than GitHub issues.
