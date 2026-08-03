# F001 + F027 — RESOLVED (verified fixed in main, 36th run)

**Evaluation Date**: 2026-08-03 (36th run)
**Category**: bug / security
**Priority**: P1 / P2
**Status**: RESOLVED (verified fixed in `main` @ 880e02d..HEAD)
**Skills used**: targeted code-trace + runtime exit-code probe

## F001 — Floating promise in `fetch-data.js` `main()` (bug, P1) — RESOLVED

**Prior state (35th run)**: `scripts/fetch-data.js:353` called
`const csvPath = fetchFromGitHub(sourceRepo);` without `await`, so a Promise flowed
into `copyToRaw()` → `fs.copyFileSync` TypeError → `useCachedData()` fallback → every
`npm run fetch-data` used the cache.

**Verified fix (this run)**: `scripts/fetch-data.js:378` now reads
`const csvPath = await fetchFromGitHub(sourceRepo);` with an inline comment citing
F001 ("must be awaited, otherwise csvPath is a Promise and copyToRaw fails (F001)")
and a proper `try/catch` fallback plus `main().catch(...)` at the entry point.

## F027 — check-workflow-security.js `--json` exit code (security, P2) — RESOLVED

**Prior bug (35th run)**: `--json` branch wrote the payload via `console.log` but
fell through with **no** `process.exit`, so a CI consuming `--json` always saw exit 0.

**Verified fix (this run)**:
```
$ node scripts/check-workflow-security.js --json ; echo "exit=$?"
  (12 violations in payload: 2 CRITICAL + 10 HIGH)
exit=1                      # json mode now correctly FAILS
```
`scripts/check-workflow-security.js` JSON branch now reads
`process.exit(allViolations.length === 0 ? 0 : 1);` (with a `// F027` comment).

## Conclusion

Both findings are closed as fixed on `main`. Move both out of the open-findings
tracking ledger into resolved history. No further action required for F001 or F027.