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
const { terminate } = require('./utils');
const {
  IntegrationError,
  ERROR_CODES,
  retry,
  withTimeoutSync,
  CircuitBreaker,
  isTransientError,
} = require('./resilience');

// Default external data configuration
const DEFAULT_SOURCE_REPO = 'https://github.com/玩家们/daftar-sekolah-indonesia.git';
const DEFAULT_BRANCH = 'main';
const EXTERNAL_DATA_DIR = path.join(process.cwd(), 'external-data');

// Integration hardening - resilience thresholds for external operations
const GIT_OPERATION_TIMEOUT_MS = 120000; // 2 minutes for git clone/fetch
const GIT_RETRY_MAX_ATTEMPTS = 3;
const GIT_RETRY_INITIAL_DELAY_MS = 1000;
const GIT_CIRCUIT_BREAKER_THRESHOLD = 3;
const GIT_CIRCUIT_BREAKER_RESET_MS = 120000; // 2 min reset for external service

// Circuit breaker specifically for the external data source
const fetchCircuitBreaker = new CircuitBreaker({
  failureThreshold: GIT_CIRCUIT_BREAKER_THRESHOLD,
  resetTimeoutMs: GIT_CIRCUIT_BREAKER_RESET_MS,
});

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
 * Executes a git command synchronously with timeout protection.
 * Wraps execSync with withTimeoutSync to prevent hanging on external operations.
 * @param {string} command - Git command to execute
 * @param {Object} execOptions - Options for execSync (cwd, stdio, etc.)
 * @param {string} operationName - Human-readable name for the operation
 * @returns {Buffer|string} stdout from the command
 * @throws {IntegrationError} On timeout or execution failure
 */
function execGitCommand(command, execOptions, operationName) {
  return withTimeoutSync(
    timeoutOptions => execSync(command, { ...execOptions, ...timeoutOptions }),
    GIT_OPERATION_TIMEOUT_MS,
    operationName
  );
}

/**
 * Clone or update the external data repository, with timeout, retry, and circuit breaker.
 * Falls back to cached data if fetch fails after retries.
 * @param {string} repoUrl - Git repository URL
 * @param {string} branch - Branch name
 * @returns {string|null} Path to CSV file or null if no data source available
 * @throws {IntegrationError} If validation fails or circuit breaker is open
 */
function fetchFromGitHub(repoUrl = DEFAULT_SOURCE_REPO, branch = DEFAULT_BRANCH) {
  const safeRepoUrl = validateRepoUrl(repoUrl);
  const safeBranch = validateBranchName(branch);
  logger.info({ repo: safeRepoUrl, branch: safeBranch }, 'Fetching external data');

  return fetchCircuitBreaker.execute(() => {
    return retry(
      () => {
        const startTime = Date.now();

        try {
          if (!fs.existsSync(EXTERNAL_DATA_DIR)) {
            logger.info('Cloning external data repository...');
            execGitCommand(
              `git clone --depth 1 ${safeRepoUrl} ${EXTERNAL_DATA_DIR}`,
              { stdio: 'inherit', cwd: process.cwd() },
              `git clone ${safeRepoUrl}`
            );
          } else {
            logger.info('Updating external data repository...');
            execGitCommand(
              'git fetch origin',
              { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' },
              'git fetch origin'
            );
            execGitCommand(
              `git checkout ${safeBranch}`,
              { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' },
              `git checkout ${safeBranch}`
            );
          }

          const csvFiles = findCsvFiles(EXTERNAL_DATA_DIR);

          if (csvFiles.length === 0) {
            throw new IntegrationError(
              'No CSV files found in external data repository',
              ERROR_CODES.FETCH_ERROR,
              { repoUrl: safeRepoUrl, externalDataDir: EXTERNAL_DATA_DIR }
            );
          }

          const preferredFiles = ['sekolah.csv', 'data.csv', 'schools.csv', 'daftarsekolah.csv'];
          let selectedFile = csvFiles[0];

          for (const preferred of preferredFiles) {
            const found = csvFiles.find(f => f.toLowerCase().includes(preferred.toLowerCase()));
            if (found) {
              selectedFile = found;
              break;
            }
          }

          logger.info(
            { csvFile: path.basename(selectedFile), elapsedMs: Date.now() - startTime },
            'External data fetched successfully'
          );
          return selectedFile;
        } catch (error) {
          if (error instanceof IntegrationError) throw error;
          throw new IntegrationError(
            `Git operation failed: ${error.message}`,
            ERROR_CODES.EXTERNAL_SERVICE_ERROR,
            { repoUrl: safeRepoUrl, branch: safeBranch, originalError: error.message }
          );
        }
      },
      {
        maxAttempts: GIT_RETRY_MAX_ATTEMPTS,
        initialDelayMs: GIT_RETRY_INITIAL_DELAY_MS,
        shouldRetry: err =>
          isTransientError(err) || err.code === ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      }
    );
  }, 'fetchFromGitHub');
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
 * Attempts to use cached (previously fetched) data as fallback
 * when the external source is unavailable.
 * @param {string} destPath - Path where raw data should be written
 * @returns {boolean} Whether cached data was found and used
 */
function useCachedData(destPath) {
  if (fs.existsSync(destPath)) {
    logger.warn('Falling back to cached data at ' + destPath);
    return true;
  }
  // Also check if external-data dir has cached CSV files
  if (fs.existsSync(EXTERNAL_DATA_DIR)) {
    const csvFiles = findCsvFiles(EXTERNAL_DATA_DIR);
    if (csvFiles.length > 0) {
      const success = copyToRaw(csvFiles[0], destPath);
      if (success) {
        logger.warn('Falling back to cached external data');
        return true;
      }
    }
  }
  return false;
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

  try {
    const csvPath = fetchFromGitHub(sourceRepo);
    const success = copyToRaw(csvPath, outputPath);

    if (!success) {
      throw new IntegrationError(
        'Failed to copy external data to ' + outputPath,
        ERROR_CODES.FILE_WRITE_ERROR,
        { sourcePath: csvPath, destPath: outputPath }
      );
    }

    logger.info('External data fetched successfully');
    logger.info('Raw data location: ' + outputPath);
  } catch (error) {
    logger.error({ err: error }, 'External data fetch failed');

    if (useCachedData(outputPath)) {
      logger.warn('Using cached data as fallback. Build may use stale data.');
      return;
    }

    terminate(
      'Could not fetch external data and no cache available. Manual intervention required.'
    );
  }
}

module.exports = {
  fetchFromGitHub,
  findCsvFiles,
  copyToRaw,
  validateRepoUrl,
  validateBranchName,
  execGitCommand,
  useCachedData,
  fetchCircuitBreaker,
};

if (require.main === module) {
  main();
}
