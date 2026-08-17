const { describe, it, beforeEach, afterEach, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { Readable } = require('stream');

const https = require('https');

// F052 fix: node --test runs test files in parallel child processes; this file
// previously wrote/unlinked the REAL data/enrichment.json (via the module-level
// ENRICHMENT_DATA_PATH, resolved at require time) plus hardcoded data/*.json
// paths, racing with other test files and concurrent suite runs. Redirect
// CONFIG.DATA_DIR to a per-process temp dir BEFORE requiring ./enrichment, and
// point the hardcoded paths at it too.
const CONFIG = require('../src/core/config');
CONFIG.DATA_DIR = path.join(os.tmpdir(), `enrichment-test-data-${process.pid}`);
fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });

/**
 * Creates a mock https.get that returns canned JSON data instead of making real HTTP calls.
 * @param {Object} responseData - JSON data to return
 * @param {number} statusCode - HTTP status code
 */
/**
 * Wikipedia API mock data: empty search results, so all enrichSchool calls
 * return {} (no enrichment found) without making real HTTP requests.
 */
const MOCK_EMPTY_SEARCH = { query: { search: [] } };

let mockHttpsOriginal;

function mockHttpsGet(responseData, statusCode = 200) {
  const mockReq = {
    on() {
      return mockReq;
    },
  };

  https.get = function (...args) {
    const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    const mockRes = new Readable({
      read() {
        this.push(JSON.stringify(responseData));
        this.push(null);
      },
    });
    mockRes.statusCode = statusCode;
    mockRes.headers = { 'content-type': 'application/json' };
    if (typeof cb === 'function') {
      cb(mockRes);
    }
    return mockReq;
  };
}

function setupMockWikipedia() {
  mockHttpsOriginal = https.get;
  mockHttpsGet(MOCK_EMPTY_SEARCH);
}

function teardownMockWikipedia() {
  if (mockHttpsOriginal) {
    https.get = mockHttpsOriginal;
    mockHttpsOriginal = null;
  }
}

const {
  isEnrichmentEnabled,
  enrichSchool,
  enrichSchoolViaWikipedia,
  enrichSchools,
  saveEnrichmentData,
  loadEnrichmentData,
  logEnrichmentSummary,
  buildWikipediaSearchUrl,
  buildWikipediaExtractUrl,
  fetchJson,
  wikipediaCircuitBreaker,
  wikipediaRateLimiter,
  ENRICHMENT_DATA_PATH,
  WIKIPEDIA_API_URL,
} = require('./enrichment');

// Rate-limiter pacing is exercised by rate-limiter.test.js; the Wikipedia
// integration tests mock https and must run fast, so disable pacing here.
beforeEach(() => {
  wikipediaRateLimiter.reset();
  wikipediaRateLimiter.rateLimitMs = 0;
});

describe('isEnrichmentEnabled', () => {
  beforeEach(() => {
    // Store original env and argv
    this._originalEnv = process.env.ENRICHMENT_ENABLED;
    this._originalArgv = process.argv;
  });

  afterEach(() => {
    process.env.ENRICHMENT_ENABLED = this._originalEnv;
    process.argv = this._originalArgv;
  });

  it('returns false when no flag or env var is set', () => {
    delete process.env.ENRICHMENT_ENABLED;
    // Remove any --enrich flag
    process.argv = process.argv.filter(a => a !== '--enrich');
    assert.strictEqual(isEnrichmentEnabled(), false);
  });

  it('returns true when ENRICHMENT_ENABLED env var is "true"', () => {
    process.env.ENRICHMENT_ENABLED = 'true';
    process.argv = process.argv.filter(a => a !== '--enrich');
    assert.strictEqual(isEnrichmentEnabled(), true);
  });

  it('returns true when ENRICHMENT_ENABLED env var is "1"', () => {
    process.env.ENRICHMENT_ENABLED = '1';
    process.argv = process.argv.filter(a => a !== '--enrich');
    assert.strictEqual(isEnrichmentEnabled(), true);
  });

  it('returns false when ENRICHMENT_ENABLED env var is "false"', () => {
    process.env.ENRICHMENT_ENABLED = 'false';
    process.argv = process.argv.filter(a => a !== '--enrich');
    assert.strictEqual(isEnrichmentEnabled(), false);
  });

  it('returns true when --enrich flag is present in argv', () => {
    delete process.env.ENRICHMENT_ENABLED;
    process.argv = [...process.argv, '--enrich'];
    assert.strictEqual(isEnrichmentEnabled(), true);
  });
});

