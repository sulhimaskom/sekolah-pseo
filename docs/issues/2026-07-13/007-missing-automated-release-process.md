# Missing Automated Release Process

**Category**: chore
**Priority**: P3
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/007-missing-automated-release-process.md

## Problem Statement

No automated release workflow, GitHub Releases, or versioning strategy exists. The package version has remained `1.0.0` throughout the entire project history.

## Impact

- **Low-Medium**: Cannot trace which version is deployed; no changelog-driven releases
- **Mitigation**: Static site deployment makes rollback straightforward (git revert + rebuild)
- **No semantic versioning**: Breaking changes are indistinguishable from patches

## Evidence

- package.json version: `"1.0.0"` (unchanged)
- CHANGELOG.md exists but is not linked in any workflow or documentation reference
- No release workflow in `.github/workflows/`
- No GitHub Releases page entries

## Recommended Actions

1. Create a release workflow triggered by tag push (v*.*.*)
2. Integrate CHANGELOG.md into the release process
3. Configure semantic versioning based on conventional commits
4. Add release notes generation from changelog
