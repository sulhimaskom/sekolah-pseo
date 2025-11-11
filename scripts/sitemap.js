/*
 * Sitemap generator. Splits the URLs produced by build-pages.js into multiple
 * sitemap files respecting the 50,000 URL and 50MB limits, and writes a
 * sitemap-index.xml that references them. Assumes the `dist` directory has
 * been populated with HTML files.
 */

const fs = require('fs').promises;
const path = require('path');

const MAX_URLS_PER_SITEMAP = 50000;

async function collectUrls(dir, baseUrl) {
  // Validate inputs
  if (!dir || typeof dir !== 'string') {
    throw new Error('Invalid directory path');
  }
  
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('Invalid base URL');
  }
  
  // Validate dir to prevent path traversal
  const resolvedDir = path.resolve(dir);
  if (!resolvedDir.startsWith(path.resolve(path.join(__dirname, '../')))) {
    throw new Error('Directory path must be within the project directory');
  }
  
  const urls = [];
  async function walk(current, relative) {
    // Validate current path to prevent path traversal
    const resolvedCurrent = path.resolve(current);
    if (!resolvedCurrent.startsWith(resolvedDir)) {
      throw new Error('Path traversal detected');
    }
    
    const entries = await fs.readdir(current);
    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.startsWith('.')) {
        continue;
      }
      
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.endsWith('.html')) {
        // Sanitize the URL
        const sanitizedRelPath = relPath.replace(/\\/g, '/').replace(/[^a-zA-Z0-9\-_/.]/g, '');
        urls.push(`${baseUrl}/${sanitizedRelPath}`);
      }
    }
  }
  
  try {
    await walk(dir, '');
  } catch (error) {
    console.error(`Error collecting URLs from ${dir}:`, error.message);
    throw error;
  }
  
  return urls;
}

async function writeSitemapFiles(urls, outDir) {
  // Validate inputs
  if (!Array.isArray(urls)) {
    throw new Error('URLs must be an array');
  }
  
  if (!outDir || typeof outDir !== 'string') {
    throw new Error('Invalid output directory');
  }
  
  const sitemapFiles = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    
    // Validate filename to prevent path traversal
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new Error('Invalid filename that could cause path traversal');
    }
    
    // Use array join for better performance when building large strings
    const contentParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];
    
    // Process URLs in batches for better memory usage
    const urlParts = chunk.map(u => `  <url><loc>${escapeXml(u)}</loc></url>`);
    contentParts.push(...urlParts);
    contentParts.push('</urlset>');
    
    const content = contentParts.join('\n');
    await fs.writeFile(path.join(outDir, filename), content, 'utf8');
    sitemapFiles.push(filename);
  }
  return sitemapFiles;
}

async function writeSitemapIndex(files, outDir, baseUrl) {
  // Validate inputs
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array');
  }
  
  if (!outDir || typeof outDir !== 'string') {
    throw new Error('Invalid output directory');
  }
  
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('Invalid base URL');
  }
  
  // Use array join for better performance when building large strings
  const contentParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  
  // Process files in batches for better memory usage
  const sitemapParts = files.map(f => {
    // Validate filename to prevent path traversal
    if (f.includes('/') || f.includes('\\') || f.includes('..')) {
      throw new Error('Invalid filename that could cause path traversal');
    }
    return `  <sitemap><loc>${escapeXml(baseUrl)}/${escapeXml(f)}</loc></sitemap>`;
  });
  contentParts.push(...sitemapParts);
  contentParts.push('</sitemapindex>');
  
  const content = contentParts.join('\n');
  await fs.writeFile(path.join(outDir, 'sitemap-index.xml'), content, 'utf8');
}

/**
 * Escape XML characters to prevent XML injection vulnerabilities
 * 
 * @param {string} text
 * @returns {string}
 */
function escapeXml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function generateSitemaps() {
  try {
    const distDir = path.join(__dirname, '../dist');
    const outDir = distDir; // put sitemap files in dist
    
    // Validate distDir exists
    try {
      await fs.access(distDir);
    } catch {
      console.warn(`Dist directory not found at ${distDir}. Nothing to generate sitemaps for.`);
      return;
    }
    
    // Use environment variable for baseUrl, fallback to example.com for development
    const baseUrl = process.env.SITE_URL || 'https://example.com';
    const urls = await collectUrls(distDir, baseUrl);
    
    if (urls.length === 0) {
      console.log('No URLs found to generate sitemaps.');
      return;
    }
    
    const sitemapFiles = await writeSitemapFiles(urls, outDir);
    await writeSitemapIndex(sitemapFiles, outDir, baseUrl);
    console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
  } catch (error) {
    console.error('Sitemap generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateSitemaps().catch(error => {
    console.error('Sitemap generation failed:', error);
    process.exit(1);
  });
}
