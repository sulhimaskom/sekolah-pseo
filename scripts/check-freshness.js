/**
 * Data Freshness Check Script
 *
 * Checks the freshness of school data and generates a report.
 * Can be run locally or in CI/CD pipelines.
 *
 * Usage:
 *   node scripts/check-freshness.js
 *   node scripts/check-freshness.js --json  // JSON output
 *   node scripts/check-freshness.js --verbose  // Detailed output
 */

'use strict';

const fs = require('fs');
const { IntegrationError, ERROR_CODES } = require('./resilience');
const CONFIG = require('./config');
const logger = require('./logger');
const { parseCsv, terminate } = require('./utils');

const DEFAULT_MAX_AGE_DAYS = 7;

/**
 * Get the most recent update date from schools.csv
 * @returns {Object} { date: Date, daysAgo: number, recordCount: number }
 */
function getDataFreshness() {
  const schoolsPath = CONFIG.SCHOOLS_CSV_PATH;

  try {
    if (!fs.existsSync(schoolsPath)) {
      return {
        exists: false,
        date: null,
        daysAgo: null,
        recordCount: 0,
        isFresh: false,
      };
    }

    const content = fs.readFileSync(schoolsPath, 'utf-8');
    const schools = parseCsv(content);

    if (schools.length === 0) {
      return {
        exists: true,
        date: null,
        daysAgo: null,
        recordCount: 0,
        isFresh: false,
      };
    }

    const recordCount = schools.length;

    let mostRecentDate = null;
    for (let i = schools.length - 1; i >= 0; i--) {
      const updatedAt = (schools[i].updated_at || '').trim();
      if (updatedAt && updatedAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        mostRecentDate = new Date(updatedAt);
        break;
      }
    }

    if (!mostRecentDate || isNaN(mostRecentDate.getTime())) {
      return {
        exists: true,
        date: null,
        daysAgo: null,
        recordCount,
        isFresh: false,
      };
    }

    const now = new Date();
    const daysAgo = Math.floor((now - mostRecentDate) / (1000 * 60 * 60 * 24));

    return {
      exists: true,
      date: mostRecentDate.toISOString().split('T')[0],
      daysAgo,
      recordCount,
      isFresh: daysAgo <= DEFAULT_MAX_AGE_DAYS,
    };
  } catch (error) {
    if (error.name === 'IntegrationError') {
      throw error;
    }
    throw new IntegrationError(
      `Failed to check data freshness: ${error.message}`,
      ERROR_CODES.FILE_READ_ERROR,
      { originalError: error.message }
    );
  }
}

/**
 * Calculate data quality metrics
 * @returns {Object} Quality metrics
 */
function getDataQualityMetrics() {
  const schoolsPath = CONFIG.SCHOOLS_CSV_PATH;

  try {
    if (!fs.existsSync(schoolsPath)) {
      return null;
    }

    const content = fs.readFileSync(schoolsPath, 'utf-8');
    const schools = parseCsv(content);

    if (schools.length === 0) {
      return { totalRecords: 0, metrics: {} };
    }

    const totalRecords = schools.length;

    let withCoordinates = 0;
    let withAddress = 0;
    let withNpsn = 0;
    let withProvince = 0;

    for (const school of schools) {
      const npsn = (school.npsn || '').trim();
      const lat = (school.lat || '').trim();
      const lon = (school.lon || '').trim();
      const alamat = (school.alamat || '').trim();
      const province = (school.provinsi || '').trim();

      if (lat && lon) withCoordinates++;
      if (alamat) withAddress++;
      if (npsn && /^\d+$/.test(npsn)) withNpsn++;
      if (province) withProvince++;
    }

    return {
      totalRecords,
      metrics: {
        coordinates: {
          count: withCoordinates,
          percentage: ((withCoordinates / totalRecords) * 100).toFixed(2),
        },
        address: {
          count: withAddress,
          percentage: ((withAddress / totalRecords) * 100).toFixed(2),
        },
        npsn: {
          count: withNpsn,
          percentage: ((withNpsn / totalRecords) * 100).toFixed(2),
        },
        province: {
          count: withProvince,
          percentage: ((withProvince / totalRecords) * 100).toFixed(2),
        },
      },
    };
  } catch (error) {
    if (error.name === 'IntegrationError') {
      throw error;
    }
    throw new IntegrationError(
      `Failed to calculate data quality metrics: ${error.message}`,
      ERROR_CODES.FILE_READ_ERROR,
      { originalError: error.message }
    );
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');

  const freshness = getDataFreshness();
  const quality = getDataQualityMetrics();

  const result = {
    ...freshness,
    quality,
    maxAgeDays: DEFAULT_MAX_AGE_DAYS,
    checkedAt: new Date().toISOString(),
  };

  if (jsonOutput) {
    logger.info(JSON.stringify(result, null, 2));
    return;
  }

  // Human-readable output
  if (!freshness.exists) {
    terminate('No schools.csv found. Run ETL first.');
  }

  logger.info('=== Data Freshness Report ===');
  logger.info(`Last Update: ${freshness.date || 'unknown'} (${freshness.daysAgo} days ago)`);
  logger.info(`Record Count: ${freshness.recordCount}`);
  logger.info(`Status: ${freshness.isFresh ? '✅ FRESH' : '⚠️ STALE'}`);

  if (verbose && quality) {
    logger.info('\n=== Data Quality Metrics ===');
    logger.info(`Total Records: ${quality.totalRecords}`);
    logger.info(
      `With Coordinates: ${quality.metrics.coordinates.count} (${quality.metrics.coordinates.percentage}%)`
    );
    logger.info(
      `With Address: ${quality.metrics.address.count} (${quality.metrics.address.percentage}%)`
    );
    logger.info(`With NPSN: ${quality.metrics.npsn.count} (${quality.metrics.npsn.percentage}%)`);
    logger.info(
      `With Province: ${quality.metrics.province.count} (${quality.metrics.province.percentage}%)`
    );
  }

  if (!freshness.isFresh) {
    terminate(
      `Data is stale! Last update was ${freshness.daysAgo} days ago (threshold: ${DEFAULT_MAX_AGE_DAYS} days)`
    );
  }

  logger.info('\n✅ Data is fresh');
}

module.exports = {
  getDataFreshness,
  getDataQualityMetrics,
};

if (require.main === module) {
  main();
}
