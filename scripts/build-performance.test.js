'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { BuildPerformanceTracker, monitorBuild, DEFAULT_BUDGETS } = require('./build-performance');

// ── Constructor ─────────────────────────────────────────────────────────────

test('constructor uses default budgets when none provided', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.budgets.MAX_BUILD_TIME_MS, DEFAULT_BUDGETS.MAX_BUILD_TIME_MS);
  assert.strictEqual(tracker.budgets.MAX_MEMORY_BYTES, DEFAULT_BUDGETS.MAX_MEMORY_BYTES);
  assert.strictEqual(tracker.budgets.MIN_THROUGHPUT, DEFAULT_BUDGETS.MIN_THROUGHPUT);
  assert.strictEqual(tracker.budgets.MAX_FAILED_PAGES, DEFAULT_BUDGETS.MAX_FAILED_PAGES);
});

test('constructor overrides default budgets', () => {
  const custom = { MAX_BUILD_TIME_MS: 1000, MAX_FAILED_PAGES: 5 };
  const tracker = new BuildPerformanceTracker(custom);
  assert.strictEqual(tracker.budgets.MAX_BUILD_TIME_MS, 1000);
  assert.strictEqual(tracker.budgets.MAX_FAILED_PAGES, 5);
  // non-overridden fields keep defaults
  assert.strictEqual(tracker.budgets.MIN_THROUGHPUT, DEFAULT_BUDGETS.MIN_THROUGHPUT);
});

test('constructor initializes state correctly', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.startTime, null);
  assert.strictEqual(tracker.endTime, null);
  assert.strictEqual(tracker.totalPages, 0);
  assert.strictEqual(tracker.failedPages, 0);
  assert.strictEqual(tracker.buildType, 'full');
  assert.deepStrictEqual(tracker.violations, []);
});

// ── start / stop ────────────────────────────────────────────────────────────

test('start records startTime and startMemory', () => {
  const tracker = new BuildPerformanceTracker();
  const before = Date.now();
  tracker.start();
  assert.ok(tracker.startTime >= before);
  assert.ok(tracker.startTime <= Date.now());
  assert.ok(tracker.startMemory !== null);
  assert.ok(tracker.startMemory.heapUsed > 0);
});

test('stop records endTime and endMemory', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  const before = Date.now();
  tracker.stop();
  assert.ok(tracker.endTime >= before);
  assert.ok(tracker.endTime <= Date.now());
  assert.ok(tracker.endMemory !== null);
});

test('stop works even without start', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.stop();
  assert.ok(tracker.endTime !== null);
  assert.ok(tracker.endMemory !== null);
});

// ── setBuildType ────────────────────────────────────────────────────────────

test('setBuildType updates build type', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.buildType, 'full');
  tracker.setBuildType('incremental');
  assert.strictEqual(tracker.buildType, 'incremental');
});

// ── recordPageCounts ────────────────────────────────────────────────────────

test('recordPageCounts stores page metrics', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.recordPageCounts(3474, 0);
  assert.strictEqual(tracker.totalPages, 3474);
  assert.strictEqual(tracker.failedPages, 0);
});

test('recordPageCounts handles failures', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.recordPageCounts(100, 5);
  assert.strictEqual(tracker.totalPages, 100);
  assert.strictEqual(tracker.failedPages, 5);
});

// ── getElapsedMs ────────────────────────────────────────────────────────────

test('getElapsedMs returns 0 when not started', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.getElapsedMs(), 0);
});

test('getElapsedMs returns 0 when not stopped', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  assert.strictEqual(tracker.getElapsedMs(), 0);
});

test('getElapsedMs returns duration between start and stop', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  tracker.stop();
  const elapsed = tracker.getElapsedMs();
  assert.ok(typeof elapsed === 'number');
  assert.ok(elapsed >= 0);
  assert.ok(elapsed < 100); // should be nearly instant
});

// ── getThroughput ───────────────────────────────────────────────────────────

