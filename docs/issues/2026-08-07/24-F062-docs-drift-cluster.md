# F062 — Docs-drift cluster: setup/testing/deployment/README/blueprint all stale

- **ID**: F062
- **Category**: docs
- **Priority**: P3
- **Status**: NEW (64th run, 2026-08-07) — all items verified firsthand
- **Reported**: 2026-08-07

## Summary

Six independently-verified documentation inaccuracies (all checked against
actual files/commands this run):

## 1. setup.md:297 — broken command example (verified live)

- `npm run test:js -- --verbose` — `node --test` has no `--verbose` flag and
  treats it as a test-file path. Verified: running
  `node --test scripts/logger.test.js --verbose` → `Could not find '--verbose'`.
- Actual verbose output is achieved via `--test-reporter=spec` or similar.

## 2. testing.md:31 — wrong Python runner claim (verified)

- testing.md:31 says `npm run test:py` — "Runs the Python test suite (pytest
  runner)". Actual `tests/run_tests.py` is a **custom stdlib-only runner**
  (no pytest import); pytest is only used via the separate `test:py:pytest`
  script. Verified: 21 `suite.run_test()` calls in run_tests.py.
- Also: testing.md counts are stale — "1030 test cases" vs **1062** JS
  declarations measured; "Python: 27" vs **21** standalone calls; "Total 1057"
  is arithmetic of two stale numbers. Cross-doc contradiction with
  technical-writer.md:151 (875) and audit-report-2026-07-07:33 (902).

## 3. deployment.md:45 — wrong artifact filename (verified)

- Documents `dist/data/schools.json (symlink or copy)` — actual content is
  `dist/data/schools.csv` (338 bytes). No schools.json exists in dist/data.
- deployment.md:34-35 size claims (schools.json ~877 KB / gzip ~125 KB) are
  ~2000× the current state (417 B / 257 B).

## 4. deployment.md:178 — invalid vercel flag (verified)

- `vercel --prod --dist-dir=dist` — `--dist-dir` is not a valid `vercel`
  deploy flag; the directory is positional (`vercel --prod ./dist`).

## 5. README — wrong manifest filename + broken badge (verified)

- README (~line 96) documents build manifest as `manifest.json` — actual
  filename is `.build-manifest.json` (`scripts/manifest.js:29`).
- README badge line for opencode.yml has broken markdown: unclosed `]`
  (`](/actions/workflows/opencode.yml/badge.svg)` — missing `[`).

## 6. blueprint.md:95 — wrong sitemap output name (verified)

- Documents output `sitemap.xml` — actual outputs are `sitemap-index.xml` +
  `sitemap-001.xml` (`scripts/sitemap.js:126,175,187-188`).

## Also noted (minor)

- api.md:33-36 module tree omits `SearchDataService.js` + `ExportService.js`
  despite full sections existing later in the same file (api.md:2546, 2588).
- api.md:554-576 documents phantom `addNumbers()` (F017, already held) and
  omits the exported `processInBatches`.
- Orphaned root artifacts (`sitemap-index.xml`, `robots.txt`) contradict
  deployment.md's "everything lives in dist/" claims.

## Recommendation

Batch-fix all six in one docs PR: correct the setup.md example, fix the
testing.md runner claim + refresh counts, fix deployment.md artifact name/sizes
and vercel flag, fix README manifest name + badge, fix blueprint sitemap name.
All are mechanical. F005 (prettier drift on 62 files) will keep failing until
the whole docs tree is formatted.

## Related

- F017 (phantom `addNumbers` api.md:554) — same api.md staleness.
- F005 (prettier drift 62 files) — the formatting gate that blocks docs churn.
