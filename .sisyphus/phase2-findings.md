# Phase 2 — Feature Hardening Findings (ULW Loop)

**Date**: 2026-06-06
**Source**: Phase 1 Diagnostic Scoring + Code Analysis

---

## Finding 1: Duplicated Build Setup in build-pages.js

**Severity**: Medium
**Domain**: Code Quality → Maintainability

**Description**:
`build()` and `buildIncremental()` in `scripts/build-pages.js` had ~40 lines of fully duplicated setup code (ensureDistDir, loadSchools, generate homepage, province pages, etc.). This creates a maintenance hazard when changes need to be applied to both functions.

**Fixed**: ✅ Extracted `prepareBuildEnvironment()` and `finalizeBuild()` helper functions. Both `build()` and `buildIncremental()` now share the same setup/teardown logic.

**Affected Files**:
- `scripts/build-pages.js` — reduced from 498 to 486 lines

**Verification**: All 729 tests pass, lint clean, build passes

---

## Finding 2: Missing 'use strict' in Source Modules

**Severity**: Low
**Domain**: Code Quality → Determinism & Predictability

**Description**:
14 source modules were missing `'use strict'` pragma. Without strict mode, JavaScript silently fails on common errors (accidental globals, non-writable property assignments, etc.).

**Fixed**: ✅ Added `'use strict'` to all non-test source modules:
- `scripts/build-pages.js`
- `scripts/check-freshness.js`
- `scripts/enrichment.js`
- `scripts/etl.js`
- `scripts/fetch-data.js`
- `scripts/fs-safe.js`
- `scripts/manifest.js`
- `scripts/rate-limiter.js`
- `scripts/sitemap.js`
- `scripts/slugify.js`
- `scripts/utils.js`
- `src/presenters/design-system.js`
- `src/presenters/styles.js`
- `src/services/PageBuilder.js`

**Verification**: All 729 tests pass, lint clean, build passes

---

## Finding 3: Corrupted .editorconfig (Merge Artifact)

**Severity**: Low
**Domain**: Code Quality → Consistency

**Description**:
Line 2 of `.editorconfig` was corrupted with a merge artifact:
```
 different editors# across and IDEs
```
instead of:
```
across different editors and IDEs
```

**Fixed**: ✅ Restored correct comment text.

---

## Finding 4: No Release Workflow or Version Tagging

**Severity**: High
**Domain**: Delivery & Evolution Readiness → Release & Rollback Safety
**Current Score**: 65/100

**Description**:
No release workflow in `.github/workflows/`. No version tags. `package.json` stuck at 1.0.0. No rollback procedure documented. Cannot trace code changes to deployments.

**Status**: 🟡 Not fixed (requires workflow permissions and release strategy decision)

---

## Finding 5: CI Workflow Missing Build Verification Gate

**Severity**: High
**Domain**: Delivery & Evolution Readiness → CI/CD Health

**Description**:
`on-push.yml` runs 12 sequential AI flows (90-min timeout each) without any build/lint/test verification. Broken code detected only after hours of AI agent processing.

**Status**: 🟡 Not fixed (requires workflow permissions)

---

## Finding 6: Logging Inconsistency in data-quality.js

**Severity**: Medium
**Domain**: System Quality → Observability

**Description**:
`scripts/data-quality.js` uses `console.log` (11 calls) instead of structured `logger.*` API.

**Status**: 🟡 Not fixed (cosmetic — Phase 2 prohibits cosmetic cleanup)

---

## Summary

| Finding                          | Severity | Status       |
| -------------------------------- | -------- | ------------ |
| build-pages.js duplication       | Medium   | ✅ Fixed     |
| Missing 'use strict' pragma      | Low      | ✅ Fixed     |
| Corrupted .editorconfig          | Low      | ✅ Fixed     |
| No release workflow              | High     | 🟡 Not fixed |
| CI missing build verification    | High     | 🟡 Not fixed |
| Logging inconsistency            | Medium   | 🟡 Not fixed |
