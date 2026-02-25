/*
 * Build Manifest Module
 *
 * Tracks built files with content hashes for incremental build support.
 * Manifest format:
 * {
 *   version: 1,
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

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CONFIG = require('./config');
const { safeReadFile, safeWriteFile, safeAccess } = require('./fs-safe');

const MANIFEST_FILE = '.build-manifest.json';
const MANIFEST_VERSION = 1;

// Export functions for testing
module.exports = {
  loadManifest,
  saveManifest,
  computeSchoolHash,
  getChangedSchools,
  getUnchangedSchools,
  clearManifest,
  MANIFEST_FILE,
};

/**
 * Load the build manifest from disk.
 * @returns {Object|null} Manifest object or null if not exists
 */
async function loadManifest() {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  try {
    await safeAccess(manifestPath);
    const content = await safeReadFile(manifestPath);
    const manifest = JSON.parse(content);

    // Validate manifest version
    if (manifest.version !== MANIFEST_VERSION) {
      console.log(
        `Manifest version mismatch (${manifest.version} vs ${MANIFEST_VERSION}), starting fresh`
      );
      return null;
    }

    return manifest;
  } catch {
    // Manifest doesn't exist or is invalid - this is fine for first build
    return null;
  }
}

/**
 * Save the build manifest to disk.
 * @param {Object} manifest - Manifest object to save
 */
async function saveManifest(manifest) {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  try {
    await safeWriteFile(manifestPath, JSON.stringify(manifest, null, 2));
  } catch (error) {
    console.error(`Failed to save manifest: ${error.message}`);
    throw error;
  }
}

/**
 * Compute a hash for a school record based on its content.
 * Only uses fields that affect the generated page content.
 *
 * @param {Object} school - School record
 * @returns {string} MD5 hash of relevant fields
 */
function computeSchoolHash(school) {
  // Fields that affect the generated page content
  const relevantFields = [
    school.npsn,
    school.nama,
    school.bentuk_pendidikan,
    school.status,
    school.alamat,
    school.kelurahan,
    school.kecamatan,
    school.kab_kota,
    school.provinsi,
    school.lat,
    school.lon,
  ]
    .filter(Boolean)
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
 * Clear the build manifest (forces full rebuild).
 */
async function clearManifest() {
  const manifestPath = path.join(CONFIG.ROOT_DIR, MANIFEST_FILE);

  try {
    await safeAccess(manifestPath);
    fs.unlinkSync(manifestPath);
    console.log('Build manifest cleared');
  } catch {
    // File doesn't exist - that's fine
  }
}
