const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { 
  IntegrationError, 
  ERROR_CODES, 
  isTransientError, 
  withTimeout, 
  retry, 
  CircuitBreaker 
} = require('./resilience');

describe('IntegrationError', () => {
  test('creates error with all properties', () => {
    const error = new IntegrationError('Test error', ERROR_CODES.TIMEOUT, { detail: 'value' });
    assert.strictEqual(error.name, 'IntegrationError');
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, ERROR_CODES.TIMEOUT);
    assert.deepStrictEqual(error.details, { detail: 'value' });
    assert.ok(error.timestamp);
  });

  test('converts to JSON correctly', () => {
    const error = new IntegrationError('Test error', ERROR_CODES.TIMEOUT);
    const json = error.toJSON();
    assert.strictEqual(json.name, 'IntegrationError');
    assert.strictEqual(json.message, 'Test error');
    assert.strictEqual(json.code, ERROR_CODES.TIMEOUT);
    assert.ok(json.timestamp);
  });
});

describe('isTransientError', () => {
  test('identifies transient error codes', () => {
    assert.strictEqual(isTransientError({ code: 'EAGAIN' }), true);
    assert.strictEqual(isTransientError({ code: 'EIO' }), true);
    assert.strictEqual(isTransientError({ code: 'ENOSPC' }), true);
    assert.strictEqual(isTransientError({ code: 'EBUSY' }), true);
    assert.strictEqual(isTransientError({ code: 'ETIMEDOUT' }), true);
  });

  test('identifies transient error messages', () => {
    assert.strictEqual(isTransientError({ message: 'operation timeout' }), true);
    assert.strictEqual(isTransientError({ message: 'ECONNRESET occurred' }), true);
  });

  test('returns false for non-transient errors', () => {
    assert.strictEqual(isTransientError({ code: 'ENOENT' }), false);
    assert.strictEqual(isTransientError({ code: 'EINVAL' }), false);
    assert.strictEqual(isTransientError(null), false);
    assert.strictEqual(isTransientError(undefined), false);
  });
});

describe('withTimeout', () => {
  test('resolves when promise completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 100, 'test operation');
    assert.strictEqual(result, 'success');
  });

  test('rejects when promise times out', async () => {
    const promise = new Promise(() => {});
    await assert.rejects(
      withTimeout(promise, 50, 'slow operation'),
      (error) => {
        assert.ok(error instanceof IntegrationError);
        assert.strictEqual(error.code, ERROR_CODES.TIMEOUT);
        assert.ok(error.message.includes('timed out'));
        return true;
      }
    );
  });

  test('rejects when promise rejects before timeout', async () => {
    const promise = Promise.reject(new Error('operation failed'));
    await assert.rejects(
      withTimeout(promise, 100, 'failing operation'),
      (error) => {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'operation failed');
        return true;
      }
    );
  });
});

