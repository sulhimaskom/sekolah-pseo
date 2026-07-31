# SITE_URL Placeholder Default Produces example.com URLs in Artifacts

**Category**: chore
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/006-site-url-placeholder.md

## Problem Statement

`SITE_URL` defaults to the placeholder `https://example.com`. When the env var is unset, the build **succeeds with a warning** and generates `robots.txt` and sitemap URLs pointing at `https://example.com/...` — silently shipping wrong URLs to production.

```log
[warn] SITE_URL is set to default placeholder "https://example.com".
        Set SITE_URL env var for production deployment.
Generated robots.txt with sitemap URL: https://example.com/sitemap-index.xml
```

## Evidence

- `scripts/config.js:50-54` — placeholder default + warn log
- Build output 2026-07-31 (see above)
- `.env.example` — `SITE_URL=https://example.com` (documents the placeholder as default)

## Impact

- Production deployment without `SITE_URL` → broken robots.txt, invalid sitemap URLs, SEO damage
- Silent failure: build exits 0

## Suggested Fix

1. Fail the build (non-zero exit) when `SITE_URL` is unset or still `https://example.com` in production mode
2. Or gate: only allow placeholder in dev/local builds; `NODE_ENV=production` requires explicit SITE_URL
3. Update `.env.example` to make SITE_URL a required production var
