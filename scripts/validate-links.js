/*
 * Link validation script. Crawls generated HTML files and checks internal
 * hyperlinks to ensure they resolve to existing files. Outputs a report of
 * broken links. This is a simple synchronous implementation suitable for
 * small datasets. For larger sites consider streaming and concurrency.
 */

const fs = require('fs');
const path = require('path');

function collectHtmlFiles(dir) {
  const files = [];
  function walk(current) {
    const entries = fs.readdirSync(current);
    for (const entry of entries) {
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

function extractLinks(html) {
  const matches = [];
  const regex = /href=\"([^\"]+)\"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // consider only relative links
    if (href && !href.match(/^https?:/)) {
      matches.push(href);
    }
  }
  return matches;
}

function validateLinks() {
  const distDir = path.join(__dirname, '../dist');
  const htmlFiles = collectHtmlFiles(distDir);
  const broken = [];
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content);
    links.forEach(link => {
      // Normalize path: remove query/hash
      const clean = link.split(/[?#]/)[0];
      const targetPath = path.join(path.dirname(file), clean);
      if (!fs.existsSync(targetPath)) {
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
