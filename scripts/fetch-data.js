/**
 * External Data Fetch Script
 *
 * Fetches the latest school data from external sources.
 * Currently supports:
 * - GitHub repository (daftar-sekolah-indonesia)
 *
 * Usage:
 *   node scripts/fetch-data.js
 *   node scripts/fetch-data.js --source github
 *   node scripts/fetch-data.js --output custom/path.csv
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const logger = require('./logger');
const { IntegrationError, ERROR_CODES } = require('./resilience');

// Default external data configuration
const DEFAULT_SOURCE_REPO = 'https://github.com/玩家们/daftar-sekolah-indonesia.git';
const DEFAULT_BRANCH = 'main';
const EXTERNAL_DATA_DIR = path.join(process.cwd(), 'external-data');

/**
 * Validates and sanitizes a Git repository URL to prevent command injection.
 * @param {string} url - The repository URL to validate
 * @returns {string} The sanitized URL
 * @throws {Error} If URL is invalid or not a safe Git repository URL
 */
function validateRepoUrl(url) {
  // Only allow http and https protocols
  const allowedProtocols = ['http:', 'https:'];

  try {
    const parsed = new URL(url);

    // Check protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new IntegrationError(
        `Invalid protocol: ${parsed.protocol}. Only http and https are allowed.`,
        ERROR_CODES.INVALID_URL,
        { protocol: parsed.protocol }
      );
    }

    // Ensure hostname is present
    if (!parsed.hostname) {
      throw new IntegrationError('URL must have a hostname.', ERROR_CODES.INVALID_URL, {
        reason: 'missing_hostname',
      });
    }

    // Reconstruct URL to ensure it's clean (removes any injected characters)
    const sanitizedUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;

    // Validate it ends with .git (common for git repos)
    if (!sanitizedUrl.endsWith('.git')) {
      throw new IntegrationError('Repository URL must end with .git', ERROR_CODES.INVALID_URL, {
        reason: 'missing_git_extension',
      });
    }

    return sanitizedUrl;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new IntegrationError('Invalid URL format.', ERROR_CODES.INVALID_URL, {
        reason: 'parse_error',
      });
    }
    throw error;
  }
}

/**
 * Validates a Git branch name to prevent command injection in execSync.
 * Only allows safe characters: alphanumeric, hyphens, underscores, dots, slashes.
 * @param {string} branchName - The branch name to validate
 * @returns {string} The validated branch name
 * @throws {IntegrationError} If branch name contains unsafe characters
 */
function validateBranchName(branchName) {
  // Git branch naming rules: allows alphanumeric, hyphen, underscore, dot, forward slash
  // Reject any branch name with shell metacharacters
  if (typeof branchName !== 'string' || branchName.length === 0) {
    throw new IntegrationError(
      'Branch name must be a non-empty string.',
      ERROR_CODES.VALIDATION_ERROR,
      {
        reason: 'Invalid branch name type or empty',
      }
    );
  }

  if (!/^[a-zA-Z0-9_\-.\\/]+$/.test(branchName)) {
    throw new IntegrationError(
      `Invalid branch name: "${branchName}". Branch names can only contain alphanumeric characters, hyphens, underscores, dots, and slashes.`,
      ERROR_CODES.VALIDATION_ERROR,
      { branchName }
    );
  }

  // Prevent path traversal / hidden directories
  if (branchName.startsWith('.') || branchName.includes('..')) {
    throw new IntegrationError(
      `Invalid branch name: "${branchName}". Branch names cannot start with a dot or contain double dots.`,
      ERROR_CODES.VALIDATION_ERROR,
      { branchName }
    );
  }

  return branchName;
}

/**
 * Clone or update the external data repository
 * @param {string} repoUrl - Git repository URL
 * @param {string} branch - Branch name
 * @returns {string|null} Path to CSV file or null if failed
 */
function fetchFromGitHub(repoUrl = DEFAULT_SOURCE_REPO, branch = DEFAULT_BRANCH) {
  // Validate and sanitize the repo URL to prevent command injection
  const safeRepoUrl = validateRepoUrl(repoUrl);
  // Validate branch name to prevent command injection in execSync
  const safeBranch = validateBranchName(branch);
  logger.info(`Fetching data from: ${safeRepoUrl}`);

  try {
    // Create external data directory if it doesn't exist
    if (!fs.existsSync(EXTERNAL_DATA_DIR)) {
      logger.info('Cloning external data repository...');
      execSync(`git clone --depth 1 ${safeRepoUrl} ${EXTERNAL_DATA_DIR}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } else {
      logger.info('Updating external data repository...');
      execSync('git fetch origin', { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' });
      execSync(`git checkout ${safeBranch}`, { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' });
    }

    // Find CSV files in the repository
    const csvFiles = findCsvFiles(EXTERNAL_DATA_DIR);

    if (csvFiles.length === 0) {
      logger.warn('No CSV files found in external data repository');
      return null;
    }

    // Use the first CSV file found (or look for specific naming)
    const preferredFiles = ['sekolah.csv', 'data.csv', 'schools.csv', 'daftarsekolah.csv'];
    let selectedFile = csvFiles[0];

    for (const preferred of preferredFiles) {
      const found = csvFiles.find(f => f.toLowerCase().includes(preferred.toLowerCase()));
      if (found) {
        selectedFile = found;
        break;
      }
    }

    logger.info(`Using external data file: ${path.basename(selectedFile)}`);
    return selectedFile;
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch external data');
    return null;
  }
}

/**
 * Recursively find all CSV files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of CSV file paths
 */
function findCsvFiles(dir) {
  const csvFiles = [];

  if (!fs.existsSync(dir)) {
    return csvFiles;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      csvFiles.push(...findCsvFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.csv')) {
      csvFiles.push(fullPath);
    }
  }

  return csvFiles;
}

/**
 * Copy external CSV to raw.csv location
 * @param {string} sourcePath - Source CSV file path
 * @param {string} destPath - Destination path
 * @returns {boolean} Success status
 */
function copyToRaw(sourcePath, destPath) {
  try {
    // Ensure directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);
    logger.info(`Copied ${sourcePath} to ${destPath}`);
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to copy file');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let outputPath = CONFIG.RAW_DATA_PATH;
  let sourceRepo = DEFAULT_SOURCE_REPO;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--source' && args[i + 1]) {
      sourceRepo = args[i + 1];
      i++;
    }
  }

  logger.info('=== External Data Fetch ===');

  const csvPath = fetchFromGitHub(sourceRepo);

  if (!csvPath) {
    logger.warn('Could not fetch external data. Manual intervention required.');
    process.exit(1);
  }

  const success = copyToRaw(csvPath, outputPath);

  if (!success) {
    logger.error('Failed to copy external data');
    process.exit(1);
  }

  logger.info('✅ External data fetched successfully');
  logger.info(`Raw data location: ${outputPath}`);
}

module.exports = {
  fetchFromGitHub,
  findCsvFiles,
  copyToRaw,
  validateRepoUrl,
  validateBranchName,
};

if (require.main === module) {
  main();
}
