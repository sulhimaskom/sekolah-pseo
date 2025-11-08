/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This is a simple synchronous implementation suitable for
 * small datasets. For larger sites consider streaming and concurrency.
 */

const fs = require('fs');
const path = require('path');

/**
 * Collect HTML files using a stack-based approach for better performance
 *
 * @param {string} dir
 * @returns {Array<string>}
 */
function collectHtmlFiles(dir) {
  const files = [];
  
  // Use a stack-based approach instead of recursion for better performance
  const stack = [dir];
  
  while (stack.length > 0) {
    const current = stack.pop();
    
    try {
      const entries = fs.readdirSync(current);
      
      for (const entry of entries) {
        const fullPath = path.join(current, entry);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            stack.push(fullPath);
          } else if (entry.endsWith('.html')) {
            files.push(fullPath);
          }
        } catch (statError) {
          console.warn(`Could not stat ${fullPath}: ${statError.message}`);
        }
      }
    } catch (readError) {
      console.warn(`Could not read directory ${current}: ${readError.message}`);
    }
  }
  
  return files;
}

/**
 * Extract links from HTML content
 *
 * @param {string} html
 * @returns {Array<string>}
 */
function extractLinks(html) {
  const matches = [];
  const regex = /href=["']([^"']+)["']/g;
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
 * Validate links with better error handling and caching
 */
function validateLinks() {
  const distDir = path.join(__dirname, '../dist');
  
  console.log('Collecting HTML files...');
  const htmlFiles = collectHtmlFiles(distDir);
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  const broken = [];
  const checkedPaths = new Map(); // Cache to avoid checking the same path multiple times
  
  // Process files in batches to provide progress updates
  const batchSize = 100;
  for (let i = 0; i < htmlFiles.length; i += batchSize) {
    const batch = htmlFiles.slice(i, i + batchSize);
    
    for (const file of batch) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const links = extractLinks(content);
        
        for (const link of links) {
          // Normalize path: remove query/hash
          const clean = link.split(/[?#]/)[0];
          const targetPath = path.join(path.dirname(file), clean);
          
          // Check cache first
          if (checkedPaths.has(targetPath)) {
            if (!checkedPaths.get(targetPath)) {
              broken.push({ source: file, link: link });
            }
            continue;
          }
          
          // Check if path exists
          const exists = fs.existsSync(targetPath);
          checkedPaths.set(targetPath, exists);
          
          if (!exists) {
            broken.push({ source: file, link: link });
          }
        }
      } catch (fileError) {
        console.warn(`Could not process ${file}: ${fileError.message}`);
      }
    }
    
    console.log(`Processed ${Math.min(i + batchSize, htmlFiles.length)} of ${htmlFiles.length} files`);
  }
  
  if (broken.length > 0) {
    console.warn('Found broken links:');
    broken.forEach(b => console.warn(`  ${b.source} -> ${b.link}`));
    process.exit(1); // Exit with error code if broken links found
  } else {
    console.log('No broken links found.');
  }
}

if (require.main === module) {
  validateLinks();
}
