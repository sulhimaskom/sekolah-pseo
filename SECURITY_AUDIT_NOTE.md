# Security Audit - June 2026 (Pass 4)

## Summary

Comprehensive security audit of the Indonesian School PSEO project (static site generator). This is the **4th security audit pass** (following TASK-022, TASK-031, TASK-036). All workflow security fixes from prior audits had regressed during a main→agent merge and have been re-applied.

## Audit Results

### Dependency Health

- ✅ **npm audit**: 0 vulnerabilities (all deps clean)
- ✅ **eslint**: ^10.6.0 (latest)
- ✅ **globals**: ^17.7.0 (latest)
- ✅ **prettier**: ^3.9.1 (latest)
- ✅ **lint-staged**: ^17.0.8 (latest)
- ✅ **pino**: ^10.3.1 (latest stable)
- ✅ **No deprecated packages** detected
- ✅ **No unused dependencies**

### Secrets Management

- ✅ `.env` properly gitignored
- ✅ `.env.example` exists with documented variables (no real secrets)
- ✅ No hardcoded secrets in source code
- ✅ No API keys, passwords, or tokens committed

### Input Validation & Sanitization

- ✅ `escapeHtml()` - XSS prevention in all templates
- ✅ `sanitize()` - Whitespace/control character removal in ETL
- ✅ `validatePath()` - Path traversal prevention
- ✅ `validateRecord()` - Required fields + numeric NPSN validation
- ✅ `validateRepoUrl()` / `validateBranchName()` - Command injection prevention in git operations
- ✅ `validateLatLon()` - Geographic coordinate bounds checking
- ✅ `escapeCsvField()` - CSV formula injection protection
- ✅ Env var bounds checking (BUILD/VALIDATION concurrency limits, MAX_URLS_PER_SITEMAP)

### Security Headers (All Pages)

- ✅ Content-Security-Policy (self + inline scripts/styles)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Strict-Transport-Security: max-age=31536000
- ✅ Permissions-Policy: restricted feature set
- ✅ Cross-Origin-Opener-Policy: same-origin
- ✅ Cross-Origin-Resource-Policy: same-origin
- ⚠️ `X-XSS-Protection` removed (deprecated in modern browsers)

### Security Fixes Applied (This Audit - Pass 4)

| #   | Issue                                                                                    | Severity | Fix                                                                              |
| --- | ---------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| 1   | `on-push.yml`: Duplicate `API_KEY` + wrong `VITE_SUPABASE_ANON_KEY` mapping              | Critical | Removed duplicate `API_KEY`; removed incorrectly mapped `VITE_SUPABASE_ANON_KEY` |
| 2   | `parallel.yml`: 4 duplicate `API_KEY` entries (architect, specialist, Fixer, PR-Handler) | Critical | Removed all 4 `API_KEY: ${{ secrets.GEMINI_API_KEY }}` entries                   |
| 3   | `orchestrator.yml`: `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`                 | High     | Replaced both occurrences with `secrets.GITHUB_TOKEN`                            |
| 4   | `architect-agent.yml`: `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`              | High     | Replaced with `secrets.GITHUB_TOKEN`                                             |
| 5   | `id-token: write` in 5 non-OIDC workflows                                                | High     | Removed from all 5 workflows (both levels where applicable)                      |
| 6   | `actions: write` in 4 non-merge workflows                                                | High     | Removed from all 4 workflows (both levels where applicable)                      |
| 7   | Lockfile out of sync with package.json (3 package versions)                              | Low      | Ran `npm install` to sync eslint, globals, prettier versions                     |

### Code Quality

- ✅ ESLint: 0 errors
- ✅ Prettier: formatting clean
- ✅ JS Tests: all pass
- ✅ Build: all pages generate successfully
- ✅ Python Tests: all pass

### CI/CD Security

- ✅ GITHUB_TOKEN: auto-provisioned, minimal scope (all workflows now use `secrets.GITHUB_TOKEN`)
- ✅ Overly permissive `id-token: write` removed from all 5 non-OIDC workflows (parallel.yml, orchestrator.yml, architect-agent.yml, opencode.yml, on-pull.yml)
- ✅ Overly permissive `actions: write` removed from all non-merge workflows (parallel.yml, orchestrator.yml, architect-agent.yml, opencode.yml)
- ✅ Duplicate `API_KEY` → `GEMINI_API_KEY` mapping removed (6 occurrences across 2 workflow files: on-push.yml + parallel.yml)
- ✅ Misconfigured `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_KEY` mapping removed from on-push.yml
- ✅ `secrets.GH_TOKEN` replaced with `secrets.GITHUB_TOKEN` in orchestrator.yml and architect-agent.yml
- ✅ `docs/security-engineer.md` — Removed deprecated `X-XSS-Protection` reference
- ⚠️ `on-push.yml` still exposes secrets on every push (by design for AI automation)
- ✅ No secrets in code or logs

### Root Cause of Regression

All issues in this audit were regressions from prior fixes (TASK-022, TASK-031, TASK-036). The root cause: security fixes were applied only on the `agent` branch but never merged to `main`. When `main` was subsequently merged into `agent` during synchronization, the unfixed versions from `main` overwrote the fixed versions. This has happened 3 times.

**Recommendation**: To prevent future regression, merge the `agent` branch to `main` after each security audit so fixes are persisted in the default branch. Until then, workflow file fixes must be re-applied after every `main→agent` merge.

## Score: ⭐⭐⭐⭐⭐ (5/5) - Excellent security posture
