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
const { walkDirectory } = require('./utils');
const { RateLimiter } = require('./rate-limiter');

// Export functions for testing
module.exports = {
  extractLinks,
  validateLinksInFile,
  validateLinks,
};

/**
 * Extracts all href links from HTML content.
 * @param {string} html - HTML content to parse
 * @returns {string[]} Array of extracted href values (only relative links)
 */
function extractLinks(html) {
  const matches = [];
  // Cache the regex to avoid recreating it each time
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // consider only relative links
    if (href && !/^https?:/.test(href)) {
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
 * @returns {Promise<BrokenLink[]>} Array of broken links found in the file
 */
async function validateLinksInFile(file, links, distDir) {
  const brokenInFile = [];

  for (const link of links) {
    if (!link || link === '#' || link.startsWith('#') || /^https?:/.test(link)) {
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
      await safeAccess(targetPath);
    } catch (error) {
      if (error.name === 'IntegrationError') {
        try {
          const stat = await safeStat(targetPath);
          if (!stat.isDirectory()) {
            brokenInFile.push({ source: file, link: link });
          }
        } catch (statError) {
          if (statError.name === 'IntegrationError') {
            brokenInFile.push({ source: file, link: link });
          }
        }
      }
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
  } catch {
    logger.warn(`Dist directory not found at ${distDir}. Nothing to validate.`);
    return true;
  }

  const htmlFiles = await walkDirectory(distDir, fullPath => fullPath);

  logger.info(`Found ${htmlFiles.length} HTML files to validate`);

  if (htmlFiles.length === 0) {
    logger.info('No HTML files found to validate.');
    return true;
  }

  const limiter = new RateLimiter({
    maxConcurrent: CONFIG.VALIDATION_CONCURRENCY_LIMIT,
    queueTimeoutMs: 30000,
  });

  const broken = [];
  let processed = 0;

  const validatePromises = htmlFiles.map(file =>
    limiter.execute(
      async () => {
        try {
          const content = await safeReadFile(file);
          const links = extractLinks(content);
          return await validateLinksInFile(file, links, distDir);
        } catch (error) {
          logger.warn(`Failed to read file ${file}: ${error.message}`);
          return [];
        }
      },
      `validateLinks-${path.basename(file)}`
    )
  );

  const settledResults = await Promise.allSettled(validatePromises);
  const results = settledResults.filter(r => r.status === 'fulfilled').map(r => r.value);
  results.flat().forEach(brokenLink => broken.push(brokenLink));
  processed = results.length;

  logger.info(`Processed ${processed} of ${htmlFiles.length} files`);

  const metrics = limiter.getMetrics();
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
    logger.error('Link validation failed:', error);
    process.exit(1);
  });
}
