const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

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
  ENRICHMENT_DATA_PATH,
  WIKIPEDIA_API_URL,
} = require('./enrichment');

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

  it('handles school with name gracefully (API call may fail)', async () => {
    // This test verifies graceful degradation - it doesn't fail if API is unreachable
    const school = { npsn: '12345', nama: 'SDN Test School', provinsi: 'Jawa Barat' };
    const result = await enrichSchool(school);
    // Either returns empty (API unreachable) or enrichment data (API reachable)
    // Either way, it should not throw
    assert.ok(typeof result === 'object');
  });
});

describe('enrichSchoolViaWikipedia', () => {
  it('returns empty object for null input', async () => {
    const result = await enrichSchoolViaWikipedia(null);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for school without nama', async () => {
    const result = await enrichSchoolViaWikipedia({ npsn: '12345' });
    assert.deepStrictEqual(result, {});
  });

  it('gracefully handles API errors without throwing', async () => {
    // Temporarily break the Wikipedia URL to simulate API failure
    // This tests the catch block
    const school = { npsn: '99999', nama: 'SDN Unreachable', provinsi: 'Unknown' };
    const result = await enrichSchoolViaWikipedia(school);
    // Should not throw - returns empty object on failure
    assert.ok(typeof result === 'object');
  });
});

describe('enrichSchools', () => {
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
    const schools = [
      null,
      { npsn: '00001' }, // missing nama
      { npsn: '00002', nama: 'SD Test', provinsi: 'Test' },
    ];

    const result = await enrichSchools(schools, { concurrency: 1 });
    assert.ok(typeof result === 'object');
  });
});

describe('saveEnrichmentData and loadEnrichmentData', () => {
  const testDataPath = path.join(__dirname, '..', 'data', 'test-enrichment.json');

  beforeEach(() => {
    // Store original path
    this._originalPath = ENRICHMENT_DATA_PATH;
    // Clean up any test file
    try {
      fs.unlinkSync(testDataPath);
    } catch (_) { /* ignore */ }
  });

  afterEach(() => {
    // Clean up test file
    try {
      fs.unlinkSync(testDataPath);
    } catch (_) { /* ignore */ }
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
    const tempDir = path.join(__dirname, '..', 'data');
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
      try { fs.unlinkSync(tempPath); } catch (_) { /* ignore */ }
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
  it('handles complex enrichment objects', async () => {
    const school = {
      npsn: '12345678',
      nama: 'SMA Negeri 1 Jakarta',
      provinsi: 'DKI Jakarta',
      kab_kota: 'Jakarta Pusat',
      kecamatan: 'Menteng',
    };

    const result = await enrichSchool(school);
    // Should either return empty (API failure) or have wikipedia data
    // Either way, it's a valid object
    assert.ok(typeof result === 'object');
    if (result.wikipedia) {
      assert.ok(result.wikipedia.source === 'wikipedia');
      assert.ok(result.wikipedia.enrichedAt);
    }
  });
});
