const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const CONFIG = require('./config');

test.before(async () => {
  process.env.TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-test-'));
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

test('computeSchoolHash generates consistent hash for same school data', () => {
  const { computeSchoolHash } = require('./manifest');

  const school = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test No. 1',
    kelurahan: 'Test Village',
    kecamatan: 'Test District',
    kab_kota: 'Test City',
    provinsi: 'Test Province',
    lat: '-6.200000',
    lon: '106.816666',
  };

  const hash1 = computeSchoolHash(school);
  const hash2 = computeSchoolHash(school);

  assert.strictEqual(hash1, hash2);
  assert.strictEqual(hash1.length, 32); // MD5 hex is 32 chars
});

test('computeSchoolHash generates different hash for different school data', () => {
  const { computeSchoolHash } = require('./manifest');

  const school1 = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test No. 1',
    kelurahan: 'Test Village',
    kecamatan: 'Test District',
    kab_kota: 'Test City',
    provinsi: 'Test Province',
  };

  const school2 = {
    npsn: '87654321', // Different NPSN
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test No. 1',
    kelurahan: 'Test Village',
    kecamatan: 'Test District',
    kab_kota: 'Test City',
    provinsi: 'Test Province',
  };

  const hash1 = computeSchoolHash(school1);
  const hash2 = computeSchoolHash(school2);

  assert.notStrictEqual(hash1, hash2);
});

test('computeSchoolHash ignores irrelevant fields', () => {
  const { computeSchoolHash } = require('./manifest');

  const school1 = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test No. 1',
    kelurahan: 'Test Village',
    kecamatan: 'Test District',
    kab_kota: 'Test City',
    provinsi: 'Test Province',
    telp: '021-123456', // Should be ignored
    email: 'test@school.ac.id', // Should be ignored
  };

  const school2 = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test No. 1',
    kelurahan: 'Test Village',
    kecamatan: 'Test District',
    kab_kota: 'Test City',
    provinsi: 'Test Province',
    // telp and email omitted
  };

  const hash1 = computeSchoolHash(school1);
  const hash2 = computeSchoolHash(school2);

  assert.strictEqual(hash1, hash2);
});

test('computeSchoolHash handles missing optional fields', () => {
  const { computeSchoolHash } = require('./manifest');

  const school = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    // Optional fields like alamat, lat, lon are missing
  };

  const hash = computeSchoolHash(school);

  assert.ok(hash);
  assert.strictEqual(hash.length, 32);
});

test('getChangedSchools returns all schools when no manifest exists', () => {
  const { getChangedSchools } = require('./manifest');

  const schools = [
    { npsn: '12345678', nama: 'School 1' },
    { npsn: '87654321', nama: 'School 2' },
  ];

  const result = getChangedSchools(schools, null);

  assert.strictEqual(result.changed.length, 2);
  assert.strictEqual(result.unchanged.length, 0);
});

test('getChangedSchools returns all schools when manifest is empty', () => {
  const { getChangedSchools } = require('./manifest');

  const schools = [
    { npsn: '12345678', nama: 'School 1' },
    { npsn: '87654321', nama: 'School 2' },
  ];

  const manifest = { version: 1, schools: {} };

  const result = getChangedSchools(schools, manifest);

  assert.strictEqual(result.changed.length, 2);
  assert.strictEqual(result.unchanged.length, 0);
});

test('getChangedSchools identifies unchanged schools by hash', () => {
  const { getChangedSchools, computeSchoolHash } = require('./manifest');

  const school = {
    npsn: '12345678',
    nama: 'SMA Negeri 1',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test',
    kelurahan: 'Test',
    kecamatan: 'Test',
    kab_kota: 'Test',
    provinsi: 'Test',
  };

  const hash = computeSchoolHash(school);

  const manifest = {
    version: 1,
    schools: {
      12345678: {
        hash: hash,
        builtAt: '2024-01-01T00:00:00.000Z',
        path: '/schools/12345678.html',
      },
    },
  };

  const result = getChangedSchools([school], manifest);

  assert.strictEqual(result.changed.length, 0);
  assert.strictEqual(result.unchanged.length, 1);
  assert.strictEqual(result.unchanged[0].npsn, '12345678');
});

test('getChangedSchools identifies changed schools when hash differs', () => {
  const { getChangedSchools } = require('./manifest');

  const school = {
    npsn: '12345678',
    nama: 'SMA Negeri 1 Updated', // Name changed
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
    alamat: 'Jl. Test',
    kelurahan: 'Test',
    kecamatan: 'Test',
    kab_kota: 'Test',
    provinsi: 'Test',
  };

  const manifest = {
    version: 1,
    schools: {
      12345678: {
        hash: 'old-hash-value',
        builtAt: '2024-01-01T00:00:00.000Z',
        path: '/schools/12345678.html',
      },
    },
  };

  const result = getChangedSchools([school], manifest);

  assert.strictEqual(result.changed.length, 1);
  assert.strictEqual(result.changed[0].npsn, '12345678');
  assert.strictEqual(result.unchanged.length, 0);
});