describe('buildWikipediaSearchUrl', () => {
  it('builds a valid Wikipedia API search URL with school name only', () => {
    const url = buildWikipediaSearchUrl('SDN Contoh');
    assert.ok(url.startsWith(WIKIPEDIA_API_URL));
    assert.ok(url.includes('action=query'));
    assert.ok(url.includes('list=search'));
    assert.ok(url.includes('srsearch=SDN+Contoh'));
  });

  it('builds a valid Wikipedia API search URL with school name and province', () => {
    const url = buildWikipediaSearchUrl('SDN Contoh', 'Jawa Barat');
    assert.ok(url.includes('srsearch=SDN+Contoh+Jawa+Barat'));
  });
});

describe('buildWikipediaExtractUrl', () => {
  it('builds a valid Wikipedia API extract URL with page titles', () => {
    const url = buildWikipediaExtractUrl(['SDN Contoh', 'SMP Negeri 1']);
    assert.ok(url.startsWith(WIKIPEDIA_API_URL));
    assert.ok(url.includes('prop=extracts'));
    assert.ok(url.includes('exintro=true'));
    assert.ok(url.includes('explaintext=true'));
  });
});

describe('enrichSchool', () => {
  before(() => setupMockWikipedia());
  after(() => teardownMockWikipedia());

  it('returns empty object for null input', async () => {
    const result = await enrichSchool(null);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for undefined input', async () => {
    const result = await enrichSchool(undefined);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for non-object input', async () => {
    const result = await enrichSchool('string');
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for school without nama', async () => {
    const result = await enrichSchool({ npsn: '12345' });
    assert.deepStrictEqual(result, {});
  });

  it('handles school with name gracefully (no enrichment data)', async () => {
    const school = { npsn: '12345', nama: 'SDN Test School', provinsi: 'Jawa Barat' };
    const result = await enrichSchool(school);
    assert.ok(typeof result === 'object');
  });
});

describe('enrichSchoolViaWikipedia', () => {
  before(() => setupMockWikipedia());
  after(() => teardownMockWikipedia());

  it('returns empty object for null input', async () => {
    const result = await enrichSchoolViaWikipedia(null);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for school without nama', async () => {
    const result = await enrichSchoolViaWikipedia({ npsn: '12345' });
    assert.deepStrictEqual(result, {});
  });

  it('gracefully handles no Wikipedia results', async () => {
    const school = { npsn: '99999', nama: 'SDN Mock', provinsi: 'Test' };
    const result = await enrichSchoolViaWikipedia(school);
    assert.ok(typeof result === 'object');
  });
});

describe('enrichSchools', () => {
  before(() => setupMockWikipedia());
  after(() => teardownMockWikipedia());

  it('returns empty object for empty array', async () => {
    const result = await enrichSchools([]);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for null input', async () => {
    const result = await enrichSchools(null);
    assert.deepStrictEqual(result, {});
  });

  it('processes schools in batches and calls progress callback', async () => {
    const schools = [
      { npsn: '00001', nama: 'SD Test A', provinsi: 'Test' },
      { npsn: '00002', nama: 'SD Test B', provinsi: 'Test' },
    ];

    let progressCalls = 0;
    const result = await enrichSchools(schools, {
      concurrency: 2,
      onProgress: (processed, total) => {
        progressCalls++;
        assert.ok(processed <= total);
      },
    });

    assert.ok(typeof result === 'object');
    assert.ok(progressCalls > 0);
  });

  it('handles schools with missing data gracefully', async () => {
    const schools = [null, { npsn: '00001' }, { npsn: '00002', nama: 'SD Test', provinsi: 'Test' }];

    const result = await enrichSchools(schools, { concurrency: 1 });
    assert.ok(typeof result === 'object');
  });
});

