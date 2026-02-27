/**
 * @module sitemap
 * @description Sitemap generator for Indonesian School PSEO project.
 * Splits the URLs produced by build-pages.js into multiple sitemap files
 * respecting the 50,000 URL and 50MB limits, and writes a sitemap-index.xml
 * that references them. Assumes the `dist` directory has been populated with
 * HTML files.
 */

const path = require('path');
const CONFIG = require('./config');
const logger = require('./logger');
const { safeWriteFile } = require('./fs-safe');
const { walkDirectory } = require('./utils');

// Export functions for testing
module.exports = {
  collectUrls,
  writeSitemapFiles,
  writeSitemapIndex,
};

/**
 * URL entry for sitemap generation.
 * @typedef {Object} SitemapUrl
 * @property {string} url - Full URL of the page
 * @property {string} [lastmod] - Last modified date (ISO format)
 */

/**
 * Collects URLs from HTML files in a directory.
 * @param {string} dir - Directory to walk for HTML files
 * @param {string} baseUrl - Base URL for the site
 * @returns {Promise<SitemapUrl[]>} Array of URL entries
 */
async function collectUrls(dir, baseUrl) {
  return await walkDirectory(dir, (fullPath, relativePath, entry, stat) => {
    return {
      url: `${baseUrl}/${relativePath.replace(/\\/g, '/')}`,
      lastmod: stat.mtime.toISOString().split('T')[0],
    };
  });
}

/**
 * Writes sitemap XML files, splitting URLs into chunks respecting limits.
 * @param {SitemapUrl[]} urls - Array of URL entries
 * @param {string} outDir - Output directory for sitemap files
 * @returns {Promise<string[]>} Array of created sitemap filenames
 */
async function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  for (let i = 0; i < urls.length; i += CONFIG.MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + CONFIG.MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;

    // Use array join for better performance when building large strings
    const contentParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    // Process URLs in batches for better memory usage
    const urlParts = chunk.map(u => {
      if (u.lastmod) {
        return `  <url><loc>${u.url}</loc><lastmod>${u.lastmod}</lastmod></url>`;
      }
      return `  <url><loc>${u.url}</loc></url>`;
    });
    contentParts.push(...urlParts);
    contentParts.push('</urlset>');

    const content = contentParts.join('\n');
    await safeWriteFile(path.join(outDir, filename), content);
    sitemapFiles.push(filename);
  }
  return sitemapFiles;
}

/**
 * Writes the sitemap index file that references all sitemap files.
 * @param {string[]} files - Array of sitemap filenames
 * @param {string} outDir - Output directory
 * @param {string} baseUrl - Base URL for the site
 * @returns {Promise<void>}
 */
async function writeSitemapIndex(files, outDir, baseUrl) {
  // Use array join for better performance when building large strings
  const contentParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  // Process files in batches for better memory usage
  const sitemapParts = files.map(f => `  <sitemap><loc>${baseUrl}/${f}</loc></sitemap>`);
  contentParts.push(...sitemapParts);
  contentParts.push('</sitemapindex>');

  const content = contentParts.join('\n');
  await safeWriteFile(path.join(outDir, 'sitemap-index.xml'), content);
}

/**
 * Main function to generate all sitemaps.
 * Collects URLs from dist directory and generates sitemap files and index.
 * @returns {Promise<void>}
 */
async function generateSitemaps() {
  const distDir = CONFIG.DIST_DIR;
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = CONFIG.SITE_URL;
  const urls = await collectUrls(distDir, baseUrl);
  const sitemapFiles = await writeSitemapFiles(urls, outDir);
  await writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  logger.info(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps().catch(error => {
    logger.error('Sitemap generation failed:', error);
    process.exit(1);
  });
}
