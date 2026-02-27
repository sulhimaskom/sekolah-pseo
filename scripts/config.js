/**
 * @module config
 * @description Shared configuration for the Indonesian School PSEO project.
 * Provides centralized configuration values with environment variable support,
 * validation, and security utilities.
 */

const path = require('path');
const logger = require('./logger');

/**
 * Validates that a target path is within a base directory (prevents path traversal attacks).
 * @param {string} targetPath - The path to validate
 * @param {string} basePath - The base directory that the target must be within
 * @returns {boolean} True if target path is within base path, false otherwise
 */
function validatePath(targetPath, basePath) {
  const resolved = path.resolve(targetPath);
  const normalized = path.normalize(resolved);
  const baseNormalized = path.normalize(path.resolve(basePath));
  return normalized.startsWith(baseNormalized);
}

// Define base directories
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const EXTERNAL_DIR = path.join(ROOT_DIR, 'external');

// Validate RAW_DATA_PATH to prevent path traversal
let rawPath = process.env.RAW_DATA_PATH || path.join(EXTERNAL_DIR, 'raw.csv');
const resolvedRawPath = path.resolve(ROOT_DIR, rawPath);
if (!validatePath(resolvedRawPath, ROOT_DIR)) {
  logger.warn('RAW_DATA_PATH falls outside project directory, using default');
  rawPath = path.join(EXTERNAL_DIR, 'raw.csv');
}

// Environment variables with defaults
const CONFIG = {
  // File paths
  RAW_DATA_PATH: rawPath,
  SCHOOLS_CSV_PATH: path.join(DATA_DIR, 'schools.csv'),
  DIST_DIR: DIST_DIR,

  // URLs
  SITE_URL: process.env.SITE_URL || 'https://example.com',

  // Concurrency limits with validation
  BUILD_CONCURRENCY_LIMIT: Math.min(
    1000,
    Math.max(1, parseInt(process.env.BUILD_CONCURRENCY_LIMIT) || 100)
  ),
  VALIDATION_CONCURRENCY_LIMIT: Math.min(
    500,
    Math.max(1, parseInt(process.env.VALIDATION_CONCURRENCY_LIMIT) || 50)
  ),

  // Sitemap limits with validation
  MAX_URLS_PER_SITEMAP: Math.min(
    50000,
    Math.max(1, parseInt(process.env.MAX_URLS_PER_SITEMAP) || 50000)
  ),

  // Indonesia geographic bounds for coordinate validation
  INDONESIA_BOUNDS: {
    LAT_MIN: -11,
    LAT_MAX: 6,
    LON_MIN: 95,
    LON_MAX: 141,
  },

  // Rate limiter defaults
  RATE_LIMITER_DEFAULTS: {
    MAX_CONCURRENT: 100,
    RATE_LIMIT_MS: 10,
    QUEUE_TIMEOUT_MS: 30000,
  },

  // Circuit breaker defaults for file operations
  CIRCUIT_BREAKER_DEFAULTS: {
    FAILURE_THRESHOLD: 5,
    RESET_TIMEOUT_MS: 60000,
  },

  // Cache defaults
  CACHE_DEFAULTS: {
    MAX_CACHE_SIZE: 10000,
  },

  // File operation timeouts
  FILE_TIMEOUT_MS: 30000,

  // Directories
  ROOT_DIR: ROOT_DIR,
  DATA_DIR: DATA_DIR,
  EXTERNAL_DIR: EXTERNAL_DIR,

  // Security utilities
  validatePath,
};

module.exports = CONFIG;
