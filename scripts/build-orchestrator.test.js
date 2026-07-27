'use strict';

const { describe, it, test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

const {
  preCreateDirectories,
  finalizeBuild,
  prepareBuildEnvironment,
} = require('../src/services/BuildOrchestrator');
const { resetCircuitBreakers } = require('./fs-safe');
const CONFIG = require('./config');

// ── Setup / Teardown ─────────────────────────────────────────────────────────

test.beforeEach(() => {
  resetCircuitBreakers();
});

// ── preCreateDirectories ─────────────────────────────────────────────────────

describe('preCreateDirectories', () => {
  it('returns array for valid schools', async () => {
    const schools = [
      {
        npsn: '10001',
        nama: 'SD Negeri 1',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Coblong',
      },
      {
        npsn: '10002',
        nama: 'SMP Negeri 2',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Coblong',
      },
      {
        npsn: '10003',
        nama: 'SMA Negeri 3',
        provinsi: 'Jawa Timur',
        kab_kota: 'Surabaya',
        kecamatan: 'Tegalsari',
      },
    ];

    const failures = await preCreateDirectories(schools);

    assert.ok(Array.isArray(failures), 'should return an array');
    assert.strictEqual(failures.length, 0, 'should have no failures');
  });

  it('returns empty array for empty schools list', async () => {
    const failures = await preCreateDirectories([]);
    assert.ok(Array.isArray(failures));
    assert.strictEqual(failures.length, 0);
  });

  it('handles schools with missing fields gracefully', async () => {
    const schools = [
      { npsn: '1' }, // missing all location fields
      { npsn: '2', nama: 'School 2', provinsi: 'Bali', kab_kota: 'Badung', kecamatan: 'Kuta' },
      { npsn: '3', nama: '' }, // empty name
    ];

    // Should not throw — preCreateDirectories skips schools with missing fields
    const failures = await preCreateDirectories(schools);

    assert.ok(Array.isArray(failures));
    assert.strictEqual(failures.length, 0, 'should be no failures when skipping invalid schools');
  });
});

// ── finalizeBuild ────────────────────────────────────────────────────────────

describe('finalizeBuild', () => {
  it('calls stop and logReport on tracker', () => {
    const tracker = {
      stop: () => {},
      logReport: () => {},
      getGitHubSummary: () => 'summary',
    };

    let stopCalled = false;
    let logReportCalled = false;

    tracker.stop = () => { stopCalled = true; };
    tracker.logReport = () => { logReportCalled = true; };

    finalizeBuild(tracker);

    assert.strictEqual(stopCalled, true, 'tracker.stop() should be called');
    assert.strictEqual(logReportCalled, true, 'tracker.logReport() should be called');
  });

  it('does not throw when GITHUB_STEP_SUMMARY write fails', () => {
    const tracker = {
      stop: () => {},
      logReport: () => {},
      getGitHubSummary: () => 'test summary',
    };

    // Set GITHUB_STEP_SUMMARY to a non-writable location
    process.env.GITHUB_STEP_SUMMARY = '/nonexistent/path/summary.md';

    // Should not throw even though writing to GITHUB_STEP_SUMMARY fails
    assert.doesNotThrow(() => finalizeBuild(tracker));

    delete process.env.GITHUB_STEP_SUMMARY;
  });

  it('writes to GITHUB_STEP_SUMMARY when env var is set', () => {
    const tracker = {
      stop: () => {},
      logReport: () => {},
      getGitHubSummary: () => '## Build Summary\n- Pages: 100\n',
    };

    const tempFile = path.join(os.tmpdir(), `github-summary-${Date.now()}.md`);

    process.env.GITHUB_STEP_SUMMARY = tempFile;

    assert.doesNotThrow(() => finalizeBuild(tracker));

    // Verify the summary was written
    const content = require('fs').readFileSync(tempFile, 'utf8');
    assert.ok(content.includes('Build Summary'), 'GITHUB_STEP_SUMMARY should contain build summary');
    assert.ok(content.includes('Pages: 100'), 'GITHUB_STEP_SUMMARY should contain page count');

    // Cleanup
    try {
      require('fs').unlinkSync(tempFile);
    } catch {
      // ignore
    }
    delete process.env.GITHUB_STEP_SUMMARY;
  });
});

// ── prepareBuildEnvironment (integration smoke test) ─────────────────────────

describe('prepareBuildEnvironment', () => {
  it('returns object with schools, enrichmentMap, and sharedPagesPromise', async () => {
    // This is a lightweight integration test that verifies the function
    // returns the expected shape. It requires schools.csv to exist.
    const result = await prepareBuildEnvironment();

    assert.ok(Array.isArray(result.schools), 'schools should be an array');
    assert.ok(result.schools.length > 0, 'should have at least one school');
    assert.ok(result.enrichmentMap, 'enrichmentMap should exist');
    assert.ok(typeof result.enrichmentMap === 'object', 'enrichmentMap should be an object');
    assert.ok(result.sharedPagesPromise instanceof Promise, 'sharedPagesPromise should be a Promise');

    // Verify school objects have required fields
    for (const school of result.schools) {
      assert.ok(school.npsn, 'school should have npsn');
      assert.ok(school.nama, 'school should have nama');
      assert.ok(school.provinsi, 'school should have provinsi');
      assert.ok(school.kab_kota, 'school should have kab_kota');
      assert.ok(school.kecamatan, 'school should have kecamatan');
    }
  });

  it('generates dist files via sharedPagesPromise', async () => {
    const result = await prepareBuildEnvironment();

    // Wait for shared pages to complete
    await result.sharedPagesPromise;

    // Verify key files were generated
    const indexPath = path.join(CONFIG.DIST_DIR, 'index.html');
    const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
    assert.ok(indexExists, 'index.html should exist after sharedPagesPromise resolves');

    const schoolsJsonPath = path.join(CONFIG.DIST_DIR, 'schools.json');
    const jsonExists = await fs.access(schoolsJsonPath).then(() => true).catch(() => false);
    assert.ok(jsonExists, 'schools.json should exist after sharedPagesPromise resolves');
  });
});
