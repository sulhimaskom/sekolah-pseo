# F061 — `.env` workflow is fiction: docs instruct a config path that no code reads

- **ID**: F061
- **Category**: config/env parity (DX)
- **Priority**: P2
- **Status**: NEW (64th run, 2026-08-07) — verified
- **Reported**: 2026-08-07

## Summary

`docs/setup.md:65` (`cp .env.example .env`) and `docs/setup.md:80-87` +
`docs/deployment.md:260-267` (configure vars in `.env`) instruct users to
configure the project through a `.env` file — **but no code ever loads it**.
There is **zero dotenv usage** in the repo: `package.json` dependencies are
`{ "pino": "^10.3.1" }` only, and no script reads `.env` (grep verified).

## Evidence

- `package.json` dependencies = `{ pino }` — no dotenv, no env-file loader.
- `grep -rn "dotenv" package.json scripts/ src/` → no matches.
- Docs that describe the workflow: `docs/setup.md:65, 80-87`;
  `docs/deployment.md:260-267`.
- Verified by FAIL-SAFE re-check this run (see run report step 6).

## Impact

- **The documented config workflow silently does nothing.** A user following
  setup.md will set vars in `.env`, see nothing break (because defaults are
  used), and never actually configure the tool. Config errors surface late,
  with no error message.
- Env vars ARE genuinely consumed (`SITE_URL`, `RAW_DATA_PATH`,
  `LOG_LEVEL`, `ENRICHMENT_ENABLED`, `BUILD_CONCURRENCY_LIMIT`,
  `VALIDATION_CONCURRENCY_LIMIT`, `MAX_URLS_PER_SITEMAP` from `.env.example`;
  plus undocumented `EXTERNAL_DATA_DIR` and 4× `PERF_*` from code) — but only
  via shell-exported environment, not `.env`.

## Secondary defect

`.env.example` is also missing 5 vars that code genuinely consumes and
`api.md` documents: `EXTERNAL_DATA_DIR` (fetch-data.js:39, api.md:4540) and
`PERF_MAX_BUILD_TIME_MS` / `PERF_MAX_MEMORY_BYTES` / `PERF_MIN_THROUGHPUT` /
`PERF_MAX_FAILED_PAGES` (build-performance.js:19-25, api.md:5179-5182).

## Recommendation (pick one)

1. **Add a dotenv loader** (small: `import 'dotenv/config'` in config.js) so
   the documented `.env` workflow actually works — aligns docs with behavior.
2. **Or change the docs** to say "export these env vars in your shell / CI
   secrets" and drop the `.env` instructions.

Option 1 is lower-friction for users and matches the docs' intent.

## Related

- F044 (config/env parity cluster, prior) — same domain.
- F012 (lint-staged engine mismatch) — config drift family.
