const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

// F069: pin the failed-pages budget to the default (0) so the enforcement
// test is deterministic regardless of the runner environment.
process.env.PERF_MAX_FAILED_PAGES = '0';

// F052 fix: node --test runs test files in parallel child processes;
// this file previously removed/wrote the REAL CONFIG.DIST_DIR (dist/) and
// CONFIG.ROOT_DIR/.build-manifest.json, racing with other test files (and
// concurrent suite runs) that share those paths — observed as FILE_READ_ERROR,
// ENOTEMPTY rmdir and missing-page failures under load. Redirect both to a
// per-process temp dir BEFORE requiring build-pages: BuildOrchestrator,
// ExportService and SearchDataService all capture CONFIG.DIST_DIR at module
// load (const distDir = CONFIG.DIST_DIR), and manifest.js resolves the
// manifest path from CONFIG.ROOT_DIR at call time.
const CONFIG = require('./config');
const { withConfig } = require('./test-helpers');
CONFIG.ROOT_DIR = path.join(os.tmpdir(), `build-pages-test-root-${process.pid}`);
CONFIG.DIST_DIR = path.join(CONFIG.ROOT_DIR, 'dist');

const {
  writeSchoolPage,
  writeSchoolPagesConcurrently,
  loadSchools,
  generateExternalStyles,
  generateRobotsTxt,
  ensureDistDir,
  exportSchoolsCsv,
  writeSearchDataFile,
  preCreateProvinceDirectories,
  generateProvincePages,
  generateKabupatenPages,
  generateKecamatanPages,
  build,
  buildIncremental,
  createManifestFromSchools,
} = require('./build-pages');
const { resetCircuitBreakers } = require('./fs-safe');
const { MANIFEST_VERSION } = require('./manifest');
const slugify = require('./slugify');

// Retry file existence checks with backoff to handle transient
// filesystem delays under parallel CI I/O load (parallel test workers
// sharing the same disk can cause fs.access to not immediately see
// files after fs.writeFile resolves).
async function waitForFile(filePath, maxRetries = 15, delayMs = 200) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) return true;
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

test.before(async () => {
  process.env.TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'build-pages-test-'));

  // Ensure clean state for integration tests: remove stale dist/ and manifest
  // This prevents circuit breaker cascade failures from stale build artifacts
  try {
    await fs.rm(CONFIG.DIST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore if dist/ doesn't exist
  }
  try {
    await fs.rm(path.join(CONFIG.ROOT_DIR, '.build-manifest.json'), { force: true });
  } catch {
    // Ignore if manifest doesn't exist
  }
});

// Reset circuit breakers before each test to prevent state pollution from
// other test files that share the fs-safe singleton circuit breaker instance.
// Without this, tests can fail with "Circuit breaker is OPEN" errors when
// run as part of the full test suite (node --test scripts/*.test.js).
test.beforeEach(() => {
  resetCircuitBreakers();
});

