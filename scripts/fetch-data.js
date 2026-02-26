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

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const logger = require('./logger');

// Default external data configuration
const DEFAULT_SOURCE_REPO = 'https://github.com/玩家们/daftar-sekolah-indonesia.git';
const DEFAULT_BRANCH = 'main';
const EXTERNAL_DATA_DIR = path.join(process.cwd(), 'external-data');

/**
 * Clone or update the external data repository
 * @param {string} repoUrl - Git repository URL
 * @param {string} branch - Branch name
 * @returns {string|null} Path to CSV file or null if failed
 */
function fetchFromGitHub(repoUrl = DEFAULT_SOURCE_REPO, branch = DEFAULT_BRANCH) {
  logger.info(`Fetching data from: ${repoUrl}`);

  try {
    // Create external data directory if it doesn't exist
    if (!fs.existsSync(EXTERNAL_DATA_DIR)) {
      logger.info('Cloning external data repository...');
      execSync(`git clone --depth 1 ${repoUrl} ${EXTERNAL_DATA_DIR}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } else {
      logger.info('Updating external data repository...');
      execSync('git fetch origin', { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' });
      execSync(`git checkout ${branch}`, { cwd: EXTERNAL_DATA_DIR, stdio: 'inherit' });
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
    logger.error(`Failed to fetch external data: ${error.message}`);
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
    logger.error(`Failed to copy file: ${error.message}`);
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
};

if (require.main === module) {
  main();
}
