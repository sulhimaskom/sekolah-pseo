/**
 * @module validate-links
 * @description Link validation script for Indonesian School PSEO project.
 * Crawls generated HTML files and checks internal hyperlinks to ensure they
 * resolve to existing files. Outputs a report of broken links. This implementation
 * uses asynchronous operations and concurrency for better performance on large datasets.
 */

const path = require('path');
const CONFIG = require('./config');
const logger = require('./logger');
const { safeReadFile, safeAccess, safeStat } = require('./fs-safe');
const { walkDirectory, processConcurrently, terminate } = require('./utils');

/**
 * Checks if a link is a relative link (should be validated locally).
 * Filters out: null/undefined, empty, hash-only/fragment, and external URLs.
 * @param {string|null|undefined} link - The link to check
 * @returns {boolean} True if the link is a relative link
 */
function isRelativeLink(link) {
  if (!link || link === '#' || link.startsWith('#') || /^https?:/.test(link)) {
    return false;
  }
  return true;
}

/**
 * Memoized target-existence probe for link validation.
 *
 * A single validateLinks() run performs tens of thousands of stat(2) calls
 * against a handful of unique targets — every school page links to the same
 * shared assets (styles.css, favicon.svg, '/'). Measured at 5,014-page scale:
 * 15,067 stat calls against 27 unique targets (a 558x duplicate ratio), each
 * routed through safeStat's retry + timeout + circuit-breaker wrappers.
 *
 * The dist/ tree is immutable during a run, so memoizing existence is correct
 * with no invalidation risk: the cache lives and dies with one validateLinks()
 * call. The promise (not the boolean) is cached so concurrent in-flight probes
 * of the same target are also deduplicated. A non-IntegrationError failure is
 * intentionally NOT cached — it is unexpected (safeStat wraps all failures)
 * and must not poison the cache with a permanent rejection.
 *
 * @param {Map<string, Promise<boolean>>} cache - targetPath → existence promise
 * @param {string} targetPath - Absolute resolved target path
 * @returns {Promise<boolean>} True if the target exists, false if it does not
 */
function statExistsCached(cache, targetPath) {
  if (!cache.has(targetPath)) {
    const probe = safeStat(targetPath)
      .then(() => true)
      .catch(error => {
        if (error.name === 'IntegrationError') {
          return false;
        }
        throw error;
      });
    cache.set(targetPath, probe);
  }
  return cache.get(targetPath);
}

// Export functions for testing
module.exports = {
  extractLinks,
  validateLinksInFile,
  validateLinks,
  isRelativeLink,
  statExistsCached,
};

/**
 * Extracts all href links from HTML content.
 * @param {string} html - HTML content to parse
 * @returns {string[]} Array of extracted href values (only relative links)
 */
function extractLinks(html) {
  const matches = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (isRelativeLink(href)) {
      matches.push(href);
    }
  }
  return matches;
}

/**
 * Broken link entry.
 * @typedef {Object} BrokenLink
 * @property {string} source - Path to the HTML file containing the broken link
 * @property {string} link - The broken link URL
 */

/**
 * Validates links within a single HTML file.
 * @param {string} file - Path to the HTML file
 * @param {string[]} links - Array of links to validate
 * @param {string} distDir - Base directory for resolving relative links
 * @param {Map<string, Promise<boolean>>} [statCache] - Shared memoized existence
 *   cache. Callers that validate many files (validateLinks) pass one cache per
 *   run so identical targets across files are stat'ed once; direct calls get a
 *   fresh cache so behavior is unchanged.
 * @returns {Promise<BrokenLink[]>} Array of broken links found in the file
 */
async function validateLinksInFile(file, links, distDir, statCache = new Map()) {
  const brokenInFile = [];

  for (const link of links) {
    if (!isRelativeLink(link)) {
      continue;
    }

    const clean = link.split(/[?#]/)[0];

    let targetPath;
    if (clean.startsWith('/')) {
      targetPath = path.join(distDir, clean);
    } else {
      targetPath = path.join(path.dirname(file), clean);
    }

    try {
      // Existence probe: stat succeeds for both regular files and directories,
      // so either means the target resolves — the link is valid. Memoized so a
      // target shared across thousands of files is probed once per run.
      const exists = await statExistsCached(statCache, targetPath);
      if (!exists) {
        // Target does not exist (or is inaccessible) → broken link.
        brokenInFile.push({ source: file, link: link });
      }
    } catch {
      // Legacy semantics: unexpected (non-IntegrationError) failures are
      // silently skipped, never reported as broken links.
    }
  }

  return brokenInFile;
}

/**
 * Main function to validate all links in the dist directory.
 * Walks all HTML files, extracts links, and validates them.
 * @returns {Promise<boolean>} True if no broken links found, false otherwise
 */
async function validateLinks() {
  const distDir = CONFIG.DIST_DIR;

  try {
    await safeAccess(distDir);
  } catch (error) {
    logger.warn({ err: error }, `Dist directory not found at ${distDir}. Nothing to validate.`);
    return true;
  }

  const htmlFiles = await walkDirectory(distDir, fullPath => fullPath);

  logger.info(`Found ${htmlFiles.length} HTML files to validate`);

  if (htmlFiles.length === 0) {
    logger.info('No HTML files found to validate.');
    return true;
  }

  const statCache = new Map();

  const { results, metrics } = await processConcurrently(
    htmlFiles,
    async file => {
      try {
        const content = await safeReadFile(file);
        const links = extractLinks(content);
        return await validateLinksInFile(file, links, distDir, statCache);
      } catch (error) {
        logger.warn({ err: error, file }, 'Failed to read file');
        return [];
      }
    },
    {
      limit: CONFIG.VALIDATION_CONCURRENCY_LIMIT,
      timeout: 30000,
      getName: file => `validateLinks-${path.basename(file)}`,
      onProgress: (processed, total) => {
        if (processed % 100 === 0 || processed === total) {
          logger.info(`Processed ${processed} of ${total} files`);
        }
      },
    }
  );

  const broken = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .flat();

  logger.info('Validation metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

  if (broken.length > 0) {
    logger.warn(`Found ${broken.length} broken links:`);
    broken.forEach(b => logger.warn(`  ${b.source} -> ${b.link}`));
    return false;
  } else {
    logger.info('No broken links found.');
    return true;
  }
}

if (require.main === module) {
  validateLinks().catch(error => {
    terminate(`Link validation failed: ${error.message}`);
  });
}
