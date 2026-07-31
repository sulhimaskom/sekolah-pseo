# Global + Unscoped Concurrency Groups Serialize CI

**Category**: ci
**Priority**: P1
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/003-ci-concurrency-groups.md

## Problem Statement

`on-push.yml` uses `concurrency.group: global` — a **repo-wide lock** that cancels/serializes every push-triggered run across all branches. `on-pull.yml` uses unscoped `group: oc-agent`, so PR runs from different branches collide. The 07-30 hardening log fixed both (→ `on-push-${{ github.ref }}`, `pull-${{ github.ref }}`) but the changes were never pushed.

## Evidence

```yaml
# .github/workflows/on-push.yml:10-12
concurrency:
  group: global # ← repo-wide serialization
  cancel-in-progress: false

# .github/workflows/on-pull.yml:16-17
concurrency:
  group: oc-agent # ← unscoped, collides across PRs
```

- `docs/issues/2026-07-30/01-phase2-hardening.md` — fix documented, never applied

## Impact

- All pushes queue behind each other (12 × up-to-90-min opencode steps each)
- PR workflows on different branches block each other
- Change velocity / blast radius severely throttled (Delivery criterion scored 72)

## Suggested Fix

```yaml
# on-push.yml
concurrency:
  group: on-push-${{ github.ref }}
# on-pull.yml
concurrency:
  group: pull-${{ github.ref }}
```

Push via a token with `workflows` permission (or `GH_TOKEN` PAT as orchestrator.yml uses).
