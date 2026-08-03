# F021 — Orphaned Security Gate: `check-workflow-security.js` Not Tested/Not Wired

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: security
**Priority**: P2
**Status**: OPEN

## Summary
`scripts/check-workflow-security.js` (a bespoke CI workflow invariant scanner that flags
`DUPLICATE_API_KEY`, `id-token: write`, `actions: write`, `GH_TOKEN`, etc.) has:
- **no test** (no `check-workflow-security.test.js`)
- **no npm entry** (not exported as a script in package.json)
- **husky suppresses its failure**: `.husky/pre-commit` runs
  `node scripts/check-workflow-security.js 2>/dev/null || echo "skipped"`

## Evidence
```
node scripts/check-workflow-security.js -> ❌ Found 12 violation(s): 2 CRITICAL + 10 HIGH
.husky/pre-commit: node scripts/check-workflow-security.js 2>/dev/null || echo "⚠️  skipped..."
```
Because failures are swallowed, the gate is effectively inert — developers can commit the exact
violations the tool is meant to prevent. It reports 12 real violations right now (F013) and they
are not blocking anything.

## Impact
Security invariant enforcement is non-functional. Security regressions (privileged permissions,
duplicate API keys) can be committed silently.

## Suggested fix
- Add `"check-wf-security": "node scripts/check-workflow-security.js"` to package.json.
- Add a minimal unit test asserting it flags a known regression fixture.
- In `.husky/pre-commit`, remove the `|| echo skip` swallow so failures block the commit (or
  surface a non-zero exit).
- Fix the 12 reported violations (F013).

## Affected
`scripts/check-workflow-security.js`, `.husky/pre-commit`, `package.json`