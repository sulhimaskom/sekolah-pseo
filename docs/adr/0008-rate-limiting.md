# ADR-0008: Implement Rate Limiting for Concurrent Operations

## Status

Accepted

## Date

2026-01-10

## Context

The project performs multiple concurrent operations:

- Page generation (100 concurrent operations)
- Link validation (50 concurrent requests)
- File system operations

Uncontrolled concurrency can cause:

- Resource exhaustion (memory, file handles, network connections)
- System instability under load
- No visibility into operation throughput

## Decision

Implement configurable rate limiting for all concurrent operations:

- Page generation: configurable limit via `BUILD_CONCURRENCY_LIMIT` (default: 100)
- Link validation: configurable limit via `VALIDATION_CONCURRENCY_LIMIT` (default: 50)
- Queue timeout: 30 seconds default
- Built-in metrics tracking (total, completed, failed, rejected, throughput, success rate)
- Backpressure handling when limit exceeded

## Consequences

### Positive

- Controlled concurrency prevents resource exhaustion
- Backpressure handling when system is under load
- Built-in metrics for monitoring and debugging
- Configurable limits for different environments
- Queue timeout prevents indefinite waiting

### Negative

- Additional complexity in concurrent code paths
- Need to tune limits for optimal performance

### Neutral

- Implemented in `scripts/rate-limiter.js`

## Status History

| Date       | Status   | Notes                                |
| ---------- | -------- | ------------------------------------ |
| 2026-01-10 | Accepted | Initial rate limiting implementation |
