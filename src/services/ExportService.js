/**
 * @module ExportService
 * @description Service-layer module owning static artifact exports for the
 * build: writes the external stylesheet (styles.css) and copies the processed
 * school data CSV into the distributable output (dist/data/schools.csv).
 *
 * Extracted from BuildOrchestrator (see docs/blueprint.md ADR-0005 layer
 * separation) so that artifact export concerns stay isolated from the build
 * orchestration flow.
 *
 * Architectural role (per docs/blueprint.md):
 *   src/services/        ← Business logic (this module)
 *   src/presenters/      ← Presentation / template layer
 */

'use strict';

const path = require('path');
const { generateSchoolPageStyles } = require('../presenters/styles');
const logger = require('../../scripts/logger');
const CONFIG = require('../../scripts/config');
const { safeMkdir, safeWriteFile, safeReadFile } = require('../../scripts/fs-safe');

const distDir = CONFIG.DIST_DIR;

/**
 * Write the external styles.css file to disk.
 * CSS generation (pure presentation) lives in src/presenters/styles.js,
 * while file I/O belongs here alongside other file operations.
 *
 * @param {string} targetDir - Path to the dist directory
 * @returns {Promise<string>} Path to the written styles.css file
 */
async function writeExternalStylesFile(targetDir) {
  const css = generateSchoolPageStyles();
  const outputPath = path.join(targetDir, 'styles.css');
  await safeMkdir(targetDir);
  await safeWriteFile(outputPath, css);
  return outputPath;
}

/**
 * Export schools CSV to dist directory for user download.
 */
async function exportSchoolsCsv() {
  const csvPath = CONFIG.SCHOOLS_CSV_PATH;
  const distDataDir = path.join(distDir, 'data');
  await safeMkdir(distDataDir);
  const csvContent = await safeReadFile(csvPath);
  const outputPath = path.join(distDataDir, 'schools.csv');
  await safeWriteFile(outputPath, csvContent);
  logger.info(
    `Exported schools data (${(Buffer.byteLength(csvContent, 'utf-8') / 1024 / 1024).toFixed(1)} MB)`
  );
}

module.exports = {
  writeExternalStylesFile,
  exportSchoolsCsv,
};
