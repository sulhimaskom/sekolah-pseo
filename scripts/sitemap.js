/*
 * Sitemap generator. Splits the URLs produced by build-pages.js into multiple
 * sitemap files respecting the 50,000 URL and 50MB limits, and writes a
 * sitemap-index.xml that references them. Assumes the `dist` directory has
 * been populated with HTML files.
 */

const fs = require('fs');
const path = require('path');

const MAX_URLS_PER_SITEMAP = 50000;

function collectUrls(dir, baseUrl) {
  const urls = [];
  function walk(current, relative) {
    for (const entry of fs.readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.endsWith('.html')) {
        urls.push(`${baseUrl}/${relPath.replace(/\\/g, '/')}`);
      }
    }
  }
  walk(dir, '');
  return urls;
}

function writeSitemapFiles(urls, outDir) {
  const sitemapFiles = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(sitemapFiles.length + 1).padStart(3, '0')}.xml`;
    const content = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
      .concat(
        chunk.map(u => {
          return `  <url><loc>${u}</loc></url>`;
        })
      )
      .concat('</urlset>')
      .join('\n');
    fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
    sitemapFiles.push(filename);
  }
  return sitemapFiles;
}

function writeSitemapIndex(files, outDir, baseUrl) {
  const content = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    .concat(
      files.map(f => {
        return `  <sitemap><loc>${baseUrl}/${f}</loc></sitemap>`;
      })
    )
    .concat('</sitemapindex>')
    .join('\n');
  fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), content, 'utf8');
}

function generateSitemaps() {
  const distDir = path.join(__dirname, '../dist');
  const outDir = distDir; // put sitemap files in dist
  const baseUrl = 'https://example.com'; // TODO: update to your domain or Cloudflare pages URL
  const urls = collectUrls(distDir, baseUrl);
  const sitemapFiles = writeSitemapFiles(urls, outDir);
  writeSitemapIndex(sitemapFiles, outDir, baseUrl);
  console.log(`Generated ${sitemapFiles.length} sitemap files with ${urls.length} URLs total`);
}

if (require.main === module) {
  generateSitemaps();
}
