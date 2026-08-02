# F024 — Build pipeline omits sitemap generation; 404.html references missing sitemap-index.xml (re-verified 3rd)

**Evaluation Date**: 2026-08-02 (31st run)
**Category**: bug
**Priority**: P2
**Status**: OPEN — **RE-CONFIRMED (3rd consecutive)**

## Summary

`npm run build` generates school/province/home pages but never runs the sitemap generator.
`public/404.html` (copied verbatim to `dist/`) links `/sitemap-index.xml`, which does not
exist in `dist/` after a fresh build → broken link. Only running `npm run sitemap`
separately produces the file.

## Evidence (this run)

```
$ npm run build          # exit 0, 2 pages — no sitemap step in output
$ npm run validate-links
Found 2 broken links:
  dist/404.html -> /sitemap-index.xml  (and related path)
```

`grep -n sitemap scripts/build-pages.js src/services/BuildOrchestrator.js` → **0 hits**.
Build entrypoint `package.json: "build": "node scripts/build-pages.js && cp -r public/* dist/"`
has no sitemap step.

## Impact

404 pages on the deployed site point to a nonexistent sitemap; search engines may 404 on
`sitemap-index.xml`. Build output is incomplete relative to documented pipeline
(README "Alur Data" shows Sitemap Generator → dist/sitemap-index.xml as part of the flow).

## Suggested fix

1. Append `&& npm run sitemap` to the `build` script, OR
2. Invoke the sitemap generator inside `build-pages.js` after page generation, OR
3. Make 404.html reference sitemap only when present (conditional), and add a CI check
   (`validate-links` after build) as a gate.

## Affected

package.json (build script), scripts/build-pages.js, scripts/sitemap.js, public/404.html,
scripts/validate-links.js (the gate that catches it)

## Status tracking

- 29th run: NEW (1 broken link)
- 30th run: re-verified (1 broken link)
- **31st run: re-verified (2 broken links)**
