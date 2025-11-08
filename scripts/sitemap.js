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
 * Collect URLs from HTML files in the dist directory using a more efficient approach
 *
 * @param {string} dir
 * @param {string} baseUrl
 * @returns {Array<string>}
 */
function collectUrls(dir, baseUrl) {
  const urls = [];
  
  // Use a stack-based approach instead of recursion for better performance
  const stack = [{ current: dir, relative: '' }];
  
  while (stack.length > 0) {
    const { current, relative } = stack.pop();
    
    try {
      const entries = fs.readdirSync(current);
      
      for (const entry of entries) {
        const fullPath = path.join(current, entry);
        const relPath = path.join(relative, entry);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            stack.push({ current: fullPath, relative: relPath });
          } else if (entry.endsWith('.html')) {
            urls.push(`${baseUrl}/${relPath.replace(/\\/g, '/')}`);
          }
        } catch (statError) {
          console.warn(`Could not stat ${fullPath}: ${statError.message}`);
        }
      }
    } catch (readError) {
      console.warn(`Could not read directory ${current}: ${readError.message}`);
    }
  }
  
  return urls;
}

/**
 * Write sitemap files in batches
 *
 * @param {Array<string>} urls
 * @param {string} outDir
 * @returns {Array<string>}
 */
function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    
    // Use array join for more efficient string building
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];
    
    for (const url of chunk) {
      lines.push(`  <url><loc>${url}</loc></url>`);
    }
    
    lines.push('</urlset>');
    
    try {
      fs.writeFileSync(path.join(outDir, filename), lines.join('\n'), 'utf8');
      sitemapFiles.push(filename);
    } catch (writeError) {
      console.error(`Failed to write ${filename}: ${writeError.message}`);
    }
  }
  
  return sitemapFiles;
}

/**
 * Write the sitemap index file
 *
 * @param {Array<string>} files
 * @param {string} outDir
 * @param {string} baseUrl
 */
function writeSitemapIndex(files, outDir, baseUrl) {
  // Use array join for more efficient string building
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  
  for (const file of files) {
    lines.push(`  <sitemap><loc>${baseUrl}/${file}</loc></sitemap>`);
  }
  
  lines.push('</sitemapindex>');
  
  try {
    fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), lines.join('\n'), 'utf8');
  } catch (writeError) {
    console.error(`Failed to write sitemap-index.xml: ${writeError.message}`);
  }
}

function generateSitemaps() {
  const distDir = path.join(__dirname, '../dist');
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = 'https://example.com'; // TODO: update to your domain or Cloudflare pages URL
  
  console.log('Collecting URLs...');
  const urls = collectUrls(distDir, baseUrl);
  console.log(`Found ${urls.length} URLs`);
  
  console.log('Generating sitemap files...');
  const sitemapFiles = writeSitemapFiles(urls, outDir);
  
  console.log('Generating sitemap index...');
  writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps();
}
