/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This is a simple synchronous implementation suitable for
 * small datasets. For larger sites consider streaming and concurrency.
 */

const fs = require('fs');
const path = require('path');

/**
 * Collect all HTML files from the dist directory using a more efficient approach.
 *
 * @param {string} dir - The directory to scan
 * @returns {Array<string>} - Array of HTML file paths
 */
function collectHtmlFiles(dir) {
  const files = [];
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
        files.push(path.join(dir, relPath));
      }
    }
  }
  
  return files;
}

/**
 * Extract links from HTML content using a more efficient approach.
 *
 * @param {string} html - HTML content to extract links from
 * @returns {Array<string>} - Array of link href values
 */
function extractLinks(html) {
  const matches = [];
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
 * Validate links in HTML files.
 */
function validateLinks() {
  const distDir = path.join(__dirname, '../dist');
  const htmlFiles = collectHtmlFiles(distDir);
  const broken = [];
  
  // Create a set of all existing files for faster lookup
  const existingFiles = new Set(htmlFiles.map(f => path.relative(distDir, f)));
  
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content);
    
    links.forEach(link => {
      // Normalize path: remove query/hash
      const clean = link.split(/[?#]/)[0];
      
      // Resolve the target path relative to the current file's directory
      const targetPath = path.join(path.dirname(path.relative(distDir, file)), clean);
      
      // Normalize the path to match our existing files set
      const normalizedPath = path.normalize(targetPath).replace(/\\/g, '/');
      
      if (!existingFiles.has(normalizedPath)) {
        broken.push({ source: file, link: link });
      }
    });
  });
  
  if (broken.length > 0) {
    console.warn('Found broken links:');
    broken.forEach(b => console.warn(`  ${b.source} -> ${b.link}`));
  } else {
    console.log('No broken links found.');
  }
}

if (require.main === module) {
  validateLinks();
}
