/*
 * Link validation script. Crawls generated HTML files and checks internal
 * and external hyperlinks. Internal links that are broken fail the build.
 * External links that are unreachable generate warnings but don't fail the build.
 * Use --strict flag to treat external link failures as errors.
 * Outputs a report of broken links. This implementation uses asynchronous
 * operations and concurrency for better performance on large datasets.
 */

const path = require('path');
const { URL } = require('url');
const http = require('http');
const https = require('https');
const CONFIG = require('./config');
const logger = require('./logger');
const { safeReadFile, safeAccess, safeStat } = require('./fs-safe');
const { walkDirectory } = require('./utils');
const { RateLimiter } = require('./rate-limiter');

// Default validation options
const DEFAULT_VALIDATION_OPTIONS = {
  strict: false,
  externalTimeoutMs: 5000,
  maxExternalRetries: 1,
};

/**
 * Validates an external HTTP link with a timeout
 * @param {string} urlString - The URL to validate
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{ok: boolean, statusCode?: number, error?: string}>}
 */
function validateExternalLink(urlString, timeoutMs = 5000) {
  return new Promise(resolve => {
    let parsedUrl;
    try {
      parsedUrl = new URL(urlString);
    } catch {
      resolve({ ok: false, error: 'Invalid URL' });
      return;
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const timeout = setTimeout(() => {
      resolve({ ok: false, error: 'Request timeout' });
    }, timeoutMs);

    const req = protocol.get(urlString, { timeout: timeoutMs }, res => {
      clearTimeout(timeout);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ ok: true, statusCode: res.statusCode });
      } else if (res.statusCode >= 400) {
        resolve({ ok: false, statusCode: res.statusCode, error: `HTTP ${res.statusCode}` });
      }
      res.resume(); // Drain the response
    });

    req.on('error', error => {
      clearTimeout(timeout);
      resolve({ ok: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      clearTimeout(timeout);
      resolve({ ok: false, error: 'Request timeout' });
    });
  });
}

/**
 * Categorizes a link as 'internal' or 'external'
 * @param {string} href - The href to categorize
 * @returns {{ type: 'internal' | 'external', url: string | null }}
 */
function categorizeLink(href) {
  if (!href || href === '#' || href.startsWith('#')) {
    return { type: 'internal', url: null }; // Skip hash-only links
  }

  if (/^https?:\/\//.test(href)) {
    return { type: 'external', url: href };
  }

  return { type: 'internal', url: null };
}

/**
 * Extracts both internal and external links from HTML
 * @param {string} html - The HTML content to parse
 * @returns {{ internal: string[], external: string[] }}
 */
function extractLinks(html) {
  const result = { internal: [], external: [] };
  const regex = /href="([^"]+)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const categorized = categorizeLink(href);

    if (categorized.type === 'external' && categorized.url) {
      result.external.push(categorized.url);
    } else if (categorized.type === 'internal' && href && !href.startsWith('#')) {
      result.internal.push(href);
    }
  }

  return result;
}

/**
 * Validates internal links in a file
 * @param {string} file - The file being validated
 * @param {string[]} links - Array of internal links
 * @param {string} distDir - The dist directory path
 * @returns {Promise<Array<{source: string, link: string}>>}
 */
async function validateInternalLinksInFile(file, links, distDir) {
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
 * Validates external links in a file
 * @param {string} file - The file being validated
 * @param {string[]} links - Array of external links
 * @param {Object} options - Validation options
 * @returns {Promise<Array<{source: string, link: string, error: string}>>}
 */
async function validateExternalLinksInFile(file, links, options) {
  const brokenInFile = [];
  const { externalTimeoutMs, maxExternalRetries } = { ...DEFAULT_VALIDATION_OPTIONS, ...options };

  for (const link of links) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxExternalRetries; attempt++) {
      const result = await validateExternalLink(link, externalTimeoutMs);

      if (result.ok) {
        lastError = null;
        break;
      }
      lastError = result.error || 'Unknown error';
    }

    if (lastError) {
      brokenInFile.push({ source: file, link: link, error: lastError });
    }
  }

  return brokenInFile;
}

/**
 * Validates links in a file (internal and external)
 * @param {string} file - The file being validated
 * @param {{internal: string[], external: string[]}} links - Links object
 * @param {string} distDir - The dist directory path
 * @param {Object} options - Validation options
 * @returns {Promise<{internal: Array, external: Array}>}
 */
async function validateLinksInFile(file, links, distDir, options = {}) {
  const internalResults = await validateInternalLinksInFile(file, links.internal, distDir);
  const externalResults = await validateExternalLinksInFile(file, links.external, options);

  return {
    internal: internalResults,
    external: externalResults,
  };
}

/**
 * Generates a validation report
 * @param {Object} results - Validation results
 * @param {string} reportPath - Path to write the report
 */
