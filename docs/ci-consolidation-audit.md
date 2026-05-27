# CI Workflow Consolidation Audit

> **Date:** 2026-05-27
> **Issues:** #133, #179, #299
> **Status:** Analysis complete, recommendations ready for implementation

## Executive Summary

The repository has 6 CI workflow files with significant functional overlap. This audit maps each workflow's triggers, responsibilities, and resource consumption, then proposes a consolidation plan to reduce complexity and CI runtime.

## Workflow Inventory

| # | File | Trigger | Scope | Lines | OpenCode Runs |
|---|------|---------|-------|-------|---------------|
| 1 | `on-push.yml` | Any push + dispatch | 13 sequential flows (00–12) | 533 | 13 |
| 2 | `parallel.yml` | Push to `main` + every 4h + dispatch | Architect → 13 parallel specialists | ~400 | 4 |
| 3 | `on-pull.yml` | PR + hourly + dispatch | Single OpenCode analysis | 437 | 1 |
| 4 | `opencode.yml` | PR events + reviews + comments + dispatch | PR handler agent | 408 (active) | 1 |
| 5 | `orchestrator.yml` | Daily schedule + dispatch | Daily repo health orchestration | ~200 | 1 |
| 6 | `architect-agent.yml` | Dispatch only | Architect analysis agent | ~200 | 1 |

## Overlap Analysis

### 1. HIGH: `on-push.yml` ↔ `parallel.yml`

**Evidence:**
- Both trigger on `push` events
- Both use the same 13 flow prompt files (`.github/workflows/prompt/00.md` through `12.md`)
- `on-push.yml` runs them **sequentially** (total worst-case: 13 × 30min = 6.5h)
- `parallel.yml` runs them **in parallel** via separate stage-2 jobs

**Impact:**
- Every push to a feature branch triggers `on-push.yml` → 6.5h sequential execution blocked on `concurrency: global`
- `parallel.yml` already covers `main` branch pushes with better parallelism
- Feature branch pushes don't need full OpenCode flow analysis

**Recommendation:**
- Restrict `on-push.yml` to `workflow_dispatch` only (remove `push` trigger)
- Feature branch CI should only run `npm test` (unit tests + lint), which takes ~4s
- The full OpenCode analysis on push is redundant with `parallel.yml`

### 2. MEDIUM: `orchestrator.yml` ↔ `architect-agent.yml`

**Evidence:**
- Both run OpenCode with comprehensive repo analysis prompts
- `orchestrator.yml` runs daily (scheduled) + dispatch
- `architect-agent.yml` is dispatch-only
- Their prompts cover overlapping concerns: issue management, code quality, architecture review

**Impact:**
- Duplicate maintenance burden for similar functionality
- Separate workflows means separate concurrency groups and resource pools

**Recommendation:**
- Merge `architect-agent.yml` into `orchestrator.yml` as a conditional job
- Use a workflow input flag: `include_architect_analysis` (default: false for schedule, true for dispatch)

### 3. MEDIUM: `on-pull.yml` ↔ `opencode.yml`

**Evidence:**
- Both trigger on `pull_request` events
- `on-pull.yml` runs a single OpenCode analysis (hourly + on PR)
- `opencode.yml` runs a PR handler agent with similar scope

**Impact:**
- Two workflows responding to the same event → double execution
- `on-pull.yml` runs hourly even when no PR activity exists

**Recommendation:**
- Remove `pull_request` trigger from `on-pull.yml` (keep hourly schedule + dispatch)
- Let `opencode.yml` be the sole PR handler

### 4. LOW: All workflows — Secret sprawl

**Evidence:**
- `on-push.yml` exposes 10+ secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`, etc.) to feature branch pushes
- `on-pull.yml` and `opencode.yml` expose a similar set
- Most OpenCode flows don't need cloud secrets for their analysis tasks

**Recommendation:**
- Scope secrets only to the workflows/jobs that actually use them
- Remove cloud infrastructure secrets from analysis-only workflows

## Proposed Consolidated Workflow Set

| # | Workflow | Trigger | What It Does |
|---|----------|---------|-------------|
| 1 | `ci.yml` | Push (any branch), PR | `npm test` + `npm run build` — fast unit-level CI |
| 2 | `parallel.yml` | Push to `main`, every 4h, dispatch | Full parallel OpenCode analysis (keep as-is) |
| 3 | `opencode.yml` | PR events + reviews + comments | PR handler (keep as-is) |
| 4 | `orchestrator.yml` | Daily schedule + dispatch | Daily repo health (absorb architect-agent) |
| — | `on-push.yml` | **Remove push trigger** → dispatch only | Deprecated — kept for manual fallback |
| — | `on-pull.yml` | **Remove pull_request trigger** → hourly + dispatch | Deprecated — kept for manual fallback |
| — | `architect-agent.yml` | **Merge into orchestrator.yml** | Removed as standalone file |

## Resource Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Unique workflow files | 6 | 4 | **−33%** |
| OpenCode runs per push | 14 (13 on-push + 1 parallel) | 4 (parallel only) | **−71%** |
| Secrets exposed to forks | 10+ (via on-push) | 0 | **−100%** |
| CI queue contention | global lock on on-push | removed | **Significant** |

## Migration Plan

1. **Phase 1** (safe, no functionality loss):
   - Remove `push` trigger from `on-push.yml` (keep `workflow_dispatch`)
   - Remove `pull_request` trigger from `on-pull.yml` (keep `schedule` + `workflow_dispatch`)

2. **Phase 2** (consolidation):
   - Copy `architect-agent.yml` prompt logic into `orchestrator.yml` as a conditional job
   - Delete `architect-agent.yml`

3. **Phase 3** (hardening):
   - Audit and minimize secret exposure per workflow
   - Add reusable workflow for shared OpenCode setup steps

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Feature branch loses OpenCode analysis | Low | Feature branch CI already runs `npm test`; full analysis happens on `main` via `parallel.yml` |
| Missed daily orchestration | Low | `orchestrator.yml` unchanged |
| PR handling gaps | Low | `opencode.yml` handles all PR events; `on-pull.yml` kept as fallback |
| Workflow permissions block changes | High (GITHUB_TOKEN) | Requires manual PR from maintainer with `workflows` permission |

## Appendix: Trigger Event Map

```
                    push (any)    push (main)    pull_request    schedule    dispatch
on-push.yml            ✅                           ❌             ❌          ✅
parallel.yml           ❌            ✅              ❌           ✅           ✅
on-pull.yml            ❌            ❌              ✅           ✅           ✅
opencode.yml           ❌            ❌              ✅           ❌           ✅
orchestrator.yml       ❌            ❌              ❌           ✅           ✅
architect-agent.yml    ❌            ❌              ❌           ❌           ✅
```

**Legend:** ✅ = active trigger, ❌ = not triggered

## Appendix: Secret Exposure per Workflow

| Workflow | # Secrets | Risk Level |
|----------|-----------|------------|
| `on-push.yml` | 10+ | 🔴 High — runs on any fork push |
| `parallel.yml` | 6 | 🟡 Medium — runs on main only |
| `on-pull.yml` | 4 | 🟡 Medium — runs on PR |
| `opencode.yml` | 2 | 🟢 Low |
| `orchestrator.yml` | 2 | 🟢 Low |
| `architect-agent.yml` | 2 | 🟢 Low |
