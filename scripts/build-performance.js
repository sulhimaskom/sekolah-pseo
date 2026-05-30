/**
 * @module build-performance
 * @description Build performance monitoring for the Indonesian School PSEO project.
 * Tracks build metrics (duration, memory, throughput), enforces performance budgets,
 * and generates structured reports for CI/CD visibility.
 */

'use strict';

const logger = require('./logger');

/**
 * Default performance budgets.
 * These can be overridden via environment variables.
 */
const DEFAULT_BUDGETS = Object.freeze({
  /** Max total build time in milliseconds (default: 5 minutes) */
  MAX_BUILD_TIME_MS: parseInt(process.env.PERF_MAX_BUILD_TIME_MS) || 300000,
  /** Max memory usage in bytes (default: 2 GB) */
  MAX_MEMORY_BYTES: parseInt(process.env.PERF_MAX_MEMORY_BYTES) || 2 * 1024 * 1024 * 1024,
  /** Minimum throughput in pages/second (default: 10) */
  MIN_THROUGHPUT: parseFloat(process.env.PERF_MIN_THROUGHPUT) || 10,
  /** Max allowed failed pages (default: 0) */
  MAX_FAILED_PAGES: parseInt(process.env.PERF_MAX_FAILED_PAGES) || 0,
});

/**
 * Performance budget thresholds with human-readable labels.
 */
const BUDGET_LABELS = {
  MAX_BUILD_TIME_MS: 'Maximum build time',
  MAX_MEMORY_BYTES: 'Maximum memory usage',
  MIN_THROUGHPUT: 'Minimum throughput',
  MAX_FAILED_PAGES: 'Maximum failed pages',
};

/**
 * Track build performance metrics.
 * Usage: wrap a build function and capture start/end timing.
 */
class BuildPerformanceTracker {
  /**
   * @param {Object} [budgets] - Override default performance budgets
   */
  constructor(budgets = {}) {
    this.budgets = { ...DEFAULT_BUDGETS, ...budgets };
    this.startTime = null;
    this.endTime = null;
    this.startMemory = null;
    this.endMemory = null;
    this.totalPages = 0;
    this.failedPages = 0;
    this.buildType = 'full';
    this.violations = [];
  }

  /**
   * Start the performance tracking timer.
   * Call this before the build begins.
   */
  start() {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
    logger.info('Build performance tracking started');
  }

  /**
   * Stop the performance tracking timer and record end state.
   * Call this after the build completes.
   */
  stop() {
    this.endTime = Date.now();
    this.endMemory = process.memoryUsage();
  }

  /**
   * Set the build type for context in reports.
   * @param {'full'|'incremental'} type
   */
  setBuildType(type) {
    this.buildType = type;
  }

  /**
   * Record page counts at the end of the build.
   * @param {number} total - Total pages processed
   * @param {number} failed - Failed pages count
   */
  recordPageCounts(total, failed) {
    this.totalPages = total;
    this.failedPages = failed;
  }

  /**
   * Calculate elapsed build time in milliseconds.
   * @returns {number}
   */
  getElapsedMs() {
    if (!this.startTime || !this.endTime) return 0;
    return this.endTime - this.startTime;
  }

  /**
   * Calculate throughput in pages per second.
   * @returns {number}
   */
  getThroughput() {
    const elapsedSec = this.getElapsedMs() / 1000;
    if (elapsedSec <= 0) return 0;
    return Math.round((this.totalPages / elapsedSec) * 100) / 100;
  }

  /**
   * Get peak memory usage delta in bytes.
   * @returns {number} Memory increase in bytes
   */
  getMemoryDelta() {
    if (!this.startMemory || !this.endMemory) return 0;
    return this.endMemory.heapUsed - this.startMemory.heapUsed;
  }

  /**
   * Get the peak RSS (Resident Set Size) in bytes.
   * @returns {number}
   */
  getPeakRss() {
    if (!this.endMemory) return 0;
    return this.endMemory.rss;
  }

