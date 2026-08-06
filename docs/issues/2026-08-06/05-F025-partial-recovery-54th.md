# F025 — Live Site Status (54th verification, 2026-08-06)

- **Category**: bug
- **Priority**: P1
- **Affected**: GitHub Pages deployment of `sulhimaskom/sekolah-pseo`

## Status this run: PARTIAL (probe-wise recovery vs 53rd "FULL OUTAGE")

8-path probe against `https://sulhimaskom.github.io/sekolah-pseo/` (2026-08-06 05:18 UTC):

| Path                 | HTTP | Note                           |
| -------------------- | ---- | ------------------------------ |
| `/`                  | 404  | **no homepage**                |
| `/index.html`        | 404  |                                |
| `/styles.css`        | 404  | no styles                      |
| `/404.html`          | 404  |                                |
| `/favicon.svg`       | 404  |                                |
| `/security.txt`      | 404  |                                |
| `/robots.txt`        | 200  | committed at repo root, served |
| `/sitemap-index.xml` | 200  | committed at repo root, served |

`https://sekolah-pseo.pages.dev/` → **000** (unreachable/connection failure).

## Root cause (verified via `gh api repos/sulhimaskom/sekolah-pseo/pages`)

- Pages config: `build_type: legacy`, `source: { branch: main, path: / }` — Pages
  serves the **repository root**, not the build output.
- The generated static site is written to **`dist/`** (gitignored, `npm run build` →
  `node scripts/build-pages.js && cp -r public/* dist/`).
- Repo root contains **no `index.html`** (`git ls-tree --name-only HEAD` confirms) —
  only `robots.txt` and `sitemap-index.xml` exist at root, which is why exactly those
  two paths return 200 while every generated asset 404s.
- Pages reports `status: built` with no error — the "build" is a no-op legacy build
  that serves the root directory as-is.

## Why the 53rd-run "FULL OUTAGE" classification was a probe-set artifact

53rd ran a 5-path probe and reported all-404. This run's 8-path probe shows the two
repo-root-committed files serve 200. The underlying deployment state is **unchanged
since the 52nd run** (root 404, robots/sitemap 200) — i.e. **PARTIAL**, not a new
regression.

## Impact

User-facing site is effectively down: no homepage, no school pages, no CSS, no
favicon, no 404 page. Search engines get `robots.txt` + a sitemap whose targets all
404 — harmful to SEO and unusable for visitors.

## Fix options (require permissions the loop token lacks — see F050)

1. **Recommended — GitHub Actions artifact deploy**: add a Pages workflow job using
   `actions/upload-pages-artifact` with `path: dist/` + `actions/deploy-pages`, set
   Pages source to "GitHub Actions". Requires `pages: write` + `id-token: write`
   (OIDC) on a workflow run with `contents: read` — the loop token (`GITHUB_TOKEN`
   from `on-pull.yml`, no `pages` scope) cannot create/run this itself.
2. **Alternative — publish branch**: commit `dist/` output to a `gh-pages` branch and
   point Pages at it. Same token constraint (requires pushing generated artifacts;
   workflow changes needed to automate it).

Per the fail-safe rule: **no guess-fix attempted** — the deployment is opaque to the
loop token and a misconfig could further damage the site. Recorded as P1 for a
maintainer with Pages admin access.

## Related findings

- F002: loop token lacks `issues:write` (issue output blocked)
- F050: loop token lacks `workflows:write`/`pages:write` (blocks deployment fix)
- F006: `SITE_URL` placeholder `https://example.com` in `.env.example`
