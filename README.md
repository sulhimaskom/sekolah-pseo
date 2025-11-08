# sekolah-pseo
Static site generator for Indonesian schools dataset (pSEO)

## Overview
This project generates static websites for Indonesian schools using data from the national school database. It processes school information and creates individual pages for each school, organized by province, district, and sub-district.

## Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

## Installation
```bash
npm install
```

## Usage
1. **Process school data** (if you have a raw dataset):
   ```bash
   npm run etl
   ```

2. **Generate static pages**:
   ```bash
   npm run build
   ```

3. **Generate sitemaps**:
   ```bash
   npm run sitemap
   ```

4. **Validate internal links**:
   ```bash
   npm run validate
   ```

## Project Structure
- `scripts/` - Node.js scripts for data processing and site generation
- `src/templates/` - Astro templates for page generation
- `schools.csv` - Processed school data (CSV format)
- `dist/` - Generated static site files (created during build)

## Security Features
- HTML escaping to prevent XSS attacks
- Path traversal protection in link validation
- Input sanitization for school data
- URL length validation

## Performance Optimizations
- Batch processing for large datasets
- Efficient file system operations
- Memory usage optimization for large CSV files
