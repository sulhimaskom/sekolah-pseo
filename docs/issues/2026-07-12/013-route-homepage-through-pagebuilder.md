# Finding #013: Homepage Bypassed PageBuilder Service Layer

**Category**: refactor
**Priority**: P3
**Status**: ✅ Fixed

## Description
The `build-pages.js` controller imported `generateHomepageHtml` directly from `src/presenters/templates/homepage`, bypassing the PageBuilder service layer (`src/services/PageBuilder.js`). This violated the architectural boundary documented in `docs/blueprint.md`, which describes PageBuilder as the business logic layer between controllers and presenters.

All other page types (school pages, province pages) already went through PageBuilder.

## Fix Applied
- Added `buildHomepageData(schools)` to `src/services/PageBuilder.js` that wraps `generateHomepageHtml()`
- Updated `scripts/build-pages.js` to import `buildHomepageData` from PageBuilder instead of importing the template directly
- Removed `const { generateHomepageHtml } = require('../src/presenters/templates/homepage')` from the controller

## Impact
- Controllers no longer need to know about template directory structure
- PageBuilder is now the single entry point for ALL page types
- Reduced coupling between controllers and presentation layer
