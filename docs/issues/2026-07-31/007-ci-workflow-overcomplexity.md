# CI/CD Workflow Overcomplexity — 2045 Lines Across 7 Workflows

**Category**: ci
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/007-ci-workflow-overcomplexity.md

## Problem Statement

The CI layer is 2045 lines across 7 workflow files. `on-push.yml` alone is 533 lines with **12 sequential opencode steps** (00–11 flow, each `timeout-minutes: 120` with a 90-min hard timeout), plus an embedded copy of the full autonomous-agent prompt. This is the single largest maintainability burden in the repo (Simplicity criterion 78).

## Evidence

```
  533 .github/workflows/on-push.yml     (12 sequential 90-min opencode runs)
  456 .github/workflows/parallel.yml
  437 .github/workflows/on-pull.yml
  216 .github/workflows/architect-agent.yml
  203 .github/workflows/opencode.yml
  200 .github/workflows/orchestrator.yml
 2045 total
```

- 39 `secrets.` references; duplicated prompt text embedded in YAML
- Closed issue #299 "Optimize GitHub workflow: sequential flows should run in parallel" (reopened behavior)

## Impact

- 12 × 90-min sequential steps → multi-hour push cycles (change velocity throttled)
- Prompt logic duplicated across `on-push.yml` and `.github/prompt/*.md` → drift risk
- Hard to review, hard to audit, high blast radius per change

## Suggested Fix

1. Replace the 12 inline `opencode run "$(cat ...)"` steps with a single matrix/loop over `.github/prompt/*.md`
2. Extract the embedded autonomous-agent prompt to `.github/prompt/` (single source of truth)
3. Consolidate the 7 workflows to 3: on-push, on-pull, orchestrator
4. Delete unused/redundant workflow files only after confirming no references

## Related

- `docs/issues/2026-07-13/001-ci-workflow-overcomplexity.md`
- `docs/issues/2026-07-30/00-audit-report.md` (Simplicity 78)
