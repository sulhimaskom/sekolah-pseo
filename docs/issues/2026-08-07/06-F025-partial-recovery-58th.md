# F025 — Live site root 404: PARTIAL recovery (Pages built, root still 404)

- **Evaluation Date**: 2026-08-07
- **Category**: bug
- **Priority**: P1
- **Status**: **PARTIAL recovery (58th run)** — was REGRESSED/errored (57th), now
  Pages `built` @ `9d48a06` (00:47); user-facing root still 404
- **File affected**: GitHub Pages config (legacy source `main@/`); site written
  to gitignored `dist/`, no `index.html` at repo root

## Domain Score Table

| Domain                  | 57th | 58th | Criterion affected |
| ----------------------- | ---- | ---- | ------------------ |
| B. System Quality       | 72.0 | 72.0 | Stability          |
| D. Delivery & Evolution | 59.3 | 59.3 | Release & Rollback |

## Criteria-level breakdown

| Criterion              | W   | Score | Rationale                                              |
| ---------------------- | --- | ----- | ------------------------------------------------------ |
| B1. Stability          | 20  | 74    | +2: pipeline no longer errors (built @ 9d48a06)        |
| D2. Release & Rollback | 20  | 40    | +0 net: build no longer errors, but root still 404     |

## Observations

Live-site probe (5 paths, github.io, this run):

| Path                 | HTTP |
| -------------------- | ---- |
| `/`                  | 404  |
| `/index.html`        | 404  |
| `/styles.css`        | 404  |
| `/robots.txt`        | 200  |
| `/sitemap-index.xml` | 200  |

Pages API/builds:

| Build time (UTC)    | Status                            |
| ------------------- | --------------------------------- |
| 2026-08-07 00:47:22 | **built** @ commit `9d48a06`      |
| 2026-08-06 13:56:22 | errored — "Page build failed."    |
| 2026-08-06 08:39:23 | built                             |

## Evidence

- `gh api repos/sulhimaskom/sekolah-pseo/pages` → `{"source":{"branch":"main","path":"/"},"status":"built"}` (57th: `errored`).
- `gh api .../pages/builds` → latest build `built` @ commit `9d48a06`, created 00:46:58, updated 00:47:22.
- Live probe: root/index.html/styles.css still **404**.

## Impact / Risk

The deploy pipeline recovered (no more errored build), but the product-level
defect persists: GitHub Pages serves the repo root (`main@/`), while generated
HTML lives in gitignored `dist/` — so the homepage is never published. Site
root stays down; users reach only committed static files (robots, sitemap).

## Suggested resolution (not implemented — read-only audit; requires perms the loop token lacks — F050)

1. Switch Pages to Actions artifact deploy from `dist/` (`deploy-pages` +
   `pages: write`), OR
2. Publish `dist/` to a `gh-pages` branch.
3. Both require `workflows: write`/`pages: write` the loop token lacks (F050) —
   no guess-fix attempted (fail-safe rule).