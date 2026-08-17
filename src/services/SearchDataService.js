/**
 * @module SearchDataService
 * @description Service-layer module owning search-data artifact generation for
 * the static site build: serializes school records into the client-side search
 * payload (schools.json) and its gzip pre-compressed variant (schools.json.gz).
 *
 * Extracted from BuildOrchestrator (see docs/blueprint.md ADR-0005 layer
 * separation) so that changes to the search-data format or compression policy
 * stay isolated from the build orchestration flow.
 *
 * Architectural role (per docs/blueprint.md):
 *   src/services/        ← Business logic (this module)
 *   src/presenters/      ← Presentation / template layer
 */

'use strict';

const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { prepareSchoolDataForSearch } = require('./PageBuilder');
const logger = require('../core/logger');
const CONFIG = require('../core/config');
const { safeWriteFile } = require('../core/fs-safe');

const gzipAsync = promisify(zlib.gzip);
const distDir = CONFIG.DIST_DIR;

/**
 * Generate external search data file (schools.json) for lazy-loaded client-side search.
 * This separates the ~1.3MB JSON search data from the homepage HTML,
 * allowing the homepage to load as a lightweight ~14KB page.
 * The JS client fetches the JSON asynchronously after page load.
 *
 * @param {Array<Object>} schools
 */
async function writeSearchDataFile(schools) {
  const searchData = prepareSchoolDataForSearch(schools);
  const jsonContent = JSON.stringify(searchData);
  const outputPath = path.join(distDir, 'schools.json');
  await safeWriteFile(outputPath, jsonContent);

  // Pre-compress schools.json.gz for servers with gzip_static support.
  // This enables ~86% transfer size reduction without per-request compression overhead.
  // Uses level 6 (vs 9) for ~3x faster compression at <2% size penalty — the gzip
  // is served statically by nginx, so decompression speed is irrelevant at the edge.
  const gzipped = await gzipAsync(jsonContent, { level: 6 });
  const gzipPath = path.join(distDir, 'schools.json.gz');
  await safeWriteFile(gzipPath, gzipped);

  logger.info(
    `Generated schools.json (${(Buffer.byteLength(jsonContent, 'utf-8') / 1024).toFixed(0)} KB)` +
      `, gzip: ${(gzipped.length / 1024).toFixed(0)} KB`
  );
}

module.exports = {
  writeSearchDataFile,
};
