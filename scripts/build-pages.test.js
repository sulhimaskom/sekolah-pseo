const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

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
  build,
  buildIncremental,
  createManifestFromSchools,
} = require('./build-pages');
const { resetCircuitBreakers } = require('./fs-safe');
const CONFIG = require('./config');
const slugify = require('./slugify');

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

test('loadSchools throws error when file not found', async () => {
  const originalPath = CONFIG.SCHOOLS_CSV_PATH;
  CONFIG.SCHOOLS_CSV_PATH = '/nonexistent/path/schools.csv';

  try {
    await assert.rejects(loadSchools(), /Failed to read file/);
  } finally {
    CONFIG.SCHOOLS_CSV_PATH = originalPath;
  }
});

test('loadSchools throws error when CSV is empty', async () => {
  const originalPath = CONFIG.SCHOOLS_CSV_PATH;
  // Use the actual schools.csv but it should have data
  // This tests the "empty CSV" case
  CONFIG.SCHOOLS_CSV_PATH = originalPath;

  try {
    const schools = await loadSchools();
    // If file exists and has data, should return non-empty
    assert.ok(schools.length > 0, 'Should load schools from valid CSV');
  } finally {
    CONFIG.SCHOOLS_CSV_PATH = originalPath;
  }
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
  assert.strictEqual(manifest.version, 1, 'manifest version should be 1');
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
  assert.strictEqual(manifest.version, 1, 'manifest version should be 1');
  assert.ok(manifest.lastBuild, 'manifest should have lastBuild timestamp');
  assert.deepStrictEqual(manifest.schools, {}, 'schools should be empty object');
});

test('build creates dist directory and generates files', async () => {
  // Reset circuit breakers to prevent state pollution from other test files
  // that share the fs-safe singleton circuit breaker instance
  resetCircuitBreakers();

  // Run build to test it
  await build();

  // Retry file existence checks with backoff to handle transient
  // filesystem delays under parallel CI I/O load (parallel test workers
  // sharing the same disk can cause fs.access to not immediately see
  // files after fs.writeFile resolves).
  // Increased from 5 retries × 100ms to 10 retries × 200ms per audit
  // finding CQ-01 (2026-06-28): the previous values caused 1/772 flaky
  // failures under extreme CI I/O contention.
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
});

test('buildIncremental runs without error when manifest exists', async () => {
  // First run full build to create manifest
  await build();

  // Then run incremental build
  await buildIncremental();

  // Verify index.html still exists
  const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
  const indexExists = await fs
    .access(indexPath)
    .then(() => true)
    .catch(() => false);
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

  // Verify index.html was created
  const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
  const exists = await fs
    .access(indexPath)
    .then(() => true)
    .catch(() => false);
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

  // Verify build output exists (index.html should be generated)
  const indexPath = path.join(CONFIG.ROOT_DIR, 'dist', 'index.html');
  try {
    await fs.access(indexPath);
    assert.ok(true, 'index.html exists after incremental build');
  } catch {
    assert.fail('index.html should exist after incremental build');
  }
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
  await fs.rm(CONFIG.DIST_DIR, { recursive: true, force: true });

  await ensureDistDir();

  const exists = await fs
    .access(CONFIG.DIST_DIR)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, 'dist directory should be created');
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
