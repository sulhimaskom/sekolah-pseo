# F024 — Build pipeline omits sitemap generation; 404.html references missing sitemap-index.xml (re-verified 2nd)

**Evaluation Date**: 2026-08-02 (30th run)
**Category**: bug
**Priority**: P2
**Status**: OPEN — re-verified valid (2nd consecutive)

## Summary
`npm run build` (build-pages.js → BuildOrchestrator.js) does NOT generate
`dist/sitemap-index.xml` — sitemap generation is a separate `npm run sitemap` step. However:
- `public/404.html:32` hard-codes `<a href="/sitemap-index.xml">Lihat Peta Situs</a>`, which is
  copied verbatim into `dist/404.html` on every build.
- No CI workflow invokes `npm run sitemap` (grep of `.github/workflows/*.yml` → 0 hits;
  re-verified this run: on-push.yml=0, on-pull.yml=0, parallel.yml=0).

## Evidence (this run)
```
$ npm run build   # clean dist → 15 files
$ npm run validate-links
warn: Found 1 broken links:
  dist/404.html -> /sitemap-index.xml
$ npm run sitemap  # after this step, validate-links is clean
```

## Impact
- Any deployed dist from `npm run build` alone contains a broken link on the 404 page.
- Site crawlers and the validate-links gate flag the artifact; robots.txt advertises
  `Sitemap: …/sitemap-index.xml` which may not exist at deploy time.

## Suggested fix
- Invoke sitemap generation as part of the build pipeline (`build()` calls the sitemap step
  after pages are written), OR
- Wire `npm run sitemap` into the CI deploy workflow, OR
- Have 404.html reference the sitemap only when it exists (conditional render).

## Affected
public/404.html:32, scripts/build-pages.js, src/services/BuildOrchestrator.js,
.github/workflows/* (no sitemap step)
