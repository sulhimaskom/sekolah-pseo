const fs = require('fs').promises;
const {
  withTimeout,
  retry,
  IntegrationError,
  ERROR_CODES,
  CircuitBreaker,
} = require('./resilience');
const CONFIG = require('./config');

const DEFAULT_FILE_TIMEOUT_MS = CONFIG.FILE_TIMEOUT_MS;
const { FAILURE_THRESHOLD, RESET_TIMEOUT_MS } = CONFIG.CIRCUIT_BREAKER_DEFAULTS;

/**
 * Factory function to create an isolated fs-safe instance with its own circuit breakers.
 * This enables test isolation - each test can have its own instance with fresh state.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.failureThreshold - Circuit breaker failure threshold (default from config)
 * @param {number} options.resetTimeoutMs - Circuit breaker reset timeout (default from config)
 * @param {number} options.fileTimeoutMs - File operation timeout (default from config)
 * @returns {Object} Object containing safe filesystem functions
 */
function createFsSafe(options = {}) {
  const failureThreshold = options.failureThreshold || FAILURE_THRESHOLD;
  const resetTimeoutMs = options.resetTimeoutMs || RESET_TIMEOUT_MS;
  const fileTimeoutMs = options.fileTimeoutMs || DEFAULT_FILE_TIMEOUT_MS;

  // Create isolated circuit breakers for this instance
  const fileReadCircuitBreaker = new CircuitBreaker({
    failureThreshold,
    resetTimeoutMs,
  });

  const fileWriteCircuitBreaker = new CircuitBreaker({
    failureThreshold,
    resetTimeoutMs,
  });

  /**
   * Reset the circuit breakers for this instance.
   * Useful for testing to clear state between test runs.
   */
  function resetCircuitBreakers() {
    fileReadCircuitBreaker.reset();
    fileWriteCircuitBreaker.reset();
  }

  function safeReadFile(filePath, fileOptions = {}) {
    return fileReadCircuitBreaker
      .execute(
        () =>
          retry(
            () =>
              withTimeout(
                fs.readFile(filePath, fileOptions.encoding || 'utf8'),
                fileOptions.timeoutMs || fileTimeoutMs,
                `readFile: ${filePath}`
              ),
            { maxAttempts: fileOptions.maxAttempts || 3 }
          ),
        `readFile: ${filePath}`
      )
      .catch(error => {
        throw new IntegrationError(`Failed to read file ${filePath}`, ERROR_CODES.FILE_READ_ERROR, {
          filePath,
          originalError: error.message,
          circuitBreakerState: fileReadCircuitBreaker.getState(),
        });
      });
  }

  function safeWriteFile(filePath, data, fileOptions = {}) {
    return fileWriteCircuitBreaker
      .execute(
        () =>
          retry(
            () =>
              withTimeout(
                fs.writeFile(filePath, data, fileOptions.encoding || 'utf8'),
                fileOptions.timeoutMs || fileTimeoutMs,
                `writeFile: ${filePath}`
              ),
            { maxAttempts: fileOptions.maxAttempts || 3 }
          ),
        `writeFile: ${filePath}`
      )
      .catch(error => {
        throw new IntegrationError(
          `Failed to write file ${filePath}`,
          ERROR_CODES.FILE_WRITE_ERROR,
          {
            filePath,
            originalError: error.message,
            circuitBreakerState: fileWriteCircuitBreaker.getState(),
          }
        );
      });
  }

  function safeMkdir(dirPath, fileOptions = {}) {
    return retry(
      () =>
        withTimeout(
          fs.mkdir(dirPath, { recursive: true }),
          fileOptions.timeoutMs || 5000,
          `mkdir: ${dirPath}`
        ),
      { maxAttempts: fileOptions.maxAttempts || 2 }
    ).catch(error => {
      if (error.code === 'EEXIST') return;
      throw new IntegrationError(
        `Failed to create directory ${dirPath}`,
        ERROR_CODES.FILE_WRITE_ERROR,
        { dirPath, originalError: error.message }
      );
    });
  }

  function safeAccess(filePath, mode = fs.constants.F_OK) {
    return withTimeout(fs.access(filePath, mode), 5000, `access: ${filePath}`).catch(error => {
      throw new IntegrationError(
        `File access check failed for ${filePath}`,
        ERROR_CODES.FILE_READ_ERROR,
        { filePath, originalError: error.message }
      );
    });
  }

  function safeReaddir(dirPath, fileOptions = {}) {
    return retry(
      () => withTimeout(fs.readdir(dirPath), fileOptions.timeoutMs || 10000, `readdir: ${dirPath}`),
      { maxAttempts: fileOptions.maxAttempts || 3 }
    ).catch(error => {
      throw new IntegrationError(
        `Failed to read directory ${dirPath}`,
        ERROR_CODES.FILE_READ_ERROR,
        {
          dirPath,
          originalError: error.message,
        }
      );
    });
  }

  function safeStat(filePath, fileOptions = {}) {
    return retry(
      () => withTimeout(fs.stat(filePath), fileOptions.timeoutMs || 5000, `stat: ${filePath}`),
      { maxAttempts: fileOptions.maxAttempts || 3 }
    ).catch(error => {
      throw new IntegrationError(
        `Failed to get file stats for ${filePath}`,
        ERROR_CODES.FILE_READ_ERROR,
        { filePath, originalError: error.message }
      );
    });
  }

  return {
    safeReadFile,
    safeWriteFile,
    safeMkdir,
    safeAccess,
    safeReaddir,
    safeStat,
    resetCircuitBreakers,
    fileReadCircuitBreaker,
    fileWriteCircuitBreaker,
  };
}

// Create the default singleton instance (for backward compatibility)
const defaultInstance = createFsSafe();

// Export the default instance functions for direct use
const {
  safeReadFile,
  safeWriteFile,
  safeMkdir,
  safeAccess,
  safeReaddir,
  safeStat,
  resetCircuitBreakers,
  fileReadCircuitBreaker,
  fileWriteCircuitBreaker,
} = defaultInstance;

module.exports = {
  // Factory function for creating isolated instances
  createFsSafe,
  // Default singleton instance functions (backward compatible)
  safeReadFile,
  safeWriteFile,
  safeMkdir,
  safeAccess,
  safeReaddir,
  safeStat,
  // Utility functions
  DEFAULT_FILE_TIMEOUT_MS,
  resetCircuitBreakers,
  // Exported circuit breakers for advanced use cases
  fileReadCircuitBreaker,
  fileWriteCircuitBreaker,
};