test('getChangedSchools identifies new schools not in manifest', () => {
  const { getChangedSchools, computeSchoolHash } = require('./manifest');

  // Compute hash for the existing school
  const existingSchool = {
    npsn: '12345678',
    nama: 'Existing School',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
  };
  const existingHash = computeSchoolHash(existingSchool);

  const schools = [
    existingSchool,
    { npsn: '99999999', nama: 'New School', bentuk_pendidikan: 'SMA', status: 'Swasta' },
  ];

  const manifest = {
    version: 1,
    schools: {
      12345678: {
        hash: existingHash,
        builtAt: '2024-01-01T00:00:00.000Z',
        path: '/schools/12345678.html',
      },
    },
  };

  const result = getChangedSchools(schools, manifest);

  // New school (99999999) is not in manifest, should be in changed
  assert.strictEqual(result.changed.length, 1);
  assert.strictEqual(result.changed[0].npsn, '99999999');
  // Existing school (12345678) with matching hash should be in unchanged
  assert.strictEqual(result.unchanged.length, 1);
  assert.strictEqual(result.unchanged[0].npsn, '12345678');
});

test('getUnchangedSchools returns only unchanged schools', () => {
  const { getUnchangedSchools, computeSchoolHash } = require('./manifest');

  const unchangedSchool = {
    npsn: '12345678',
    nama: 'Unchanged School',
    bentuk_pendidikan: 'SMA',
    status: 'Negeri',
  };

  const hash = computeSchoolHash(unchangedSchool);

  const manifest = {
    version: 1,
    schools: {
      12345678: { hash, builtAt: '2024-01-01T00:00:00.000Z', path: '/test.html' },
    },
  };

  const schools = [
    unchangedSchool,
    { npsn: '99999999', nama: 'New School', bentuk_pendidikan: 'SMA', status: 'Swasta' },
  ];

  const result = getUnchangedSchools(schools, manifest);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].npsn, '12345678');
});

test('MANIFEST_FILE constant is defined', () => {
  const { MANIFEST_FILE } = require('./manifest');

  assert.strictEqual(MANIFEST_FILE, '.build-manifest.json');
});
test('MANIFEST_FILE constant is defined', () => {
  const { MANIFEST_FILE } = require('./manifest');

  assert.strictEqual(MANIFEST_FILE, '.build-manifest.json');
});

test('loadManifest returns null when manifest does not exist', async () => {
  const { loadManifest } = require('./manifest');

  // Use a non-existent path by temporarily changing ROOT_DIR
  const originalRoot = CONFIG.ROOT_DIR;
  const testDir = path.join(os.tmpdir(), 'nonexistent-manifest-test-' + Date.now());
  CONFIG.ROOT_DIR = testDir;

  try {
    const result = await loadManifest();
    assert.strictEqual(result, null);
  } finally {
    CONFIG.ROOT_DIR = originalRoot;
  }
});

test('loadManifest returns null when manifest version mismatches', async () => {
  const { loadManifest, saveManifest } = require('./manifest');

  const testDir = process.env.TEST_TEMP_DIR;
  const originalRoot = CONFIG.ROOT_DIR;
  CONFIG.ROOT_DIR = testDir;

  try {
    // Save manifest with wrong version
    const wrongVersionManifest = {
      version: 999, // Wrong version
      lastBuild: new Date().toISOString(),
      schools: {},
    };
    await saveManifest(wrongVersionManifest);

    // loadManifest should return null due to version mismatch
    const result = await loadManifest();
    assert.strictEqual(result, null);
  } finally {
    CONFIG.ROOT_DIR = originalRoot;
  }
});

test('saveManifest and loadManifest work correctly', async () => {
  const { saveManifest, loadManifest } = require('./manifest');

  const testDir = process.env.TEST_TEMP_DIR;
  const originalRoot = CONFIG.ROOT_DIR;
  CONFIG.ROOT_DIR = testDir;

  try {
    const testManifest = {
      version: 1,
      lastBuild: new Date().toISOString(),
      schools: {
        12345: {
          hash: 'abc123',
          builtAt: new Date().toISOString(),
          path: '/schools/12345.html',
        },
      },
    };

    await saveManifest(testManifest);
    const loaded = await loadManifest();

    assert.ok(loaded, 'manifest should be loaded');
    assert.strictEqual(loaded.version, 1);
    assert.ok(loaded.schools['12345']);
    assert.strictEqual(loaded.schools['12345'].hash, 'abc123');
  } finally {
    CONFIG.ROOT_DIR = originalRoot;
  }
});

test('clearManifest removes manifest file', async () => {
  const { saveManifest, loadManifest, clearManifest } = require('./manifest');

  const testDir = process.env.TEST_TEMP_DIR;
  const originalRoot = CONFIG.ROOT_DIR;
  CONFIG.ROOT_DIR = testDir;

  try {
    // First create a manifest
    const testManifest = {
      version: 1,
      lastBuild: new Date().toISOString(),
      schools: {},
    };
    await saveManifest(testManifest);

    // Verify it exists
    let loaded = await loadManifest();
    assert.ok(loaded, 'manifest should exist before clear');

    // Clear it
    await clearManifest();

    // Verify it's gone
    loaded = await loadManifest();
    assert.strictEqual(loaded, null, 'manifest should be null after clear');
  } finally {
    CONFIG.ROOT_DIR = originalRoot;
  }
});

test('clearManifest handles non-existent file gracefully', async () => {
  const { clearManifest } = require('./manifest');

  const testDir = path.join(os.tmpdir(), 'nonexistent-clear-test-' + Date.now());
  const originalRoot = CONFIG.ROOT_DIR;
  CONFIG.ROOT_DIR = testDir;

  try {
    // Should not throw - just handles missing file
    await clearManifest();
  } finally {
    CONFIG.ROOT_DIR = originalRoot;
  }
});
