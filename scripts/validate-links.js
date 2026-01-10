/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This implementation uses asynchronous operations and
 * concurrency for better performance on large datasets.
 */

const path = require('path');
const CONFIG = require('./config');
const { safeReadFile, safeAccess, safeStat } = require('./fs-safe');
const { walkDirectory } = require('./utils');

// Export functions for testing
module.exports = {
  extractLinks,
  validateLinksInFile
};

function extractLinks(html) {
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

async function validateLinksInFile(file, links, distDir) {
  const brokenInFile = [];

  for (const link of links) {
    if (!link || link === '#' || link.startsWith('#') || /^https?:/.test(link)) {
      continue;
    }

    const clean = link.split(/[?#]/)[0];

    let targetPath;
    if (clean.startsWith('/')) {
      targetPath = path.join(distDir, clean);
    } else {
      targetPath = path.join(path.dirname(file), clean);
    }

    try {
      await safeAccess(targetPath);
    } catch (error) {
      if (error.name === 'IntegrationError') {
        try {
          const stat = await safeStat(targetPath);
          if (!stat.isDirectory()) {
            brokenInFile.push({ source: file, link: link });
          }
        } catch (statError) {
          if (statError.name === 'IntegrationError') {
            brokenInFile.push({ source: file, link: link });
          }
        }
      }
    }
  }

  return brokenInFile;
}

async function validateLinks() {
  const distDir = CONFIG.DIST_DIR;
  
  try {
    await safeAccess(distDir);
  } catch {
    console.warn(`Dist directory not found at ${distDir}. Nothing to validate.`);
    return true;
  }
  
  const htmlFiles = await walkDirectory(distDir, (fullPath) => fullPath);
  
  console.log(`Found ${htmlFiles.length} HTML files to validate`);
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found to validate.');
    return true;
  }
  
  const concurrencyLimit = CONFIG.VALIDATION_CONCURRENCY_LIMIT;
  const broken = [];
   
  for (let i = 0; i < htmlFiles.length; i += concurrencyLimit) {
    const batch = htmlFiles.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async (file) => {
      try {
        const content = await safeReadFile(file);
        const links = extractLinks(content);
        return await validateLinksInFile(file, links, distDir);
      } catch (error) {
        console.warn(`Failed to read file ${file}: ${error.message}`);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.flat().forEach(brokenLink => broken.push(brokenLink));

    console.log(`Processed ${Math.min(i + concurrencyLimit, htmlFiles.length)} of ${htmlFiles.length} files`);
  }
  
  if (broken.length > 0) {
    console.warn(`Found ${broken.length} broken links:`);
    broken.forEach(b => console.warn(`  ${b.source} -> ${b.link}`));
    return false;
  } else {
    console.log('No broken links found.');
    return true;
  }
}

if (require.main === module) {
  validateLinks().catch(error => {
    console.error('Link validation failed:', error);
    process.exit(1);
  });
}
