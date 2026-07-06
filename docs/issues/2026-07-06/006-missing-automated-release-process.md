# Chore: No Automated Release Process

**Category**: chore | **Priority**: P3
**Evaluation Date**: 2026-07-06
**Audit Report**: docs/audit-report-2026-07-06.md

## Description

The repository has no automated release workflow, version tags, or GitHub releases. While CHANGELOG.md exists, there is no mechanism to:
- Create tagged releases
- Generate release notes
- Publish artifacts
- Manage version bumps

### Key Findings

1. No `release.yml` or similar workflow in `.github/workflows/`
2. `package.json` shows `"version": "1.0.0"` but no corresponding git tags exist
3. No audit trail linking specific code versions to deployments

### Impact
- **Low**: Static site generation simplifies rollback to previous deployment
- **Medium**: Cannot easily identify which changes are in production
- **Medium**: No automated changelog generation

### Recommendations
1. Create a release workflow triggered by version tags (v*.*.*)
2. Use `softprops/action-gh-release` for automated release notes
3. Add `npm version` script for managed version bumps
4. Tag current state as v1.0.0 to establish baseline
