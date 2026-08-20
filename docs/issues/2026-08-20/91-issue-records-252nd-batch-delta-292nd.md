# Issue Records — 252nd Batch Delta (292nd run, 2026-08-20)

**Ledger**: 252nd batch delta. **Trigger**: Phase 0 probe → **1 open PR (#853, 291st ledger)** → PR HANDLER MODE → merged → re-probe **0 open PRs / 0 open issues** → Phase 0.3 EMPTY → Phase 1 audit (292nd, read-only flat verification).

**F002 status**: `gh api user` → GraphQL "Resource not accessible by integration" — **403 CONCLUSIVE (94th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (292nd basis — active tracked findings)

| Finding | Category | Priority | Status              | Observation                                                                                                                                                                                                                                           |
| ------- | -------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F002    | ci       | P1       | HELD                | Token lacks `issues: write` — **403 CONCLUSIVE (94th)** (re-probed direct this run)                                                                                                                                                                   |
| F004    | security | P2       | HELD                | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 291st basis, **zero growth** (9th consecutive)                                                                                                                             |
| F005    | docs     | P3       | HELD                | **246 files** (138th obs): 245 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 43rd clean obs); ledger-only drift by convention (246 at post-#853 HEAD; this run's files 90/91/92 written prettier-clean → no growth) |
| F007    | refactor | P2       | HELD                | Workflow YAML overcomplexity (2045L)                                                                                                                                                                                                                  |
| F011    | release  | P2       | HELD                | 0 tags / no release process (F242 docs-fix landed; automation still absent)                                                                                                                                                                           |
| F018    | data     | P2       | HELD                | Data STALE **31 days** (threshold 7; held at 31d, same-day re-observation)                                                                                                                                                                            |
| F025    | config   | P3       | HELD                | SITE_URL placeholder `https://example.com` (src/core/config.js:57); live site root 404 while Pages "built"                                                                                                                                            |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities                                                                                                                                                                                                                           |
| F029    | test     | P2       | NOT OBSERVED        | working tree clean after full suite (verified this run)                                                                                                                                                                                               |
| F037    | security | P1       | HELD                | 12 workflow violations (2 CRITICAL + 10 HIGH), **193rd obs**, push-blocked F050 (69th documented pass)                                                                                                                                                |
| F063    | ci       | P3       | HELD                | on-pull streak maintained (≥24 threshold; last 29 completed schedule runs all success + 1 in-progress at probe) — 41st obs                                                                                                                            |
| F064    | test     | P3       | HELD                | pytest env parity UNAVAILABLE — 38th obs (python3 -m pytest → "No module named pytest")                                                                                                                                                               |
| F225    | refactor | P3       | HELD                | 4 import edges src/services/BuildOrchestrator.js:52-55 → ../../scripts/*                                                                                                                                                                              |
| F228    | docs     | P3       | HELD                | README.md:312 12-violation note accurate at HEAD `a6811ad`                                                                                                                                                                                            |
| F229    | security | P2       | HELD                | **unhardened `curl                                                                                                                                                                                                                                    | bash` installer in BOTH on-pull.yml:63 AND on-push.yml:63** — 57th obs |
| F230    | docs     | P3       | HELD                | blueprint.md/task.md prettier-clean — 56th clean obs                                                                                                                                                                                                  |
| F231    | test     | P3       | RESOLVED maintained | build-performance.js:344 monitorBuild report-after-stop                                                                                                                                                                                               |
| F232    | refactor | P3       | RESOLVED maintained | manifest.js version-gated content hashes                                                                                                                                                                                                              |
| F233    | refactor | P3       | RESOLVED maintained | IntegrationError.details at src/core/resilience.js:10-17, cause preserved                                                                                                                                                                             |
| F234    | test     | P3       | RESOLVED maintained | fetch-data.js:36-39 EXTERNAL_DATA_DIR validation                                                                                                                                                                                                      |
| F236    | test     | P3       | HELD                | 3 quality implementations (data-quality, check-freshness, check-workflow-security) each with .test.js                                                                                                                                                 |
| F237    | refactor | P3       | HELD                | 6 `generate*Pages` refs (build-pages.js) + 12 `build*PageData` refs (PageBuilder.js)                                                                                                                                                                  |
| F239    | docs     | P3       | HELD                | api.md:3888 Comparison Module + api.md:6627 Test Helpers Module present — 42nd obs                                                                                                                                                                    |
| F246    | test     | P3       | HELD                | footer year injectable (footer.js:24/30) for deterministic tests                                                                                                                                                                                      |
| F247    | bug      | P3       | HELD                | no `/provinsi/undefined/` path at source (test-assertion-only matches)                                                                                                                                                                                |
| F248    | test     | P3       | HELD                | isValidCoordinate at src/core/data-schema.js:222                                                                                                                                                                                                      |
| F249    | test     | P3       | HELD                | escape-only reset in homepage.js (escapeHtml)                                                                                                                                                                                                         |
| F250    | test     | P3       | HELD                | strict coordinate parse + npsn dedupe src/core/data-schema.js:52-57                                                                                                                                                                                   |
| F251    | test     | P3       | HELD                | scripts/data-schema.test.js prettier-clean — 43rd clean obs                                                                                                                                                                                           |

## Held-finding detail (292nd basis)

### F037 — workflow security violations (193rd obs, push-blocked F050 69th documented pass)

`node scripts/check-workflow-security.js` exits non-zero. Violations (2 CRITICAL + 10 HIGH):

- **[CRITICAL] DUPLICATE_API_KEY ×2** — `on-push.yml` AND `parallel.yml`: `API_KEY` references same secret (`secrets.GEMINI_API_KEY`) as `GEMINI_API_KEY`.
- **[HIGH] ID_TOKEN_WRITE ×4** — `architect-agent.yml:13`, `opencode.yml:18`, `orchestrator.yml:9`, `parallel.yml:16`: `id-token: write` in non-OIDC workflows.
- **[HIGH] ACTIONS_WRITE_NON_MERGE ×4** — `architect-agent.yml:17`, `opencode.yml:22`, `orchestrator.yml:13`, `parallel.yml:15`: `actions: write` in non-merge workflows.
- **[HIGH] GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN ×2** — `architect-agent.yml` (1×) + `orchestrator.yml` (2×): `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`.

Note: F229 (unhardened `curl|bash` installer) is a separate source-observed finding (on-pull.yml:63 + on-push.yml:63) tracked outside the gate's 5-rule set; the gate output above reflects only the 5 rules it applies.

### F004 — secrets inventory (57 refs / 10 unique names, zero growth)

| Secret                | Refs |
| --------------------- | ---- |
| GITHUB_TOKEN          | 14   |
| IFLOW_API_KEY         | 10   |
| GEMINI_API_KEY        | 10   |
| CLOUDFLARE_API_TOKEN  | 5    |
| CLOUDFLARE_ACCOUNT_ID | 5    |
| VITE_SUPABASE_KEY     | 4    |
| VITE_SUPABASE_URL     | 3    |
| GH_TOKEN              | 3    |
| SUPABASE_SECRET_KEY   | 2    |
| SUPABASE_ANON_KEY     | 1    |

Byte-identical to 291st basis — **zero growth** (9th consecutive zero-growth observation).

### F005 — prettier drift set (246 files, ledger-only, zero source)

`npx prettier --check "docs/**/*.md"` → **246 files** with code-style issues, all under `docs/issues/` (245 ledger files) + `SECURITY_AUDIT_NOTE.md`. **Zero source files** in the drift set — verified each run. This run's ledger files 90/91/92 were written prettier-clean → no growth (246 at post-#853 HEAD, matching 291st basis).

### F063 — on-pull CI streak (41st obs)

`gh run list --workflow=on-pull.yml --limit 30` → 29 completed `success` + 1 in-progress at probe time. Streak maintained at ≥24 threshold. PR #853's workflow run completed with `action_required` (approval gate for bot-authored PRs, zero jobs executed) — not a CI failure; docs-only PRs merge on local-matrix verification per 264th+ precedent.

### F018 — data staleness (31 days, same-day re-observation)

`node scripts/check-freshness.js` → Last Update 2026-07-20 (31 days ago), threshold 7 days → **STALE**. Held at 31d; requires external data refresh (fetch-data with valid API creds) — **BLOCKED** (env credentials unavailable in this runner).

(End of file)
