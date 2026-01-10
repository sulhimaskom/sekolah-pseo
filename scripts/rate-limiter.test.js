const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { RateLimiter } = require('./rate-limiter');

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxConcurrent: 2, queueTimeoutMs: 1000 });
  });

  describe('constructor', () => {
    it('should create rate limiter with default options', () => {
      const defaultLimiter = new RateLimiter();
      assert.strictEqual(defaultLimiter.maxConcurrent, 100);
      assert.strictEqual(defaultLimiter.rateLimitMs, 10);
      assert.strictEqual(defaultLimiter.queueTimeoutMs, 30000);
    });

    it('should create rate limiter with custom options', () => {
      assert.strictEqual(limiter.maxConcurrent, 2);
      assert.strictEqual(limiter.rateLimitMs, 10);
      assert.strictEqual(limiter.queueTimeoutMs, 1000);
    });

    it('should initialize metrics to zero', () => {
      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.total, 0);
      assert.strictEqual(metrics.completed, 0);
      assert.strictEqual(metrics.failed, 0);
      assert.strictEqual(metrics.rejected, 0);
      assert.strictEqual(metrics.queued, 0);
    });
  });

  describe('execute', () => {
    it('should execute single operation successfully', async () => {
      const result = await limiter.execute(async () => 'success');
      assert.strictEqual(result, 'success');
      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.completed, 1);
      assert.strictEqual(metrics.active, 0);
    });

    it('should execute multiple operations concurrently', async () => {
      const results = await Promise.all([
        limiter.execute(async () => 'a'),
        limiter.execute(async () => 'b'),
        limiter.execute(async () => 'c')
      ]);
      assert.deepStrictEqual(results, ['a', 'b', 'c']);
      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.completed, 3);
    });

    it('should respect maxConcurrent limit', async () => {
      const slowLimiter = new RateLimiter({ maxConcurrent: 2 });
      let maxActive = 0;

      const checkActive = () => {
        maxActive = Math.max(maxActive, slowLimiter.getMetrics().active);
      };

      const operations = Array.from({ length: 5 }, () => 
        slowLimiter.execute(async () => {
          checkActive();
          await new Promise(resolve => setTimeout(resolve, 100));
          checkActive();
          return 'done';
        })
      );

      const interval = setInterval(checkActive, 5);
      await Promise.all(operations);
      clearInterval(interval);

      assert.strictEqual(maxActive, 2);
    });

    it('should handle failed operations', async () => {
      const error = new Error('Operation failed');
      await assert.rejects(
        () => limiter.execute(async () => { throw error; }),
        error
      );
      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.failed, 1);
    });

    it('should reject queued operations after timeout', async () => {
      const slowLimiter = new RateLimiter({
        maxConcurrent: 1,
        queueTimeoutMs: 100
      });

      const slowOp = slowLimiter.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 'done';
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      const fastOps = Array.from({ length: 5 }, (_, i) => 
        slowLimiter.execute(async () => i)
          .catch(err => err)
      );

      const results = await Promise.all([slowOp, ...fastOps]);
      const rejections = results.filter(r => r instanceof Error);
      assert.strictEqual(rejections.length, 5);
      rejections.forEach(rejection => {
        assert.strictEqual(rejection.code, 'RETRY_EXHAUSTED');
      });

      const metrics = slowLimiter.getMetrics();
      assert.strictEqual(metrics.rejected, 5);
    });

    it('should execute queued operations after active ones complete', async () => {
      const executionOrder = [];

      const ops = Array.from({ length: 4 }, (_, i) => 
        limiter.execute(async () => {
          executionOrder.push(i);
          await new Promise(resolve => setTimeout(resolve, 20));
          return i;
        })
      );

      await Promise.all(ops);
      assert.strictEqual(executionOrder.length, 4);
    });
  });

  describe('getMetrics', () => {
    it('should track total operations', async () => {
      await limiter.execute(async () => 1);
      await limiter.execute(async () => 2);
      await limiter.execute(async () => 3);

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.total, 3);
    });

    it('should track completed operations', async () => {
      await limiter.execute(async () => 1);
      await limiter.execute(async () => 2);

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.completed, 2);
    });

    it('should track failed operations', async () => {
      await limiter.execute(async () => { throw new Error('fail'); }).catch(() => {});
      await limiter.execute(async () => { throw new Error('fail'); }).catch(() => {});

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.failed, 2);
    });

    it('should track rejected operations', async () => {
      const testLimiter = new RateLimiter({
        maxConcurrent: 1,
        queueTimeoutMs: 50
      });

      const slowOp = testLimiter.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const rejectedOps = Array.from({ length: 3 }, () =>
        testLimiter.execute(async () => 'done').catch(err => err)
      );

      await Promise.all(rejectedOps);
      await slowOp;

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = testLimiter.getMetrics();
      assert.strictEqual(metrics.rejected, 3);
    });

    it('should track queued operations', async () => {
      let block = true;
      
      limiter.execute(async () => {
        while (block) await new Promise(resolve => setTimeout(resolve, 10));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const queuedOps = Array.from({ length: 5 }, (_, i) =>
        limiter.execute(async () => i)
      );

      const metrics = limiter.getMetrics();
      assert.ok(metrics.queued > 0);

      block = false;
      await Promise.all(queuedOps);
    });

    it('should track maximum queue size', async () => {
      let block = true;

      limiter.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      limiter.execute(async () => {
        while (block) await new Promise(resolve => setTimeout(resolve, 10));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const queuedOps = Array.from({ length: 10 }, () =>
        limiter.execute(async () => 'done')
      );

      block = false;
      await Promise.all(queuedOps);

      const metrics = limiter.getMetrics();
      assert.ok(metrics.maxQueueSize > 0);
    });

    it('should track active operations', async () => {
      let block = true;

      const activeOps = Array.from({ length: 2 }, () =>
        limiter.execute(async () => {
          while (block) await new Promise(resolve => setTimeout(resolve, 10));
        })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.active, 2);

      block = false;
      await Promise.all(activeOps);
    });

    it('should track current queue length', async () => {
      let block = true;

      limiter.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      limiter.execute(async () => {
        while (block) await new Promise(resolve => setTimeout(resolve, 10));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const queuedOps = Array.from({ length: 5 }, () =>
        limiter.execute(async () => 'done')
      );

      const metrics = limiter.getMetrics();
      assert.ok(metrics.queueLength > 0);

      block = false;
      await Promise.all(queuedOps);
    });

    it('should calculate throughput', async () => {
      await limiter.execute(async () => 'done');
      await limiter.execute(async () => 'done');
      await limiter.execute(async () => 'done');

      const metrics = limiter.getMetrics();
      assert.ok(!isNaN(parseFloat(metrics.throughput)));
      assert.ok(parseFloat(metrics.throughput) >= 0);
    });

    it('should calculate success rate', async () => {
      await limiter.execute(async () => 'done');
      await limiter.execute(async () => 'done');
      await limiter.execute(async () => { throw new Error('fail'); }).catch(() => {});

      const metrics = limiter.getMetrics();
      assert.strictEqual(parseFloat(metrics.successRate), 66.67);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', async () => {
      await limiter.execute(async () => 1);
      await limiter.execute(async () => 2);

      limiter.reset();

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.total, 0);
      assert.strictEqual(metrics.completed, 0);
      assert.strictEqual(metrics.failed, 0);
      assert.strictEqual(metrics.rejected, 0);
      assert.strictEqual(metrics.queued, 0);
      assert.strictEqual(metrics.maxQueueSize, 0);
    });

    it('should clear queued operations and timers', async () => {
      let block = true;

      limiter.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      limiter.execute(async () => {
        while (block) await new Promise(resolve => setTimeout(resolve, 10));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      limiter.execute(async () => 'queued');
      limiter.execute(async () => 'queued2');

      await new Promise(resolve => setTimeout(resolve, 10));

      limiter.reset();

      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.queueLength, 0);
      assert.strictEqual(metrics.queued, 0);
      assert.strictEqual(metrics.active, 0);

      block = false;
    });
  });

  describe('operationName', () => {
    it('should use provided operation name', async () => {
      await limiter.execute(async () => 'done', 'testOperation');
      
      const metrics = limiter.getMetrics();
      assert.ok(metrics);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid succession of operations', async () => {
      const ops = Array.from({ length: 100 }, (_, i) =>
        limiter.execute(async () => i)
      );

      const results = await Promise.all(ops);
      assert.strictEqual(results.length, 100);
      
      const metrics = limiter.getMetrics();
      assert.strictEqual(metrics.completed, 100);
      assert.strictEqual(metrics.failed, 0);
    });

    it('should handle empty results from operations', async () => {
      const result = await limiter.execute(async () => null);
      assert.strictEqual(result, null);
    });

    it('should handle operations that return undefined', async () => {
      const result = await limiter.execute(async () => undefined);
      assert.strictEqual(result, undefined);
    });
  });
});
