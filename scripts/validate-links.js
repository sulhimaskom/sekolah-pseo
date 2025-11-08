/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This is a simple synchronous implementation suitable for
 * small datasets. For larger sites consider streaming and concurrency.
 */

const fs = require('fs');
const path = require('path');

/**
 * Collect all HTML files from a directory recursively
 * @param {string} dir - Directory to scan
 * @returns {Array<string>} - Array of HTML file paths
 */
function collectHtmlFiles(dir) {
  const files = [];
  
  // Security: Check if directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist`);
    return files;
  }
  
  function walk(current) {
    const entries = fs.readdirSync(current);
    for (const entry of entries) {
      // Security: Skip hidden files and directories
      if (entry.startsWith('.')) continue;
      
      const fullPath = path.join(current, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

/**
 * Extract all links from HTML content
 * @param {string} html - HTML content to parse
 * @returns {Array<string>} - Array of link href values
 */
function extractLinks(html) {
  const matches = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Security: Validate link length and format
    if (href && href.length <= 2048 && !href.match(/^https?:/)) {
      matches.push(href);
    }
  }
  return matches;
}

/**
 * Validate that all internal links resolve to existing files
 */
function validateLinks() {
  const distDir = path.join(__dirname, '../dist');
  const htmlFiles = collectHtmlFiles(distDir);
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found to validate.');
    return;
  }
  
  const broken = [];
  htmlFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const links = extractLinks(content);
      links.forEach(link => {
        // Normalize path: remove query/hash
        const clean = link.split(/[?#]/)[0];
        
        // Security: Resolve path safely to prevent directory traversal
        const dirName = path.dirname(file);
        const resolvedPath = path.resolve(dirName, clean);
        
        // Security: Ensure resolved path is within dist directory
        const relativePath = path.relative(distDir, resolvedPath);
        if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
          if (!fs.existsSync(resolvedPath)) {
            broken.push({ source: file, link: link });
          }
        } else {
          console.warn(`Skipping potentially unsafe link: ${link} in ${file}`);
        }
      });
    } catch (error) {
      console.error(`Error reading file ${file}: ${error.message}`);
      broken.push({ source: file, link: 'FILE_READ_ERROR' });
    }
  });
  
  if (broken.length > 0) {
    console.warn(`Found ${broken.length} broken links:`);
    broken.forEach(b => console.warn(`  ${b.source} -> ${b.link}`));
  } else {
    console.log('No broken links found.');
  }
}

if (require.main === module) {
  validateLinks();
}
