# F064 — Dependabot PR #547 (lint-staged 17.2.0→17.3.0) merged with a FAILED on-push CI run

- **ID**: F064
- **Category**: ci
- **Priority**: P2
- **Status**: NEW (65th run, 2026-08-07) — verified via run logs
- **Reported**: 2026-08-07

## Summary

Dependabot bumped `lint-staged` 17.2.0 → 17.3.0 (PR #547). The PR was
**merged**, but its on-push CI run (run 30800520364, branch
`dependabot/npm_and_yarn/lint-staged-17.3.0`) **FAILED after 4h30m**. The new
version declares `"engines": { "node": ">=22.22.1" }` while the environment
runs Node `v20.20.2` and every workflow pins `node-version: 20`. This is the
F012 engine-mismatch family now actively producing red CI on merged commits.

## Evidence

- `gh pr view 547` → state MERGED; `gh run view 30800520364 --json jobs`
  → job conclusion `failure` (4h30m1s).
- `package-lock.json` → `lint-staged@17.3.0` `engines.node = ">=22.22.1"`.
- `.nvmrc` = `22`; CI pins `node-version: 20` (on-pull.yml:53, parallel.yml).
- `npm install` reproduces: `npm warn EBADENGINE ... required: { node:
'>=22.22.1' } current: { node: 'v20.20.2' }`.
- F012 record: docs/issues/2026-07-31/012-lint-staged-engine-mismatch.md.

## Impact

- Merged dependency runs outside its declared engine contract in CI and
  locally — behavior not guaranteed, and this run demonstrates the bump
  degrades CI (4.5-hour failed run instead of minutes).
- `.nvmrc` (22), `package.json engines` (>=20.0.0), and CI pin (20) remain
  three-way inconsistent (F012), now with a concrete red-run consequence.

## Recommendation

1. Align upward (recommended): bump CI `node-version` to 22 in
   `on-pull.yml` + `parallel.yml`, update `package.json` `engines` to `>=22`,
   and keep `.nvmrc` = 22. This satisfies lint-staged 17.3.0's contract.
2. OR pin lint-staged back to 17.2.0 and add a Dependabot `ignore` for the
   engine-incompatible range until the Node bump lands.
3. Process: block Dependabot merges when the workflow run on the dependency
   branch fails (requires branch protection, not currently present).

## Related

- F012 (lint-staged engine mismatch) — root finding, this is its escalation.
- F065 (continue-on-error masks failures) — why the failed run did not block.
