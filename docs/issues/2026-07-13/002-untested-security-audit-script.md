# Test: Security Validation Script Has No Test Coverage

**Category**: test | **Priority**: P2
**Evaluation Date**: 2026-07-13
**Audit Report**: docs/audit-report-2026-07-13.md

## Description

`scripts/check-workflow-security.js` (233 lines) is responsible for detecting security regressions in CI workflow files. It has **zero test coverage**.

This is the ONLY source file in the `scripts/` directory without corresponding tests. Every other source file has a matching `.test.js` file.

## Impact

- **Medium**: False negatives in the security checker could allow workflow security regressions to go undetected
- The checker already detected 10 violations, but without tests we cannot be confident it catches ALL violation types
- Untested regex and pattern-matching logic is prone to edge-case bugs
- This tool is referenced in SECURITY_AUDIT_NOTE.md as a regression prevention mechanism — its own reliability is unverified

## File Affected

- `scripts/check-workflow-security.js` (233 lines)

## Recommended Fix

Add unit tests covering:

1. Each rule correctly identifies violations in sample YAML content
2. Rules do NOT flag allowed overrides (on-pull.yml)
3. Edge cases: empty files, malformed YAML, missing permissions blocks
4. Integration test: run against actual workflow files in `.github/workflows/`
5. Test both `--json` and default output formats

## Example Test Structure

```javascript
const { execSync } = require('child_process');
const path = require('path');

// Test that each RULE detects its target pattern
test('ID_TOKEN_WRITE rule flags non-OIDC workflows', () => {
  // ...
});

// Test that on-pull.yml is NOT flagged
test('ACTIONS_WRITE_NON_MERGE allows on-pull.yml', () => {
  // ...
});
```

## Verification

```bash
# After adding tests:
npm run test:js | grep check-workflow-security
```
Expected: Test suite exists and passes for `check-workflow-security.js`.
