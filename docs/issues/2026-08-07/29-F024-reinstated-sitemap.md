# F024 (REINSTATED) — Build omits sitemap; dist contains no sitemap-index.xml

- **ID**: F024
- **Category**: bug
- **Priority**: P2
- **Status**: REINSTATEMENT (65th run, 2026-08-07) — re-verified present; was dropped from 64th matrix
- **Reported**: 2026-08-07 (originally tracked 2026-08-02, last RE-CONFIRMED 39th run)

## Summary

`npm run build` (`scripts/build-pages.js`) does **not** invoke the sitemap
generator. After a clean build, `dist/` contains **no** `sitemap-index.xml`
(verified this run). The 64th audit matrix dropped F024 without a resolution
record; the defect is unchanged.

## Evidence

- `npm run build` → exit 0, 6 HTML pages, then `ls dist/ | grep -i sitemap` → **no output**.
- `grep -n "sitemap" scripts/build-pages.js` → no sitemap step in the build.
- `sitemap` is a separate manual script (`npm run sitemap`) — never wired into build.
- Ledger check: F024 absent from 64th findings matrix; last explicit status
  "RE-CONFIRMED (no sitemap step in build)" (39th run, 2026-08-04).

## Impact

- SEO-critical artifact (`sitemap-index.xml`) is not produced by the standard
  build. A deploy from `npm run build` ships without the sitemap Google needs
  for indexing — silent SEO degradation on every deployment.

## Recommendation

1. Wire sitemap generation into `build-pages.js` (or add a post-build step in
   the deploy pipeline) so `dist/sitemap-index.xml` is produced on every build.
2. Add a build assertion: fail the build if `sitemap-index.xml` is missing
   from `dist/` (ties into the F065 "CI must actually verify" theme).
3. Restore F024 to the active findings matrix — do not drop without RESOLVED.

## Related

- F062 (blueprint.md:95 documents `sitemap.xml` output names that are wrong) — docs-drift cluster.
- F065 (silent CI) — build omission undetected by CI.
