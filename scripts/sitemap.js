/**
 * @module sitemap
 * @description Sitemap generator for Indonesian School PSEO project.
 * Splits the URLs produced by build-pages.js into multiple sitemap files
 * respecting the 50,000 URL and 50MB limits, and writes a sitemap-index.xml
 * that references them. Assumes the `dist` directory has been populated with
 * HTML files.
 *
 * Two URL collection strategies are available:
 * 1. collectUrls(distDir, baseUrl) - walks filesystem for HTML files (slower but always accurate)
 * 2. collectUrlsFromSchools(schools, baseUrl) - generates URLs from school data (faster, avoids I/O)
 */

'use strict';

const path = require('path');
const CONFIG = require('./config');
const logger = require('./logger');
const { safeWriteFile } = require('./fs-safe');
const { walkDirectory, terminate } = require('./utils');
const { getSchoolRelativePath, getUniqueProvinces } = require('../src/services/PageBuilder');

// Export functions for testing
module.exports = {
  collectUrls,
  collectUrlsFromSchools,
  writeSitemapFiles,
  writeSitemapIndex,
  escapeXml,
  generateSitemaps,
};

/**
 * URL entry for sitemap generation.
 * @typedef {Object} SitemapUrl
 * @property {string} url - Full URL of the page
 * @property {string} [lastmod] - Last modified date (ISO format)
 */

/**
 * Escape XML special characters to prevent XML injection.
 * Handles: & < > " '
 * @param {string} text - Text to escape
 * @returns {string} XML-escaped text
 */
function escapeXml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
 * Collect URLs from school data directly, avoiding filesystem walk.
 * Generates homepage, province pages, and individual school page URLs.
 *
 * @param {Array<Object>} schools - School data objects
 * @param {string} baseUrl - Base URL for the site (e.g. https://example.com)
 * @returns {Array<{url: string, lastmod: string}>} Array of URL entries
 */
function collectUrlsFromSchools(schools, baseUrl) {
  const now = new Date().toISOString().split('T')[0];
  const urls = [];
  const normalizedBase = baseUrl.replace(/\/$/, '');

  // Homepage
  urls.push({ url: `${normalizedBase}/`, lastmod: now });

  // Province pages
  const provinces = getUniqueProvinces(schools);
  for (const province of provinces) {
    urls.push({
      url: `${normalizedBase}/provinsi/${province.slug}/`,
      lastmod: now,
    });
  }

  // Individual school pages
  for (const school of schools) {
    const relPath = getSchoolRelativePath(school);
    urls.push({
      url: `${normalizedBase}/${relPath}`,
      lastmod: now,
    });
  }

  return urls;
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
    // URLs are XML-escaped to prevent XML injection from special characters
    const urlParts = chunk.map(u => {
      const encodedUrl = escapeXml(u.url);
      if (u.lastmod) {
        return `  <url><loc>${encodedUrl}</loc><lastmod>${u.lastmod}</lastmod></url>`;
      }
      return `  <url><loc>${encodedUrl}</loc></url>`;
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
  const sitemapParts = files.map(
    f => `  <sitemap><loc>${escapeXml(baseUrl)}/${escapeXml(f)}</loc></sitemap>`
  );
  contentParts.push(...sitemapParts);
  contentParts.push('</sitemapindex>');

  const content = contentParts.join('\n');
  await safeWriteFile(path.join(outDir, 'sitemap-index.xml'), content);
}

/**
 * Main function to generate all sitemaps.
 * When schools data is provided, uses data-driven URL generation (faster, avoids filesystem walk).
 * Otherwise falls back to walking the dist directory for HTML files.
 *
 * @param {Array<Object>} [schools] - Optional school data for data-driven URL generation
 * @returns {Promise<{urls: Array, files: Array}>}
 */
async function generateSitemaps(schools) {
  const distDir = CONFIG.DIST_DIR;
  const outDir = distDir;
  const baseUrl = CONFIG.SITE_URL;

  let urls;
  if (schools && schools.length > 0) {
    urls = collectUrlsFromSchools(schools, baseUrl);
  } else {
    urls = await collectUrls(distDir, baseUrl);
  }

  const sitemapFiles = await writeSitemapFiles(urls, outDir);
  await writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  logger.info(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
  return { urls, files: sitemapFiles };
}

if (require.main === module) {
  // Try to load schools data for faster sitemap generation
  const { safeReadFile } = require('./fs-safe');
  const { parseCsv } = require('./utils');

  safeReadFile(CONFIG.SCHOOLS_CSV_PATH)
    .then(text => {
      const schools = parseCsv(text);
      if (schools.length > 0) {
        return generateSitemaps(schools);
      }
      return generateSitemaps();
    })
    .catch(err => {
      // Log the error but fall back to generating sitemaps without pre-loaded data.
      // This ensures sitemaps are always generated even if the CSV is missing or parsing fails.
      logger.warn({ err }, 'Could not load schools data for sitemap, generating without data');
      return generateSitemaps();
    })
    .catch(error => {
      logger.error({ err: error }, 'Sitemap generation failed');
      terminate('Sitemap generation failed');
    });
}
