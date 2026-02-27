/**
 * @module resilience
 * @description Resilience patterns for error handling, retries, and circuit breakers.
 * Provides utilities for building robust integrations with proper error handling.
 */

const { EventEmitter } = require('events');

/**
 * Custom error class for integration errors with code and details.
 * @extends Error
 * @param {string} message - Error message
 * @param {string} code - Error code from ERROR_CODES
 * @param {Object} [details={}] - Additional error details
 */
class IntegrationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Standard error codes for integration errors.
 * @readonly
 * @enum {string}
 */
const ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
};

const TRANSIENT_ERROR_CODES = ['EAGAIN', 'EIO', 'ENOSPC', 'EBUSY', 'ETIMEDOUT'];

/**
 * Checks if an error is a transient error that may be retried.
 * @param {Error|null} error - Error to check
 * @returns {boolean} True if error is transient and should be retried
 */
function isTransientError(error) {
  if (!error) return false;
  if (TRANSIENT_ERROR_CODES.includes(error.code)) return true;
  if (error.message && typeof error.message === 'string') {
    return (
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('EAGAIN') ||
      error.message.includes('EIO') ||
      error.message.includes('ENOSPC') ||
      error.message.includes('EBUSY')
    );
  }
  return false;
}

/**
 * Executes a promise with a timeout.
 * @param {Promise<*>} promise - Promise to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} [operationName='operation'] - Name for this operation (for logging)
 * @returns {Promise<*>} Result of the promise
 * @throws {IntegrationError} Throws TIMEOUT error if deadline exceeded
 */
async function withTimeout(promise, timeoutMs, operationName = 'operation') {
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new IntegrationError(
          `${operationName} timed out after ${timeoutMs}ms`,
          ERROR_CODES.TIMEOUT,
          { timeoutMs, operationName }
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
}

/**
 * Retry options for the retry function.
 * @typedef {Object} RetryOptions
 * @property {number} [maxAttempts=3] - Maximum retry attempts
 * @property {number} [initialDelayMs=100] - Initial delay between retries (ms)
 * @property {number} [maxDelayMs=10000] - Maximum delay between retries (ms)
 * @property {number} [backoffMultiplier=2] - Multiplier for exponential backoff
 * @property {Function} [shouldRetry=isTransientError] - Function to determine if error should be retried
 */

/**
 * Executes a function with exponential backoff retry.
 * @param {Function} fn - Function to execute
 * @param {RetryOptions} [options={}] - Retry configuration
 * @returns {Promise<*>} Result of the function execution
 * @throws {IntegrationError} Throws RETRY_EXHAUSTED error after max attempts
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = isTransientError,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw new IntegrationError(
          `Operation failed after ${attempt} attempt(s)`,
          ERROR_CODES.RETRY_EXHAUSTED,
          {
            attempts: attempt,
            maxAttempts,
            lastError: lastError.message,
            lastErrorCode: lastError.code,
          }
        );
      }

      const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern implementation.
 * Prevents cascading failures by tracking errors and opening the circuit after threshold.
 * @see https://martinfowler.com/bliki/CircuitBreaker.html
 */
class CircuitBreaker {
  /**
   * Circuit breaker options.
   * @typedef {Object} CircuitBreakerOptions
   * @property {number} [failureThreshold=5] - Number of failures before opening circuit
   * @property {number} [resetTimeoutMs=60000] - Time to wait before attempting reset (ms)
   * @property {number} [monitoringPeriodMs=10000] - Period for monitoring failures (ms)
   */

  /**
   * Creates a new CircuitBreaker instance.
   * @param {CircuitBreakerOptions} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000;
    this.monitoringPeriodMs = options.monitoringPeriodMs || 10000;

    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.eventEmitter = new EventEmitter();
    this.monitoringStart = null;
  }

  /**
   * Executes a function through the circuit breaker.
   * @param {Function} fn - Function to execute
   * @param {string} [operationName='operation'] - Name for this operation (for logging)
   * @returns {Promise<*>} Result of the function execution
   * @throws {IntegrationError} Throws CIRCUIT_BREAKER_OPEN if circuit is open
   */
  async execute(fn, operationName = 'operation') {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.eventEmitter.emit('stateChange', { from: 'OPEN', to: 'HALF_OPEN' });
      } else {
        throw new IntegrationError(
          `Circuit breaker is OPEN for ${operationName}`,
          ERROR_CODES.CIRCUIT_BREAKER_OPEN,
          {
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            resetTimeoutMs: this.resetTimeoutMs,
          }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.eventEmitter.emit('stateChange', { from: 'HALF_OPEN', to: 'CLOSED' });
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.eventEmitter.emit('stateChange', { from: 'HALF_OPEN', to: 'OPEN' });
    } else if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      this.eventEmitter.emit('stateChange', { from: 'CLOSED', to: 'OPEN' });
    }
  }

  shouldAttemptReset() {
    return this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeoutMs;
  }

  /**
   * Gets the current state of the circuit breaker.
   * @returns {Object} Current state including state, failureCount, and lastFailureTime
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  onStateChange(callback) {
    this.eventEmitter.on('stateChange', callback);
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.eventEmitter.emit('stateChange', { from: this.state, to: 'CLOSED' });
  }
}

module.exports = {
  IntegrationError,
  ERROR_CODES,
  isTransientError,
  withTimeout,
  retry,
  CircuitBreaker,
};
