/*
 * Static page generator. Reads the normalised schools dataset and writes
 * individual pages for each school as well as index pages for provinces,
 * kabupaten/kota and kecamatan.
 *
 * This script is a skeleton to illustrate the structure expected by the
 * project plan. To actually generate pages you need to integrate with
 * your chosen SSG (Astro or Eleventy) and template files under src/templates.
 */

const fs = require('fs');
const path = require('path');
const slugify = require('./slugify');

/**
 * Load the processed schools CSV into an array of objects.
 */
function loadSchools() {
  const csvPath = path.join(__dirname, '../data/schools.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Schools data file not found at ${csvPath}. Please run ETL script first.`);
  }
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or contains only header');
  }
  const header = lines.shift().split(',');
  return lines.map(l => {
    const values = l.split(',');
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

/**
 * Write a single school page. In a real implementation you would render an
 * Astro/Eleventy template here. For now we create a simple HTML stub with
 * placeholders.
 *
 * @param {Object} school
 */
function writeSchoolPage(school) {
  // Validate required fields
  if (!school.npsn || !school.nama) {
    console.warn('Skipping school with missing NPSN or name:', school);
    return;
  }
  
  const outDir = path.join(
    __dirname,
    '..',
    'dist',
    'provinsi',
    slugify(school.provinsi),
    'kabupaten',
    slugify(school.kab_kota),
    'kecamatan',
    slugify(school.kecamatan)
  );
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const filename = `${school.npsn}-${slugify(school.nama)}.html`;
  const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>${school.nama}</title>\n</head>\n<body>\n  <h1>${school.nama}</h1>\n  <p>Alamat: ${school.alamat}</p>\n  <p>Jenjang: ${school.bentuk_pendidikan}</p>\n  <p>Status: ${school.status}</p>\n  <!-- TODO: Insert generator and FAQ components here -->\n</body>\n</html>`;
  fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
}

/**
 * Write index pages for provinces, kabupaten/kota and kecamatan
 * @param {Array<Object>} schools
 */
function writeIndexPages(schools) {
  // Group schools by region
  const provinces = {};
  const kabupaten = {};
  const kecamatan = {};
  
  schools.forEach(school => {
    // Province index
    const provinsiSlug = slugify(school.provinsi);
    if (!provinces[provinsiSlug]) {
      provinces[provinsiSlug] = {
        name: school.provinsi,
        schools: []
      };
    }
    provinces[provinsiSlug].schools.push(school);
    
    // Kabupaten/Kota index
    const kabupatenSlug = `${provinsiSlug}/${slugify(school.kab_kota)}`;
    if (!kabupaten[kabupatenSlug]) {
      kabupaten[kabupatenSlug] = {
        name: school.kab_kota,
        province: school.provinsi,
        schools: []
      };
    }
    kabupaten[kabupatenSlug].schools.push(school);
    
    // Kecamatan index
    const kecamatanSlug = `${kabupatenSlug}/${slugify(school.kecamatan)}`;
    if (!kecamatan[kecamatanSlug]) {
      kecamatan[kecamatanSlug] = {
        name: school.kecamatan,
        kabupaten: school.kab_kota,
        province: school.provinsi,
        schools: []
      };
    }
    kecamatan[kecamatanSlug].schools.push(school);
  });
  
  // Write province index pages
  Object.keys(provinces).forEach(provinsiSlug => {
    const provinceData = provinces[provinsiSlug];
    const outDir = path.join(__dirname, '..', 'dist', 'provinsi', provinsiSlug);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>Sekolah di ${provinceData.name}</title>\n</head>\n<body>\n  <h1>Daftar Sekolah di ${provinceData.name}</h1>\n  <ul>\n${provinceData.schools.map(school => `    <li><a href="../provinsi/${provinsiSlug}/kabupaten/${slugify(school.kab_kota)}/kecamatan/${slugify(school.kecamatan)}/${school.npsn}-${slugify(school.nama)}.html">${school.nama}</a></li>`).join('\n')}\n  </ul>\n</body>\n</html>`;
    fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
  });
  
  // Write kabupaten/kota index pages
  Object.keys(kabupaten).forEach(kabupatenSlug => {
    const kabupatenData = kabupaten[kabupatenSlug];
    const outDir = path.join(__dirname, '..', 'dist', 'provinsi', kabupatenSlug);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>Sekolah di ${kabupatenData.name}, ${kabupatenData.province}</title>\n</head>\n<body>\n  <h1>Daftar Sekolah di ${kabupatenData.name}, ${kabupatenData.province}</h1>\n  <ul>\n${kabupatenData.schools.map(school => `    <li><a href="../../kecamatan/${slugify(school.kecamatan)}/${school.npsn}-${slugify(school.nama)}.html">${school.nama}</a></li>`).join('\n')}\n  </ul>\n</body>\n</html>`;
    fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
  });
  
  // Write kecamatan index pages
  Object.keys(kecamatan).forEach(kecamatanSlug => {
    const kecamatanData = kecamatan[kecamatanSlug];
    const outDir = path.join(__dirname, '..', 'dist', 'provinsi', kecamatanSlug);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const content = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="utf-8" />\n  <title>Sekolah di ${kecamatanData.name}, ${kecamatanData.kabupaten}, ${kecamatanData.province}</title>\n</head>\n<body>\n  <h1>Daftar Sekolah di ${kecamatanData.name}, ${kecamatanData.kabupaten}, ${kecamatanData.province}</h1>\n  <ul>\n${kecamatanData.schools.map(school => `    <li><a href="${school.npsn}-${slugify(school.nama)}.html">${school.nama}</a></li>`).join('\n')}\n  </ul>\n</body>\n</html>`;
    fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
  });
}

/**
 * Main build function. Iterates over all schools, writing pages. You can add
 * flags to limit by region to adhere to the monthly build cap.
 */
function build() {
  try {
    const schools = loadSchools();
    console.log(`Loaded ${schools.length} schools from data file`);
    
    // Process schools in batches to avoid memory issues with large datasets
    const batchSize = 1000;
    let processedCount = 0;
    
    for (let i = 0; i < schools.length; i += batchSize) {
      const batch = schools.slice(i, i + batchSize);
      batch.forEach(writeSchoolPage);
      processedCount += batch.length;
      console.log(`Processed ${processedCount}/${schools.length} schools`);
    }
    
    // Write index pages
    writeIndexPages(schools);
    
    console.log(`Generated ${schools.length} school pages and index pages`);
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}