const fs = require('fs').promises;
const { withTimeout, retry, IntegrationError, ERROR_CODES, CircuitBreaker } = require('./resilience');

const DEFAULT_FILE_TIMEOUT_MS = 30000;

const fileReadCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000
});

const fileWriteCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000
});

function safeReadFile(filePath, options = {}) {
  return fileReadCircuitBreaker.execute(
    () => retry(
      () => withTimeout(
        fs.readFile(filePath, options.encoding || 'utf8'),
        options.timeoutMs || DEFAULT_FILE_TIMEOUT_MS,
        `readFile: ${filePath}`
      ),
      { maxAttempts: options.maxAttempts || 3 }
    ),
    `readFile: ${filePath}`
  ).catch(error => {
    throw new IntegrationError(
      `Failed to read file ${filePath}`,
      ERROR_CODES.FILE_READ_ERROR,
      { filePath, originalError: error.message, circuitBreakerState: fileReadCircuitBreaker.getState() }
    );
  });
}

function safeWriteFile(filePath, data, options = {}) {
  return fileWriteCircuitBreaker.execute(
    () => retry(
      () => withTimeout(
        fs.writeFile(filePath, data, options.encoding || 'utf8'),
        options.timeoutMs || DEFAULT_FILE_TIMEOUT_MS,
        `writeFile: ${filePath}`
      ),
      { maxAttempts: options.maxAttempts || 3 }
    ),
    `writeFile: ${filePath}`
  ).catch(error => {
    throw new IntegrationError(
      `Failed to write file ${filePath}`,
      ERROR_CODES.FILE_WRITE_ERROR,
      { filePath, originalError: error.message, circuitBreakerState: fileWriteCircuitBreaker.getState() }
    );
  });
}

function safeMkdir(dirPath, options = {}) {
  return retry(
    () => withTimeout(
      fs.mkdir(dirPath, { recursive: true }),
      options.timeoutMs || 5000,
      `mkdir: ${dirPath}`
    ),
    { maxAttempts: options.maxAttempts || 2 }
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
  return withTimeout(
    fs.access(filePath, mode),
    5000,
    `access: ${filePath}`
  ).catch(error => {
    throw new IntegrationError(
      `File access check failed for ${filePath}`,
      ERROR_CODES.FILE_READ_ERROR,
      { filePath, originalError: error.message }
    );
  });
}

function safeReaddir(dirPath, options = {}) {
  return retry(
    () => withTimeout(
      fs.readdir(dirPath),
      options.timeoutMs || 10000,
      `readdir: ${dirPath}`
    ),
    { maxAttempts: options.maxAttempts || 3 }
  ).catch(error => {
    throw new IntegrationError(
      `Failed to read directory ${dirPath}`,
      ERROR_CODES.FILE_READ_ERROR,
      { dirPath, originalError: error.message }
    );
  });
}

function safeStat(filePath, options = {}) {
  return retry(
    () => withTimeout(
      fs.stat(filePath),
      options.timeoutMs || 5000,
      `stat: ${filePath}`
    ),
    { maxAttempts: options.maxAttempts || 3 }
  ).catch(error => {
    throw new IntegrationError(
      `Failed to get file stats for ${filePath}`,
      ERROR_CODES.FILE_READ_ERROR,
      { filePath, originalError: error.message }
    );
  });
}

module.exports = {
  safeReadFile,
  safeWriteFile,
  safeMkdir,
  safeAccess,
  safeReaddir,
  safeStat,
  DEFAULT_FILE_TIMEOUT_MS,
  fileReadCircuitBreaker,
  fileWriteCircuitBreaker
};
