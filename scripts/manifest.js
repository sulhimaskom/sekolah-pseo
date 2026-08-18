/*
 * Build Manifest Module
 *
 * Tracks built files with content hashes for incremental build support.
 * Manifest format:
 * {
 *   version: 2,
 *   lastBuild: "ISO timestamp",
 *   schools: {
 *     "npsn": {
 *       "hash": "content hash",
 *       "builtAt": "ISO timestamp",
 *       "path": "relative path to built file"
 *     }
 *   }
 * }
 */

'use strict';

const path = require('path');
const crypto = require('crypto');
const CONFIG = require('../src/core/config');
const logger = require('../src/core/logger');
const { safeReadFile, safeUnlink, fastWriteFile } = require('../src/core/fs-safe');
const { IntegrationError, ERROR_CODES } = require('../src/core/resilience');
const { fileExists } = require('../src/core/utils');

const MANIFEST_FILE = '.build-manifest.json';

// Bumped to 2 in TASK-073: computeSchoolHash switched from filter(Boolean).join('|')
// to length-prefixed field serialization, so hashes from version-1 manifests are
// no longer comparable. The version gate in loadManifest() discards stale manifests,
// forcing one full rebuild after upgrade (safe, non-destructive, reversible).
const MANIFEST_VERSION = 2;

// Export functions for testing
module.exports = {
  loadManifest,
  saveManifest,
  computeSchoolHash,
  getChangedSchools,
  getUnchangedSchools,
  getOrphanedSchoolPaths,
  clearManifest,
  MANIFEST_FILE,
  MANIFEST_VERSION,
};

/**
 * Load the build manifest from disk.
 * @returns {Object|null} Manifest object or null if not exists
 */
async function loadManifest() {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  if (!(await fileExists(manifestPath))) {
    return null;
  }

  try {
    const content = await safeReadFile(manifestPath);
    const manifest = JSON.parse(content);

    if (manifest.version !== MANIFEST_VERSION) {
      logger.info(
        `Manifest version mismatch (${manifest.version} vs ${MANIFEST_VERSION}), starting fresh`
      );
      return null;
    }

    return manifest;
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError(
      `Failed to load manifest: ${error.message}`,
      ERROR_CODES.FILE_READ_ERROR,
      { manifestPath, originalError: error.message }
    );
  }
}

/**
 * Save the build manifest to disk.
 * @param {Object} manifest - Manifest object to save
 */
async function saveManifest(manifest) {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  try {
    // Compact JSON: manifest is consumed only by JSON.parse, never read by humans.
    // Skipping pretty-print reduces stringify CPU cost and file I/O at scale.
    // Uses fastWriteFile (no retry/timeout/circuit-breaker) since manifest
    // writes are local filesystem operations — same pattern as bulk school pages.
    await fastWriteFile(manifestPath, JSON.stringify(manifest));
  } catch (error) {
    logger.error({ err: error }, 'Failed to save manifest');
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError(
      `Failed to save manifest: ${error.message}`,
      ERROR_CODES.FILE_WRITE_ERROR,
      { manifestPath, originalError: error.message }
    );
  }
}

/**
 * Compute a hash for a school record based on its content.
 * Only uses fields that affect the generated page content.
 *
 * Fields are serialized with a length prefix ("<len>:<value>") joined by "|",
 * making every field boundary unambiguous even when a field is empty or contains
 * the delimiter. The previous filter(Boolean).join('|') produced identical hash
 * input for different records — e.g. {nama:'A', alamat:'B'} and {nama:'A',
 * kecamatan:'B'} both serialized to 'A|B' — which could silently skip rebuilding
 * a changed page and serve stale content.
 *
 * @param {Object} school - School record
 * @returns {string} MD5 hash of relevant fields
 */
function computeSchoolHash(school) {
  // Fields that affect the generated page content
  // NOTE: excluded field that doesn't affect output:
  //   - kelurahan: not displayed in school page template
  //   - lat/lon: included — rendered in comparisonData (school-page.js)
  const relevantFields = [
    school.npsn,
    school.nama,
    school.bentuk_pendidikan,
    school.status,
    school.alamat,
    school.kecamatan,
    school.kab_kota,
    school.provinsi,
    school.lat,
    school.lon,
  ]
    .map(field => {
      const value = String(field ?? '');
      return `${value.length}:${value}`;
    })
    .join('|');

  return crypto.createHash('md5').update(relevantFields).digest('hex');
}

/**
 * Get schools that have changed since last build.
 * @param {Array<Object>} schools - Current school records
 * @param {Object} manifest - Previous build manifest
 * @returns {Object} { changed: Array, unchanged: Array }
 */
function getChangedSchools(schools, manifest) {
  if (!manifest || !manifest.schools) {
    // No manifest - all schools are "changed"
    return { changed: schools, unchanged: [] };
  }

  const changed = [];
  const unchanged = [];

  for (const school of schools) {
    const npsn = school.npsn;
    const currentHash = computeSchoolHash(school);

    if (!manifest.schools[npsn]) {
      // New school - needs to be built
      changed.push(school);
    } else if (manifest.schools[npsn].hash !== currentHash) {
      // Hash changed - needs to be rebuilt
      changed.push(school);
    } else {
      // Unchanged - skip building
      unchanged.push(school);
    }
  }

  return { changed, unchanged };
}

/**
 * Get schools that haven't changed since last build.
 * @param {Array<Object>} schools - Current school records
 * @param {Object} manifest - Previous build manifest
 * @returns {Array<Object>} Unchanged schools
 */
function getUnchangedSchools(schools, manifest) {
  const { unchanged } = getChangedSchools(schools, manifest);
  return unchanged;
}

/**
 * Get school page paths recorded in the manifest that no current school produces.
 * F045: getChangedSchools() iterates only CURRENT schools, so pages for schools
 * removed from the CSV or whose path changed (provinsi/kab_kota/kecamatan/nama)
 * would otherwise stay in dist/ forever after incremental builds.
 *
 * @param {Object} manifest - Previous build manifest
 * @param {Set<string>} currentPaths - Set of relative paths for current schools
 * @returns {string[]} Orphaned relative paths to delete
 */
function getOrphanedSchoolPaths(manifest, currentPaths) {
  if (!manifest || !manifest.schools) {
    return [];
  }

  const current = currentPaths instanceof Set ? currentPaths : new Set(currentPaths);
  const orphaned = [];

  for (const npsn of Object.keys(manifest.schools)) {
    const { path: relPath } = manifest.schools[npsn];
    if (relPath && !current.has(relPath)) {
      orphaned.push(relPath);
    }
  }

  return orphaned;
}

/**
 * Clear the build manifest (forces full rebuild).
 */
async function clearManifest() {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  if (await fileExists(manifestPath)) {
    await safeUnlink(manifestPath);
    logger.info('Build manifest cleared');
  }
}
