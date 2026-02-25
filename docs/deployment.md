# Deployment Guide

This guide covers deploying the generated static site to various hosting platforms.

## Overview

The Sekolah PSEO project generates static HTML pages in the `dist/` directory. These files can be deployed to any static hosting service.

## Prerequisites

Before deploying, ensure you have:

1. Run the build pipeline:

   ```bash
   npm run etl
   npm run build
   npm run sitemap
   ```

2. Verify the output in `dist/`:
   ```bash
   ls -la dist/
   ```

## Build Output

The build process generates the following structure:

```
dist/
├── styles.css              # Shared CSS file
├── sitemap-index.xml       # Sitemap index
├── sitemap-001.xml         # Sitemap file(s)
├── provinsi/               # Province directories
│   ├── dki-jakarta/
│   │   └── kabupaten/
│   │       └── jakarta-pusat/
│   │           └── kecamatan/
│   │               └── menteng/
│   │                   └── 12345678-school-name.html
│   └── jawa-barat/
│       └── ...
└── ...
```

## Deployment Options

### GitHub Pages

**Option 1: Using GitHub Actions (Recommended)**

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: |
          npm run etl
          npm run build
          npm run sitemap
        env:
          SITE_URL: ${{ vars.SITE_URL }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)

3. Add `SITE_URL` in repository settings (optional):
   - Settings → Secrets and variables → Variables

**Option 2: Manual Deploy**

```bash
# Build the site
npm run etl && npm run build && npm run sitemap

# Initialize git if needed
git init
git checkout -b gh-pages

# Add all dist files
git add dist/ -f
git commit -m "Deploy to GitHub Pages"

# Push to remote
git push origin gh-pages --force
```

---

### Netlify

**Option 1: Using Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the site
npm run etl && npm run build && npm run sitemap

# Deploy
netlify deploy --prod --dir=dist
```

**Option 2: Using Netlify Dashboard**

1. Push your code to GitHub
2. Connect your repository in Netlify dashboard
3. Configure build settings:
   - Build command: `npm run etl && npm run build && npm run sitemap`
   - Publish directory: `dist`
4. Add environment variable:
   - `SITE_URL`: Your Netlify URL (e.g., `https://your-site.netlify.app`)

**Option 3: Drag and Drop**

1. Run the build locally:
   ```bash
   npm run etl && npm run build && npm run sitemap
   ```
2. Go to Netlify Drop: https://app.netlify.com/drop
3. Drag the `dist/` folder to the drop zone

---

### Vercel

**Option 1: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Build the site
npm run etl && npm run build && npm run sitemap

# Deploy
vercel --prod --dist-dir=dist
```

**Option 2: Using Vercel Dashboard**

1. Import your GitHub repository in Vercel
2. Configure project settings:
   - Framework Preset: Other
   - Build Command: `npm run etl && npm run build && npm run sitemap`
   - Output Directory: `dist`
3. Add environment variable:
   - `SITE_URL`: Your Vercel URL

---

### Traditional Hosting (FTP/SFTP)

**Using lftp:**

```bash
# Build first
npm run etl && npm run build && npm run sitemap

# Connect and upload
lftp -e "set ftp:ssl-allow no; mirror -R dist/ /public_html; quit" \
  -u username,password ftp.yourhost.com
```

**Using scp:**

```bash
# Build first
npm run etl && npm run build && npm run sitemap

# Upload via scp
scp -r dist/* user@yourserver.com:/var/www/html/
```

---

### Docker

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run etl && npm run build && npm run sitemap

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t sekolah-pseo .
docker run -p 8080:80 sekolah-pseo
```

---

## Environment Configuration

Set the `SITE_URL` environment variable before building for correct sitemap generation:

| Platform       | How to Set                               |
| -------------- | ---------------------------------------- |
| GitHub Actions | Repository Settings → Secrets/Variables  |
| Netlify        | Site Settings → Environment Variables    |
| Vercel         | Project Settings → Environment Variables |
| Docker         | Dockerfile or docker-compose.yml         |
| Local          | `.env` file or shell export              |

Example `.env` file:

```env
SITE_URL=https://sekolah-pseo.example.com
BUILD_CONCURRENCY_LIMIT=100
VALIDATION_CONCURRENCY_LIMIT=50
MAX_URLS_PER_SITEMAP=50000
```

## Post-Deployment

### Verify Deployment

1. **Check sitemap**: Visit `https://your-domain.com/sitemap-index.xml`
2. **Validate links**: Run `npm run validate-links`
3. **Test pages**: Open a few school pages to verify they render correctly

### Search Engine Indexing

The generated sitemap files help search engines index your site:

1. **Google Search Console**: Submit your sitemap at https://search.google.com/search-console
2. **Bing Webmaster Tools**: Submit sitemap at https://www.bing.com/webmasters
3. **Sitemap URL**: `https://your-domain.com/sitemap-index.xml`

### Custom Domain

**Netlify:**

```bash
netlify domain add yourdomain.com
netlify domain add www.yourdomain.com
```

**Vercel:**
Add custom domain in project settings (automatic SSL provided)

**Traditional:**

- Update DNS A record to point to your server IP
- Configure SSL/TLS certificate

---

## Troubleshooting

### Broken Links After Deployment

If `npm run validate-links` shows broken links:

1. Ensure `SITE_URL` matches your actual deployment URL
2. Rebuild after changing `SITE_URL`:
   ```bash
   npm run etl && npm run build && npm run sitemap
   ```

### Missing Pages

1. Check if all school data was processed: `ls data/schools.csv`
2. Verify build completed without errors
3. Check `dist/` contains all expected directories

### Sitemap Not Found

1. Ensure you ran `npm run sitemap` after `npm run build`
2. Verify `SITE_URL` is set correctly in environment
3. Check `dist/sitemap-index.xml` exists

### SSL/HTTPS Issues

| Platform     | Solution                                |
| ------------ | --------------------------------------- |
| Netlify      | Automatic (enabled by default)          |
| Vercel       | Automatic (enabled by default)          |
| GitHub Pages | Automatic (enabled in settings)         |
| Traditional  | Install Let's Encrypt or use cloudflare |

---

## CI/CD Integration Example

### GitHub Actions Full Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: |
          npm run etl
          npm run build
          npm run sitemap
        env:
          SITE_URL: ${{ vars.SITE_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Performance Considerations

### CDN Usage

All major platforms (Netlify, Vercel, GitHub Pages) include CDN by default. For traditional hosting:

1. Use Cloudflare for free CDN
2. Enable caching headers in nginx/apache config

### Caching Headers

Add to `nginx.conf`:

```nginx
location / {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

---

## Next Steps

- [Architecture Blueprint](blueprint.md) - Technical details
- [API Documentation](api.md) - Module contracts
- [Testing Guide](testing.md) - Test details
- [Setup Guide](setup.md) - Development setup
