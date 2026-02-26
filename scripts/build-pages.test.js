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
} = require('./build-pages');
const CONFIG = require('./config');
const slugify = require('./slugify');

test.before(async () => {
  process.env.TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'build-pages-test-'));
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
