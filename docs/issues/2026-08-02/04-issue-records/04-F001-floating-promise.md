# ISSUE RECORD — F001: Floating promise in fetch-data.js main()

> **Status**: GitHub issue creation BLOCKED (403) — record persisted per repo convention.
> **Labels**: `bug`, `P1`
> **Evaluation date**: 2026-08-02
> **File affected**: `scripts/fetch-data.js` (line 338)

## Summary

`main()` at `fetch-data.js:319` is invoked synchronously at line 338 without `await`
(a floating promise). Errors inside the async chain can be swallowed or surface as
unhandled rejections depending on module load order — this interacts with the F014
parallel test-file race (F001 was observed to be order-dependent in prior runs).

## Evidence

- `scripts/fetch-data.js:319` — `function main() { ... }`
- `scripts/fetch-data.js:338` — `main();` (no `await`, no `.catch`)

## Suggested resolution

`main().catch(err => { logger.error({err}, 'fetch-data failed'); process.exitCode = 1; });`
and/or export a promise-returning `run()` the CLI entry point awaits.

## Domain impact

- A1 Correctness (82/100), A10 Determinism (70/100)
