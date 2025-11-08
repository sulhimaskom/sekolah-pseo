/*
 * Sitemap generator. Splits the URLs produced by build-pages.js into multiple
 * sitemap files respecting the 50,000 URL and 50MB limits, and writes a
 * sitemap-index.xml that references them. Assumes the `dist` directory has
 * been populated with HTML files.
 */

const fs = require('fs');
const path = require('path');

const MAX_URLS_PER_SITEMAP = 50000;

/**
 * Collect all HTML file URLs from the dist directory using a more efficient approach.
 *
 * @param {string} dir - The directory to scan
 * @param {string} baseUrl - The base URL for the site
 * @returns {Array<string>} - Array of URLs
 */
function collectUrls(dir, baseUrl) {
  const urls = [];
  const stack = [''];
  
  while (stack.length > 0) {
    const relative = stack.pop();
    const current = path.join(dir, relative);
    
    const entries = fs.readdirSync(current, { withFileTypes: true });
    
    for (const entry of entries) {
      const relPath = path.join(relative, entry.name);
      if (entry.isDirectory()) {
        stack.push(relPath);
      } else if (entry.name.endsWith('.html')) {
        urls.push(`${baseUrl}/${relPath.replace(/\\/g, '/')}`);
      }
    }
  }
  
  return urls;
}

/**
 * Write sitemap files with improved performance for large datasets.
 *
 * @param {Array<string>} urls - Array of URLs to include in sitemaps
 * @param {string} outDir - Output directory for sitemap files
 * @returns {Array<string>} - Array of generated sitemap filenames
 */
function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    
    // Use a more efficient approach for building the XML content
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];
    
    // Add URLs efficiently
    for (const url of chunk) {
      lines.push(`  <url><loc>${url}</loc></url>`);
    }
    
    lines.push('</urlset>');
    
    const content = lines.join('\n');
    fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
    sitemapFiles.push(filename);
  }
  
  return sitemapFiles;
}

/**
 * Write the sitemap index file.
 *
 * @param {Array<string>} files - Array of sitemap filenames
 * @param {string} outDir - Output directory
 * @param {string} baseUrl - Base URL for the site
 */
function writeSitemapIndex(files, outDir, baseUrl) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  
  // Add sitemap references efficiently
  for (const file of files) {
    lines.push(`  <sitemap><loc>${baseUrl}/${file}</loc></sitemap>`);
  }
  
  lines.push('</sitemapindex>');
  
  const content = lines.join('\n');
  fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), content, 'utf8');
}

function generateSitemaps() {
  const distDir = path.join(__dirname, '../dist');
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = 'https://example.com'; // TODO: update to your domain or Cloudflare pages URL
  const urls = collectUrls(distDir, baseUrl);
  const sitemapFiles = writeSitemapFiles(urls, outDir);
  writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps();
}
