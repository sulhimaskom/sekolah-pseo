# CI/CD Workflow Overcomplexity

**Category**: ci | **Priority**: P2
**Evaluation Date**: 2026-07-12
**Audit Report**: docs/audit-report-2026-07-12.md

## Description

The repository has 6 separate GitHub Actions workflow files totaling 2045 lines of YAML. This creates significant maintenance overhead, configuration drift risk, and debugging complexity.

### Key Findings

1. **6 workflows, 2045 total lines**:
   - `on-push.yml`: 533 lines
   - `on-pull.yml`: 437 lines
   - `parallel.yml`: 456 lines
   - `architect-agent.yml`: 216 lines
   - `opencode.yml`: 203 lines
   - `orchestrator.yml`: 200 lines

2. **Global concurrency bottleneck**: `concurrency.group: global` with `cancel-in-progress: false` serializes ALL push-triggered runs, even for unrelated changes.

3. **Redundant logic**: Multiple workflows set up identical Node/cache/environment configurations without using shared composite actions or reusable workflows.

### Files Affected

- `.github/workflows/on-push.yml`
- `.github/workflows/on-pull.yml`
- `.github/workflows/parallel.yml`
- `.github/workflows/architect-agent.yml`
- `.github/workflows/opencode.yml`
- `.github/workflows/orchestrator.yml`

### Recommendations

1. Consolidate to 2-3 workflows maximum
2. Extract shared setup into composite action or reusable workflow
3. Remove or scope `concurrency.group: global` to per-branch
4. Use `paths:` / `paths-ignore:` filtering for targeted triggers
