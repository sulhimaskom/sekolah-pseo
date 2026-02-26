const { IntegrationError, ERROR_CODES } = require('./resilience');
const CONFIG = require('./config');

class RateLimiter {
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