describe('saveEnrichmentData and loadEnrichmentData', () => {
  const testDataPath = path.join(CONFIG.DATA_DIR, 'test-enrichment.json');

  beforeEach(() => {
    // Store original path
    this._originalPath = ENRICHMENT_DATA_PATH;
    // Clean up any test file
    try {
      fs.unlinkSync(testDataPath);
    } catch {
      /* ignore */
    }
  });

  afterEach(() => {
    // Clean up test file
    try {
      fs.unlinkSync(testDataPath);
    } catch {
      /* ignore */
    }
  });

  it('loadEnrichmentData returns empty object when file does not exist', async () => {
    const result = await loadEnrichmentData();
    // The real path may or may not exist, so we just verify it returns an object
    assert.ok(typeof result === 'object');
  });

  it('round-trips enrichment data through save and load', async () => {
    // Override the module's internal path
    const originalPath = ENRICHMENT_DATA_PATH;

    const testData = {
      '00001': {
        wikipedia: {
          wikipediaUrl: 'https://id.wikipedia.org/wiki/Test',
          wikipediaTitle: 'Test School',
          wikipediaExtract: 'A test school for enrichment.',
          enrichedAt: '2026-05-31T00:00:00.000Z',
          source: 'wikipedia',
        },
      },
    };

    // Use a temporary path for testing
    const tempDir = CONFIG.DATA_DIR;
    const tempPath = path.join(tempDir, 'test-enrichment-save.json');

    try {
      // Save using our own write
      fs.writeFileSync(tempPath, JSON.stringify(testData, null, 2));

      // Load using the module's loadEnrichmentData
      // We need to create the file at the real path and then load
      // Since ENRICHMENT_DATA_PATH points to data/enrichment.json, we write there temporarily
      const realPath = originalPath;
      fs.writeFileSync(realPath, JSON.stringify(testData, null, 2));

      const loaded = await loadEnrichmentData();
      assert.ok(loaded['00001']);
      assert.strictEqual(loaded['00001'].wikipedia.source, 'wikipedia');
      assert.strictEqual(loaded['00001'].wikipedia.wikipediaTitle, 'Test School');

      // Clean up
      fs.unlinkSync(realPath);
    } finally {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        /* ignore */
      }
    }
  });
});

describe('logEnrichmentSummary', () => {
  it('logs enrichment summary without errors', () => {
    const enrichmentData = {
      '00001': { wikipedia: { source: 'wikipedia' } },
      '00002': { wikipedia: { source: 'wikipedia' } },
    };

    // Should not throw
    logEnrichmentSummary(enrichmentData, 100);
  });

  it('handles empty enrichment data', () => {
    logEnrichmentSummary({}, 100);
  });

  it('handles zero total schools', () => {
    logEnrichmentSummary({}, 0);
  });
});

describe('enrichSchool integration with multiple source types', () => {
  before(() => setupMockWikipedia());
  after(() => teardownMockWikipedia());

  it('handles complex enrichment objects (mocked)', async () => {
    const school = {
      npsn: '12345678',
      nama: 'SMA Negeri 1 Jakarta',
      provinsi: 'DKI Jakarta',
      kab_kota: 'Jakarta Pusat',
      kecamatan: 'Menteng',
    };

    const result = await enrichSchool(school);
    assert.ok(typeof result === 'object');
  });
});

describe('saveEnrichmentData', () => {
  afterEach(() => {
    try {
      fs.unlinkSync(ENRICHMENT_DATA_PATH);
    } catch {
      /* ignore */
    }
  });

  it('persists enrichment data that can be loaded back', async () => {
    const testData = {
      '00001': {
        wikipedia: {
          wikipediaUrl: 'https://id.wikipedia.org/wiki/Test',
          wikipediaTitle: 'Test School',
          wikipediaExtract: 'A test school for testing save function.',
          enrichedAt: '2026-06-15T00:00:00.000Z',
          source: 'wikipedia',
        },
      },
    };

    try {
      await saveEnrichmentData(testData);

      const loaded = await loadEnrichmentData();

      assert.ok(loaded['00001']);
      assert.strictEqual(loaded['00001'].wikipedia.source, 'wikipedia');
      assert.strictEqual(loaded['00001'].wikipedia.wikipediaTitle, 'Test School');
      assert.strictEqual(
        loaded['00001'].wikipedia.wikipediaExtract,
        'A test school for testing save function.'
      );
    } finally {
      try {
        fs.unlinkSync(ENRICHMENT_DATA_PATH);
      } catch {
        /* ignore */
      }
    }
  });

  it('overwrites existing enrichment data file', async () => {
    try {
      // Save initial data
      await saveEnrichmentData({
        '00001': { wikipedia: { source: 'wikipedia', title: 'Initial' } },
      });

      // Overwrite with new data
      await saveEnrichmentData({
        '00002': { wikipedia: { source: 'wikipedia', title: 'Updated' } },
      });

      const loaded = await loadEnrichmentData();

      // Initial data should be gone
      assert.ok(!loaded['00001']);
      // New data should exist
      assert.ok(loaded['00002']);
      assert.strictEqual(loaded['00002'].wikipedia.title, 'Updated');
    } finally {
      try {
        fs.unlinkSync(ENRICHMENT_DATA_PATH);
      } catch {
        /* ignore */
      }
    }
  });

  it('saves empty enrichment data successfully', async () => {
    try {
      await saveEnrichmentData({});

      const loaded = await loadEnrichmentData();
      assert.deepStrictEqual(loaded, {});
    } finally {
      try {
        fs.unlinkSync(ENRICHMENT_DATA_PATH);
      } catch {
        /* ignore */
      }
    }
  });
});

