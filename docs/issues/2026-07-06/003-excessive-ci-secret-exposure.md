# Security: Excessive CI Secret Exposure

**Category**: security | **Priority**: P1
**Evaluation Date**: 2026-07-06
**Audit Report**: docs/audit-report-2026-07-06.md

## Description

The `on-push.yml` workflow exposes an excessive number of secrets as environment variables, including a confusing alias and overly broad GitHub token permissions.

### Key Findings

1. **9 secrets passed in single CI job** (on-push.yml lines 19-28):
   - `GITHUB_TOKEN`, `IFLOW_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`
   - `API_KEY` (mapped to `secrets.GEMINI_API_KEY` — confusing alias)
   - `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`

2. **Confusing alias**: `API_KEY: ${{ secrets.GEMINI_API_KEY }}` — two different env var names for the same secret value creates confusion about which key is authoritative.

3. **Broad permissions**: `contents: write` on every push workflow run violates least privilege principle.

### Impact
- **High**: Every workflow run has broad secret access — any compromised step could exfiltrate secrets
- **Medium**: Confusion between API_KEY and GEMINI_API_KEY could lead to secret rotation failures

### Files Affected
- `.github/workflows/on-push.yml`
- `.github/workflows/on-pull.yml`

### Recommendations
1. Audit which secrets are actually needed for push-triggered builds
2. Remove unused/unnecessary secrets from workflow env
3. Eliminate `API_KEY` alias — use `GEMINI_API_KEY` directly
4. Restrict `contents: write` to only jobs that need it
5. Consider OIDC for cloud provider auth instead of long-lived secrets
