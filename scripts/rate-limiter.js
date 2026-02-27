/**
 * @module rate-limiter
 * @description Rate limiter for controlling concurrent operations.
 * Implements a queue-based rate limiter with metrics tracking.
 */

const { IntegrationError, ERROR_CODES } = require('./resilience');
const CONFIG = require('./config');

/**
 * Rate limiter options.
 * @typedef {Object} RateLimiterOptions
 * @property {number} [maxConcurrent=100] - Maximum concurrent operations
 * @property {number} [rateLimitMs=10] - Minimum time between operations (ms)
 * @property {number} [queueTimeoutMs=30000] - Maximum time a task can wait in queue (ms)
 */

/**
 * Rate limiter metrics.
 * @typedef {Object} RateLimiterMetrics
 * @property {number} total - Total tasks processed
 * @property {number} completed - Successfully completed tasks
 * @property {number} failed - Failed tasks
 * @property {number} rejected - Rejected due to queue timeout
 * @property {number} queued - Currently queued tasks
 * @property {number} maxQueueSize - Maximum queue size observed
 * @property {number} startTime - Timestamp when limiter was created
 * @property {number} active - Currently active operations
 * @property {number} queueLength - Current queue length
 * @property {string} throughput - Tasks per second
 * @property {string} successRate - Percentage of successful tasks
 */

/**
 * Rate limiter class for controlling concurrent operations.
 * Uses a queue-based approach to limit the number of concurrent executions.
 */
class RateLimiter {
  /**
   * Creates a new RateLimiter instance.
   * @param {RateLimiterOptions} [options={}] - Configuration options
   */
  constructor(options = {}) {
    const defaults = CONFIG.RATE_LIMITER_DEFAULTS;
    this.maxConcurrent = options.maxConcurrent || defaults.MAX_CONCURRENT;
    this.rateLimitMs = options.rateLimitMs || defaults.RATE_LIMIT_MS;
    this.queueTimeoutMs = options.queueTimeoutMs || defaults.QUEUE_TIMEOUT_MS;

    this.activeCount = 0;
    this.queue = [];
    this.metrics = {
      total: 0,
      completed: 0,
      failed: 0,
      rejected: 0,
      queued: 0,
      maxQueueSize: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Executes a function with rate limiting.
   * @param {Function} fn - Function to execute
   * @param {string} [operationName='operation'] - Name for this operation (for logging)
   * @returns {Promise<*>} Result of the function execution
   */
  async execute(fn, operationName = 'operation') {
    return new Promise((resolve, reject) => {
      const task = {
        fn,
        operationName,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      if (this.activeCount < this.maxConcurrent) {
        this.executeTask(task);
      } else {
        this.queueTask(task);
      }
    });
  }

  executeTask(task) {
    this.activeCount++;
    this.metrics.total++;

    const executeAndTrack = async () => {
      try {
        const result = await task.fn();
        this.metrics.completed++;
        task.resolve(result);
      } catch (error) {
        this.metrics.failed++;
        task.reject(error);
      } finally {
        this.activeCount--;
        this.processQueue();
      }
    };

    executeAndTrack();
  }

  queueTask(task) {
    this.metrics.queued++;
    this.queue.push(task);

    if (this.queue.length > this.metrics.maxQueueSize) {
      this.metrics.maxQueueSize = this.queue.length;
    }

    const queueTimer = setTimeout(() => {
      const index = this.queue.indexOf(task);
      if (index > -1) {
        this.queue.splice(index, 1);
        this.metrics.rejected++;
        this.metrics.queued--;
        task.reject(
          new IntegrationError(
            `Rate limiter queue timeout for ${task.operationName}`,
            ERROR_CODES.RETRY_EXHAUSTED,
            {
              operationName: task.operationName,
              queueTimeoutMs: this.queueTimeoutMs,
              queueSize: this.queue.length,
            }
          )
        );
      }
    }, this.queueTimeoutMs);

    task.queueTimer = queueTimer;
  }

  processQueue() {
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift();
      this.metrics.queued--;

      if (task.queueTimer) {
        clearTimeout(task.queueTimer);
      }

      this.executeTask(task);
    }
  }

  /**
   * Gets current metrics for this rate limiter.
   * @returns {RateLimiterMetrics} Current metrics including throughput and success rate
   */
  getMetrics() {
    const elapsedMs = Date.now() - this.metrics.startTime;
    return {
      ...this.metrics,
      active: this.activeCount,
      queueLength: this.queue.length,
      throughput: elapsedMs > 0 ? (this.metrics.completed / (elapsedMs / 1000)).toFixed(2) : 0,
      successRate:
        this.metrics.total > 0
          ? ((this.metrics.completed / this.metrics.total) * 100).toFixed(2)
          : 0,
    };
  }

  /**
   * Resets the rate limiter, clearing all queued tasks and resetting metrics.
   */
  reset() {
    this.activeCount = 0;
    this.queue.forEach(task => {
      if (task.queueTimer) {
        clearTimeout(task.queueTimer);
      }
    });
    this.queue = [];
    this.metrics = {
      total: 0,
      completed: 0,
      failed: 0,
      rejected: 0,
      queued: 0,
      maxQueueSize: 0,
      startTime: Date.now(),
    };
  }
}

module.exports = {
  RateLimiter,
};
