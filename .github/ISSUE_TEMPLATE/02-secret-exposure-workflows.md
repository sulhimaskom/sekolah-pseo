---
name: Secret Variable Name Exposure in CI Workflows
about: Secret variable names (not values) visible across 6 CI workflow files
title: '[P1] Security: Remove exposed secret variable names from CI workflow files'
labels: security, P1
assignees: ''
---

## Evaluation Date

2026-06-06

## Domain Score Table

**Domain**: System Quality → Security Practices
**Score**: 70/100 (deduction of -30 for secret exposure)

## Criteria-Level Breakdown

### Security Practices (Weight: 20)

**Observations**:
CI workflow files expose secret variable names (not values) across **6 files**:

| File                                    | Exposed Secret Names                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/on-push.yml`         | IFLOW_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GEMINI_API_KEY, SUPABASE_ANON_KEY, VITE_SUPABASE_ANON_KEY, API_KEY |
| `.github/workflows/on-pull.yml`         | IFLOW_API_KEY, SUPABASE_SECRET_KEY, VITE_SUPABASE_KEY, VITE_SUPABASE_URL                                                                                             |
| `.github/workflows/parallel.yml`        | IFLOW_API_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GEMINI_API_KEY, API_KEY                                                                                  |
| `.github/workflows/orchestrator.yml`    | IFLOW_API_KEY                                                                                                                                                        |
| `.github/workflows/architect-agent.yml` | IFLOW_API_KEY                                                                                                                                                        |
| `.github/workflows/template.md`         | GH_TOKEN, IFLOW_API_KEY                                                                                                                                              |

**Evidence**:

```bash
grep -r "secrets\." .github/workflows/ | grep -v GITHUB_TOKEN
```

**Impact / Risk**:

- CWE-200: Exposure of Sensitive Information
- While GitHub encrypts secret values, the **names** reveal:
  - Cloudflare usage (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)
  - Supabase usage (SUPABASE_SECRET_KEY, VITE_SUPABASE_URL)
  - AI service usage (GEMINI_API_KEY, IFLOW_API_KEY)
- Enables targeted attacks on infrastructure
- template.md containing secret patterns encourages insecure copying

**Score Rationale**:

- Base: 100 (path traversal protection ✓, XSS prevention ✓, 0 npm vulns ✓)
- Deduction: -20 for secret variable names in 6 files
- Deduction: -10 for template.md with secret patterns

## Evidence Per Criterion

- Files: All `.github/workflows/*.yml` files
- File: `.github/workflows/template.md`

## Recommendation

1. Remove secrets not actually used by each workflow
2. Use GitHub Environments to scope secrets per environment
3. Remove secret patterns from template.md — reference GitHub docs instead
4. Audit all `${{ secrets.* }}` references for necessity
