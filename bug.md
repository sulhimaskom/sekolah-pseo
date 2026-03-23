# Bug Report

- [x] bug: scripts/config.test.js failure because ROOT_DIR check is too specific ('sekolah-pseo'). Current ROOT_DIR is '/app'.
- [x] bug: Broken link in public/404.html pointing to /sitemap-index.xml. Link validator reports this as broken because it's an absolute path but might not be correctly handled or the file is missing in some contexts. Actually, validate-links.js reported: `/app/dist/404.html -> /sitemap-index.xml` as broken. Fixed by changing to relative path `sitemap-index.xml`.
