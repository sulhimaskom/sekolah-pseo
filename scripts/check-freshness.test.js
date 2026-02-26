const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

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
});
