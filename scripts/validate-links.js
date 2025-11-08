/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This is a simple synchronous implementation suitable for
 * small datasets. For larger sites consider streaming and concurrency.
 */

const fs = require('fs');
const path = require('path');

/**
 * Collect all HTML files from the dist directory
 * @param {string} dir - Directory to scan
 * @returns {Array<string>} - Array of HTML file paths
 */
function collectHtmlFiles(dir) {
  const files = [];
  
  // Check if directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist. No HTML files to validate.`);
    return files;
  }
  
  function walk(current) {
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
      
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (error) {
        console.warn(`Could not stat ${fullPath}:`, error.message);
        continue;
      }
      
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
 * Extract all href links from HTML content
 * @param {string} html - HTML content
 * @returns {Array<string>} - Array of link href values
 */
function extractLinks(html) {
  const matches = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Consider only relative links (not http/https)
    if (href && !/^https?:/.test(href)) {
      matches.push(href);
    }
  }
  return matches;
}

/**
 * Validate all internal links in HTML files
 */
function validateLinks() {
  const distDir = path.join(__dirname, '../dist');
  console.log(`Collecting HTML files from ${distDir}`);
  const htmlFiles = collectHtmlFiles(distDir);
  
  if (htmlFiles.length === 0) {
    console.warn('No HTML files found. Skipping link validation.');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} HTML files`);
  const broken = [];
  const checkedLinks = new Set(); // Avoid checking the same link multiple times
  
  htmlFiles.forEach((file, index) => {
    // Progress indicator for large datasets
    if (htmlFiles.length > 100 && index % Math.floor(htmlFiles.length / 10) === 0) {
      console.log(`Processing file ${index + 1}/${htmlFiles.length}`);
    }
    
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (error) {
      console.warn(`Could not read ${file}:`, error.message);
      return;
    }
    
    const links = extractLinks(content);
    links.forEach(link => {
      // Skip empty links
      if (!link) return;
      
      // Create a unique key for this link check to avoid duplicates
      const linkKey = `${file} -> ${link}`;
      if (checkedLinks.has(linkKey)) return;
      checkedLinks.add(linkKey);
      
      // Normalize path: remove query/hash
      const clean = link.split(/[?#]/)[0];
      
      // Handle relative paths
      const targetPath = path.resolve(path.dirname(file), clean);
      
      // Check if target exists
      if (!fs.existsSync(targetPath)) {
        broken.push({ source: file, link: link });
      }
    });
  });
  
  if (broken.length > 0) {
    console.warn(`Found ${broken.length} broken links:`);
    broken.forEach(b => console.warn(`  ${b.source} -> ${b.link}`));
    
    // Exit with error code for CI/CD
    process.exit(1);
  } else {
    console.log('No broken links found.');
  }
}

if (require.main === module) {
  validateLinks();
}