test.after(async () => {
  const testDir = process.env.TEST_TEMP_DIR;
  if (testDir) {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to cleanup test directory: ${err.message}`);
    }
  }
});

test('writeSchoolPage validates required school fields - null input', async () => {
  await assert.rejects(async () => await writeSchoolPage(null), /Invalid school object provided/);
});

test('writeSchoolPage validates required school fields - missing nama', async () => {
  await assert.rejects(
    async () =>
      await writeSchoolPage({ provinsi: 'Prov', kab_kota: 'Kab', kecamatan: 'Kec', npsn: '12345' }),
    /School object missing required fields/
  );
});

test('writeSchoolPage validates required school fields - missing npsn', async () => {
  await assert.rejects(
    async () =>
      await writeSchoolPage({
        provinsi: 'Prov',
        kab_kota: 'Kab',
        kecamatan: 'Kec',
        nama: 'School',
      }),
    /School object missing required fields/
  );
});

test('writeSchoolPage validates required school fields - missing provinsi', async () => {
  await assert.rejects(
    async () =>
      await writeSchoolPage({ kab_kota: 'Kab', kecamatan: 'Kec', npsn: '12345', nama: 'School' }),
    /School object missing required fields/
  );
});

test('writeSchoolPage validates required school fields - missing kab_kota', async () => {
  await assert.rejects(
    async () =>
      await writeSchoolPage({ provinsi: 'Prov', kecamatan: 'Kec', npsn: '12345', nama: 'School' }),
    /School object missing required fields/
  );
});

test('writeSchoolPage validates required school fields - missing kecamatan', async () => {
  await assert.rejects(
    async () =>
      await writeSchoolPage({ provinsi: 'Prov', kab_kota: 'Kab', npsn: '12345', nama: 'School' }),
    /School object missing required fields/
  );
});

test('writeSchoolPagesConcurrently handles empty array', async () => {
  const result = await writeSchoolPagesConcurrently([], 5);
  assert.deepStrictEqual(result, { successful: 0, failed: 0 });
});

test('writeSchoolPagesConcurrently handles partial failures', async () => {
  const schools = [
    {
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      npsn: '20001',
      nama: 'Valid School',
      alamat: 'Alamat',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
    },
    {
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      npsn: '20002',
      nama: 'Invalid School',
    },
  ];

  const result = await writeSchoolPagesConcurrently(schools, 2);
  assert.strictEqual(result.successful, 1);
  assert.strictEqual(result.failed, 1);
});

test('writeSchoolPagesConcurrently handles all failures', async () => {
  const schools = [
    {
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      npsn: '30001',
      nama: 'Invalid School 1',
    },
    {
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      npsn: '30002',
      nama: 'Invalid School 2',
    },
  ];

  const result = await writeSchoolPagesConcurrently(schools, 2);
  assert.strictEqual(result.successful, 0);
  assert.strictEqual(result.failed, 2);
});

test('build rejects with PERFORMANCE_BUDGET_VIOLATION when school pages fail (F069)', async () => {
  // F069: build() must fail loudly when pages fail instead of exiting 0.
  // Use a CSV with one valid school and one school missing required fields
  // (writeSchoolPage rejects for it), so writeSchoolPagesConcurrently
  // reports failed=1 while shared page generation tolerates the row.
  const tempCsvPath = path.join(CONFIG.ROOT_DIR, 'schools-f069.csv');
  const csvContent = [
    'npsn,nama,bentuk_pendidikan,status,alamat,kelurahan,kecamatan,kab_kota,provinsi,lat,lon,updated_at',
    '99001,SMA Negeri F069,SMA,N,Jl. Test No. 1,Gambir,Gambir,Jakarta Pusat,DKI Jakarta,-6.2,106.8,2026-08-10',
    '99002,SD Incomplete',
  ].join('\n');

  try {
    await fs.writeFile(tempCsvPath, csvContent);
    await withConfig({ SCHOOLS_CSV_PATH: tempCsvPath }, async () => {
      await assert.rejects(build(), error => {
        assert.strictEqual(error.code, 'PERFORMANCE_BUDGET_VIOLATION');
        assert.match(error.message, /Failed pages 1 exceeds budget of 0/);
        return true;
      });
    });
  } finally {
    await fs.unlink(tempCsvPath).catch(() => {});
  }
});

test('loadSchools throws error when file not found', async () => {
  await withConfig({ SCHOOLS_CSV_PATH: '/nonexistent/path/schools.csv' }, async () => {
    await assert.rejects(loadSchools(), /Failed to read file/);
  });
});

test('loadSchools throws error when CSV is empty', async () => {
  // Use the actual schools.csv but it should have data
  const schools = await loadSchools();
  assert.ok(schools.length > 0, 'Should load schools from valid CSV');
});

test('slugify integration: creates correct slugs for Indonesian place names', () => {
  assert.strictEqual(slugify('Jawa Barat'), 'jawa-barat');
  assert.strictEqual(slugify('DKI Jakarta'), 'dki-jakarta');
  assert.strictEqual(slugify('Kabupaten Bandung'), 'kabupaten-bandung');
  assert.strictEqual(slugify('Kecamatan Coblong'), 'kecamatan-coblong');
});

test('slugify integration: handles school names correctly', () => {
  assert.strictEqual(slugify('SMA Negeri 1 Bandung'), 'sma-negeri-1-bandung');
  assert.strictEqual(slugify('SD Negeri Cibadak 01'), 'sd-negeri-cibadak-01');
  assert.strictEqual(slugify('SMK Telkom Bandung'), 'smk-telkom-bandung');
  assert.strictEqual(slugify('Sekolah Dasar Islam Terpadu'), 'sekolah-dasar-islam-terpadu');
});

test('slugify integration: removes diacritics from Indonesian characters', () => {
  assert.strictEqual(slugify('Jawa Tengah'), 'jawa-tengah');
  assert.strictEqual(slugify('Yogyakarta'), 'yogyakarta');
  assert.strictEqual(slugify('Surabaya'), 'surabaya');
});

test('generateExternalStyles creates external CSS file', async () => {
  await generateExternalStyles();

  const stylesPath = path.join(CONFIG.DIST_DIR, 'styles.css');
  const exists = await fs
    .access(stylesPath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'styles.css should be created');

  const cssContent = await fs.readFile(stylesPath, 'utf-8');
  assert.ok(cssContent.includes(':root'), 'CSS should contain :root selector');
  assert.ok(cssContent.includes('--color-primary'), 'CSS should contain CSS variables');
  assert.ok(cssContent.includes('.skip-link'), 'CSS should contain skip link styles');
});

test('createManifestFromSchools creates valid manifest structure', () => {
  const schools = [
    {
      npsn: '10001',
      nama: 'SMA Negeri 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Merdeka',
      kelurahan: 'Coblong',
      lat: '-6.1234',
      lon: '106.5678',
    },
    {
      npsn: '10002',
      nama: 'SMA Negeri 2',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Bandung Wetan',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Sudirman',
      lat: '-6.2345',
      lon: '106.6789',
    },
  ];

  const manifest = createManifestFromSchools(schools);

  assert.ok(manifest, 'manifest should be created');
  assert.strictEqual(
    manifest.version,
    MANIFEST_VERSION,
    'manifest version should match MANIFEST_VERSION'
  );
  assert.ok(manifest.lastBuild, 'manifest should have lastBuild timestamp');
  assert.ok(manifest.schools, 'manifest should have schools object');
  assert.strictEqual(Object.keys(manifest.schools).length, 2, 'manifest should have 2 schools');

  // Check first school
  assert.ok(manifest.schools['10001'], 'school 10001 should exist');
  assert.ok(manifest.schools['10001'].hash, 'school should have hash');
  assert.ok(manifest.schools['10001'].builtAt, 'school should have builtAt');
  assert.ok(manifest.schools['10001'].path, 'school should have path');

  // Check second school (missing optional fields)
  assert.ok(manifest.schools['10002'], 'school 10002 should exist');
  assert.ok(
    manifest.schools['10002'].hash,
    'school should have hash even with missing optional fields'
  );
});

test('createManifestFromSchools handles empty array', () => {
  const manifest = createManifestFromSchools([]);

  assert.ok(manifest, 'manifest should be created');
  assert.strictEqual(
    manifest.version,
    MANIFEST_VERSION,
    'manifest version should match MANIFEST_VERSION'
  );
  assert.ok(manifest.lastBuild, 'manifest should have lastBuild timestamp');
  assert.deepStrictEqual(manifest.schools, {}, 'schools should be empty object');
});

test('build creates dist directory and generates files', async () => {
  // Reset circuit breakers to prevent state pollution from other test files
  // that share the fs-safe singleton circuit breaker instance
  resetCircuitBreakers();

  // Run build to test it
  await build();

  // Verify dist directory exists
  const distExists = await waitForFile(CONFIG.DIST_DIR);
  assert.ok(distExists, 'dist directory should exist');

  // Verify index.html was created
  const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
  const indexExists = await waitForFile(indexPath);
  assert.ok(indexExists, 'index.html should be created');

  // Verify manifest was created
  const manifestPath = path.join(CONFIG.ROOT_DIR, '.build-manifest.json');
  const manifestExists = await waitForFile(manifestPath);
  assert.ok(manifestExists, 'manifest should be created');

  // F024: robots.txt advertises sitemap-index.xml, so the build must produce it
  const sitemapIndexPath = path.join(CONFIG.DIST_DIR, 'sitemap-index.xml');
  const sitemapIndexExists = await waitForFile(sitemapIndexPath);
  assert.ok(sitemapIndexExists, 'sitemap-index.xml should be created by build');
});

test('buildIncremental runs without error when manifest exists', async () => {
  // First run full build to create manifest
  await build();

  // Then run incremental build
  await buildIncremental();

  // Use waitForFile to handle race conditions with other test processes
  // that share the dist/ directory when running in parallel
  const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
  const indexExists = await waitForFile(indexPath);
  assert.ok(indexExists, 'index.html should exist after incremental build');
});

test('buildIncremental performs full build when no manifest exists', async () => {
  // Remove manifest to simulate first run
  const manifestPath = path.join(CONFIG.ROOT_DIR, '.build-manifest.json');
  try {
    await fs.unlink(manifestPath);
  } catch {
    // Ignore if manifest doesn't exist
  }

  // Run incremental build without manifest - should perform full build
  await buildIncremental();

  // Use waitForFile to handle race conditions with other test processes
  const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
  const exists = await waitForFile(indexPath);
  assert.ok(exists, 'index.html should exist after incremental build without manifest');
});

test('buildIncremental runs without error', async () => {
  // Remove manifest to simulate first run
  const manifestPath = path.join(CONFIG.ROOT_DIR, '.build-manifest.json');
  try {
    await fs.unlink(manifestPath);
  } catch {
    // Ignore if manifest doesn't exist
  }

  await buildIncremental();

  // Use waitForFile to handle race conditions with other test processes
  const indexPath = path.join(CONFIG.ROOT_DIR, 'dist', 'index.html');
  const exists = await waitForFile(indexPath);
  assert.ok(exists, 'index.html should exist after incremental build');
});

test('generateRobotsTxt creates robots.txt with correct sitemap URL', async () => {
  // Ensure dist directory exists
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await generateRobotsTxt('https://sekolah.example.com');

  const robotsPath = path.join(CONFIG.DIST_DIR, 'robots.txt');
  const content = await fs.readFile(robotsPath, 'utf-8');

  assert.ok(content.includes('User-agent: *'));
  assert.ok(content.includes('Allow: /'));
  assert.ok(content.includes('Sitemap: https://sekolah.example.com/sitemap-index.xml'));
});

test('generateRobotsTxt normalizes trailing slash in SITE_URL', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await generateRobotsTxt('https://sekolah.example.com/');

  const robotsPath = path.join(CONFIG.DIST_DIR, 'robots.txt');
  const content = await fs.readFile(robotsPath, 'utf-8');

  // URL should not have double slash
  assert.ok(content.includes('Sitemap: https://sekolah.example.com/sitemap-index.xml'));
  assert.ok(!content.includes('https://sekolah.example.com//sitemap-index.xml'));
});

// --- ensureDistDir tests ---

test('ensureDistDir creates dist directory when it does not exist', async () => {
  // Use a temp directory for isolation to avoid conflicts with other test files
  // running in parallel that share CONFIG.DIST_DIR
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ensureDistDir-test-'));
  const testDistDir = path.join(tempRoot, 'dist');

  const { safeMkdir } = require('./fs-safe');
  await safeMkdir(testDistDir);

  const exists = await fs
    .access(testDistDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'dist directory should be created');

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test('ensureDistDir does not throw when dist directory already exists', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await ensureDistDir();

  const exists = await fs
    .access(CONFIG.DIST_DIR)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'dist directory should still exist');
});

// --- exportSchoolsCsv tests ---

test('exportSchoolsCsv copies schools.csv to dist/data/', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await exportSchoolsCsv();

  const exportedPath = path.join(CONFIG.DIST_DIR, 'data', 'schools.csv');
  const exists = await fs
    .access(exportedPath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'schools.csv should be exported to dist/data/');

  const content = await fs.readFile(exportedPath, 'utf-8');
  assert.ok(content.length > 0, 'exported CSV should have content');
  assert.ok(content.includes('npsn'), 'exported CSV should contain npsn header');
  assert.ok(content.includes(','), 'exported CSV should be comma-separated');
});

test('exportSchoolsCsv creates dist/data/ directory if missing', async () => {
  await fs.rm(CONFIG.DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await exportSchoolsCsv();

  const dataDir = path.join(CONFIG.DIST_DIR, 'data');
  const dataDirExists = await fs
    .access(dataDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(dataDirExists, 'dist/data/ directory should be created');
});

// --- writeSearchDataFile tests ---

test('writeSearchDataFile creates schools.json from school data', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
    },
  ];

  await writeSearchDataFile(schools);

  const jsonPath = path.join(CONFIG.DIST_DIR, 'schools.json');
  const jsonExists = await fs
    .access(jsonPath)
    .then(() => true)
    .catch(() => false);
  assert.ok(jsonExists, 'schools.json should exist');

  const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
  assert.ok(Array.isArray(content), 'schools.json should be an array');
  assert.strictEqual(content.length, 1, 'should contain 1 school');

  assert.ok(Array.isArray(content[0]), 'each entry should be a flat array');
  assert.strictEqual(content[0][0], '10001', 'first element should be npsn');
  assert.strictEqual(content[0][1], 'SMA 1', 'second element should be nama');
});

test('writeSearchDataFile creates gzip-compressed schools.json.gz', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
    },
  ];

  await writeSearchDataFile(schools);

  const gzPath = path.join(CONFIG.DIST_DIR, 'schools.json.gz');
  const gzExists = await fs
    .access(gzPath)
    .then(() => true)
    .catch(() => false);
  assert.ok(gzExists, 'schools.json.gz should exist');

  const zlib = require('zlib');
  const gzBuffer = await fs.readFile(gzPath);
  const decompressed = zlib.gunzipSync(gzBuffer).toString('utf-8');
  const parsed = JSON.parse(decompressed);
  assert.ok(Array.isArray(parsed), 'decompressed content should be an array');
  assert.strictEqual(parsed.length, 1, 'decompressed should contain 1 school');
});

test('writeSearchDataFile handles empty schools array', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await writeSearchDataFile([]);

  const jsonPath = path.join(CONFIG.DIST_DIR, 'schools.json');
  const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
  assert.ok(Array.isArray(content), 'schools.json should be an array');
  assert.strictEqual(content.length, 0, 'empty schools should produce empty array');
});

// --- preCreateProvinceDirectories tests ---

test('preCreateProvinceDirectories creates province directories from schools', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
    },
    {
      npsn: '10002',
      nama: 'SMA 2',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Gubeng',
    },
  ];

  await preCreateProvinceDirectories(schools);

  const prov1Dir = path.join(CONFIG.DIST_DIR, 'provinsi', 'jawa-barat');
  const prov2Dir = path.join(CONFIG.DIST_DIR, 'provinsi', 'jawa-timur');

  const d1 = await fs
    .access(prov1Dir)
    .then(() => true)
    .catch(() => false);
  const d2 = await fs
    .access(prov2Dir)
    .then(() => true)
    .catch(() => false);

  assert.ok(d1, 'jawa-barat directory should exist');
  assert.ok(d2, 'jawa-timur directory should exist');
});

test('preCreateProvinceDirectories accepts pre-computed provinces array', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
    },
  ];

  const provinces = [{ name: 'Jawa Barat', slug: 'jawa-barat', count: 1 }];

  await preCreateProvinceDirectories(schools, provinces);

  const provDir = path.join(CONFIG.DIST_DIR, 'provinsi', 'jawa-barat');
  const exists = await fs
    .access(provDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'jawa-barat directory should exist using pre-computed provinces');
});

test('preCreateProvinceDirectories handles empty schools array', async () => {
  await fs.rm(CONFIG.DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  await preCreateProvinceDirectories([]);

  const provDir = path.join(CONFIG.DIST_DIR, 'provinsi');
  const provExists = await fs
    .access(provDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(!provExists, 'no provinsi directory should be created for empty schools');
});

// --- generateProvincePages tests ---

test('generateProvincePages generates province pages for each province', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    {
      npsn: '10002',
      nama: 'SMA 2',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Gubeng',
      bentuk_pendidikan: 'SMA',
      status: 'Swasta',
      alamat: 'Jl. Test 2',
    },
  ];

  const result = await generateProvincePages(schools);

  assert.strictEqual(result.successful, 2, 'both province pages should succeed');
  assert.strictEqual(result.failed, 0, 'no province pages should fail');

  const page1Path = path.join(CONFIG.DIST_DIR, 'provinsi', 'jawa-barat', 'index.html');
  const page2Path = path.join(CONFIG.DIST_DIR, 'provinsi', 'jawa-timur', 'index.html');

  const p1 = await fs
    .access(page1Path)
    .then(() => true)
    .catch(() => false);
  const p2 = await fs
    .access(page2Path)
    .then(() => true)
    .catch(() => false);

  assert.ok(p1, 'jawa-barat province page should exist');
  assert.ok(p2, 'jawa-timur province page should exist');

  const content1 = await fs.readFile(page1Path, 'utf-8');
  assert.ok(
    content1.includes('<!DOCTYPE html>') || content1.includes('<html'),
    'province page should be valid HTML'
  );
  assert.ok(content1.includes('Jawa Barat'), 'province page should contain province name');
});

test('generateProvincePages handles empty schools array', async () => {
  const result = await generateProvincePages([]);
  assert.strictEqual(result.successful, 0, 'no province pages with empty schools');
  assert.strictEqual(result.failed, 0, 'no province page failures with empty schools');
});

test('generateProvincePages skips schools without provinsi in grouping', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    { npsn: '10002', nama: 'SMA 2', kab_kota: 'Surabaya', kecamatan: 'Gubeng' },
  ];

  const result = await generateProvincePages(schools);
  assert.strictEqual(result.successful, 1, 'only valid province should succeed');
  assert.strictEqual(result.failed, 0, 'no failures - invalid schools are skipped in grouping');
});

// --- generateKabupatenPages tests ---

test('generateKabupatenPages generates kabupaten pages for each province/kabupaten', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    {
      npsn: '10002',
      nama: 'SMA 2',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Swasta',
      alamat: 'Jl. Test 2',
    },
    {
      npsn: '10003',
      nama: 'SMA 3',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Gubeng',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test 3',
    },
  ];

  const result = await generateKabupatenPages(schools);

  assert.strictEqual(result.successful, 2, 'both kabupaten pages should succeed');
  assert.strictEqual(result.failed, 0, 'no kabupaten pages should fail');

  const page1Path = path.join(
    CONFIG.DIST_DIR,
    'provinsi',
    'jawa-barat',
    'kabupaten',
    'bandung',
    'index.html'
  );
  const page2Path = path.join(
    CONFIG.DIST_DIR,
    'provinsi',
    'jawa-timur',
    'kabupaten',
    'surabaya',
    'index.html'
  );

  assert.ok(await waitForFile(page1Path), 'jawa-barat/bandung kabupaten page should exist');
  assert.ok(await waitForFile(page2Path), 'jawa-timur/surabaya kabupaten page should exist');

  const content1 = await fs.readFile(page1Path, 'utf-8');
  assert.ok(content1.includes('<!DOCTYPE html>'), 'kabupaten page should be valid HTML');
  assert.ok(content1.includes('Bandung'), 'kabupaten page should contain kabupaten name');
  assert.ok(content1.includes('2 sekolah'), 'kabupaten page should count both schools');
  assert.ok(
    content1.includes('/provinsi/jawa-barat/kabupaten/bandung/kecamatan/coblong/'),
    'kabupaten page should link to kecamatan page'
  );
});

test('generateKabupatenPages handles empty schools array', async () => {
  const result = await generateKabupatenPages([]);
  assert.strictEqual(result.successful, 0, 'no kabupaten pages with empty schools');
  assert.strictEqual(result.failed, 0, 'no kabupaten page failures with empty schools');
});

test('generateKabupatenPages skips schools without provinsi or kab_kota in grouping', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    { npsn: '10002', nama: 'SMA 2', provinsi: 'Jawa Timur', kecamatan: 'Gubeng' },
    { npsn: '10003', nama: 'SMA 3', kab_kota: 'Surabaya', kecamatan: 'Gubeng' },
  ];

  const result = await generateKabupatenPages(schools);
  assert.strictEqual(result.successful, 1, 'only valid province/kabupaten should succeed');
  assert.strictEqual(result.failed, 0, 'no failures - invalid schools are skipped in grouping');
});

// --- generateKecamatanPages tests ---

test('generateKecamatanPages generates kecamatan pages for each location', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    {
      npsn: '10002',
      nama: 'SMA 2',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Swasta',
      alamat: 'Jl. Test 2',
    },
    {
      npsn: '10003',
      nama: 'SMA 3',
      provinsi: 'Jawa Timur',
      kab_kota: 'Surabaya',
      kecamatan: 'Gubeng',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test 3',
    },
  ];

  const result = await generateKecamatanPages(schools);

  assert.strictEqual(result.successful, 2, 'both kecamatan pages should succeed');
  assert.strictEqual(result.failed, 0, 'no kecamatan pages should fail');

  const page1Path = path.join(
    CONFIG.DIST_DIR,
    'provinsi',
    'jawa-barat',
    'kabupaten',
    'bandung',
    'kecamatan',
    'coblong',
    'index.html'
  );
  const page2Path = path.join(
    CONFIG.DIST_DIR,
    'provinsi',
    'jawa-timur',
    'kabupaten',
    'surabaya',
    'kecamatan',
    'gubeng',
    'index.html'
  );

  assert.ok(await waitForFile(page1Path), 'jawa-barat/bandung/coblong kecamatan page should exist');
  assert.ok(await waitForFile(page2Path), 'jawa-timur/surabaya/gubeng kecamatan page should exist');

  const content1 = await fs.readFile(page1Path, 'utf-8');
  assert.ok(content1.includes('<!DOCTYPE html>'), 'kecamatan page should be valid HTML');
  assert.ok(content1.includes('Kecamatan Coblong'), 'kecamatan page should contain kecamatan name');
  assert.ok(content1.includes('2 sekolah'), 'kecamatan page should count both schools');
  assert.ok(content1.includes('10001-sma-1.html'), 'kecamatan page should link to school pages');
});

test('generateKecamatanPages handles empty schools array', async () => {
  const result = await generateKecamatanPages([]);
  assert.strictEqual(result.successful, 0, 'no kecamatan pages with empty schools');
  assert.strictEqual(result.failed, 0, 'no kecamatan page failures with empty schools');
});

test('generateKecamatanPages skips schools without full location in grouping', async () => {
  await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });

  const schools = [
    {
      npsn: '10001',
      nama: 'SMA 1',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong',
      bentuk_pendidikan: 'SMA',
      status: 'Negeri',
      alamat: 'Jl. Test',
    },
    { npsn: '10002', nama: 'SMA 2', provinsi: 'Jawa Barat', kab_kota: 'Bandung' },
  ];

  const result = await generateKecamatanPages(schools);
  assert.strictEqual(result.successful, 1, 'only valid location should succeed');
  assert.strictEqual(result.failed, 0, 'no failures - invalid schools are skipped in grouping');
});
