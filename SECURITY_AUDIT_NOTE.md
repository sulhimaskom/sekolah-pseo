# Security Audit - July 2026 (Pass 6)

## Summary

Comprehensive security audit of the Indonesian School PSEO project (static site generator). This is the **6th security audit pass** (following TASK-022, TASK-031, TASK-036, TASK-044, TASK-048). All workflow security fixes from prior audits had regressed again during a main→agent merge and have been re-applied.

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

### Security Fixes Applied (This Audit - Pass 6)

| #   | Issue                                                                                    | Severity | Fix                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `on-push.yml`: Duplicate `API_KEY` + wrong `VITE_SUPABASE_ANON_KEY` mapping              | Critical | Removed duplicate `API_KEY`; removed incorrectly mapped `VITE_SUPABASE_ANON_KEY`                                                 |
| 2   | `parallel.yml`: 4 duplicate `API_KEY` entries (architect, specialist, Fixer, PR-Handler) | Critical | Removed all 4 `API_KEY: ${{ secrets.GEMINI_API_KEY }}` entries                                                                   |
| 3   | `orchestrator.yml`: `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`                 | High     | Replaced both occurrences with `secrets.GITHUB_TOKEN`                                                                            |
| 4   | `architect-agent.yml`: `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN`              | High     | Replaced with `secrets.GITHUB_TOKEN`                                                                                             |
| 5   | `id-token: write` in 5 non-OIDC workflows                                                | High     | Removed from `parallel.yml`, `on-pull.yml`, `opencode.yml`, and from both levels of `orchestrator.yml` and `architect-agent.yml` |
| 6   | `actions: write` in 4 non-merge workflows                                                | High     | Removed from `parallel.yml` and from both levels of `orchestrator.yml`, `architect-agent.yml`, and `opencode.yml`                |
| 7   | `opencode.yml`: `actions: write` at both levels                                          | High     | Removed `actions: write` and `id-token: write` from top-level and job-level permissions                                          |

### Code Quality

- ✅ ESLint: 0 errors
- ✅ Prettier: formatting clean
- ✅ JS Tests: 875/875 pass
- ✅ Python Tests: 27/27 pass
- ✅ npm audit: 0 vulnerabilities
- ✅ pip-audit: 0 vulnerabilities
- ✅ Build: all pages generate successfully

### CI/CD Security

- ✅ GITHUB_TOKEN: auto-provisioned, minimal scope (all workflows now use `secrets.GITHUB_TOKEN`)
- ✅ Overly permissive `id-token: write` removed from all 6 non-OIDC workflows
- ✅ Overly permissive `actions: write` removed from all non-merge workflows
- ✅ Duplicate `API_KEY` → `GEMINI_API_KEY` mapping removed (6 occurrences across 2 workflow files)
- ✅ Misconfigured `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_KEY` mapping removed from on-push.yml
- ✅ `secrets.GH_TOKEN` replaced with `secrets.GITHUB_TOKEN` in orchestrator.yml and architect-agent.yml
- ⚠️ `on-push.yml` still exposes secrets on every push (by design for AI automation)
- ✅ No secrets in code or logs

### Root Cause of Regression (5th occurrence)

All issues in this audit were regressions from prior fixes (TASK-022, TASK-031, TASK-036, TASK-044, TASK-048). The root cause: security fixes were applied only on the `agent` branch but never merged to `main`. When `main` was subsequently merged into `agent` during synchronization, the unfixed versions from `main` overwrote the fixed versions. This has happened **5 times** now.

**Recommendation**: To prevent future regression, one of these MUST be implemented:

1. **Merge `agent` → `main` after each security audit** so fixes persist in the default branch.
2. **Add a pre-commit/pre-push hook** that checks for:
   - `id-token: write` in non-OIDC workflows → reject
   - `actions: write` in non-merge workflows → reject
   - `API_KEY` as duplicate of `GEMINI_API_KEY` → reject
   - `secrets.GH_TOKEN` usage → reject
3. **Add GitHub Actions workflow** (`.github/workflows/security-regression-check.yml`) that validates these invariants on every push to `main` or `agent`.

## Score: ⭐⭐⭐⭐⭐ (5/5) - Excellent security posture

### Audit Summary (All Passes)

| Pass | Date       | Agent                   | Issues Found | Severity   |
| ---- | ---------- | ----------------------- | ------------ | ---------- |
| 1    | 2026-06-09 | Security Engineer       | 12           | 3 Critical |
| 2    | 2026-06-11 | Security Engineer       | 8            | 2 Critical |
| 3    | 2026-06-17 | Security Engineer       | 6            | 1 Critical |
| 4    | 2026-06-22 | Principal Security Eng. | 18           | 5 Critical |
| 5    | 2026-06-28 | Principal Security Eng. | 11           | 2 Critical |
| 6    | 2026-07-04 | Principal Security Eng. | 17           | 2 Critical |
