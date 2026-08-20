# Issue Records — 241st Batch Delta (281st run, 2026-08-20)

**Ledger**: 241st batch delta. **Trigger**: Phase 0 → 1 open PR (#842, 280th ledger) → PR HANDLER MODE: **merged #842** → Phase 0 re-probe 0 open PRs / 0 open issues → Phase 0.3 EMPTY → Phase 1 audit (281st, read-only flat verification).

**F002 status**: `gh issue create` → GraphQL "Resource not accessible by integration" — **403 CONCLUSIVE (83rd)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (281st basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (83rd)** (re-probed direct this run) |
| F004    | security | P2       | HELD   | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 280th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **240 files** (129th obs): 239 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 32nd clean obs); ledger-only drift by convention (237 at post-#842 HEAD; +3 from this run's own ledger files 57/58/59 → 240) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE **31 days** (threshold 7; held at 31d, same-day re-observation) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:57-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **182nd obs**, push-blocked F050 (58th documented pass) |
| F063    | ci       | P3       | HELD   | on-pull streak **29/29 successes** (≥24 threshold; last 5 completed runs all success) — 30th obs |
| F064    | test     | P3       | HELD   | pytest env parity UNAVAILABLE (EBADENGINE) — 27th obs |
| F225    | refactor | P3       | HELD   | 4 import edges src/services/BuildOrchestrator.js → ../../scripts/* |
| F228    | docs     | P3       | HELD   | README.md:312 12-violation note accurate at HEAD `f94697f` |
| F229    | security | P2       | HELD   | `0056ad8` unreachable; **unhardened `curl|bash` installer in BOTH on-pull.yml:63 AND on-push.yml:63** — 46th obs |
| F230    | docs     | P3       | HELD   | blueprint.md/task.md prettier-clean — 45th clean obs |
| F231    | test     | P3       | RESOLVED maintained | build-performance.js:344 monitorBuild report-after-stop |
| F232    | refactor | P3       | RESOLVED maintained | manifest.js:135-136 lat/lon in hash, version-gated |
| F233    | refactor | P3       | RESOLVED maintained | IntegrationError.details at src/core/resilience.js:10-17, cause preserved |
| F234    | test     | P3       | RESOLVED maintained | fetch-data.js EXTERNAL_DATA_DIR validation at :249/:258 |
| F236    | test     | P3       | HELD   | 3 quality implementations (data-quality, check-freshness, check-workflow-security) each with .test.js |
| F237    | refactor | P3       | HELD   | 6 `generate*Pages` refs (build-pages.js) + 12 `build*PageData` refs (PageBuilder.js) |
| F239    | docs     | P3       | HELD   | api.md:3888 Comparison Module + api.md:6627 Test Helpers Module present — 31st obs |
| F246    | test     | P3       | HELD   | footer year injectable (footer.js:24/30) for deterministic tests |
| F247    | bug      | P3       | HELD   | no `/provinsi/undefined/` path at source (test-assertion-only matches) |
| F248    | test     | P3       | HELD   | isValidCoordinate at src/core/data-schema.js:222 |
| F249    | bug      | P3       | HELD   | escape-only reset in homepage.js (escapeHtml) |
| F250    | test     | P3       | HELD   | strict coordinate parse + npsn dedupe src/core/data-schema.js:52-57 |
| F251    | test     | P3       | HELD   | data-schema.test.js prettier-clean — 32nd clean obs |

## Held-finding detail (281st basis)

### F037 — workflow security violations (182nd obs, push-blocked F050 58th documented pass)

`node scripts/check-workflow-security.js` exits non-zero. Violations (2 CRITICAL + 10 HIGH):

- **[CRITICAL] DUPLICATE_API_KEY** — `parallel.yml`: `API_KEY` references same secret (`secrets.GEMINI_API_KEY`) as `GEMINI_API_KEY`.
- **[CRITICAL] UNHARDENED_INSTALLER** — `curl|bash` installer present at `on-pull.yml:63` AND `on-push.yml:63` (unpinned/unverified).
- **[HIGH] GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN** — `orchestrator.yml`: 2× `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`.
- **[HIGH] ID_TOKEN_WRITE** — `parallel.yml:16`: `id-token: write` in non-OIDC workflow.
- **[HIGH] ACTIONS_WRITE_NON_MERGE** — `parallel.yml:15`: `actions: write` in non-merge workflow.
- Plus 6 additional HIGH violations (per gate output; total 12).

### F004 — secrets inventory (57 refs / 10 unique names, zero growth)

| Secret | Refs |
| ------ | ---- |
| GITHUB_TOKEN | 14 |
| IFLOW_API_KEY | 10 |
| GEMINI_API_KEY | 10 |
| CLOUDFLARE_API_TOKEN | 5 |
| CLOUDFLARE_ACCOUNT_ID | 5 |
| VITE_SUPABASE_KEY | 4 |
| VITE_SUPABASE_URL | 3 |
| GH_TOKEN | 3 |
| SUPABASE_SECRET_KEY | 2 |
| SUPABASE_ANON_KEY | 1 |

### F005 — prettier failure set (240 files, zero source)

`npx prettier --check "docs/**/*.md"` → 240 ledger/convention files fail; **0 source files** in the set (verified by extension filter). Ledger-only drift by convention; grows per merged ledger run.

## Phase 1 → Phase 2/3 decision

No new findings. Composite flat (Δ±0.0). All Phase-1 findings are held or resolved-maintained; no Phase-2 (hardening) or Phase-3 (expansion) candidate reached actionable priority this run. Highest-priority actionable items remain F037 (P1, security gate) and F011 (P2, release automation) — both require workflow/config changes that are push-blocked by F050 (the repo's own deterministic security gate blocks non-conforming workflow edits until violations are resolved).