describe('retry', () => {
  test('returns result on first success', async () => {
    let attemptCount = 0;
    const fn = () => {
      attemptCount++;
      return Promise.resolve('success');
    };
    
    const result = await retry(fn);
    assert.strictEqual(result, 'success');
    assert.strictEqual(attemptCount, 1);
  });

  test('retries on transient errors', async () => {
    let attemptCount = 0;
    const fn = () => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('EAGAIN: resource temporarily unavailable'));
      }
      return Promise.resolve('success');
    };
    
    const result = await retry(fn, { maxAttempts: 5 });
    assert.strictEqual(result, 'success');
    assert.strictEqual(attemptCount, 3);
  });

  test('exhausts retries for non-transient errors', async () => {
    let attemptCount = 0;
    const fn = () => {
      attemptCount++;
      return Promise.reject(new Error('ENOENT: no such file'));
    };
    
    await assert.rejects(
      retry(fn, { maxAttempts: 3 }),
      (error) => {
        assert.ok(error instanceof IntegrationError);
        assert.strictEqual(error.code, ERROR_CODES.RETRY_EXHAUSTED);
        assert.strictEqual(attemptCount, 1);
        return true;
      }
    );
  });

  test('exhausts retries for persistent transient errors', async () => {
    let attemptCount = 0;
    const fn = () => {
      attemptCount++;
      return Promise.reject(new Error('EAGAIN: resource temporarily unavailable'));
    };
    
    await assert.rejects(
      retry(fn, { maxAttempts: 2 }),
      (error) => {
        assert.ok(error instanceof IntegrationError);
        assert.strictEqual(error.code, ERROR_CODES.RETRY_EXHAUSTED);
        assert.strictEqual(attemptCount, 2);
        return true;
      }
    );
  });

  test('respects custom maxAttempts', async () => {
    let attemptCount = 0;
    const fn = () => {
      attemptCount++;
      return Promise.reject(new Error('EAGAIN'));
    };
    
    await assert.rejects(
      retry(fn, { maxAttempts: 4 }),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.RETRY_EXHAUSTED);
        assert.strictEqual(attemptCount, 4);
        return true;
      }
    );
  });

  test('uses exponential backoff', async () => {
    let attemptCount = 0;
    const timestamps = [];
    
    const fn = () => {
      timestamps.push(Date.now());
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('EAGAIN'));
      }
      return Promise.resolve('success');
    };
    
    await retry(fn, { 
      maxAttempts: 5, 
      initialDelayMs: 50,
      backoffMultiplier: 2
    });
    
    assert.strictEqual(attemptCount, 3);
    assert.ok(timestamps.length >= 3);
    
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];
    
    assert.ok(delay1 >= 40, 'First delay should be at least 40ms');
    assert.ok(delay2 >= 90, 'Second delay should be at least 90ms (2x)');
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 100
    });
  });

  afterEach(() => {
    circuitBreaker.eventEmitter.removeAllListeners();
  });

  test('executes function when circuit is closed', async () => {
    const result = await circuitBreaker.execute(() => Promise.resolve('success'));
    assert.strictEqual(result, 'success');
    assert.strictEqual(circuitBreaker.getState().state, 'CLOSED');
  });

  test('tracks failures and opens circuit after threshold', async () => {
    const fn = () => Promise.reject(new Error('EAGAIN'));
    
    for (let i = 0; i < 3; i++) {
      await assert.rejects(circuitBreaker.execute(fn));
    }
    
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
  });

  test('rejects immediately when circuit is open', async () => {
    const fn = () => Promise.reject(new Error('EAGAIN'));
    
    for (let i = 0; i < 3; i++) {
      await assert.rejects(circuitBreaker.execute(fn));
    }
    
    await assert.rejects(
      circuitBreaker.execute(() => Promise.resolve('success')),
      (error) => {
        assert.ok(error instanceof IntegrationError);
        assert.strictEqual(error.code, ERROR_CODES.CIRCUIT_BREAKER_OPEN);
        return true;
      }
    );
  });

  test('allows execution after reset timeout', async () => {
    const fn = () => Promise.reject(new Error('EAGAIN'));
    
    for (let i = 0; i < 3; i++) {
      await assert.rejects(circuitBreaker.execute(fn));
    }
    
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const result = await circuitBreaker.execute(() => Promise.resolve('success'));
    assert.strictEqual(result, 'success');
    assert.strictEqual(circuitBreaker.getState().state, 'CLOSED');
  });

  test('enters half-open state after reset timeout', async () => {
    const fn = () => Promise.reject(new Error('EAGAIN'));
    
    for (let i = 0; i < 3; i++) {
      await assert.rejects(circuitBreaker.execute(fn));
    }
    
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    await circuitBreaker.execute(() => Promise.resolve('success'));
    assert.strictEqual(circuitBreaker.getState().state, 'CLOSED');
  });

  test('re-opens circuit on failure in half-open state', async () => {
    const failFn = () => Promise.reject(new Error('EAGAIN'));
    
    for (let i = 0; i < 3; i++) {
      await assert.rejects(circuitBreaker.execute(failFn));
    }
    
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    await assert.rejects(circuitBreaker.execute(failFn));
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
  });

  test('resets failure count on success', async () => {
    circuitBreaker.onFailure();
    circuitBreaker.onFailure();
    assert.strictEqual(circuitBreaker.getState().failureCount, 2);
    
    circuitBreaker.onSuccess();
    assert.strictEqual(circuitBreaker.getState().failureCount, 0);
  });

  test('emits state change events', async () => {
    const events = [];
    circuitBreaker.onStateChange((event) => events.push(event));
    
    const failFn = () => Promise.reject(new Error('EAGAIN'));
    
    await assert.rejects(circuitBreaker.execute(failFn));
    await assert.rejects(circuitBreaker.execute(failFn));
    await assert.rejects(circuitBreaker.execute(failFn));
    
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].from, 'CLOSED');
    assert.strictEqual(events[0].to, 'OPEN');
  });

  test('resets circuit manually', () => {
    circuitBreaker.onFailure();
    circuitBreaker.onFailure();
    circuitBreaker.onFailure();
    
    assert.strictEqual(circuitBreaker.getState().state, 'OPEN');
    assert.strictEqual(circuitBreaker.getState().failureCount, 3);
    
    circuitBreaker.reset();
    
    assert.strictEqual(circuitBreaker.getState().state, 'CLOSED');
    assert.strictEqual(circuitBreaker.getState().failureCount, 0);
  });
});
