# F001 — Floating promise in fetch-data.js `main()` — CLI always falls back to cache (RE-CONFIRMED, impact upgraded)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: bug
**Priority**: P1
**Status**: OPEN — RE-CONFIRMED with live reproduction; impact upgraded to functional breakage
**Skills used**: `obra-superpowers-systematic-debugging` (trace the promise chain:
`main()` → `fetchFromGitHub()` → `fetchCircuitBreaker.execute()` (async) → `retry()` (async);
live probe confirmed return type)

## Summary

`fetchFromGitHub` (scripts/fetch-data.js:178) returns the result of
`fetchCircuitBreaker.execute(...)`, which is declared `async` (resilience.js:289) and
therefore **always returns a Promise**. `main()` (fetch-data.js:334) calls it
synchronously:

```js
const csvPath = fetchFromGitHub(sourceRepo); // <- Promise, not a path string
const success = copyToRaw(csvPath, outputPath); // fs.copyFileSync(Promise, ...) -> TypeError
```

The Promise is never awaited and never has a `.catch()`, and `copyToRaw` receives a
`Promise` object as `sourcePath`.

## Evidence (33rd run, live probe)

```
$ node -e "const { fetchFromGitHub } = require('./scripts/fetch-data.js');
           const r = fetchFromGitHub('https://github.com/foo/bar.git');
           console.log(typeof r?.then === 'function' ? 'PROMISE (floating)' : typeof r);"
fetchFromGitHub returns: PROMISE (floating)
```

`copyToRaw` (fetch-data.js:289–304) calls `fs.copyFileSync(sourcePath, destPath)` with the
Promise object → `TypeError: The argument 'src' must be of type string or an instance of
Buffer or URL. Received an instance of Promise`. The `try/catch` in `main()` catches this,
then unconditionally attempts `useCachedData(outputPath)` — so **`npm run fetch-data`
silently uses the cache even when the network fetch succeeds**, and when the fetch fails
the floating rejection is unhandled.

## Impact

- `npm run fetch-data` cannot load fresh external data; it always reports "Using cached
  data as fallback". Directly feeds F018 (data stale 13 days, 2 records).
- Unhandled promise rejection on network failure → `unhandledRejection` crash (Node ≥15
  default) or silent partial execution.
- Underestimating this finding in runs 24–31 allowed the CLI breakage to persist.

## Suggested fix (minimal, atomic)

1. Make `main()` `async` and `await` the result:
   ```js
   async function main() {
     ...
     const csvPath = await fetchFromGitHub(sourceRepo);
     const success = copyToRaw(csvPath, outputPath);
     ...
   }
   // call site: main().catch((e) => { logger.error({ err: e }, 'fetch-data failed'); process.exitCode = 1; });
   ```
2. Add a regression test: stub `fetchFromGitHub` returning a rejected promise and assert
   the process exits non-zero with a logged error (no unhandled rejection).

## Affected

scripts/fetch-data.js (main(), :334–378; call site :392–393), scripts/fetch-data.test.js
(regression test).

## Status tracking

- 24th–31st runs: RE-VERIFIED via code inspection (main() sync, no await/.catch)
- **33rd run: RE-CONFIRMED via live probe — `fetchFromGitHub` returns a floating Promise;
  impact upgraded: CLI fetch path is functionally broken (cache fallback always used)**
