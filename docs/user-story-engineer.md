# User Story Engineer - Domain Documentation

## Overview
The user-story-engineer domain focuses on delivering small, safe, measurable improvements to the repository.

## Principles
1. **Small** - Each improvement should be atomic and focused
2. **Safe** - Changes should not break existing functionality
3. **Measurable** - Improvements should have clear, verifiable outcomes

## Workflow Phases
1. **INITIATE** - Check for existing PRs with label "user-story-engineer"
2. **PLAN** - Identify the improvement to make
3. **IMPLEMENT** - Make the change
4. **VERIFY** - Ensure tests pass and no regressions
5. **SELF_REVIEW** - Review the change for quality
6. **SELF_EVOLVE** - Update this documentation with learnings
7. **DELIVER** - Create PR with label "user-story-engineer"

## PR Requirements
- Label: user-story-engineer
- Linked to issue if any
- Up to date with default branch
- No conflict
- Build/lint/test success
- ZERO warnings
- Small atomic diff

## Improvements Delivered

### PR #94: fix: resolve npm security vulnerabilities (ajv, minimatch)
- Fixed 2 npm security vulnerabilities
- Updated package-lock.json via `npm audit fix`
- All tests pass
### PR #106: feat: add EditorConfig for consistent coding styles
- Added `.editorconfig` file for IDE/editor consistency
- Configured settings to match existing Prettier configuration
- Build and tests pass
