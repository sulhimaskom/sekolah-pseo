# Issue Records — 68th verification (labeled findings, GitHub-issue output blocked by F002)

**Labels**: multiple (see each record). **Format**: evaluation date / domain table / criteria breakdown / evidence / files affected.
Local `gh issue create` currently returns HTTP 403 `createIssue` (F002 held 65 sessions) — these records are the repo's labeled issue channel for this run.

## Issue 1 — Workflow security regressions: 12 live violations (F037, F038, F056-F059, F013)

- **Category/priority**: `security` / `P0`
- **Evaluation date**: 2026-08-07
- **Domain**: B. System Quality (Security 46/100)
- **Evidence**: `node scripts/check-workflow-security.js` → exit 1, 12 violations (verified firsthand):
  - CRITICAL `DUPLICATE_API_KEY`: `on-push.yml:26`, `parallel.yml:37,282,362,416` (`API_KEY` = `GEMINI_API_KEY`)
  - HIGH `ID_TOKEN_WRITE` (non-OIDC): `architect-agent.yml:13,30`, `opencode.yml:18,35`, `orchestrator.yml:9,26`, `parallel.yml:16`
  - HIGH `ACTIONS_WRITE_NON_MERGE`: `architect-agent.yml:17,34`, `opencode.yml:22,39`, `orchestrator.yml:13,30`, `parallel.yml:15`
  - HIGH `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN`: `orchestrator.yml:33,41`, `architect-agent.yml:37`
- **Impact**: repo ships regressed secrets on every push; `.husky/pre-commit:3` swallows the checker failure via `|| echo skipped` so **the security gate is dead**; no CI workflow invokes the checker.
- **Fix**: delete API_KEY aliases, s/GH_TOKEN/GITHUB_TOKEN, drop id-token/actions from non-merge workflows, wire checker as CI job. (Blocked on `workflows:write`.)

## Issue 2 — No build/lint/test gate in any CI workflow

- **Category/priority**: `ci` / `P1`
- **Evaluation date**: 2026-08-07
- **Domain**: D. Delivery & Evolution (CI/CD Health 46/100)
- **Evidence**: grep of `.github/workflows/*` for `npm run build|lint|test|pytest` → **zero matches**. `on-push.yml`/`on-pull.yml` only run `opencode run`; `parallel.yml:72,347` runs `npm ci || true` (swallows failures) with `continue-on-error` on the specialists job (`parallel.yml:227`). README's "quality gate (lint + format check)" claim is false.
- **Fix**: add `ci.yml` running lint → format:check → test:js → test:py → build as a hard gate (as already proposed but unimplemented in `docs/ci-consolidation-audit.md`).

## Issue 3 — F005 Prettier drift 64 files

- **Category/priority**: `docs` / `P3`
- **Evaluation date**: 2026-08-07
- **Domain**: A. Code Quality (Consistency 55/100)
- **Evidence**: `npm run format:check` exit 1; population = `docs/issues/*`.
- **Fix**: `npx prettier --write` on `docs/issues/**` + make the generator emit prettier-clean markdown.

## Issue 4 — F024 build omits sitemap

- **Category/priority**: `bug` / `P2`
- **Evaluation date**: 2026-08-07
- **Evidence**: after `npm run build`, `dist/` has no `sitemap-index.xml` (`ls dist/*.xml` → no such file; build runs only `build-pages.js`; sitemap is a separate manual step). Live Pages root `/`/`/index.html` still 404 (deploy-gap, F025).
- **Fix**: invoke `sitemap.js` at end of build + add build assertion.

## Issue 5 — F018 data stale 18 days

- **Category/priority**: `bug` / `P1`
- **Evaluation date**: 2026-08-07
- **Evidence**: `npm run check-freshness` exit 1 — last update 2026-07-20 (18 d, threshold 7).

## Issue 6 — F064 / F012 node-engine & dependabot red-merge

- **Category/priority**: `ci` / `P2`
- **Evidence**: `EBADENGINE` (lint-staged@17.3.0 needs node ≥22.22.1, env v20.20.2); `.nvmrc=22` vs workflows `node-version: 20`; dependabot PR merged while red.

## Issue 7 — F061 / F062 env & docs drift

- **Category/priority**: `chore`/`P2`, `docs`/`P3`
- **Evidence**: `.env.example` lacks 10+ CI secrets; `release.md:67` references non-existent `release.yml` (verified: no such file); api.md phantom `addNumbers` (verified at api.md:554-575); setup.md v20 vs .nvmrc=22; deployment.md dist tree/schools.json mismatch; README manifest name error.

## Issue 8 — F028 npm audit HIGH — RESOLVED this run

- **Category/priority**: `security` / `P2` — closed
- **Evaluation date**: 2026-08-07
- **Evidence**: `npm audit` → **0 vulnerabilities** (exit 0). The 67th-run ledger recorded 1 HIGH (brace-expansion@5.0.8); the transitive fix is now present in the resolved tree. First positive matrix delta since the 66th run. No further action required beyond keeping `npm audit` in the CI gate (Issue 2).
