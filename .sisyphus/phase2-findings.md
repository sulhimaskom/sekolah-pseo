# Phase 2 — Feature Hardening Findings

**Date**: 2026-05-27
**Source**: Phase 1 Diagnostic Scoring

---

## Finding 1: CI Workflow Missing Build/Lint/Test Verification

**Severity**: High
**Domain**: Delivery & Evolution Readiness → CI/CD Health
**Current Score**: 70/100

**Description**: The `on-push.yml` workflow has 12 sequential AI agent flows (00-11) with 120-min timeout each, but no build/lint/test verification steps. Broken code is not detected until AI agents process it, causing 18-hour waste on broken builds.

**Affected File**: `.github/workflows/on-push.yml`

**Recommendation**: Add `npm ci`, `npm run build`, `npm run test`, and `npm run lint` steps before the AI agent pipeline (requires workflows permission).

---

## Finding 2: Stale Remote Branches

**Severity**: Medium
**Domain**: Delivery & Evolution Readiness → Technical Debt

**Description**: 30+ stale remote branches exist from automated agent runs, including `agent-*` branches, `fix/*` branches, and experimental branches. Some are >30 days old.

**Affected**: Remote branches

**Recommendation**: Clean up stale branches older than 30 days that are no longer active.

---

## Finding 3: Node Engine Compatibility Warning

**Severity**: Low
**Domain**: Code Quality → Consistency

**Description**: `lint-staged@17.0.5` requires Node >=22.22.1, but the project engine spec is `>=20.0.0`. Produces warnings on `npm install`.

**Affected File**: `package.json`

**Recommendation**: Either downgrade lint-staged to a version compatible with Node 20, or update the engine field.

---

## Finding 4: Coverage Gaps in Core Modules

**Severity**: Medium
**Domain**: Code Quality → Testability

**Description**: Several core modules have sub-80% coverage:
- `scripts/fetch-data.js`: 67.03% statements, 66.66% functions
- `scripts/etl.js`: 78.31% statements
- `scripts/check-freshness.js`: 78.57% statements

These modules handle external data fetching and ETL — the most critical data pipeline paths.

**Affected Files**: `scripts/fetch-data.js`, `scripts/etl.js`, `scripts/check-freshness.js`

**Recommendation**: Add test coverage for uncovered branches in these modules.

---

## Finding 5: Security Policy Contact

**Severity**: High (previously), Fixed
**Domain**: System Quality → Security Practices
**Current Score**: 65 → ~70 (after fix)

**Description**: SECURITY.md had a placeholder email address. Fixed in PR #377 by adding GitHub Private Vulnerability Reporting guidance.

**Status**: ✅ Fixed

---

## Finding 6: Duplicate Issues #179 and #299

**Severity**: Medium
**Domain**: Delivery & Evolution Readiness → CI/CD Health

**Description**: Issue #299 "Optimize GitHub workflow" is a semantic duplicate of #179 "Sequential workflow execution creates 6+ hour bottleneck." Both describe the same problem with the 12-step sequential CI pipeline.

**Recommendation**: Close #299 as a duplicate of #179 (requires issue triage permissions).

---

## Summary

| Finding | Severity | Status |
|---|---|---|
| CI workflow missing verification | High | Blocked (needs workflows permission) |
| Stale branches | Medium | Recommend cleanup |
| Engine compatibility | Low | Minor |
| Coverage gaps | Medium | Recommend tests |
| Security policy | High | ✅ Fixed |
| Duplicate issues | Medium | Awaiting issue triage |
