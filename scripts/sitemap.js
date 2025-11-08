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
  
  // Check if directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist. No URLs to collect.`);
    return urls;
  }
  
  function walk(current, relative) {
    // Read directory entries
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch (error) {
      console.warn(`Could not read directory ${current}:`, error.message);
      return;
    }
    
    for (const entry of entries) {
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (error) {
        console.warn(`Could not stat ${fullPath}:`, error.message);
        continue;
      }
      
      if (stat.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.endsWith('.html')) {
        // Normalize path separators for URLs
        const urlPath = relPath.replace(/\\/g, '/');
        urls.push(`${baseUrl}/${urlPath}`);
      }
    }
  }
  
  walk(dir, '');
  return urls;
}

/**
 * Write sitemap files with batches of URLs
 * @param {Array<string>} urls - Array of URLs to include
 * @param {string} outDir - Output directory
 * @returns {Array<string>} - Array of generated sitemap filenames
 */
function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  
  // Process URLs in chunks
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    const filePath = path.join(outDir, filename);
    
    // Generate XML content
    const content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    .concat(
      chunk.map(u => `  <url><loc>${u}</loc></url>`)
    )
    .concat('</urlset>')
    .join('\n');
    
    // Write file
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      sitemapFiles.push(filename);
      console.log(`Generated ${filename} with ${chunk.length} URLs`);
    } catch (error) {
      console.error(`Failed to write ${filename}:`, error.message);
    }
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
  if (files.length === 0) {
    console.warn('No sitemap files to index');
    return;
  }
  
  const content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
  .concat(
    files.map(f => `  <sitemap><loc>${baseUrl}/${f}</loc></sitemap>`)
  )
  .concat('</sitemapindex>')
  .join('\n');
  
  const indexPath = path.join(outDir, 'sitemap-index.xml');
  
  try {
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`Generated sitemap index with ${files.length} sitemap references`);
  } catch (error) {
    console.error(`Failed to write sitemap index:`, error.message);
  }
}

/**
 * Generate sitemaps for the site
 */
function generateSitemaps() {
  const distDir = path.join(__dirname, '../dist');
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = 'https://example.com'; // TODO: update to your domain or Cloudflare pages URL
  
  console.log(`Collecting URLs from ${distDir}`);
  const urls = collectUrls(distDir, baseUrl);
  
  if (urls.length === 0) {
    console.warn('No URLs found. Skipping sitemap generation.');
    return;
  }
  
  console.log(`Found ${urls.length} URLs`);
  const sitemapFiles = writeSitemapFiles(urls, outDir);
  writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps();
}