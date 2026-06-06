---
name: Logging Inconsistency in data-quality.js
about: data-quality.js uses console.log instead of structured logger
title: "[P2] Chore: Migrate console.log to structured logger in data-quality.js"
labels: chore, P2
assignees: ''
---

## Evaluation Date
2026-06-06

## Domain Score Table
**Domain**: Code Quality → Consistency (Score: 80/100)
**Domain**: System Quality → Observability (Score: 78/100)

## Criteria-Level Breakdown

### Consistency (Weight: 5)
**Observations**:
`scripts/data-quality.js` uses `console.log` and `console.error` for output (11 calls) instead of the project's established structured logging via `pino` (`logger.js`).

All other modules consistently use the logger API from `scripts/logger.js` which provides:
- Structured JSON output
- Log levels (info, warn, error, debug)
- ISO timestamps
- Child loggers for module context

**Evidence**:
```bash
grep -c "console.log\|console.error" scripts/data-quality.js
# Result: 11
```

Lines using console.log/console.error (non-exhaustive):
- Line 369: `console.log(formatJson(report));`
- Line 371: `console.log(formatHuman(report));`
- Line 374: `console.log(\`  Fields analyzed: ${REQUIRED_FIELDS.length}\`);`
- Line 387: `console.error('\n  ❌ Quality thresholds FAILED:');`
- Line 395: `console.log('  ✅ All quality thresholds met.\n');`

**Impact / Risk**:
- Low: Functional correctness is not affected
- Low-Medium: Output format inconsistency — some output is structured JSON, some is plain text
- Medium: In CI, structured logs enable automated log parsing; console.log breaks this

**Score Rationale**:
- Deduction: -20 for inconsistency in logging approach (single module deviating from project standard)

## Evidence Per Criterion
- File: `scripts/data-quality.js` (lines 369-395)
- Reference: `scripts/logger.js` (correct pattern)

## Recommendation
Replace all `console.log`/`console.error` calls in `scripts/data-quality.js` with the equivalent `logger.info`/`logger.error` calls from `scripts/logger.js`.
