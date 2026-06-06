---
name: CI Missing Build/Lint/Test Gate
about: on-push.yml runs 12 sequential AI flows without verifying code first
title: '[P1] CI: Add build/lint/test verification gate before AI agent pipeline in on-push.yml'
labels: ci, P1
assignees: ''
---

## Evaluation Date

2026-06-06

## Domain Score Table

**Domain**: Delivery & Evolution Readiness → CI/CD Health
**Score**: 65/100 (deduction of -35 for CI gaps)

## Criteria-Level Breakdown

### CI/CD Health (Weight: 20)

**Observations**:
The `on-push.yml` workflow (533 lines) has 12 sequential AI agent flows (00-11) with 120-minute timeout each, but **no build/lint/test verification steps**. Broken code is not detected until AI agents process it, potentially wasting up to 18 hours on broken builds.

```
jobs:
  analyze:
    steps:
      - name: 00 flow    # 120 min
      - name: 01 flow    # 120 min
      ...
      - name: 11 flow    # 120 min
      - name: on-push    # Only runs if no open issues
```

There is NO `npm ci`, `npm run build`, `npm run lint`, or `npm run test` before any AI flow.

**Evidence**:

- `.github/workflows/on-push.yml` — 12 sequential AI flows, no build step
- `.github/workflows/on-pull.yml` — 437 lines, no explicit build verification
- Compared to `parallel.yml` which does run `npm ci` before AI agents

**Impact / Risk**:

- High: If `main` branch has broken code (e.g., missing deps, syntax errors), all 12 AI agent flows fail after 90+ minutes each
- Up to 18 hours of wasted compute per push
- No feedback loop for contributors

**Score Rationale**:

- Base: 100
- Deduction: -15 for no build verification gate
- Deduction: -10 for 12 sequential flows without early termination
- Deduction: -10 for 533-line workflow complexity

## Evidence Per Criterion

- File: `.github/workflows/on-push.yml` (lines 74-170: 12 sequential AI flows, no build step)
- File: `.github/workflows/on-pull.yml` (437 lines, complex embedded prompt)
- File: `.github/workflows/parallel.yml` (has `npm ci` step — reference for fix)

## Recommendation

1. Add `npm ci` step before AI agent pipeline
2. Add `npm run build` and `npm run lint` verification
3. Add `npm test` gate that stops the pipeline on failure
4. Consider extracting reusable workflow steps to composite actions