function generateValidationReport(results, reportPath) {
  const fs = require('fs');
  const timestamp = new Date().toISOString();

  let report = 'Link Validation Report\n';
  report += `Generated: ${timestamp}\n`;
  report += '================================\n\n';

  report += 'Summary:\n';
  report += `- Total HTML files processed: ${results.totalFiles}\n`;
  report += `- Internal links checked: ${results.internalChecked}\n`;
  report += `- External links checked: ${results.externalChecked}\n`;
  report += `- Broken internal links: ${results.brokenInternal.length}\n`;
  report += `- Broken external links: ${results.brokenExternal.length}\n`;
  report += `- Build status: ${results.buildFailed ? 'FAILED' : 'PASSED'}\n\n`;

  if (results.brokenInternal.length > 0) {
    report += 'Broken Internal Links (CRITICAL):\n';
    results.brokenInternal.forEach(link => {
      report += `  ${link.source} -> ${link.link}\n`;
    });
    report += '\n';
  }

  if (results.brokenExternal.length > 0) {
    report += 'Broken External Links (WARNING):\n';
    results.brokenExternal.forEach(link => {
      report += `  ${link.source} -> ${link.link} (${link.error})\n`;
    });
    report += '\n';
  }

  fs.writeFileSync(reportPath, report);
  logger.info(`Validation report saved to: ${reportPath}`);
}

/**
 * Main validation function
 * @param {Object} options - Validation options
 * @returns {Promise<boolean>} - True if validation passed, false if failed
 */
async function validateLinks(options = {}) {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const distDir = CONFIG.DIST_DIR;

  // Parse command line args if running directly
  if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--strict')) {
      opts.strict = true;
    }
  }

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

  const brokenInternal = [];
  const brokenExternal = [];
  let processed = 0;
  let internalChecked = 0;
  let externalChecked = 0;

  const validatePromises = htmlFiles.map(file =>
    limiter.execute(
      async () => {
        try {
          const content = await safeReadFile(file);
          const links = extractLinks(content);
          internalChecked += links.internal.length;
          externalChecked += links.external.length;
          return await validateLinksInFile(file, links, distDir, opts);
        } catch (error) {
          logger.warn(`Failed to read file ${file}: ${error.message}`);
          return { internal: [], external: [] };
        }
      },
      `validateLinks-${path.basename(file)}`
    )
  );

  const settledResults = await Promise.allSettled(validatePromises);
  const results = settledResults.filter(r => r.status === 'fulfilled').map(r => r.value);

  results.forEach(result => {
    result.internal.forEach(link => brokenInternal.push(link));
    result.external.forEach(link => brokenExternal.push(link));
  });

  processed = results.length;

  logger.info(`Processed ${processed} of ${htmlFiles.length} files`);
  logger.info(`Checked ${internalChecked} internal links and ${externalChecked} external links`);

  const metrics = limiter.getMetrics();
  logger.info('Validation metrics:', {
    total: metrics.total,
    completed: metrics.completed,
    failed: metrics.failed,
    throughput: metrics.throughput,
  });

  // Generate validation report
  const reportPath = path.join(distDir, 'link-validation-report.txt');
  generateValidationReport(
    {
      totalFiles: processed,
      internalChecked,
      externalChecked,
      brokenInternal,
      brokenExternal,
      buildFailed: brokenInternal.length > 0 || (opts.strict && brokenExternal.length > 0),
    },
    reportPath
  );

  // Log broken links
  if (brokenInternal.length > 0) {
    logger.error(`Found ${brokenInternal.length} broken internal links (CRITICAL):`);
    brokenInternal.forEach(b => logger.error(`  ${b.source} -> ${b.link}`));
  }

  if (brokenExternal.length > 0) {
    logger.warn(`Found ${brokenExternal.length} broken external links (WARNING):`);
    brokenExternal.forEach(b => logger.warn(`  ${b.source} -> ${b.link} (${b.error})`));
  }

  // Determine if build should fail
  const buildFailed = brokenInternal.length > 0 || (opts.strict && brokenExternal.length > 0);

  if (buildFailed) {
    if (brokenInternal.length > 0) {
      logger.error('Build FAILED due to broken internal links');
    } else if (opts.strict && brokenExternal.length > 0) {
      logger.error('Build FAILED due to broken external links (strict mode)');
    }
    return false;
  } else if (brokenExternal.length > 0) {
    logger.warn(
      'Build PASSED but with external link warnings (use --strict to fail on external link errors)'
    );
    return true;
  } else {
    logger.info('No broken links found. Build PASSED.');
    return true;
  }
}

// Export functions for testing
module.exports = {
  extractLinks,
  categorizeLink,
  validateLinksInFile,
  validateExternalLink,
  validateLinks,
  DEFAULT_VALIDATION_OPTIONS,
};

if (require.main === module) {
  validateLinks().catch(error => {
    logger.error('Link validation failed:', error);
    process.exit(1);
  });
}
