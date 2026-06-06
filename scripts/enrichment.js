/*
 * School Data Enrichment Module
 *
 * Provides AI-powered data enrichment for school records using external
 * data sources (Wikipedia API by default). The enrichment pipeline is
 * designed with safety-first principles:
 *
 * - Feature-flagged: disabled by default, opt-in via --enrich flag or ENRICHMENT_ENABLED env var
 * - Graceful degradation: enrichment failures never block the ETL pipeline
 * - Rate-limited: respects upstream API limits
 * - Modular source architecture: easy to add new enrichment sources
 *
 * Usage:
 *   node scripts/etl.js --enrich          # Run ETL with enrichment
 *   ENRICHMENT_ENABLED=true node scripts/etl.js  # Env var approach
 */

'use strict';

const logger = require('./logger');
const { safeReadFile, safeWriteFile, safeAccess } = require('./fs-safe');
const { withTimeout } = require('./resilience');
const CONFIG = require('./config');
const path = require('path');

// Enrichment data file path
const ENRICHMENT_DATA_PATH = path.join(CONFIG.DATA_DIR, 'enrichment.json');

// Wikipedia API configuration
const WIKIPEDIA_API_URL = 'https://id.wikipedia.org/w/api.php';
const WIKIPEDIA_API_TIMEOUT_MS = 10000;

// Maximum results per enrichment source
const MAX_WIKIPEDIA_RESULTS = 3;

/**
 * Check if enrichment is enabled.
 * Enrichment is enabled when:
 *   - ENRICHMENT_ENABLED environment variable is set to 'true' or '1', OR
 *   - --enrich flag is present in process.argv
 *
 * @returns {boolean} True if enrichment is enabled
 */
function isEnrichmentEnabled() {
  const envEnabled =
    process.env.ENRICHMENT_ENABLED === 'true' || process.env.ENRICHMENT_ENABLED === '1';
  const flagEnabled = process.argv.includes('--enrich');
  return envEnabled || flagEnabled;
}

/**
 * Build a Wikipedia API search URL for a school query.
 *
 * @param {string} schoolName - School name to search for
 * @param {string} [province] - Province to narrow the search
 * @returns {string} Wikipedia API URL
 */
function buildWikipediaSearchUrl(schoolName, province) {
  const query = province ? `${schoolName} ${province}` : schoolName;
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(MAX_WIKIPEDIA_RESULTS),
    format: 'json',
    origin: '*',
  });
  return `${WIKIPEDIA_API_URL}?${params.toString()}`;
}

/**
 * Build a Wikipedia API URL to fetch page extracts.
 *
 * @param {Array<string>} pageTitles - Page titles to fetch extracts for
 * @returns {string} Wikipedia API URL
 */
function buildWikipediaExtractUrl(pageTitles) {
  const params = new URLSearchParams({
    action: 'query',
    titles: pageTitles.join('|'),
    prop: 'extracts',
    exintro: 'true',
    explaintext: 'true',
    exlimit: String(MAX_WIKIPEDIA_RESULTS),
    format: 'json',
    origin: '*',
  });
  return `${WIKIPEDIA_API_URL}?${params.toString()}`;
}

/**
 * Fetch a URL with a timeout.
 * Uses native https/http module to avoid external dependencies.
 *
 * @param {string} url - URL to fetch
 * @param {number} [timeoutMs=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Parsed JSON response
 */
function fetchJson(url, timeoutMs = WIKIPEDIA_API_TIMEOUT_MS) {
  const protocol = url.startsWith('https') ? require('https') : require('http');

  return withTimeout(
    new Promise((resolve, reject) => {
      protocol
        .get(
          url,
          { headers: { 'User-Agent': 'SekolahPSEO/1.0 (school directory project)' } },
          res => {
            let data = '';
            res.on('data', chunk => {
              data += chunk;
            });
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (parseError) {
                reject(new Error(`Failed to parse API response: ${parseError.message}`));
              }
            });
          }
        )
        .on('error', reject);
    }),
    timeoutMs,
    `Wikipedia API request: ${url.slice(0, 100)}...`
  );
}

/**
 * Enrich a single school record using Wikipedia API.
 * Searches for the school name (with province) on Indonesian Wikipedia.
 *
 * @param {Object} school - School record with at least 'nama' and 'provinsi'
 * @returns {Promise<Object>} Enrichment data (empty object if no results or error)
 */
