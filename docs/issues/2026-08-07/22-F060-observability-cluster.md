# F060 — Observability cluster: pino arg-order bug, enrichment silent failures, unhandled-rejection blind spot

- **ID**: F060
- **Category**: bug (observability)
- **Priority**: P2
- **Status**: NEW (64th run, 2026-08-07) — arg-order bug **verified with pino 10**
- **Reported**: 2026-08-07

## Summary

Three observability defects that silently lose failure signal:

1. **pino arg-order bug — metrics silently dropped** (`scripts/validate-links.js:153`)
2. **Enrichment failures invisible** (`scripts/enrichment.js:216, 268-281`)
3. **No unhandled-rejection guard** (`scripts/interactive.js:345`, whole repo)

## 1. validate-links.js:153 — pino arg-order bug (verified)

- **Code**: `logger.info('Validation metrics:', {...})`
- **Verified with pino 10**: fields passed **after** the message string are
  dropped from output → `{"msg":"Validation metrics:"}` only. The metrics object
  is silently lost.
- **Fix**: pino requires the object as the **first** argument:
  `logger.info({ ...metrics }, 'Validation metrics:')`.

## 2. Enrichment failures invisible

- `enrichment.js:216` — Wikipedia enrichment failures logged at `logger.debug`
  → invisible at default `info` level.
- `enrichment.js:268-281` — `Promise.allSettled` rejection reasons dropped with
  **zero logging** in `enrichSchools()`.
- **Impact**: enrichment silently degrades; the graceful-degradation design
  (etl.js:427-429) means failures never surface to operators.

## 3. No unhandled-rejection guard

- `interactive.js:345` — `main()` invoked without `.catch`; no
  `process.on('unhandledRejection')` anywhere in scripts/src.
- **Impact**: async failures crash without diagnosis — the failure mode the
  resilience layer otherwise tries to prevent.

## Recommendation

- Fix the pino call order (one line).
- Bump enrichment failure logging to `warn` and log `allSettled` rejections.
- Add a global `unhandledRejection` handler (logger + exit code) in
  `scripts/logger.js` or a shared bootstrap.

## Related

- F033 (pino `--json` raw passthrough) — same logger module.
- F046 (error-handling cluster, partially resolved) — same domain.