test('getThroughput returns 0 when no pages recorded', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  tracker.stop();
  assert.strictEqual(tracker.getThroughput(), 0);
});

test('getThroughput calculates pages per second', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startTime = Date.now() - 2000; // 2 seconds ago
  tracker.endTime = Date.now();
  tracker.totalPages = 100;
  const throughput = tracker.getThroughput();
  assert.ok(throughput > 0);
  // 100 pages / 2 seconds = 50 pages/sec (approximately)
  assert.ok(throughput > 40 && throughput < 60);
});

test('getThroughput handles very fast builds', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startTime = Date.now() - 1; // 1ms
  tracker.endTime = Date.now();
  tracker.totalPages = 10;
  const throughput = tracker.getThroughput();
  assert.ok(throughput > 0);
});

// ── getMemoryDelta / getPeakRss ─────────────────────────────────────────────

test('getMemoryDelta returns 0 when no memory data', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.getMemoryDelta(), 0);
});

test('getMemoryDelta returns difference in heap usage', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startMemory = { heapUsed: 1000 };
  tracker.endMemory = { heapUsed: 2000 };
  assert.strictEqual(tracker.getMemoryDelta(), 1000);
});

test('getMemoryDelta can be negative', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startMemory = { heapUsed: 2000 };
  tracker.endMemory = { heapUsed: 1000 };
  assert.strictEqual(tracker.getMemoryDelta(), -1000);
});

test('getPeakRss returns 0 when no endMemory', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.getPeakRss(), 0);
});

test('getPeakRss returns RSS from endMemory', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.endMemory = { rss: 12345678 };
  assert.strictEqual(tracker.getPeakRss(), 12345678);
});

test('getPeakRss returns actual peak RSS after start/stop', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.start();
  tracker.stop();
  const peakRss = tracker.getPeakRss();
  assert.ok(typeof peakRss === 'number');
  assert.ok(peakRss > 0);
});

// ── checkBudgets ────────────────────────────────────────────────────────────

test('checkBudgets returns no violations when within budgets', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 60000,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 5,
  });
  tracker.startTime = Date.now() - 100;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);
  const violations = tracker.checkBudgets();
  assert.strictEqual(violations.length, 0);
});

test('checkBudgets detects build time violations', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 1,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 5,
  });
  tracker.startTime = Date.now() - 10000;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);
  const violations = tracker.checkBudgets();
  assert.ok(violations.some(v => v.budget === 'MAX_BUILD_TIME_MS'));
});

test('checkBudgets detects throughput violations', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 60000,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 1000,
    MAX_FAILED_PAGES: 5,
  });
  tracker.startTime = Date.now() - 5000;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(5, 0);
  const violations = tracker.checkBudgets();
  assert.ok(violations.some(v => v.budget === 'MIN_THROUGHPUT'));
});

test('checkBudgets detects failed pages violations', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 60000,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 0,
  });
  tracker.startTime = Date.now() - 100;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 3);
  const violations = tracker.checkBudgets();
  assert.ok(violations.some(v => v.budget === 'MAX_FAILED_PAGES'));
});

test('checkBudgets stores violations on tracker', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 60000,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 0,
  });
  tracker.startTime = Date.now() - 100;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 3);
  tracker.checkBudgets();
  assert.strictEqual(tracker.violations.length, 1);
  assert.strictEqual(tracker.violations[0].budget, 'MAX_FAILED_PAGES');
});

test('checkBudgets clears previous violations on each call', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 60000,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 0,
  });
  tracker.startTime = Date.now() - 100;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 3);
  tracker.checkBudgets();
  assert.strictEqual(tracker.violations.length, 1);
  tracker.recordPageCounts(100, 0);
  const violations = tracker.checkBudgets();
  assert.strictEqual(violations.length, 0);
});

// ── formatBytes ─────────────────────────────────────────────────────────────

test('formatBytes handles zero', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.formatBytes(0), '0 B');
});

