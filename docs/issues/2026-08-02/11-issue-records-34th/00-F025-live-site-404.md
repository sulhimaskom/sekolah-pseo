# F025 — GitHub Pages deployment is green but live site returns 404 at root (NEW, 34th run)

**Evaluation Date**: 2026-08-02 (34th run)
**Category**: bug
**Priority**: P1
**Status**: OPEN — NEW (first observed 34th run)
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven verification:
deployment-green vs site-content cross-check); `librarian`-adjacent live probes via `gh
api` + `curl` (no external docs required)

## Summary

GitHub Pages is configured (source: `main`, path `/`), the `pages build and deployment`
workflow shows **31/31 successful runs**, yet `https://sulhimaskom.github.io/sekolah-pseo/`
returns **HTTP 404** on the root path. Root cause: the generated `dist/` directory
(containing `index.html`) is **gitignored and never committed** — the Pages deployment
publishes an empty artifact. Only `public/404.html` and static assets exist in the
committed tree.

## Evidence (34th run, fresh probes)

```
$ gh api repos/sulhimaskom/sekolah-pseo/pages --jq '{url, status, source}'
{"cname":null,"source":{"branch":"main","path":"/"},"status":"built",
 "url":"https://sulhimaskom.github.io/sekolah-pseo/"}

$ curl -s -o /dev/null -w "%{http_code}" https://sulhimaskom.github.io/sekolah-pseo/
404                                          # root path — NO index.html served

$ curl -s -o /dev/null -w "%{http_code}" https://sulhimaskom.github.io/sekolah-pseo/robots.txt
200                                          # committed file IS served
```

```
$ git ls-files | grep -c "index.html"
0                                             # index.html never committed

$ git ls-files | grep -E "\.html$"
public/404.html                               # only 404 page in the tree
```

`dist/` is gitignored (`.gitignore:10,236`). No workflow job builds `dist/` and commits
it; the Pages source points at branch `main` path `/`, which contains no `index.html`.

## Impact / Risk

- **Functional**: the product is unreachable at its published URL. Any link, search
  engine crawler, or direct visitor gets a 404.
- **Discovery**: silent — Pages reports "built" and the workflow shows green, so the
  breakage is invisible to CI monitoring.
- **Security-adjacent**: `public/security.txt` and robots are served, giving an
  impression of a live site while the content is absent.

## Suggested fix (options)

1. Add a build+deploy job that runs `npm run build` and publishes `dist/` (e.g. via
   `actions/upload-pages-artifact` + `actions/deploy-pages`, or commit `dist/`).
2. Or set Pages source to a `gh-pages` branch produced by a build job.
3. Minimum viable: document that the site is intentionally not deployed until a release
   pipeline exists (F011), and add a monitoring check (e.g. scheduled curl asserting
   HTTP 200 on the root path).

## File affected

- `.gitignore` (`dist/` entry) — deployment-relevant
- `.github/workflows/` (no Pages deploy job) — missing artifact pipeline
- `docs/deployment.md` — documents manual `dist/` output, no CI publish step
