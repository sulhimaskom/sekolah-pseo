# F052 — RESOLVED (52nd verification, 2026-08-05)

## Finding

**build-pages / enrichment tests race on shared repo paths under parallel load.**
Introduced in the 51st audit report (F052, P2, test category) when `build-pages.test.js`
and `enrichment.test.js` mutated real repo paths (`dist/`, `.build-manifest.json`,
`data/enrichment.json`) under Node 20's concurrent `node --test` execution.

## Fix

PR #578 (squash `f496a23`): isolate writes to per-process `os.tmpdir()`:

- `scripts/build-pages.test.js` — sets `CONFIG.ROOT_DIR`/`CONFIG.DIST_DIR` to a
  per-process `os.tmpdir()` path (`build-pages-test-root-${process.pid}`); per-test
  `mkdtemp` for `ensureDistDir` cases.
- `scripts/enrichment.test.js` — points enrichment data write to a temp path.

## Verification (this run)

- 3× concurrent `npm run test:js` (reproduces the original 5-failure scenario): each
  run → **1051 pass / 0 fail / 4 skip**.
- Post-test `git status`: **clean tree** — no `dist/`, `.build-manifest.json`, or
  `data/enrichment.json` residue.

## Category / Priority

- Category: test
- Priority: P2

## Resolution delta (composite +0.2 → 73.4, back to 50th-run baseline)

- A. Testability 69→70, A. Determinism 73→74
- B. Stability 73→74, D. CI/CD Health 52→53
