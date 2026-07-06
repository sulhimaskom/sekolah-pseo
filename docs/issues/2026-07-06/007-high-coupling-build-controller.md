# Phase 2 - Hardening: High Coupling in build-pages.js Controller

**Category**: refactor | **Priority**: P2
**Evaluation Date**: 2026-07-06
**Phase**: Phase 2 (Feature Hardening & Integration)

## Description

`scripts/build-pages.js` acts as a monolithic controller with **16 internal dependencies**, directly importing from 13 project modules. This creates tight coupling that violates the controller-as-thin-orchestrator pattern documented in `docs/blueprint.md`.

### Current Dependencies

```
slugify, utils (parseCsv, processConcurrently, terminate), logger, config,
resilience, fs-safe, PageBuilder (src/), styles (src/), homepage templates,
manifest, build-performance, enrichment
```

### Impact

- **Reduced testability**: Testing build logic requires mocking 10+ dependencies
- **High blast radius**: Changes to any imported module can break the controller
- **SRP violation**: Handles data loading, orchestration, file I/O, manifest tracking, enrichment, performance tracking

### Evidence

- `scripts/build-pages.js`: 16 require() calls to project modules
- 536 lines handling 10+ distinct responsibilities
- No dedicated test isolation (test file tests the entire module as a unit)

### Recommendations

1. Extract a `BuildOrchestrator` service class to `src/services/` that encapsulates the build pipeline steps
2. Keep `build-pages.js` as a thin CLI entry point (< 50 lines) that only parses args, calls orchestrator, and handles exit codes
3. Extract data loading into a dedicated `SchoolDataLoader` service
4. Extract output writing into a dedicated `OutputWriter` service
