# F025 — REGRESSED: Live Site Full Outage (53rd verification, 2026-08-06)

## Finding

**The GitHub Pages site is now in FULL OUTAGE.** In the 52nd run (2026-08-05) F025 was PARTIAL:
`/` and `/index.html` returned 404 but `robots.txt` and `sitemap-index.xml` returned 200.
This run (2026-08-06) every probed path returns 404 — root, index.html, robots.txt,
sitemap-index.xml, favicon.svg, 404.html, security.txt, docs/README.md — across two
independent curl attempts (including after a 3s pause).

## Evidence (this run)

| Probe                                         | 52nd run | 53rd run |
| --------------------------------------------- | -------- | -------- |
| `https://sulhimaskom.github.io/sekolah-pseo/` | 404      | **404**  |
| `/index.html`                                 | 404      | **404**  |
| `/robots.txt`                                 | **200**  | **404**  |
| `/sitemap-index.xml`                          | **200**  | **404**  |
| `/favicon.svg`                                | —        | **404**  |
| `/404.html`                                   | —        | **404**  |
| `/security.txt`                               | —        | **404**  |
| `/docs/README.md`                             | —        | **404**  |

- `gh api .../pages` — `{"status":"built","build_type":"legacy","url":"https://sulhimaskom.github.io/sekolah-pseo/"}`,
  source = branch `main`, path `/`.
- `gh api .../pages/builds/latest` — build #1134781069 at `2026-08-06T00:00:27Z` from commit
  `8b66fce` (the 52nd run's docs commit), status `built`, `error.message: null`.
- Control: `https://octocat.github.io/` -> 200 (GitHub Pages infra is up).
- `raw.githubusercontent.com/sulhimaskom/sekolah-pseo/main/robots.txt` -> **200** and
  `.../sitemap-index.xml` -> **200** (source files intact at HEAD).
- `git ls-files` — `robots.txt` and `sitemap-index.xml` tracked at repo root; only tracked HTML
  is `public/404.html` (the static build outputs to gitignored `dist/` which is **empty** after a
  "successful" local build).

## Diagnosis

The Pages deployment artifact (or its serving layer) is broken/empty while the source files are
healthy at HEAD. Root cause is in the **deployment band** (Pages build config / publish source /
serving), not in repo contents: the source files that previously served at 200 still exist at HEAD,
and the Pages build reports `built` with no error. The `build_type=legacy` (branch main, path `/`)
means Pages serves the repo root — which contains no `index.html` (only `public/404.html`), so a
root/index 404 was pre-existing; but robots/sitemap regressing 200->404 indicates the published
artifact changed or the serving layer degraded.

## Status

- **Category**: bug
- **Priority**: P1 (production site unavailable end-to-end)
- **Action**: per FAIL-SAFE rule, **no guess-fix attempted** — the loop token lacks
  `workflows:write` (F050) and Pages publish permissions, and the deployment is opaque.
  Needs a human with repo admin/Pages access to inspect the Pages source setting (`main@/`),
  the latest build log, and the published artifact, then re-deploy.
- **Impact**: composite -1.0 (73.4 -> 72.4); D. Release & Rollback 50 -> 30.

## Suggested remediation (for human with admin access)

1. Open GitHub repo Settings -> Pages. Confirm source = "Deploy from a branch", branch `main`,
   folder `/`. Re-run the build ("Build and deployment" latest run).
2. If the site still 404s, check whether the Pages deployment publishes an empty artifact
   (build at 00:00:27Z from 8b66fce). A docs-only commit should not break serving; investigate
   whether a Jekyll build step now ignores `.nojekyll`-protected files or whether `404.html`
   handling changed.
3. Long-term: migrate to the `actions/deploy-pages` workflow (repo already has `public/` +
   `_headers` + `_redirects`) so the deployed artifact is the built `dist/` + `public/` output,
   which makes the deployment deterministic and testable in CI.
