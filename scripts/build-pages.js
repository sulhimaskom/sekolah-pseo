/*
 * Static page generator — CLI entry point.
 *
 * All build pipeline logic lives in src/services/BuildOrchestrator.js
 * (the service-layer orchestrator). This module is a thin CLI entry point
 * that delegates to the orchestrator and re-exports its functions for
 * backward-compatible imports (tests and other scripts).
 *
 * Architecture per docs/blueprint.md:
 *   scripts/              ← Controller / CLI entry (this module)
 *   src/services/         ← Business logic (BuildOrchestrator)
 *   src/presenters/templates/ ← Presentation layer
 */

'use strict';

const { terminate } = require('./utils');
const buildOrchestrator = require('../src/services/BuildOrchestrator');

// Re-export all orchestrator functions for backward-compatible imports.
// Tests (build-pages.test.js) and other scripts import from this module.
const {
  build,
  buildIncremental,
  ensureDistDir,
  loadSchools,
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  preCreateProvinceDirectories,
  generateProvincePages,
  generateKabupatenPages,
  generateKecamatanPages,
  generateRobotsTxt,
  generateExternalStyles,
  writeExternalStylesFile,
  writeSearchDataFile,
  exportSchoolsCsv,
  createManifestFromSchools,
  computeSchoolHash,
} = buildOrchestrator;

module.exports = {
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  writeExternalStylesFile,
  ensureDistDir,
  loadSchools,
  generateExternalStyles,
  generateRobotsTxt,
  generateProvincePages,
  generateKabupatenPages,
  generateKecamatanPages,
  preCreateProvinceDirectories,
  writeSearchDataFile,
  exportSchoolsCsv,
  build,
  buildIncremental,
  computeSchoolHash,
  createManifestFromSchools,
};

// CLI entry point: when executed directly (not imported), run the build.
if (require.main === module) {
  build().catch(error => {
    terminate(`Build failed: ${error.message}`);
  });
}
