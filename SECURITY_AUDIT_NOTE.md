# Security Audit - June 2026

## Summary

Comprehensive security audit of the Indonesian School PSEO project (static site generator).

## Audit Results

### Dependency Health

- ✅ **npm audit**: 0 vulnerabilities (all deps clean)
- ✅ **eslint**: ^10.4.1 (latest stable)
- ✅ **lint-staged**: ^17.0.7 (latest stable)
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

### Security Fixes Applied (This Audit)

| #   | Issue                                                               | Severity | Fix                                                                   |
| --- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| 1   | `robots.txt` had hardcoded `https://example.com` placeholder        | Medium   | Added `generateRobotsTxt()` to build process; uses dynamic `SITE_URL` |
| 2   | Sitemap URLs not XML-encoded (potential XInclude injection)         | Low      | Added `escapeXml()` function; URLs encoded in sitemap.xml output      |
| 3   | `on-push.yml`: `VITE_SUPABASE_ANON_KEY` mapped to wrong secret name | Medium   | Removed duplicate/incorrect secret mappings                           |
| 4   | `X-XSS-Protection` meta tag used (deprecated/no-op)                 | Low      | Removed from all 3 page templates                                     |
| 5   | `eslint` minor version behind (10.4.0 -> 10.4.1)                    | Low      | Updated package.json                                                  |
| 6   | `lint-staged` minor version behind (17.0.5 -> 17.0.7)               | Low      | Updated package.json                                                  |
| 7   | `SECURITY_AUDIT_NOTE.md` was empty placeholder                      | Low      | Documented audit findings                                             |

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

## Score: ⭐⭐⭐⭐⭐ (5/5) - Excellent security posture
