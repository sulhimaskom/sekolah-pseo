/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This implementation uses asynchronous operations and
 * concurrency for better performance on large datasets.
 */

const fs = require('fs').promises;
const path = require('path');

async function collectHtmlFiles(dir) {
  // Validate input
  if (!dir || typeof dir !== 'string') {
    throw new Error('Invalid directory path');
  }
  
  // Validate dir to prevent path traversal
  const resolvedDir = path.resolve(dir);
  if (!resolvedDir.startsWith(path.resolve(path.join(__dirname, '../')))) {
    throw new Error('Directory path must be within the project directory');
  }
  
  const files = [];
  async function walk(current) {
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
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  
  try {
    await walk(dir);
  } catch (error) {
    console.error(`Error collecting HTML files from ${dir}:`, error.message);
    throw error;
  }
  
  return files;
}

function extractLinks(html) {
  // Validate input
  if (typeof html !== 'string') {
    return [];
  }
  
  const matches = [];
  // Cache the regex to avoid recreating it each time
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

async function validateLinks() {
  try {
    const distDir = path.join(__dirname, '../dist');
    
    // Check if dist directory exists
    try {
      await fs.access(distDir);
    } catch (error) {
      console.warn(`Dist directory not found at ${distDir}. Nothing to validate.`);
      return true;
    }
    
    const htmlFiles = await collectHtmlFiles(distDir);
    
    console.log(`Found ${htmlFiles.length} HTML files to validate`);
    
    // If no files found, return early
    if (htmlFiles.length === 0) {
      console.log('No HTML files found to validate.');
      return true;
    }
    
    // Process files concurrently with a controlled concurrency limit
    const concurrencyLimit = parseInt(process.env.VALIDATION_CONCURRENCY_LIMIT) || 50;
    
    // Validate concurrencyLimit
    if (isNaN(concurrencyLimit) || concurrencyLimit <= 0) {
      concurrencyLimit = 50; // Default value
    }
    
    const broken = [];
    
    for (let i = 0; i < htmlFiles.length; i += concurrencyLimit) {
      const batch = htmlFiles.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (file) => {
        try {
          // Validate file path to prevent path traversal
          const resolvedFile = path.resolve(file);
          const distDirResolved = path.resolve(distDir);
          if (!resolvedFile.startsWith(distDirResolved)) {
            console.warn(`Skipping file outside of dist directory: ${file}`);
            return [];
          }
          
          const content = await fs.readFile(file, 'utf8');
          const links = extractLinks(content);
          const brokenInFile = [];
          
          for (const link of links) {
            // Skip empty links, anchor links, and external links
            if (!link || link === '#' || link.startsWith('#') || /^https?:/.test(link)) {
              continue;
            }
            
            // Normalize path: remove query/hash
            const clean = link.split(/[?#]/)[0];
            
            // Validate clean path to prevent path traversal
            if (clean.includes('..')) {
              brokenInFile.push({ source: file, link: link, reason: 'Path traversal detected' });
              continue;
            }
            
            const targetPath = path.join(path.dirname(file), clean);
            
            // Validate targetPath to prevent path traversal
            const resolvedTarget = path.resolve(targetPath);
            if (!resolvedTarget.startsWith(distDirResolved)) {
              brokenInFile.push({ source: file, link: link, reason: 'Path traversal detected' });
              continue;
            }
            
            try {
              await fs.access(targetPath);
            } catch (error) {
              // Only report as broken if it's not a directory (which would be a valid path)
              try {
                const stat = await fs.stat(targetPath);
                if (!stat.isDirectory()) {
                  brokenInFile.push({ source: file, link: link });
                }
              } catch {
                brokenInFile.push({ source: file, link: link });
              }
            }
          }
          
          return brokenInFile;
        } catch (error) {
          console.warn(`Failed to read file ${file}: ${error.message}`);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.flat().forEach(brokenLink => broken.push(brokenLink));
      
      // Log progress
      console.log(`Processed ${Math.min(i + concurrencyLimit, htmlFiles.length)} of ${htmlFiles.length} files`);
    }
    
    if (broken.length > 0) {
      console.warn(`Found ${broken.length} broken links:`);
      broken.forEach(b => {
        if (b.reason) {
          console.warn(`  ${b.source} -> ${b.link} (${b.reason})`);
        } else {
          console.warn(`  ${b.source} -> ${b.link}`);
        }
      });
      return false;
    } else {
      console.log('No broken links found.');
      return true;
    }
  } catch (error) {
    console.error('Link validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  validateLinks().catch(error => {
    console.error('Link validation failed:', error);
    process.exit(1);
  });
}