test('formatBytes converts to KB', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.formatBytes(1024), '1.00 KB');
});

test('formatBytes converts to MB', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.formatBytes(1048576), '1.00 MB');
});

test('formatBytes converts to GB', () => {
  const tracker = new BuildPerformanceTracker();
  const gb = 1073741824;
  assert.strictEqual(tracker.formatBytes(gb), '1.00 GB');
});

test('formatBytes handles fractional values', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.formatBytes(1536), '1.50 KB');
});

// ── formatDuration ──────────────────────────────────────────────────────────

test('formatDuration formats milliseconds', () => {
  const tracker = new BuildPerformanceTracker();
  assert.strictEqual(tracker.formatDuration(500), '500ms');
  assert.strictEqual(tracker.formatDuration(0), '0ms');
  assert.strictEqual(tracker.formatDuration(999), '999ms');
});

test('formatDuration formats seconds', () => {
  const tracker = new BuildPerformanceTracker();
  assert.ok(tracker.formatDuration(1500).includes('s'));
  assert.ok(tracker.formatDuration(1000).endsWith('s'));
});

test('formatDuration formats minutes', () => {
  const tracker = new BuildPerformanceTracker();
  const result = tracker.formatDuration(120000);
  assert.ok(result.includes('m'));
  assert.ok(result.includes('s'));
});

test('formatDuration handles exact minute boundary', () => {
  const tracker = new BuildPerformanceTracker();
  const result = tracker.formatDuration(60000);
  assert.ok(result.includes('m'));
});

// ── generateReport ──────────────────────────────────────────────────────────

test('generateReport returns structured report object', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.setBuildType('incremental');
  tracker.startTime = Date.now() - 500;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);

  const report = tracker.generateReport();
  assert.strictEqual(report.buildType, 'incremental');
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.passed, true);
  assert.ok(report.timestamp);
  assert.ok(report.metrics);
  assert.ok(report.budgets);
  assert.ok(Array.isArray(report.violations));
});

test('generateReport includes all metrics fields', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startTime = Date.now() - 500;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);

  const report = tracker.generateReport();
  const m = report.metrics;
  assert.ok('elapsedMs' in m);
  assert.ok('elapsedFormatted' in m);
  assert.ok('totalPages' in m);
  assert.ok('failedPages' in m);
  assert.ok('throughput' in m);
  assert.ok('throughputFormatted' in m);
  assert.ok('memoryDelta' in m);
  assert.ok('peakRss' in m);
  assert.strictEqual(m.totalPages, 100);
  assert.strictEqual(m.failedPages, 0);
});

test('generateReport shows violations when budgets exceed', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 1,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 5,
  });
  tracker.startTime = Date.now() - 10000;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);

  const report = tracker.generateReport();
  assert.strictEqual(report.status, 'VIOLATION');
  assert.strictEqual(report.passed, false);
  assert.ok(report.violations.length > 0);
});

// ── getGitHubSummary ────────────────────────────────────────────────────────

test('getGitHubSummary returns markdown string', () => {
  const tracker = new BuildPerformanceTracker();
  tracker.startTime = Date.now() - 500;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);

  const summary = tracker.getGitHubSummary();
  assert.strictEqual(typeof summary, 'string');
  assert.ok(summary.includes('Build Performance Report'));
  assert.ok(summary.includes('| Metric |'));
  assert.ok(summary.includes('Duration |'));
  assert.ok(summary.includes('Throughput |'));
  assert.ok(summary.includes('Peak RSS |'));
  assert.ok(summary.includes('Failed Pages |'));
  assert.ok(summary.includes('Build type:'));
  assert.ok(summary.includes('Timestamp:'));
});

test('getGitHubSummary shows violations when present', () => {
  const tracker = new BuildPerformanceTracker({
    MAX_BUILD_TIME_MS: 1,
    MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
    MIN_THROUGHPUT: 0,
    MAX_FAILED_PAGES: 5,
  });
  tracker.startTime = Date.now() - 10000;
  tracker.endTime = Date.now();
  tracker.recordPageCounts(100, 0);

  const summary = tracker.getGitHubSummary();
  assert.ok(summary.includes('Budget Violations'));
});

