# Consolidated stable findings — F002–F004, F006–F013, F016–F017, F019–F023 (re-verified, 33rd run)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: multiple
**Priority**: mixed
**Status**: OPEN (all re-verified valid; evidence refreshed this run)

Each finding below was independently re-verified this run. Details unchanged from
28th–31st records; fresh evidence noted inline.

## F002 — Loop token lacks `issues: write` (ci, P1) — 30th consecutive block

`gh issue create` → `403 Resource not accessible by integration (createIssue)`;
`gh api user` → `403 Resource not accessible by integration` (permissions: none).
Probed live this run. Phase 1/2/3 issue output continues to ship as labeled docs records

- PR (established repo pattern, runs 1–32).

## F003 — Global concurrency group in on-push.yml (ci, P2)

`.github/workflows/on-push.yml:10-12` — `concurrency: { group: global,
cancel-in-progress: false }`. Re-verified: still present. Serializes all pushes; a long
flow blocks unrelated runs.

## F004 — Excessive CI secret exposure (security, P1)

Re-counted this run: **59 `secrets.*` references across 11 distinct names** in
`.github/workflows/` — GITHUB_TOKEN(14), IFLOW_API_KEY(11), GEMINI_API_KEY(10),
CLOUDFLARE_API_TOKEN(5), CLOUDFLARE_ACCOUNT_ID(5), VITE_SUPABASE_KEY(4), GH_TOKEN(4),
VITE_SUPABASE_URL(3), SUPABASE_SECRET_KEY(2), SUPABASE_ANON_KEY(1). CWE-200 surface:
attackers learn service architecture from workflow files.

## F006 — SITE_URL placeholder (chore, P2)

Re-confirmed this run — `check-freshness` logs: "SITE_URL is set to default placeholder
'https://example.com'. Set SITE_URL env var for production deployment." Build/freshness
outputs carry the placeholder.

## F007 — CI workflow overcomplexity (refactor, P2)

Re-counted: **2045 lines** across 6 workflow files (on-push 533, on-pull 437, parallel
456, opencode 203, orchestrator 200, architect-agent 216) + template.md 174. Embedded
400+ line prompts, 3 layers of orchestration. High maintenance surface for a static-site
generator.

## F008 — styles.js oversized 1275L (refactor, P2)

`wc -l src/presenters/styles.js` → 1275 (re-verified). Also homepage.js 716L,
utils.js 415L.

## F009 — pytest not wired into CI (test, P2)

`python3 tests/run_tests.py` → **27/27 pass** (re-verified this run), but 0 workflow
jobs run Python tests (grep re-verified: no hits in .github/workflows/).

## F010 — Missing E2E/integration tests (test, P3)

No e2e toolchain; no full-pipeline (ETL→build→sitemap→validate) integration test.
`validate-links` is run manually, not gated.

## F011 — Missing automated release (ci, P2)

`git tag | wc -l` → 0 (re-verified). No release workflow; version pinned 1.0.0; no
rollback procedure.

## F012 — lint-staged engine mismatch (chore, P3)

`.nvmrc` = 22, CI `setup-node node-version: 20` (on-pull.yml:53, parallel.yml), and
lint-staged@17.2.0 requires node ≥22.22.1 → EBADENGINE warning on `npm install`
(observed again this run, running v20.20.2).

## F013 — Workflow permissions (security, P2)

`node scripts/check-workflow-security.js` → **12 violations: 2 CRITICAL + 10 HIGH**
(re-verified this run): DUPLICATE_API_KEY ×2 (parallel.yml: API_KEY aliases
GEMINI_API_KEY), ID_TOKEN_WRITE (parallel.yml:16), ACTIONS_WRITE_NON_MERGE
(parallel.yml:15), GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN (orchestrator.yml ×2).

## F016 — README documents non-existent `gitignore-check` (docs, P3)

README §"CI Verification" references a `gitignore-check` workflow; file absent from
`.github/workflows/` (re-verified).

## F017 — docs/api.md documents nonexistent `addNumbers()` (docs, P3)

api.md documents `addNumbers(a, b)`; no such export in scripts/ (re-verified: 0 grep
hits).

## F019 — Dead code tests/run_tests.py (refactor, P3)

Duplicate imports (lines 20–25: sys, json, time, traceback, argparse, typing
re-imported); unreachable code (lines 523–527: `return suite` after earlier return) —
re-verified.

## F020 — Dead script apply-caching-patch.sh (chore, P3)

References `feature-ci-incremental-caching.patch` (line 14) which does not exist in repo
(re-verified).

## F021 — Orphaned check-workflow-security.js gate (security, P2)

No test, no npm script entry; `.husky/pre-commit:3` suppresses its output with
`2>/dev/null` (re-verified) — the gate's findings never fail the commit.

## F022 — head-meta.js untested (test, P3)

No `scripts/head-meta.test.js` (verified absent this run).

## F023 — Validator logic duplication (refactor, P3)

`validateBranchName` / `validateRepoUrl` duplicated logic; no shared validation module
(re-verified).
