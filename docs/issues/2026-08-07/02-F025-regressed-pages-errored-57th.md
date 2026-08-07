# F025 — Live site root 404: REGRESSED to errored Pages build

- **Evaluation Date**: 2026-08-07
- **Category**: bug
- **Priority**: P1
- **Status**: REGRESSED (57th run) — was PARTIAL (56th), now Pages build `errored`
- **File affected**: GitHub Pages config (source `main@/`, legacy build_type);
  generated site lives in `dist/` (gitignored), no `index.html` at repo root

## Domain Score Table (relevant)

| Domain                  | 56th | 57th | Criterion affected |
| ----------------------- | ---- | ---- | ------------------ |
| B. System Quality       | 72.8 | 72.0 | Stability          |
| D. Delivery & Evolution | 63.7 | 59.3 | Release & Rollback |

## Criteria-level breakdown

| Criterion              | Weight | Score | Rationale                                                       |
| ---------------------- | ------ | ----- | --------------------------------------------------------------- |
| B1. Stability          | 20     | 72    | −2: deploy pipeline now errors; user-facing site down at root   |
| D2. Release & Rollback | 20     | 35    | −5: F025 regression (errored build) on top of existing root-404 |

## Observations

Live-site probe (5 paths, github.io):

| Path                 | HTTP |
| -------------------- | ---- |
| `/`                  | 404  |
| `/index.html`        | 404  |
| `/styles.css`        | 404  |
| `/robots.txt`        | 200  |
| `/sitemap-index.xml` | 200  |

Pages API/builds history:

| Build time (UTC)    | Status                             |
| ------------------- | ---------------------------------- |
| 2026-08-06 13:56:22 | **errored** — "Page build failed." |
| 2026-08-06 08:39:23 | built                              |
| 2026-08-06 05:56:44 | built                              |

Deployment run 31108323103 (2026-08-06 13:56:23 → 14:06:55, 10m32s) concluded
`failure` with `##[error]Timeout reached, aborting!` and a `GITHUB_TOKEN
Permissions` error_count of 10.

## Evidence

- `gh api repos/sulhimaskom/sekolah-pseo/pages` → `{"build_type":"legacy","source":{"branch":"main","path":"/"},"status":"errored"}` (56th run: `status: "built"`).
- `gh api repos/.../pages/builds` → latest build `errored` 2026-08-06 13:56:22.
- `gh api repos/.../actions/runs/31108323103` → `conclusion: failure`.
- Root cause unchanged: legacy Pages serves the repo root (`main@/`), but the
  generated site is written to `dist/` (gitignored) — no `index.html` exists at
  the repo root, hence root 404.

## Impact / Risk

User-facing site remains DOWN at root (worse than 56th: the deploy pipeline now
also errors instead of merely serving the wrong root). robots.txt and
sitemap-index.xml serve only because they are committed at the repo root.

## Score Rationale

- **D2 −5 (40 → 35)**: previously "built but wrong source" (PARTIAL); now the
  build itself errors. Release & rollback safety is degraded — a failing deploy
  with no rollback path (0 tags, F011).
- **B1 −2**: deploy-pipeline instability adds to the F053 CI-cancellation
  deduction; combined CI surface deduction kept at −2 for B1.

## Suggested resolution (not implemented — read-only audit; requires perms the loop token lacks — F050)

1. Option (a): switch Pages to Actions-artifact deploy from `dist/`
   (`actions/deploy-pages` + `pages: write` permission).
2. Option (b): publish `dist/` to a `gh-pages` branch.
3. Both require `workflows: write` / `pages: write` which the loop token lacks
   (F050) — recorded, no guess-fix attempted (fail-safe rule).
