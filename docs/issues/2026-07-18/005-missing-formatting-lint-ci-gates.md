# Missing Pre-Merge Formatting and Lint Gates in CI

**Category**: ci
**Priority**: P2
**Evaluation Date**: 2026-07-18

---

## Problem

CI pipelines do not enforce code formatting (`prettier`) or linting (`eslint`) as blocking gates before merge. Currently:

- `npm run format:check` is not run in any CI workflow
- `npm run lint` is not run as an explicit CI step
- 6 docs files are already unformatted (see #003)
- Lint passes currently, but there is no regression protection

## Evidence

From `.github/workflows/on-push.yml` (12 steps of opencode agent runs, no lint/format checks):
From `.github/workflows/on-pull.yml`:
From `.github/workflows/parallel.yml`:

None of these workflows include explicit `npm run lint` or `npm run format:check` steps.

## Impact

- **Formatting drift**: Over time, code and docs will become inconsistently formatted
- **Review overhead**: Formatting issues distract from substantive code review
- **Diff noise**: Inconsistent formatting inflates diffs with whitespace/quote changes
- **No quality floor**: Without automated gates, code quality is purely human-dependent

## Current State

- Lint: Passes cleanly (0 errors)
- Format: 6 docs files out of compliance
- CI: Neither checked

## Suggested Fix

Add a fast pre-merge check job to CI:

```yaml
quality-gate:
  name: Quality Gate (Lint + Format)
  runs-on: ubuntu-24.04-arm
  steps:
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v6
      with:
        node-version: 20
        cache: npm
    - run: npm ci
    - run: npm run lint
    - run: npm run format:check
```

Make this a required check for pull requests. It completes in <30 seconds and catches formatting/lint issues before review.

## Files Affected

- `.github/workflows/on-push.yml`
- `.github/workflows/on-pull.yml`
- `.github/workflows/parallel.yml`
