# lint-staged@17.2.0 Requires Node >=22.22.1 but Project Declares >=20 and CI Pins Node 20

**Category**: chore
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/012-lint-staged-engine-mismatch.md

## Problem Statement

`lint-staged` was bumped to `17.2.0` (commit `6e99171 deps(deps-dev): Bump lint-staged from 17.1.0 to 17.2.0`) which declares `"engines": { "node": ">=22.22.1" }`. The project declares `"engines": { "node": ">=20.0.0" }` in `package.json`, CI pins `node-version: 20` in every workflow, and the runtime here is `v20.20.2`. Result:

- `npm install` emits `npm warn EBADENGINE` for `lint-staged@17.2.0`.
- `.husky/pre-commit` runs `npx lint-staged`, which executes `eslint --fix` + `prettier --write` on every commit. Under Node 20 the tool declares itself unsupported — behavior is not guaranteed (it currently prints its version correctly, but the engine contract is violated).
- Three-way version mismatch: `.nvmrc` = `22`, `package.json engines` = `>=20.0.0`, CI workflows = `20`.

## Reproduction

```bash
node --version        # v20.20.2
npm install           # npm warn EBADENGINE Unsupported engine { package: 'lint-staged@17.2.0', required: { node: '>=22.22.1' }, current: { node: 'v20.20.2' } }
npx lint-staged --version  # 17.2.0 (works today; unsupported contract)
```

## Impact

- Pre-commit hook quality gates run on an unsupported Node version; behavior can break silently after future patch releases.
- Developer machines on Node 20 (the declared minimum) get warnings on every install.
- CI and local dev environments diverge (`.nvmrc` says 22, CI uses 20, engines says >=20).

## Suggested Fix

1. **Prefer**: downgrade `lint-staged` to `17.1.0` (last version supporting Node 20), OR
2. **Align upward**: bump CI `node-version` to 22 in `.github/workflows/on-pull.yml` + `parallel.yml` and update `package.json engines` to `>=22`, OR
3. **Align downward**: pin `.nvmrc` and CI to Node 20 and keep `lint-staged@17.1.0`.

Pick exactly one — all three must agree afterward. Verify with `npm install` (no EBADENGINE) and a clean `npm run lint` + `npx lint-staged` on the target Node.

## Evidence

- `node_modules/lint-staged/package.json` → `"engines": {"node": ">=22.22.1"}`
- `package.json:49-51` → `"engines": { "node": ">=20.0.0" }`
- `.github/workflows/on-pull.yml:53` → `node-version: 20`
- `.github/workflows/parallel.yml:70,267,345,401` → `node-version: "20"`
- `.nvmrc` → `22`
- `npm install` log → `npm warn EBADENGINE Unsupported engine { package: 'lint-staged@17.2.0', ... }`