  /**
   * Check all budgets and record violations.
   * @returns {Array<{budget: string, threshold: *, actual: *, message: string}>}
   */
  checkBudgets() {
    this.violations = [];
    const elapsed = this.getElapsedMs();
    const throughput = this.getThroughput();

    if (elapsed > this.budgets.MAX_BUILD_TIME_MS) {
      this.violations.push({
        budget: 'MAX_BUILD_TIME_MS',
        threshold: this.budgets.MAX_BUILD_TIME_MS,
        actual: elapsed,
        message: `Build time ${elapsed}ms exceeds budget of ${this.budgets.MAX_BUILD_TIME_MS}ms`,
      });
    }

    const peakRss = this.getPeakRss();
    if (peakRss > this.budgets.MAX_MEMORY_BYTES) {
      this.violations.push({
        budget: 'MAX_MEMORY_BYTES',
        threshold: this.budgets.MAX_MEMORY_BYTES,
        actual: peakRss,
        message: `Memory usage ${this.formatBytes(peakRss)} exceeds budget of ${this.formatBytes(this.budgets.MAX_MEMORY_BYTES)}`,
      });
    }

    if (throughput < this.budgets.MIN_THROUGHPUT && this.totalPages > 0) {
      this.violations.push({
        budget: 'MIN_THROUGHPUT',
        threshold: this.budgets.MIN_THROUGHPUT,
        actual: throughput,
        message: `Throughput ${throughput} pages/sec is below budget of ${this.budgets.MIN_THROUGHPUT} pages/sec`,
      });
    }

    if (this.failedPages > this.budgets.MAX_FAILED_PAGES) {
      this.violations.push({
        budget: 'MAX_FAILED_PAGES',
        threshold: this.budgets.MAX_FAILED_PAGES,
        actual: this.failedPages,
        message: `Failed pages ${this.failedPages} exceeds budget of ${this.budgets.MAX_FAILED_PAGES}`,
      });
    }

    return this.violations;
  }

  /**
   * Format bytes to a human-readable string.
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(2)} ${units[i]}`;
  }

  /**
   * Generate a structured performance report.
   * @returns {Object} Performance report with metrics, budgets, and violations
   */
  generateReport() {
    const elapsed = this.getElapsedMs();
    const throughput = this.getThroughput();
    const violations = this.checkBudgets();
    const passed = violations.length === 0;

    const report = {
      buildType: this.buildType,
      status: passed ? 'PASS' : 'VIOLATION',
      passed,
      timestamp: new Date().toISOString(),
      metrics: {
        elapsedMs: elapsed,
        elapsedFormatted: this.formatDuration(elapsed),
        totalPages: this.totalPages,
        failedPages: this.failedPages,
        throughput: throughput,
        throughputFormatted: `${throughput} pages/sec`,
        memoryDelta: this.formatBytes(this.getMemoryDelta()),
        peakRss: this.formatBytes(this.getPeakRss()),
      },
      budgets: {
        maxBuildTimeMs: this.budgets.MAX_BUILD_TIME_MS,
        maxBuildTimeFormatted: this.formatDuration(this.budgets.MAX_BUILD_TIME_MS),
        maxMemoryBytes: this.budgets.MAX_MEMORY_BYTES,
        maxMemoryFormatted: this.formatBytes(this.budgets.MAX_MEMORY_BYTES),
        minThroughput: this.budgets.MIN_THROUGHPUT,
        maxFailedPages: this.budgets.MAX_FAILED_PAGES,
      },
      violations: violations.map(v => ({
        budget: BUDGET_LABELS[v.budget] || v.budget,
        threshold: v.threshold,
        actual: v.actual,
        message: v.message,
      })),
    };

    return report;
  }