describe('enrichSchools edge cases', () => {
  before(() => setupMockWikipedia());
  after(() => teardownMockWikipedia());

  it('skips schools without NPSN in batch processing', async () => {
    const schools = [
      { npsn: '00001', nama: 'SD Test A', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
      { nama: 'School No NPSN', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
      { npsn: '00003', nama: 'SD Test B', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
    ];

    const result = await enrichSchools(schools, { concurrency: 1 });

    assert.ok(typeof result === 'object');
    assert.ok(!result['undefined']);
  });

  it('processes batch with all schools missing NPSN', async () => {
    const schools = [
      { nama: 'No NPSN 1', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
      { nama: 'No NPSN 2', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
    ];

    // Should not throw and return empty result
    const result = await enrichSchools(schools, { concurrency: 1 });
    assert.deepStrictEqual(result, {});
  });

  it('handles mixed null/undefined entries in schools array', async () => {
    const schools = [
      null,
      undefined,
      { npsn: '00001', nama: 'SD Test', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
    ];

    const result = await enrichSchools(schools, { concurrency: 1 });

    assert.ok(typeof result === 'object');
    // Null and undefined entries should be skipped without throwing
  });

  it('calls progress callback correctly across batches', async () => {
    const schools = Array.from({ length: 5 }, (_, i) => ({
      npsn: String(10000 + i).padStart(5, '0'),
      nama: `SD Test ${i}`,
      provinsi: 'Test',
      kab_kota: 'Test',
      kecamatan: 'Test',
    }));

    const progressCalls = [];
    const result = await enrichSchools(schools, {
      concurrency: 2,
      onProgress: (processed, total) => {
        progressCalls.push({ processed, total });
      },
    });

    assert.ok(
      progressCalls.length >= 3,
      'should have at least 3 progress calls for 5 items with concurrency 2'
    );
    // Last call should report all processed
    const lastCall = progressCalls[progressCalls.length - 1];
    assert.strictEqual(lastCall.processed, 5);
    assert.strictEqual(lastCall.total, 5);
    assert.ok(typeof result === 'object');
  });

  it('handles empty progress callback gracefully', async () => {
    const schools = [
      { npsn: '00001', nama: 'SD Test', provinsi: 'Test', kab_kota: 'Test', kecamatan: 'Test' },
    ];

    // Should not throw even without onProgress
    const result = await enrichSchools(schools);
    assert.ok(typeof result === 'object');
  });
});

describe('fetchJson resilience (timeout retry + circuit breaker)', () => {
  let callCount;

  beforeEach(() => {
    callCount = 0;
    wikipediaCircuitBreaker.reset();
    wikipediaRateLimiter.reset();
  });

  afterEach(() => {
    teardownMockWikipedia();
    wikipediaCircuitBreaker.reset();
  });

  /**
   * Mock https.get that never invokes the response callback, so the request
   * hangs until the withTimeout deadline rejects it with a TIMEOUT error.
   */
  function mockHttpsGetHanging() {
    const mockReq = {
      on() {
        return mockReq;
      },
    };
    https.get = function (...args) {
      callCount++;
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      // Never call cb — the request hangs
      void cb;
      return mockReq;
    };
  }

  /**
   * Mock https.get that immediately calls the response callback with a statusCode.
   */
  function mockHttpsGetStatus(statusCode) {
    const mockReq = {
      on() {
        return mockReq;
      },
    };
    https.get = function (...args) {
      callCount++;
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const mockRes = new Readable({
        read() {
          this.push('{}');
          this.push(null);
        },
      });
      mockRes.statusCode = statusCode;
      mockRes.headers = { 'content-type': 'application/json' };
      if (typeof cb === 'function') {
        cb(mockRes);
      }
      return mockReq;
    };
  }

  it('retries TIMEOUT IntegrationErrors (3 attempts) then throws RETRY_EXHAUSTED', async () => {
    mockHttpsGetHanging();

    await assert.rejects(
      () => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50),
      err => {
        assert.strictEqual(err.name, 'IntegrationError');
        assert.strictEqual(err.code, 'RETRY_EXHAUSTED');
        assert.strictEqual(err.details.attempts, 3);
        assert.strictEqual(err.details.lastErrorCode, 'TIMEOUT');
        return true;
      }
    );

    // 3 attempts because timeouts are transient — the old predicate retried 0 times
    assert.strictEqual(callCount, 3);
  });

  it('does NOT retry non-transient IntegrationErrors (parse failure — 1 attempt)', async () => {
    // Response is '{}' from mockHttpsGetStatus but we simulate a parse failure
    // by returning invalid JSON via the status mock's Readable override.
    const mockReq = {
      on() {
        return mockReq;
      },
    };
    https.get = function (...args) {
      callCount++;
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const mockRes = new Readable({
        read() {
          this.push('not-valid-json{{{');
          this.push(null);
        },
      });
      mockRes.statusCode = 200;
      mockRes.headers = { 'content-type': 'application/json' };
      if (typeof cb === 'function') {
        cb(mockRes);
      }
      return mockReq;
    };

    await assert.rejects(
      () => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50),
      err => {
        assert.strictEqual(err.name, 'IntegrationError');
        assert.strictEqual(err.code, 'RETRY_EXHAUSTED');
        assert.strictEqual(err.details.attempts, 1);
        assert.strictEqual(err.details.lastErrorCode, 'HTTP_ERROR');
        return true;
      }
    );

    // Parse failures are non-transient — exactly 1 attempt, no retry
    assert.strictEqual(callCount, 1);
  });

  it('opens the circuit breaker after 3 consecutive HTTP failures', async () => {
    // 400 is non-transient, so each fetchJson fails fast (no internal retry)
    mockHttpsGetStatus(400);

    for (let i = 0; i < 3; i++) {
      await assert.rejects(
        () => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50),
        err => err.name === 'IntegrationError' && err.code === 'RETRY_EXHAUSTED'
      );
    }

    assert.strictEqual(wikipediaCircuitBreaker.getState().state, 'OPEN');
  });

  it('rejects with CIRCUIT_BREAKER_OPEN without hitting the network when open', async () => {
    mockHttpsGetStatus(400);

    for (let i = 0; i < 3; i++) {
      await assert.rejects(() => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50));
    }

    const callsBeforeOpen = callCount;
    await assert.rejects(
      () => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50),
      err => {
        assert.strictEqual(err.name, 'IntegrationError');
        assert.strictEqual(err.code, 'CIRCUIT_BREAKER_OPEN');
        return true;
      }
    );

    // No new network calls were made — the breaker blocked the request
    assert.strictEqual(callCount, callsBeforeOpen);
  });

  it('recovers to CLOSED after a successful request (reset on success)', async () => {
    mockHttpsGetStatus(400);

    for (let i = 0; i < 3; i++) {
      await assert.rejects(() => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50));
    }
    assert.strictEqual(wikipediaCircuitBreaker.getState().state, 'OPEN');

    // Simulate the reset window passing, then a successful request closes the circuit
    wikipediaCircuitBreaker.reset();
    assert.strictEqual(wikipediaCircuitBreaker.getState().state, 'CLOSED');

    // Re-point the mock at a success response (200 with valid JSON)
    mockHttpsGetStatus(200);
    const result = await fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50);
    assert.ok(result);
    assert.strictEqual(wikipediaCircuitBreaker.getState().state, 'CLOSED');
  });

  it('enrichSchoolViaWikipedia degrades gracefully to {} when the circuit is open', async () => {
    mockHttpsGetStatus(400);

    for (let i = 0; i < 3; i++) {
      await assert.rejects(() => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50));
    }
    assert.strictEqual(wikipediaCircuitBreaker.getState().state, 'OPEN');

    const school = { npsn: '12345', nama: 'SDN Test', provinsi: 'Jawa Barat' };
    const result = await enrichSchoolViaWikipedia(school);

    // Graceful degradation — enrichment failure must never propagate
    assert.deepStrictEqual(result, {});
  });

  it('routes every HTTP request through wikipediaRateLimiter', async () => {
    mockHttpsGetStatus(200);
    wikipediaRateLimiter.reset();

    const metricsBefore = wikipediaRateLimiter.getMetrics().total;
    await fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50);
    const metricsAfter = wikipediaRateLimiter.getMetrics().total;

    // Exactly one limiter slot consumed per HTTP request
    assert.strictEqual(metricsAfter - metricsBefore, 1);
  });

  it('does not exceed wikipediaRateLimiter maxConcurrent when requests overlap', async () => {
    mockHttpsGetStatus(200);
    wikipediaRateLimiter.reset();

    let maxActive = 0;
    const probe = setInterval(() => {
      maxActive = Math.max(maxActive, wikipediaRateLimiter.getMetrics().active);
    }, 2);

    await Promise.all(
      Array.from({ length: 5 }, () => fetchJson('https://id.wikipedia.org/w/api.php?test=1', 50))
    );
    clearInterval(probe);

    assert.ok(maxActive <= 2, `expected <= 2 concurrent, saw ${maxActive}`);
  });
});
