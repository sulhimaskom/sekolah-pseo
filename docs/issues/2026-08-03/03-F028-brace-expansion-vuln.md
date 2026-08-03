# F028 — High-severity dependency: brace-expansion@5.0.8 (DoS) (NEW, 36th run)

**Evaluation Date**: 2026-08-03 (36th run)
**Category**: security
**Priority**: P2
**Status**: OPEN — NEW (first observed 36th run)
**Skills used**: `npm audit` + `npm audit fix --dry-run` (no lockfile mutation); dependency graph trace (`npm ls brace-expansion`)

## Summary

`npm audit` reports **1 high-severity vulnerability** in the production dependency
graph:

```
brace-expansion  4.0.0 - 5.0.8
Severity: high
brace-expansion: DoS via unbounded intermediate arrays, bypassing the
CVE-2026-14257 mitigation - https://github.com/advisories/GHSA-rgw5-rvv9-x895
node_modules/brace-expansion
```

Affected module: `brace-expansion@5.0.8`, reachable via the dev chain
`eslint@10.8.0 → minimatch@10.2.5 → brace-expansion@5.0.8`. Because `eslint`
is a `devDependency`, exposure is limited to **developer/CI tooling** (lint time),
not the served static site. This lowers the practical blast radius → rated **P2**
rather than P0/P1.

## Evidence (36th run)

- `npm audit` → `1 high severity vulnerability`.
- `npm ls brace-expansion` → `eslint@10.8.0 └─ minimatch@10.2.5 └─ brace-expansion@5.0.8`.
- `npm audit fix --dry-run` → `change brace-expansion 5.0.8 => 5.0.9` (single,
  compatible bump; proven fix).
- `node -e "console.log(require('brace-expansion/package.json').engines)"` for
  5.0.9 precondition → `{ node: '20 || >=22' }` — compatible with runtime v20.20.2.

## Root cause

`brace-expansion` versions 4.0.0–5.0.8 are vulnerable to a DoS via unbounded
intermediate arrays that bypasses the accepted CVE-2026-14257 mitigation. The npm
lockfile pins `brace-expansion` to `5.0.8` (confirmed in `package-lock.json`).

## Impact / Risk

- **DoS**: malformed glob patterns passed through brace expansion can cause unbounded
  memory/allocation when linting untrusted input during CI.
- Low runtime risk (dev-time only), but CI is part of the delivery pipeline
  (F007/F013 show CI is a reviewed surface), so a green-but-affected audit is a latent
  supply-chain hygiene issue.
- No test failure; no build failure.

## Recommended resolution

Run `npm audit fix` (bumps brace-expansion 5.0.8 → 5.0.9) or pin the compatible
version in `package-lock.json`. Verify `npx eslint` and `npm run test:js` still pass
after the bump, then add a regression note. This is a low-risk, non-breaking
dependency update — a candidate for the next ordinary dependency-maintenance PR.