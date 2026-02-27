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

const fs = require('fs');
const { IntegrationError, ERROR_CODES } = require('./resilience');
const CONFIG = require('./config');
const logger = require('./logger');



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
    const lines = content.trim().split('\n');

    if (lines.length <= 1) {
      return {
        exists: true,
        date: null,
        daysAgo: null,
        recordCount: 0,
        isFresh: false,
      };
    }

    // Skip header, find the most recent updated_at (last column)
    const dataLines = lines.slice(1);
    const recordCount = dataLines.length;

    // Get the last updated_at value (most recent)
    let mostRecentDate = null;
    for (let i = dataLines.length - 1; i >= 0; i--) {
      const fields = dataLines[i].split(',');
      const updatedAt = fields[fields.length - 1]?.trim();
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
    const lines = content.trim().split('\n');

    if (lines.length <= 1) {
      return { totalRecords: 0, metrics: {} };
    }

    const dataLines = lines.slice(1);
    const totalRecords = dataLines.length;

    let withCoordinates = 0;
    let withAddress = 0;
    let withNpsn = 0;
    let withProvince = 0;

    for (const line of dataLines) {
      const fields = line.split(',');
      if (fields.length >= 12) {
        const [, , , , alamat, , , , , lat, lon] = fields;
        const npsn = fields[0]?.trim();
        const province = fields[9]?.trim();

        if (lat && lon) withCoordinates++;
        if (alamat && alamat.trim()) withAddress++;
        if (npsn && npsn.match(/^\d+$/)) withNpsn++;
        if (province) withProvince++;
      }
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
    logger.warn('No schools.csv found. Run ETL first.');
    process.exit(1);
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
    logger.warn(
      `\n⚠️ Data is stale! Last update was ${freshness.daysAgo} days ago (threshold: ${DEFAULT_MAX_AGE_DAYS} days)`
    );
    process.exit(1);
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