  /**
   * Format milliseconds to a human-readable duration string.
   * @param {number} ms
   * @returns {string}
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const totalSec = ms / 1000;
    if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(0);
    return `${min}m ${sec}s`;
  }

  /**
   * Log the performance report to the console using the project's logger.
   */
  logReport() {
    const report = this.generateReport();

    logger.info('=== Build Performance Report ===');
    logger.info(`Status: ${report.status}`);
    logger.info(`Type: ${report.buildType}`);
    logger.info(`Duration: ${report.metrics.elapsedFormatted}`);
    logger.info(`Total pages: ${report.metrics.totalPages}`);
    logger.info(`Failed pages: ${report.metrics.failedPages}`);
    logger.info(`Throughput: ${report.metrics.throughputFormatted}`);
    logger.info(`Peak RSS: ${report.metrics.peakRss}`);
    logger.info(`Memory delta: ${report.metrics.memoryDelta}`);

    if (report.violations.length > 0) {
      logger.warn(`Performance budget violations: ${report.violations.length}`);
      for (const violation of report.violations) {
        logger.warn(`  [BUDGET] ${violation.budget}: ${violation.message}`);
      }
    } else {
      logger.info('All performance budgets met');
    }
    logger.info('================================');
  }

  /**
   * Get a GitHub Actions step summary compatible string.
   * @returns {string} Markdown summary for GITHUB_STEP_SUMMARY
   */
  getGitHubSummary() {
    const report = this.generateReport();
    const statusEmoji = report.passed ? '✅' : '❌';
    const lines = [];

    lines.push(`### ${statusEmoji} Build Performance Report`);
    lines.push('');
    lines.push('| Metric | Value | Budget | Status |');
    lines.push('|--------|-------|--------|--------|');
    lines.push(
      `| Duration | ${report.metrics.elapsedFormatted} | ${report.budgets.maxBuildTimeFormatted} | ${report.metrics.elapsedMs <= report.budgets.maxBuildTimeMs ? '✅' : '❌'} |`
    );
    lines.push(
      `| Throughput | ${report.metrics.throughputFormatted} | ${report.budgets.minThroughput} pages/sec | ${report.metrics.throughput >= report.budgets.minThroughput ? '✅' : '❌'} |`
    );
    lines.push(
      `| Peak RSS | ${report.metrics.peakRss} | ${report.budgets.maxMemoryFormatted} | ${report.metrics.peakRss <= report.budgets.maxMemoryBytes ? '✅' : '❌'} |`
    );
    lines.push(
      `| Failed Pages | ${report.metrics.failedPages} | ≤${report.budgets.maxFailedPages} | ${report.metrics.failedPages <= report.budgets.maxFailedPages ? '✅' : '❌'} |`
    );
    lines.push('');

    if (!report.passed) {
      lines.push('#### Budget Violations');
      for (const v of report.violations) {
        lines.push(`- ${v.message}`);
      }
      lines.push('');
    }

    lines.push(`**Build type:** ${report.buildType}`);
    lines.push(`**Timestamp:** ${report.timestamp}`);

    return lines.join('\n');
  }
}

/**
 * Factory function: creates a tracker, starts it, wraps an async build function,
 * stops on completion or error, logs the report, and returns the result.
 *
 * @param {Function} buildFn - Async function that performs the actual build
 * @param {Object} [options]
 * @param {'full'|'incremental'} [options.buildType='full'] - Type of build
 * @param {Object} [options.budgets] - Override performance budgets
 * @param {boolean} [options.throwOnViolation=false] - Whether to throw if budget exceeded
 * @returns {Promise<{result: *, report: Object}>}
 */
async function monitorBuild(buildFn, options = {}) {
  const { buildType = 'full', budgets = {}, throwOnViolation = false } = options;

  const tracker = new BuildPerformanceTracker(budgets);
  tracker.setBuildType(buildType);
  tracker.start();

  let result;
  try {
    result = await buildFn(tracker);
    return { result, report: tracker.generateReport() };
  } finally {
    tracker.stop();
    tracker.logReport();

    if (throwOnViolation && tracker.violations.length > 0) {
      const messages = tracker.violations.map(v => v.message).join('; ');
      throw new Error(`Performance budget violation(s): ${messages}`);
    }
  }
}

module.exports = {
  BuildPerformanceTracker,
  monitorBuild,
  DEFAULT_BUDGETS,
};
