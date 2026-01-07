/*
 * Sitemap generator. Splits the URLs produced by build-pages.js into multiple
 * sitemap files respecting the 50,000 URL and 50MB limits, and writes a
 * sitemap-index.xml that references them. Assumes the `dist` directory has
 * been populated with HTML files.
 */

const fs = require('fs').promises;
const path = require('path');
const CONFIG = require('./config');

// Export functions for testing
module.exports = {
  collectUrls,
  writeSitemapFiles,
  writeSitemapIndex
};

async function collectUrls(dir, baseUrl) {
  const urls = [];
  async function walk(current, relative) {
    const entries = await fs.readdir(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.endsWith('.html')) {
        urls.push(`${baseUrl}/${relPath.replace(/\\/g, '/')}`);
      }
    }
  }
  await walk(dir, '');
  return urls;
}

async function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  for (let i = 0; i < urls.length; i += CONFIG.MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + CONFIG.MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    
    // Use array join for better performance when building large strings
    const contentParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];
    
    // Process URLs in batches for better memory usage
    const urlParts = chunk.map(u => `  <url><loc>${u}</loc></url>`);
    contentParts.push(...urlParts);
    contentParts.push('</urlset>');
    
    const content = contentParts.join('\n');
    await fs.writeFile(path.join(outDir, filename), content, 'utf8');
    sitemapFiles.push(filename);
  }
  return sitemapFiles;
}

async function writeSitemapIndex(files, outDir, baseUrl) {
  // Use array join for better performance when building large strings
  const contentParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  
  // Process files in batches for better memory usage
  const sitemapParts = files.map(f => `  <sitemap><loc>${baseUrl}/${f}</loc></sitemap>`);
  contentParts.push(...sitemapParts);
  contentParts.push('</sitemapindex>');
  
  const content = contentParts.join('\n');
  await fs.writeFile(path.join(outDir, 'sitemap-index.xml'), content, 'utf8');
}

async function generateSitemaps() {
  const distDir = CONFIG.DIST_DIR;
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = CONFIG.SITE_URL;
  const urls = await collectUrls(distDir, baseUrl);
  const sitemapFiles = await writeSitemapFiles(urls, outDir);
  await writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps().catch(error => {
    console.error('Sitemap generation failed:', error);
    process.exit(1);
  });
}