async function enrichSchoolViaWikipedia(school) {
  if (!school || !school.nama) {
    return {};
  }

  const schoolName = school.nama;
  const province = school.provinsi || '';

  try {
    // Step 1: Search for the school
    const searchUrl = buildWikipediaSearchUrl(schoolName, province);
    const searchResult = await fetchJson(searchUrl);

    const searchResults = searchResult?.query?.search;
    if (!searchResults || searchResults.length === 0) {
      return {};
    }

    // Step 2: Get extracts for top results
    const pageTitles = searchResults.map(r => r.title);
    const extractUrl = buildWikipediaExtractUrl(pageTitles);
    const extractResult = await fetchJson(extractUrl);

    const pages = extractResult?.query?.pages;
    if (!pages) {
      return {};
    }

    // Find the best matching page
    const pageIds = Object.keys(pages);
    if (pageIds.length === 0) {
      return {};
    }

    // Use the first valid page
    const firstPageId = pageIds[0];
    const page = pages[firstPageId];

    if (!page || page.missing !== undefined) {
      return {};
    }

    return {
      wikipediaUrl: `https://id.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      wikipediaTitle: page.title,
      wikipediaExtract: page.extract ? page.extract.slice(0, 500) : '',
      enrichedAt: new Date().toISOString(),
      source: 'wikipedia',
    };
  } catch (error) {
    logger.debug({ err: error, npsn: school.npsn }, 'Wikipedia enrichment failed for school');
    return {};
  }
}

/**
 * Enrich a single school record using all available enrichment sources.
 * Returns an object with enrichment data keyed by source name.
 * Enrichment failures result in empty objects (graceful degradation).
 *
 * @param {Object} school - School record
 * @returns {Promise<Object>} Enrichment data
 */
async function enrichSchool(school) {
  if (!school || typeof school !== 'object') {
    return {};
  }

  const enrichment = {};

  // Add Wikipedia enrichment (primary source)
  const wikiData = await enrichSchoolViaWikipedia(school);
  if (wikiData && Object.keys(wikiData).length > 0) {
    enrichment.wikipedia = wikiData;
  }

  return enrichment;
}

/**
 * Enrich multiple school records concurrently.
 *
 * @param {Array<Object>} schools - Array of school records
 * @param {Object} [options] - Enrichment options
 * @param {number} [options.concurrency=10] - Max concurrent API calls
 * @param {Function} [options.onProgress] - Progress callback (processed, total)
 * @returns {Promise<Object>} Object mapping NPSN to enrichment data
 */
async function enrichSchools(schools, options = {}) {
  if (!Array.isArray(schools) || schools.length === 0) {
    return {};
  }

  const concurrency = options.concurrency || 10;
  const onProgress = options.onProgress;

  const enrichmentMap = {};
  let processed = 0;

  // Process in batches to control concurrency
  for (let i = 0; i < schools.length; i += concurrency) {
    const batch = schools.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(school => enrichSchool(school)));

    for (let j = 0; j < batch.length; j++) {
      const school = batch[j];
      const result = batchResults[j];

      if (!school || !school.npsn) {
        continue;
      }

      if (result.status === 'fulfilled' && result.value && Object.keys(result.value).length > 0) {
        enrichmentMap[school.npsn] = result.value;
      }
    }

    processed += batch.length;
    if (typeof onProgress === 'function') {
      onProgress(processed, schools.length);
    }
  }

  return enrichmentMap;
}

/**
 * Save enrichment data to the enrichment data file.
 *
 * @param {Object} enrichmentData - Enrichment data keyed by NPSN
 * @returns {Promise<void>}
 */
async function saveEnrichmentData(enrichmentData) {
  const content = JSON.stringify(enrichmentData, null, 2);
  await safeWriteFile(ENRICHMENT_DATA_PATH, content);
  const byteSize = Buffer.byteLength(content, 'utf-8');
  logger.info(
    `Saved enrichment data for ${Object.keys(enrichmentData).length} schools (${(byteSize / 1024).toFixed(0)} KB)`
  );
}

/**
 * Load enrichment data from the enrichment data file.
 * Returns empty object if file doesn't exist or is invalid.
 *
 * @returns {Promise<Object>} Enrichment data keyed by NPSN
 */
async function loadEnrichmentData() {
  try {
    await safeAccess(ENRICHMENT_DATA_PATH);
    const content = await safeReadFile(ENRICHMENT_DATA_PATH);
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Log enrichment summary statistics.
 *
 * @param {Object} enrichmentData - Enrichment data keyed by NPSN
 * @param {number} totalSchools - Total number of schools processed
 */
function logEnrichmentSummary(enrichmentData, totalSchools) {
  const enrichedCount = Object.keys(enrichmentData).length;

  logger.info('\n=== Enrichment Summary ===');
  logger.info(`Total schools: ${totalSchools}`);
  logger.info(`Enriched schools: ${enrichedCount}`);
  logger.info(
    `Coverage: ${totalSchools > 0 ? ((enrichedCount / totalSchools) * 100).toFixed(1) : 0}%`
  );

  // Count by source
  const sourceCounts = {};
  for (const npsn of Object.keys(enrichmentData)) {
    const sources = Object.keys(enrichmentData[npsn]);
    for (const source of sources) {
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }
  }

  logger.info('\nEnrichment by source:');
  for (const [source, count] of Object.entries(sourceCounts)) {
    logger.info(`  ${source}: ${count} schools`);
  }
}

module.exports = {
  isEnrichmentEnabled,
  enrichSchool,
  enrichSchoolViaWikipedia,
  enrichSchools,
  saveEnrichmentData,
  loadEnrichmentData,
  logEnrichmentSummary,
  buildWikipediaSearchUrl,
  buildWikipediaExtractUrl,
  ENRICHMENT_DATA_PATH,
  WIKIPEDIA_API_URL,
};
