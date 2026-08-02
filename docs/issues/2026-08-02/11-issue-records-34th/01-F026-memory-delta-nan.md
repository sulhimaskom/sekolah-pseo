# F026 — Build performance report emits "Memory delta: NaN undefined" (NEW, 34th run)

**Evaluation Date**: 2026-08-02 (34th run)
**Category**: bug
**Priority**: P3
**Status**: OPEN — NEW (first observed 34th run)
**Skills used**: `obra-superpowers-systematic-debugging` (root-cause isolation via
unit-level reproduction of `formatBytes`)

## Summary

`npm run build` intermittently logs `Memory delta: NaN undefined` in the Build
Performance Report. Root cause: `BuildPerformanceTracker.formatBytes()` calls
`Math.log(bytes)` on a **negative** memory delta (heap used at end < heap used at start,
which happens after garbage collection). `Math.log(negative)` is `NaN`, so the formatted
string becomes `"NaN undefined"`.

## Evidence (34th run, fresh measurements)

Reproduction with a negative delta (simulating post-GC behavior):

```
$ node -e "const {BuildPerformanceTracker}=require('./scripts/build-performance.js');
  const t=new BuildPerformanceTracker();
  t.startMemory={heapUsed:5000000}; t.endMemory={heapUsed:3000000};
  console.log(t.generateReport().metrics.memoryDelta)"
NaN undefined
```

Live build log (first run of the session):

```
{"msg":"Peak RSS: 57.06 MB"}
{"msg":"Memory delta: NaN undefined"}      # negative delta after GC
```

Second (warm) run produced a valid value (`752.60 KB`) — confirming the intermittent
nature tied to heap pressure/GC timing.

Relevant code:

- `scripts/build-performance.js:186-192` — `formatBytes` has no negative-number guard
  before `Math.log`
- `scripts/build-performance.js:118-121` — `getMemoryDelta()` returns signed delta
- `scripts/build-performance.js:216` — `memoryDelta: this.formatBytes(this.getMemoryDelta())`

## Impact / Risk

- Low severity: log-only cosmetic bug in the performance report.
- Debuggability/observability degradation: the reported memory delta is unusable
  precisely when GC freed memory — the case a maintainer most wants to see.
- The build itself does not fail (budget checks use signed values, not the formatted
  string).

## Suggested fix

```js
formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(abs) / Math.log(1024));
  const val = abs / Math.pow(1024, i);
  return `${sign}${val.toFixed(2)} ${units[i]}`;
}
```

## File affected

- `scripts/build-performance.js` (lines 186-192)
- Suggest a unit test asserting negative-delta formatting.
