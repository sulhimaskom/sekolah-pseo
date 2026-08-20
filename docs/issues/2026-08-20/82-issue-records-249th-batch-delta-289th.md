# Issue Records — 249th Batch Delta (289th run, 2026-08-20)

**Ledger**: 249th batch delta. **Trigger**: Phase 0 probe → **1 open PR (#850, 288th ledger)** → PR HANDLER MODE → merged → re-probe **0 open PRs / 0 open issues** → Phase 0.3 EMPTY → Phase 1 audit (289th, read-only flat verification).

**F002 status**: `gh issue create` → GraphQL "Resource not accessible by integration (createIssue)" — **403 CONCLUSIVE (91st)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (289th basis — active tracked findings)

| Finding | Category | Priority | Status              | Observation                                                                                                                                                                                                                                           |
| ------- | -------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F002    | ci       | P1       | HELD                | Token lacks `issues: write` — **403 CONCLUSIVE (91st)** (re-probed direct this run)                                                                                                                                                                   |
| F004    | security | P2       | HELD                | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 288th basis, **zero growth**                                                                                                                                               |
| F005    | docs     | P3       | HELD                | **246 files** (135th obs): 245 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 40th clean obs); ledger-only drift by convention (246 at post-#850 HEAD; this run's files 81/82/83 written prettier-clean → no growth) |
| F007    | refactor | P2       | HELD                | Workflow YAML overcomplexity (2045L)                                                                                                                                                                                                                  |
| F011    | release  | P2       | HELD                | 0 tags / no release process (F242 docs-fix landed; automation still absent)                                                                                                                                                                           |
| F018    | data     | P2       | HELD                | Data STALE **31 days** (threshold 7; held at 31d, same-day re-observation)                                                                                                                                                                            |
| F025    | config   | P3       | HELD                | SITE_URL placeholder `https://example.com` (src/core/config.js:57); live site root 404 while Pages "built"                                                                                                                                            |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities                                                                                                                                                                                                                           |
| F029    | test     | P2       | NOT OBSERVED        | working tree clean after full suite (verified this run)                                                                                                                                                                                               |
| F037    | security | P1       | HELD                | 12 workflow violations (2 CRITICAL + 10 HIGH), **190th obs**, push-blocked F050 (66th documented pass)                                                                                                                                                |
| F063    | ci       | P3       | HELD                | on-pull streak maintained (≥24 threshold; last 29 completed schedule runs all success + 1 in-progress at probe) — 38th obs                                                                                                                            |
| F064    | test     | P3       | HELD                | pytest env parity UNAVAILABLE — 35th obs (python3 -m pytest → "No module named pytest")                                                                                                                                                               |
| F225    | refactor | P3       | HELD                | 4 import edges src/services/BuildOrchestrator.js:52-55 → ../../scripts/*                                                                                                                                                                              |
| F228    | docs     | P3       | HELD                | README.md:312 12-violation note accurate at HEAD `36c40c4`                                                                                                                                                                                            |
| F229    | security | P2       | HELD                | **unhardened `curl                                                                                                                                                                                                                                    | bash` installer in BOTH on-pull.yml:63 AND on-push.yml:63** — 54th obs |
| F230    | docs     | P3       | HELD                | blueprint.md/task.md prettier-clean — 53rd clean obs                                                                                                                                                                                                  |
| F231    | test     | P3       | RESOLVED maintained | build-performance.js:344 monitorBuild report-after-stop                                                                                                                                                                                               |
| F232    | refactor | P3       | RESOLVED maintained | manifest.js version-gated content hashes                                                                                                                                                                                                              |
| F233    | refactor | P3       | RESOLVED maintained | IntegrationError.details at src/core/resilience.js:10-17, cause preserved                                                                                                                                                                             |
| F234    | test     | P3       | RESOLVED maintained | fetch-data.js:36-39 EXTERNAL_DATA_DIR validation                                                                                                                                                                                                      |
| F236    | test     | P3       | HELD                | 3 quality implementations (data-quality, check-freshness, check-workflow-security) each with .test.js                                                                                                                                                 |
| F237    | refactor | P3       | HELD                | 6 `generate*Pages` refs (build-pages.js) + 12 `build*PageData` refs (PageBuilder.js)                                                                                                                                                                  |
| F239    | docs     | P3       | HELD                | api.md:3888 Comparison Module + api.md:6627 Test Helpers Module present — 39th obs                                                                                                                                                                    |
| F246    | test     | P3       | HELD                | footer year injectable (footer.js:24/30) for deterministic tests                                                                                                                                                                                      |
| F247    | bug      | P3       | HELD                | no `/provinsi/undefined/` path at source (test-assertion-only matches)                                                                                                                                                                                |
| F248    | test     | P3       | HELD                | isValidCoordinate at src/core/data-schema.js:222                                                                                                                                                                                                      |
| F249    | bug      | P3       | HELD                | escape-only reset in homepage.js (escapeHtml)                                                                                                                                                                                                         |
| F250    | test     | P3       | HELD                | strict coordinate parse + npsn dedupe src/core/data-schema.js:52-57                                                                                                                                                                                   |
| F251    | test     | P3       | HELD                | scripts/data-schema.test.js prettier-clean — 40th clean obs                                                                                                                                                                                           |

## Held-finding detail (289th basis)

### F037 — workflow security violations (190th obs, push-blocked F050 66th documented pass)

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

(End of file)
