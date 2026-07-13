# CI/CD Workflow Overcomplexity

**Category**: ci
**Priority**: P2
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/001-ci-workflow-overcomplexity.md

## Problem Statement

The repository contains 6 workflow files totaling 2045+ lines. The CI configuration is significantly overengineered for a static site generator project:

- `.github/workflows/on-push.yml` (533 lines) — 12 sequential OpenCode flow steps
- `.github/workflows/parallel.yml` (456 lines) — 4-stage pipeline with 13 specialist matrix jobs
- `.github/workflows/on-pull.yml` (437 lines) — PR handler with embedded full loop prompt
- `.github/workflows/orchestrator.yml` (200 lines) — Daily orchestrator
- `.github/workflows/architect-agent.yml`
- `.github/workflows/opencode.yml`

## Impact

- **High maintenance burden**: Each workflow carries embedded agent prompts, making changes risky
- **CI cost**: 12+ sequential OpenCode runs per push consumes significant CI minutes
- **Serialization**: Global concurrency group in on-push.yml serializes all runs
- **Debugging difficulty**: Complex pipeline makes it hard to identify where failures occur

## Evidence

- File sizes and line counts of each workflow
- Global concurrency group `global` in on-push.yml (line 11-13)
- 12 sequential flow steps in on-push.yml (lines 74-168)
- 13 parallel specialist jobs in parallel.yml (lines 232-245)
- Embedded 530-line prompt in on-push.yml (lines 174-528)

## Recommended Actions

1. Consolidate workflows where possible (on-push.yml and on-pull.yml overlap significantly)
2. Extract shared prompts into separate files instead of inline heredocs
3. Remove the global concurrency group or scope it per-workflow
4. Consider whether all 12 OpenCode flow steps are necessary on every push
5. Reduce the 13-specialist matrix to only roles that produce actionable changes
