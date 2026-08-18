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
  // File operation errors
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  FILE_EMPTY: 'FILE_EMPTY',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_URL: 'INVALID_URL',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_INPUT: 'INVALID_INPUT',

  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // System errors
  TIMEOUT: 'TIMEOUT',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',

  // Network / External service errors (integration hardening)
  HTTP_ERROR: 'HTTP_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',

  // Performance errors
  PERFORMANCE_BUDGET_VIOLATION: 'PERFORMANCE_BUDGET_VIOLATION',
};

const TRANSIENT_ERROR_CODES = ['EAGAIN', 'EIO', 'ENOSPC', 'EBUSY', 'ETIMEDOUT'];

const TRANSIENT_NETWORK_CODES = [
  'ECONNRESET',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNABORTED',
  'EPIPE',
  'EPROTO',
  'EAI_AGAIN',
  'ESOCKETTIMEDOUT',
];

const TRANSIENT_HTTP_STATUSES = [429, 500, 502, 503, 504];

/**
 * Checks if an error is a transient error that may be retried.
 * Covers filesystem, network, and HTTP-level transient conditions.
 * @param {Error|null} error - Error to check
 * @returns {boolean} True if error is transient and should be retried
 */
function isTransientError(error) {
  if (!error) return false;
  if (TRANSIENT_ERROR_CODES.includes(error.code) || TRANSIENT_NETWORK_CODES.includes(error.code))
    return true;
  if (
    TRANSIENT_HTTP_STATUSES.includes(error.statusCode) ||
    TRANSIENT_HTTP_STATUSES.includes(error.status)
  )
    return true;
  if (error.message && typeof error.message === 'string') {
    const msg = error.message;
    return (
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ECONNABORTED') ||
      msg.includes('EPIPE') ||
      msg.includes('EPROTO') ||
      msg.includes('EAI_AGAIN') ||
      msg.includes('ESOCKETTIMEDOUT') ||
      msg.includes('EAGAIN') ||
      msg.includes('EIO') ||
      msg.includes('ENOSPC') ||
      msg.includes('EBUSY') ||
      msg.includes('socket hang up') ||
      msg.includes('socket closed') ||
      msg.includes('read ETIMEDOUT') ||
      msg.includes('5xx') ||
      msg.includes('status 429') ||
      msg.includes('status 500') ||
      msg.includes('status 502') ||
      msg.includes('status 503') ||
      msg.includes('status 504')
    );
  }
  return false;
}

/**
 * Executes a promise with a timeout.
 * @param {Promise<*>} promise - Promise to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} [operationName='operation'] - Name for this operation (for logging)
 * @param {Function} [onTimeout] - Optional cleanup callback invoked when the
 *   deadline fires (e.g. to abort/destroy an in-flight HTTP request). Errors
 *   thrown by the callback are swallowed so they never mask the TIMEOUT error.
 * @returns {Promise<*>} Result of the promise
 * @throws {IntegrationError} Throws TIMEOUT error if deadline exceeded
 */
async function withTimeout(promise, timeoutMs, operationName = 'operation', onTimeout) {
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      if (typeof onTimeout === 'function') {
        try {
          onTimeout();
        } catch {
          // Cleanup errors must never mask the TIMEOUT error.
        }
      }
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
 * Executes a synchronous function with a timeout using spawnSync.
 * Kills the child process if it exceeds the deadline.
 * Designed for wrapping execSync/execFileSync calls that may hang.
 *
 * @param {Function} syncFn - Synchronous function that accepts { timeout, killSignal } options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} [operationName='operation'] - Name for this operation (for logging)
 * @returns {*} Result of the synchronous function
 * @throws {IntegrationError} Throws TIMEOUT error if deadline exceeded, or original error
 */
function withTimeoutSync(syncFn, timeoutMs, operationName = 'operation') {
  const timeoutAt = Date.now() + timeoutMs;
  try {
    return syncFn({ timeout: timeoutMs, killSignal: 'SIGTERM' });
  } catch (error) {
    if (
      error.killed ||
      error.signal === 'SIGTERM' ||
      (error.message && error.message.includes('timed out'))
    ) {
      throw new IntegrationError(
        `${operationName} timed out after ${timeoutMs}ms`,
        ERROR_CODES.TIMEOUT,
        { timeoutMs, operationName, elapsed: Date.now() - (timeoutAt - timeoutMs) }
      );
    }
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
 * @property {boolean} [jitter=false] - Randomize backoff delays (full jitter) to de-synchronize concurrent retries
 */

/**
 * Executes a function with exponential backoff retry.
 * Honors a server-provided `Retry-After` hint: if the last error carries a
 * positive numeric `retryAfterMs` (e.g. parsed from an HTTP 429 response),
 * the retry waits at least that long, capped at maxDelayMs.
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
    jitter = false,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        // Preserve the original error identity in `cause` so non-transient
        // failures (TypeError, programming bugs, domain errors) are not lost
        // behind the IntegrationError wrapper — callers that pattern-match
        // IntegrationError keep working; callers that need the root cause can
        // inspect `error.cause`.
        throw new IntegrationError(
          `Operation failed after ${attempt} attempt(s)`,
          ERROR_CODES.RETRY_EXHAUSTED,
          {
            attempts: attempt,
            maxAttempts,
            lastError: lastError.message,
            lastErrorCode: lastError.code,
            cause: lastError,
          }
        );
      }

      let delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs);

      // Full jitter (AWS recommendation): randomize the backoff so concurrent
      // retries don't fire in lockstep and amplify load on a recovering service.
      if (jitter) {
        delay = Math.random() * delay;
      }

      // Retry-After (e.g. HTTP 429) is a floor: never retry sooner than the
      // server asked, but cap at maxDelayMs to bound total wait time.
      if (lastError && Number.isFinite(lastError.retryAfterMs) && lastError.retryAfterMs > 0) {
        delay = Math.max(delay, Math.min(lastError.retryAfterMs, maxDelayMs));
      }

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
    // Single-flight guard for HALF_OPEN: only one probe may run at a time so
    // a recovering service isn't hit by every queued caller at once.
    this.halfOpenProbeInFlight = false;
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

    // HALF_OPEN: allow exactly one probe. While a probe is in flight, further
    // callers are rejected immediately (no cascade onto the recovering service).
    const isHalfOpen = this.state === 'HALF_OPEN';
    if (isHalfOpen) {
      if (this.halfOpenProbeInFlight) {
        throw new IntegrationError(
          `Circuit breaker is OPEN for ${operationName}`,
          ERROR_CODES.CIRCUIT_BREAKER_OPEN,
          {
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            resetTimeoutMs: this.resetTimeoutMs,
            probeInFlight: true,
          }
        );
      }
      this.halfOpenProbeInFlight = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      if (isHalfOpen) {
        this.halfOpenProbeInFlight = false;
      }
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
      probeInFlight: this.halfOpenProbeInFlight,
    };
  }

  onStateChange(callback) {
    this.eventEmitter.on('stateChange', callback);
  }

  reset() {
    const previousState = this.state;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.halfOpenProbeInFlight = false;
    this.eventEmitter.emit('stateChange', { from: previousState, to: 'CLOSED' });
  }
}

module.exports = {
  IntegrationError,
  ERROR_CODES,
  isTransientError,
  withTimeout,
  withTimeoutSync,
  retry,
  CircuitBreaker,
};
