# Issue Records — 123rd Batch (Delta, 164th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 163rd audit matrix on `2cf2097`, re-executed fresh this run (see
`41-audit-report-2026-08-13-164th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **152nd
consecutive denial**, freshly probed this run). Per the 163-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: PR #704 merged (PR HANDLER MODE), orchestrator 10/10 HELD (15 days), pull CI best held 11/1/0 (13th), F005 flat 96 (12th), F004 stable 59/10

## Open findings (held)

| ID   | Category    | Priority | Title                                                                         | State           |
| ---- | ----------- | -------- | ----------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)     | HELD (65th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (secrets.GH_TOKEN vs GITHUB_TOKEN, 15 days) | HELD (15 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (152nd denial)             | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template    | HELD            |
| F005 | chore       | P2       | 96 docs/issues ledger files fail `prettier --check` (12th flat)               | HELD/FLAT       |
| F008 | refactor    | P2       | src/presenters/styles.js is 1318 lines (maintainability)                      | HELD            |
| F065 | bug         | P2       | Homepage undefined-slug latent bug (src/presenters/templates/homepage.js)     | CANDIDATE       |
| F065 | security    | P2       | config validatePath hardening candidate (scripts/config.js)                   | CANDIDATE       |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                            | HELD            |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                         | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 19–25)                         | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (24 days > 7 threshold)                         | HELD            |
| F025 | enhancement | P1       | SITE_URL placeholder "https://example.com" in prod config                     | HELD            |
| F064 | chore       | P2       | Runtime drift: .nvmrc 22 vs node v20.20.2 vs CI node 20                       | HELD            |

## Maintained RESOLVED (re-verified clean this run)

| ID   | Title                      | Verification                                                |
| ---- | -------------------------- | ----------------------------------------------------------- |
| F028 | Dependency vulnerabilities | `npm audit` → 0 vulnerabilities                             |
| F026 | Build performance          | `npm run build` → Status PASS, budgets met                  |
| F027 | Test suite health          | 1100 JS + 27 py + 13 pytest, coverage gates met             |
| F017 | JS coverage gate           | 95.28% stmt / 93.03% branch / 97.14% funcs (gates 80/75/75) |
| F032 | CI pull reliability        | on-pull 13th consecutive zero-failure window (11/1/0)       |

## Batch delta (vs 122nd)

- **F038**: HELD at 10/10 — 15 consecutive days (was 14 at 163rd). No widening;
  no new orchestrator runs since 163rd reading.
- **F063**: 13th consecutive zero-failure window (was 12th) — best held.
- **F005**: 12th consecutive FLAT at 96 files (was 11th).
- **F002**: 152nd consecutive denial (was 151st).
- **Composite**: 69.30 (±0.0) — flat, 5th consecutive held.
- **PRs merged**: #704 (163rd records) in PR HANDLER MODE — 7th consecutive
  docs-merge in this run family.

## No new findings

The full command matrix re-executed fresh this run produced no new issues, no
scoring drivers changed, and all maintained-RESOLVED items re-verified clean.
This remains a flat verification run.
