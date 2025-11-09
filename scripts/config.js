/*
 * Shared configuration for the Indonesian School PSEO project
 */

const path = require('path');

// Define base directories
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const EXTERNAL_DIR = path.join(ROOT_DIR, 'external');

// Environment variables with defaults
const CONFIG = {
  // File paths
  RAW_DATA_PATH: process.env.RAW_DATA_PATH || path.join(EXTERNAL_DIR, 'raw.csv'),
  SCHOOLS_CSV_PATH: path.join(DATA_DIR, 'schools.csv'),
  DIST_DIR: DIST_DIR,
  
  // URLs
  SITE_URL: process.env.SITE_URL || 'https://example.com',
  
  // Concurrency limits
  BUILD_CONCURRENCY_LIMIT: Math.max(1, parseInt(process.env.BUILD_CONCURRENCY_LIMIT) || 100),
  VALIDATION_CONCURRENCY_LIMIT: Math.max(1, parseInt(process.env.VALIDATION_CONCURRENCY_LIMIT) || 50),
  
  // Directories
  ROOT_DIR: ROOT_DIR,
  DATA_DIR: DATA_DIR,
  EXTERNAL_DIR: EXTERNAL_DIR
};

module.exports = CONFIG;