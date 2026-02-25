# Platform Engineering

This document captures platform engineering knowledge and improvements for the Sekolah PSEO project.

## Overview

The platform engineering domain focuses on:
- Infrastructure and build improvements
- Security vulnerability fixes
- Dependency management
- CI/CD optimization
- Repository health

## Completed Work

### 2026-02-25: Dependency Lock File Fix

**Issue**: Missing `prettier` entry in `package-lock.json`

**Problem**: Running `npm run lint` failed with "eslint not found" because:
- `package.json` declared `prettier` as devDependency
- `package-lock.json` was missing the `prettier` entry
- `node_modules` was not installed in the environment

**Solution**:
- Ran `npm install` to populate node_modules and update lock file
- Verified all dependencies are properly locked

**PR**: #105

**Verification**:
- `npm audit` reports 0 vulnerabilities
- `npm run lint` passes
- `npm test` passes (18/18 tests)
- CI checks pass

### 2026-02-25: Security Vulnerability Fixes

### 2026-02-25: Security Vulnerability Fixes

**Issue**: 2 security vulnerabilities in dependencies

**Vulnerabilities Fixed**:
- `ajv` < 6.14.0 - ReDoS when using $data option (GHSA-2g4f-4pwh-qvx6) - Moderate
- `minimatch` < 3.1.3 - ReDoS via repeated wildcards (GHSA-3ppc-4f35-3m26) - High

**Solution**: Updated package-lock.json to patched versions:
- ajv: 6.12.6 → 6.14.0
- minimatch: 3.1.2 → 3.1.4

**PR**: #95

**Verification**:
- `npm audit` reports 0 vulnerabilities
- `npm test` passes (18/18 tests)
- `npm run lint` passes
- CI checks pass

## Best Practices

### Dependency Management
1. Run `npm audit` regularly to detect vulnerabilities
2. Apply security fixes promptly (especially high severity)
3. Test after dependency updates to ensure nothing breaks

### CI/CD
1. Ensure all checks pass before merging
2. Keep workflows efficient and fast
3. Use proper labels for PR categorization

## Labels

- **platform-engineer**: For platform engineering improvements and infrastructure fixes
