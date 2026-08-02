# F024 — Build pipeline omits sitemap generation; 404.html references missing sitemap-index.xml (re-verified 4th)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: bug
**Priority**: P2
**Status**: OPEN — RE-CONFIRMED (4th consecutive)
**Skills used**: `obra-superpowers-systematic-debugging` (clean-room measurement: build →
validate-links executed in sequence, dist/ freshly generated, no test interference)

## Summary

`npm run build` generates school/province/home pages but never runs the sitemap
generator. `public/404.html` (copied verbatim to `dist/`) links `/sitemap-index.xml`,
which does not exist after a fresh build → broken link. Only running `npm run sitemap`
separately produces the file.

## Evidence (33rd run, clean measurement)

```
$ npm run build            # exit 0, 2 pages, 0 failed — no sitemap step in output
$ npm run validate-links
{"msg":"Found 7 HTML files to validate"}
{"warn":"Found 2 broken links:"}   # dist/404.html -> /sitemap-index.xml (and related path)
```

`grep -n sitemap scripts/build-pages.js src/services/BuildOrchestrator.js` → 0 hits.
`package.json: "build": "node scripts/build-pages.js && cp -r public/* dist/"` has no
sitemap step. Note: the earlier 6-broken-link reading this run was an artifact of the
test suite having mutated `dist/` before validate-links ran — the clean sequence above
is the authoritative 2-broken-link result (both sitemap-related).

## Impact

404 pages on the deployed site point to a nonexistent sitemap; search engines may 404 on
`sitemap-index.xml`. Build output is incomplete relative to the documented pipeline
(README "Alur Data" shows Sitemap Generator → dist/sitemap-index.xml as part of the flow).

## Suggested fix

1. Append `&& npm run sitemap` to the `build` script, OR
2. Invoke the sitemap generator inside `build-pages.js` after page generation, OR
3. Make 404.html reference sitemap only when present, and add `validate-links` after build
   as a CI gate.

## Affected

package.json (build script), scripts/build-pages.js, scripts/sitemap.js, public/404.html,
scripts/validate-links.js (the gate that catches it).

## Status tracking

- 29th: NEW (1 broken link) · 30th: 1 · 31st: 2 · **33rd: 2 (4th re-confirmation)**
