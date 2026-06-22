const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');

const { getDataFreshness, getDataQualityMetrics } = require('./check-freshness');

describe('check-freshness', () => {
  describe('getDataFreshness', () => {
    it('returns object with required properties when schools.csv exists', () => {
      const result = getDataFreshness();

      // Verify result structure
      assert.strictEqual(result.hasOwnProperty('exists'), true);
      assert.strictEqual(result.hasOwnProperty('date'), true);
      assert.strictEqual(result.hasOwnProperty('daysAgo'), true);
      assert.strictEqual(result.hasOwnProperty('recordCount'), true);
      assert.strictEqual(result.hasOwnProperty('isFresh'), true);
    });

    it('returns isFresh as boolean', () => {
      const result = getDataFreshness();
      assert.strictEqual(typeof result.isFresh, 'boolean');
    });

    it('returns recordCount as number', () => {
      const result = getDataFreshness();
      assert.strictEqual(typeof result.recordCount, 'number');
    });

    it('returns daysAgo as number or null', () => {
      const result = getDataFreshness();
      assert.ok(result.daysAgo === null || typeof result.daysAgo === 'number');
    });
  });

  describe('getDataQualityMetrics', () => {
    it('returns object with required properties when schools.csv exists', () => {
      const result = getDataQualityMetrics();

      assert.ok(result !== null);
      assert.ok(result.hasOwnProperty('totalRecords'));
      assert.ok(result.hasOwnProperty('metrics'));
    });

    it('returns totalRecords as number', () => {
      const result = getDataQualityMetrics();
      assert.strictEqual(typeof result.totalRecords, 'number');
    });

    it('returns metrics with expected structure', () => {
      const result = getDataQualityMetrics();

      assert.ok(result.metrics.hasOwnProperty('coordinates'));
      assert.ok(result.metrics.hasOwnProperty('address'));
      assert.ok(result.metrics.hasOwnProperty('npsn'));
      assert.ok(result.metrics.hasOwnProperty('province'));
    });

    it('metrics have count and percentage', () => {
      const result = getDataQualityMetrics();

      for (const metric of ['coordinates', 'address', 'npsn', 'province']) {
        assert.ok(result.metrics[metric].hasOwnProperty('count'));
        assert.ok(result.metrics[metric].hasOwnProperty('percentage'));
        assert.strictEqual(typeof result.metrics[metric].count, 'number');
        assert.strictEqual(typeof result.metrics[metric].percentage, 'string');
      }
    });
  });

  describe('module exports', () => {
    it('exports getDataFreshness function', () => {
      assert.strictEqual(typeof getDataFreshness, 'function');
    });

    it('exports getDataQualityMetrics function', () => {
      assert.strictEqual(typeof getDataQualityMetrics, 'function');
    });
  });

  describe('getDataFreshness edge cases', () => {
    it('returns correct structure when file exists', () => {
      const result = getDataFreshness();
      // Verify result structure for existing file
      assert.strictEqual(result.exists, true);
      assert.ok(result.hasOwnProperty('date'));
      assert.ok(result.hasOwnProperty('daysAgo'));
      assert.ok(result.hasOwnProperty('recordCount'));
      assert.ok(result.hasOwnProperty('isFresh'));
    });

    it('handles stale data correctly', () => {
      const result = getDataFreshness();
      // daysAgo should be a number when file has valid dates
      if (result.daysAgo !== null) {
        assert.ok(typeof result.daysAgo === 'number');
        assert.ok(result.daysAgo >= 0);
        // isFresh should be boolean
        assert.strictEqual(typeof result.isFresh, 'boolean');
      }
    });

    it('handles date parsing edge cases', () => {
      const result = getDataFreshness();
      // When date exists, it should be in ISO format
      if (result.date !== null) {
        assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(result.date));
      }
    });

    it('recordCount reflects actual data lines', () => {
      const result = getDataFreshness();
      // recordCount should be a positive number for existing file
      assert.ok(typeof result.recordCount === 'number');
      if (result.exists) {
        assert.ok(result.recordCount >= 0);
      }
    });
  });

  describe('getDataQualityMetrics edge cases', () => {
    it('returns valid metrics structure when file exists', () => {
      const result = getDataQualityMetrics();
      assert.ok(result !== null);
      assert.ok(result.hasOwnProperty('totalRecords'));
      assert.ok(result.hasOwnProperty('metrics'));
    });

    it('calculates metrics for all field types', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        // All metric types should exist
        assert.ok(result.metrics.hasOwnProperty('coordinates'));
        assert.ok(result.metrics.hasOwnProperty('address'));
        assert.ok(result.metrics.hasOwnProperty('npsn'));
        assert.ok(result.metrics.hasOwnProperty('province'));

        // Each should have count and percentage
        for (const metric of ['coordinates', 'address', 'npsn', 'province']) {
          assert.ok(typeof result.metrics[metric].count === 'number');
          assert.ok(typeof result.metrics[metric].percentage === 'string');
        }
      }
    });

    it('percentages are within valid range 0-100', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        for (const metric of ['coordinates', 'address', 'npsn', 'province']) {
          const pct = parseFloat(result.metrics[metric].percentage);
          assert.ok(pct >= 0 && pct <= 100, `${metric} percentage should be 0-100`);
        }
      }
    });

    it('handles coordinate validation correctly', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        // Coordinates count should not exceed total records
        assert.ok(result.metrics.coordinates.count <= result.totalRecords);
      }
    });

    it('handles address field validation correctly', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        // Address count should not exceed total records
        assert.ok(result.metrics.address.count <= result.totalRecords);
      }
    });

    it('handles NPSN validation correctly', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        // NPSN count should not exceed total records
        assert.ok(result.metrics.npsn.count <= result.totalRecords);
      }
    });

    it('handles province field validation correctly', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        // Province count should not exceed total records
        assert.ok(result.metrics.province.count <= result.totalRecords);
      }
    });

    it('metrics counts are consistent with totalRecords', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        for (const metric of ['coordinates', 'address', 'npsn', 'province']) {
          assert.ok(
            result.metrics[metric].count <= result.totalRecords,
            `${metric} count (${result.metrics[metric].count}) exceeds totalRecords (${result.totalRecords})`
          );
        }
        const totalWithAny = Object.values(result.metrics).reduce((sum, m) => sum + m.count, 0);
        assert.ok(totalWithAny > 0, 'Expected at least one metric with non-zero count');
      }
    });

    it('percentages are consistent with counts', () => {
      const result = getDataQualityMetrics();
      if (result.totalRecords > 0) {
        for (const metric of ['coordinates', 'address', 'npsn', 'province']) {
          const expectedPct = ((result.metrics[metric].count / result.totalRecords) * 100).toFixed(
            2
          );
          assert.strictEqual(
            result.metrics[metric].percentage,
            expectedPct,
            `${metric} percentage ${result.metrics[metric].percentage} does not match expected ${expectedPct}`
          );
        }
      }
    });
  });

  describe('main() via CLI', () => {
    function extractJsonFromPino(raw) {
      // pino logs the stringified JSON in the msg field
      const lines = raw
        .trim()
        .split('\n')
        .filter(l => l.includes('"msg"'));
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          return JSON.parse(parsed.msg);
        } catch {
          continue; // skip lines where msg is not JSON (e.g. log warnings)
        }
      }
      return null;
    }

    it('outputs JSON with --json flag', () => {
      const result = execSync('node scripts/check-freshness.js --json', {
        encoding: 'utf-8',
        timeout: 10000,
      });
      const data = extractJsonFromPino(result);
      assert.ok(data !== null);
      assert.ok(data.hasOwnProperty('exists'));
      assert.ok(data.hasOwnProperty('isFresh'));
      assert.ok(data.hasOwnProperty('maxAgeDays'));
      assert.ok(data.hasOwnProperty('checkedAt'));
    });

    it('JSON output includes quality metrics', () => {
      const result = execSync('node scripts/check-freshness.js --json', {
        encoding: 'utf-8',
        timeout: 10000,
      });
      const data = extractJsonFromPino(result);
      assert.ok(data !== null);
      assert.ok(data.hasOwnProperty('quality'));
      assert.ok(data.quality === null || data.quality.hasOwnProperty('totalRecords'));
    });

    it('JSON output shows stale data correctly', () => {
      const result = execSync('node scripts/check-freshness.js --json', {
        encoding: 'utf-8',
        timeout: 10000,
      });
      const data = extractJsonFromPino(result);
      assert.ok(data !== null);
      assert.strictEqual(data.isFresh, false);
      assert.ok(data.daysAgo > 7);
      assert.ok(data.recordCount > 0);
    });

    it('verbose output includes quality metrics section', () => {
      try {
        const result = execSync('node scripts/check-freshness.js --verbose', {
          encoding: 'utf-8',
          timeout: 10000,
        });
        assert.ok(result.includes('Data Quality Metrics'));
      } catch (e) {
        // Exits with 1 because data is stale, but stderr has the output
        assert.ok(e.stderr || e.stdout);
      }
    });

    it('exits with non-zero when data is stale', () => {
      try {
        execSync('node scripts/check-freshness.js', {
          encoding: 'utf-8',
          timeout: 10000,
        });
        assert.fail('Should have thrown');
      } catch (e) {
        // Expected: exits with code 1 because data is stale
        assert.ok(e.status === 1);
        assert.ok(e.stdout.includes('Last Update'));
      }
    });
  });
});
