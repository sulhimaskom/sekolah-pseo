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
 * Collect all HTML URLs from the dist directory
 * @param {string} dir - Directory to scan
 * @param {string} baseUrl - Base URL for the site
 * @returns {Array<string>} - Array of URLs
 */
function collectUrls(dir, baseUrl) {
  const urls = [];
  function walk(current, relative) {
    // Security: Check if directory exists before reading
    if (!fs.existsSync(current)) {
      console.warn(`Directory ${current} does not exist`);
      return;
    }
    
    const entries = fs.readdirSync(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      
      // Security: Skip hidden files and directories
      if (entry.startsWith('.')) continue;
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.endsWith('.html')) {
        // Security: Validate URL length
        const url = `${baseUrl}/${relPath.replace(/\\/g, '/')}`;
        if (url.length <= 2048) { // Standard URL length limit
          urls.push(url);
        }
      }
    }
  }
  walk(dir, '');
  return urls;
}

/**
 * Write sitemap files with URL chunks
 * @param {Array<string>} urls - Array of URLs to include
 * @param {string} outDir - Output directory
 * @returns {Array<string>} - Array of generated sitemap filenames
 */
function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    const content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
      .concat(
        chunk.map(u => {
          // Security: Escape URL special characters
          const escapedUrl = u.replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;')
                              .replace(/"/g, '&quot;');
          return `  <url><loc>${escapedUrl}</loc></url>`;
        })
      )
      .concat('</urlset>')
      .join('\n');
    fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
    sitemapFiles.push(filename);
  }
  return sitemapFiles;
}

/**
 * Write the sitemap index file
 * @param {Array<string>} files - Array of sitemap filenames
 * @param {string} outDir - Output directory
 * @param {string} baseUrl - Base URL for the site
 */
function writeSitemapIndex(files, outDir, baseUrl) {
  const content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
    .concat(
      files.map(f => {
        // Security: Escape URL special characters
        const escapedUrl = `${baseUrl}/${f}`.replace(/&/g, '&amp;')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/"/g, '&quot;');
        return `  <sitemap><loc>${escapedUrl}</loc></sitemap>`;
      })
    )
    .concat('</sitemapindex>')
    .join('\n');
  fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), content, 'utf8');
}

/**
 * Generate sitemaps for all HTML files in the dist directory
 */
function generateSitemaps() {
  const distDir = path.join(__dirname, '../dist');
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = 'https://example.com'; // TODO: update to your domain or Cloudflare pages URL
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.warn('Dist directory does not exist. Creating it now.');
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  const urls = collectUrls(distDir, baseUrl);
  const sitemapFiles = writeSitemapFiles(urls, outDir);
  writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps();
}