// ── monitorBuild ────────────────────────────────────────────────────────────

test('monitorBuild wraps build function and returns report', async () => {
  const result = await monitorBuild(
    async tracker => {
      tracker.recordPageCounts(50, 1);
      return { built: true };
    },
    {
      budgets: {
        MAX_BUILD_TIME_MS: 60000,
        MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
        MIN_THROUGHPUT: 0,
        MAX_FAILED_PAGES: 5,
      },
    }
  );

  assert.ok(result.report);
  assert.strictEqual(result.report.metrics.totalPages, 50);
  assert.strictEqual(result.report.metrics.failedPages, 1);
  assert.strictEqual(result.report.buildType, 'full');
});

test('monitorBuild supports custom build type', async () => {
  const result = await monitorBuild(
    async tracker => {
      tracker.recordPageCounts(100, 0);
      return { done: true };
    },
    {
      buildType: 'incremental',
      budgets: {
        MAX_BUILD_TIME_MS: 60000,
        MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
        MIN_THROUGHPUT: 0,
        MAX_FAILED_PAGES: 5,
      },
    }
  );

  assert.strictEqual(result.report.buildType, 'incremental');
});

test('monitorBuild handles build function errors', async () => {
  const buildFn = async () => {
    throw new Error('Build failed');
  };

  await assert.rejects(
    () =>
      monitorBuild(buildFn, {
        budgets: {
          MAX_BUILD_TIME_MS: 60000,
          MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
          MIN_THROUGHPUT: 0,
          MAX_FAILED_PAGES: 5,
        },
      }),
    /Build failed/
  );
});

test('monitorBuild throws on violation when throwOnViolation is true', async () => {
  await assert.rejects(
    () =>
      monitorBuild(
        async tracker => {
          tracker.recordPageCounts(100, 10);
          return { built: true };
        },
        {
          budgets: {
            MAX_BUILD_TIME_MS: 60000,
            MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
            MIN_THROUGHPUT: 0,
            MAX_FAILED_PAGES: 0,
          },
          throwOnViolation: true,
        }
      ),
    /Performance budget violation/
  );
});

test('monitorBuild does not throw on violation when throwOnViolation is false', async () => {
  const result = await monitorBuild(
    async tracker => {
      tracker.recordPageCounts(100, 10);
      return { built: true };
    },
    {
      budgets: {
        MAX_BUILD_TIME_MS: 60000,
        MAX_MEMORY_BYTES: 2 * 1024 * 1024 * 1024,
        MIN_THROUGHPUT: 0,
        MAX_FAILED_PAGES: 0,
      },
      throwOnViolation: false,
    }
  );

  assert.ok(result.report);
  assert.strictEqual(result.report.passed, false);
});

// ── DEFAULT_BUDGETS ─────────────────────────────────────────────────────────

test('DEFAULT_BUDGETS has expected structure', () => {
  assert.ok('MAX_BUILD_TIME_MS' in DEFAULT_BUDGETS);
  assert.ok('MAX_MEMORY_BYTES' in DEFAULT_BUDGETS);
  assert.ok('MIN_THROUGHPUT' in DEFAULT_BUDGETS);
  assert.ok('MAX_FAILED_PAGES' in DEFAULT_BUDGETS);
  assert.strictEqual(typeof DEFAULT_BUDGETS.MAX_BUILD_TIME_MS, 'number');
  assert.strictEqual(typeof DEFAULT_BUDGETS.MAX_MEMORY_BYTES, 'number');
  assert.strictEqual(typeof DEFAULT_BUDGETS.MIN_THROUGHPUT, 'number');
  assert.strictEqual(typeof DEFAULT_BUDGETS.MAX_FAILED_PAGES, 'number');
});
