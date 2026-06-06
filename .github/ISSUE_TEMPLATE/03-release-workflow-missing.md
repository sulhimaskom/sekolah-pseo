---
name: Missing Release Workflow and Versioning Strategy
about: No automated release process, version tags, or rollback plan
title: '[P1] Release: Add automated release workflow with version tagging and changelog'
labels: enhancement, P1
assignees: ''
---

## Evaluation Date

2026-06-06

## Domain Score Table

**Domain**: Delivery & Evolution Readiness → Release & Rollback Safety
**Score**: 65/100

## Criteria-Level Breakdown

### Release & Rollback Safety (Weight: 20)

**Observations**:

- No release workflow in `.github/workflows/`
- No version tags (git tag) for releases
- `package.json` version stuck at `1.0.0`
- No rollback procedure documented
- While CHANGELOG.md exists, it is not integrated with any release process
- Deployment to Cloudflare Pages is configured (`cloudflare-pages.yml`) but not wired to a release workflow

**Evidence**:

- `package.json` version: 1.0.0
- `git tag --list` output: empty or no release tags
- `.github/workflows/` — no release workflow
- `docs/release.md` — may exist but no automated release pipeline

**Impact / Risk**:

- Medium: No traceability between code changes and deployments
- Medium: Cannot easily rollback to previous known-good state
- Medium: No automated deployment gate (manual deploy = risk)
- Low: Static site output is inherently rollback-safe (git revert + redeploy)

**Score Rationale**:

- Base: 100
- Deduction: -20 for no release workflow
- Deduction: -15 for no version tags or release history

## Evidence Per Criterion

- File: `package.json` (version: 1.0.0)
- File: `cloudflare-pages.yml` (configured but standalone)

## Recommendation

1. Create a release workflow (`.github/workflows/release.yml`) that:
   - Tags version on push to main (e.g., semantic release or manual trigger)
   - Runs full build/lint/test suite
   - Generates release notes from CHANGELOG.md
   - Deploys to Cloudflare Pages
2. Document rollback procedure in `docs/release.md`
3. Consider semantic versioning (semver) for releases
