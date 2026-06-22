# API Documentation

## Overview

This document defines the internal API contracts for all modules in the Sekolah PSEO project. These contracts ensure consistency, maintainability, and testability across the codebase.

## Module Organization

```
scripts/           # Controllers and utilities
├── config.js      # Configuration module
├── utils.js       # Shared utility functions
├── resilience.js  # Resilience patterns
├── fs-safe.js     # Resilient file system wrappers
├── rate-limiter.js # Rate limiting for concurrent operations
├── slugify.js     # URL slug generation
├── etl.js         # ETL operations
├── build-pages.js # Page build controller
├── sitemap.js     # Sitemap generator
├── validate-links.js # Link validation
├── logger.js       # Pino-based logging
├── fetch-data.js   # External data fetch from GitHub
├── check-freshness.js # Data freshness check
└── manifest.js     # Build manifest for incremental builds

src/
├── services/
│   └── PageBuilder.js  # Page builder service layer
└── presenters/
    ├── design-system.js   # Design tokens
    ├── styles.js         # CSS generator
    └── templates/
        ├── school-page.js    # School page HTML template
        ├── homepage.js       # Homepage HTML template
        └── province-page.js  # Province page HTML template
```

## Configuration Module (`scripts/config.js`)

### Purpose

Central configuration management with path validation and environment variable bounds checking.

### Export

```javascript
const CONFIG = {
  // File paths
  RAW_DATA_PATH: string,          // Path to raw CSV data
  SCHOOLS_CSV_PATH: string,        // Path to processed CSV data
  DIST_DIR: string,                // Output directory for HTML

  // URLs
  SITE_URL: string,                // Base URL for sitemap (default: 'https://example.com')

  // Concurrency limits (validated)
  BUILD_CONCURRENCY_LIMIT: number, // 1-1000 (default: 100)
  VALIDATION_CONCURRENCY_LIMIT: number, // 1-500 (default: 50)

  // Sitemap limits (validated)
  MAX_URLS_PER_SITEMAP: number,   // 1-50000 (default: 50000)

  // Directories
  ROOT_DIR: string,
  DATA_DIR: string,
  EXTERNAL_DIR: string,

  // Security utilities
  validatePath: function
};
```

### Functions

#### `validatePath(targetPath, basePath)`

Validates that `targetPath` is within `basePath` to prevent path traversal attacks.

**Parameters:**

- `targetPath` (string): Path to validate
- `basePath` (string): Root directory to check against

**Returns:** `boolean` - `true` if path is valid, `false` otherwise

**Error Handling:** N/A (returns boolean)

**Usage:**

```javascript
const isValid = validatePath('/project/data/file.csv', '/project');
// Returns: true
```

---

## Utility Module (`scripts/utils.js`)

### Purpose

Shared utility functions for CSV parsing, HTML escaping, arithmetic operations, directory walking, and data formatting.

### Exports

```javascript
module.exports = {
  parseCsv: function,
  escapeHtml: function,
  clearEscapeHtmlCache: function,
  escapeCsvField: function,
  walkDirectory: function,
  writeCsv: function,
  formatStatus: function,
  formatEmptyValue: function,
  hasCoordinateData: function,
  terminate: function,
  processConcurrently: function,
  generateMetaDescription: function,
};
```

### Functions

#### `parseCsv(csvData)`

Parses CSV string into array of objects, handling quoted fields with commas.

**Parameters:**

- `csvData` (string): Raw CSV data

**Returns:** `Array<Object>` - Parsed records

**Throws:** N/A (returns empty array for invalid input)

**Error Handling:** Returns `[]` for:

- `null` or `undefined` input
- Non-string input
- Empty CSV

**Usage:**

```javascript
const csvData = 'name,age\n"John, Doe",30\nJane,25';
const records = parseCsv(csvData);
// Returns: [{ name: 'John, Doe', age: '30' }, { name: 'Jane', age: '25' }]
```

---

#### `escapeHtml(text)`

Escapes HTML special characters to prevent XSS attacks.

**Parameters:**

- `text` (any): Value to escape

**Returns:** `string` - Escaped HTML-safe string

**Throws:** N/A

**Error Handling:**

- `null` or `undefined` → returns `''`
- Non-string → converts to string before escaping

**Escaped Characters:**

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#39;`

**Usage:**

```javascript
const safe = escapeHtml('<script>alert("XSS")</script>');
// Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

---

#### `clearEscapeHtmlCache()`

Clears the internal `escapeHtml` bounded Map cache. Used in testing to reset cached escape results between test cases, and for memory management when cache is no longer needed.

**Parameters:** None

**Returns:** `void`

**Throws:** N/A

**Notes:**

- Cache is a bounded Map (50,000 entry limit) — LRU-like eviction via first-key deletion
- Automatically populated on `escapeHtml()` calls — no manual priming needed
- Typically called in test `beforeEach` or `afterEach` hooks to prevent cross-test contamination

**Usage:**

```javascript
// Clear cache between test cases
clearEscapeHtmlCache();
```

---

#### `addNumbers(a, b)`

Adds two finite numbers with validation.

**Parameters:**

- `a` (number): First number
- `b` (number): Second number

**Returns:** `number` - Sum of the two numbers

**Throws:** `Error` if either parameter is not a finite number

**Error Handling:**

- Throws `Error` for `NaN`, `Infinity`, or non-numeric input

**Usage:**

```javascript
const sum = addNumbers(5, 3); // Returns: 8
addNumbers('a', 2); // Throws: Error('Both parameters must be finite numbers')
```

---

#### `walkDirectory(dir, callback)`

Recursively walks a directory tree and processes each HTML file with a callback.

**Parameters:**

- `dir` (string): Directory path to walk
- `callback` (Function): Callback function for each HTML file
  - Parameters: `(fullPath, relativePath, entry, stat)`
  - Returns: Value to include in results array, or `undefined` to skip

**Returns:** `Promise<Array>` - Array of results returned by callback

**Behavior:**

- Recursively traverses directory tree
- Filters for `.html` files only
- Passes full path, relative path, entry name, and stat to callback
- Collects non-undefined callback results

**Dependencies:**

- `safeReaddir` (from `scripts/fs-safe.js`)
- `safeStat` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
const htmlFiles = await walkDirectory('/dist', (fullPath, relPath) => fullPath);
console.log(`Found ${htmlFiles.length} HTML files`);

const urls = await walkDirectory('/dist', (fullPath, relPath) => `https://example.com/${relPath}`);
console.log(urls); // ['https://example.com/page1.html', ...]
```

---

#### `processConcurrently(items, processor, options)`

Processes an array of items concurrently with a configurable concurrency limit using `RateLimiter`. Provides progress tracking and metrics.

**Parameters:**

- `items` (Array): Array of items to process
- `processor` (Function): Async function that processes a single item, `(item, index) => Promise<any>`
- `options` (Object, optional):
  - `limit` (number): Max concurrent operations (default: 100)
  - `timeout` (number): Queue timeout in ms (default: 30000)
  - `getName` (Function): Optional function to generate operation name, `(item, index) => string`
  - `onProgress` (Function): Optional progress callback, `(processed, total) => void`

**Returns:** `Promise<Object>`

```javascript
{
  results: Array<PromiseSettledResult>,  // Promise.allSettled results
  metrics: {                             // RateLimiter metrics
    total: number,
    completed: number,
    failed: number,
    throughput: string,
    successRate: string,
  }
}
```

**Dependencies:**

- `RateLimiter` (from `scripts/rate-limiter.js`)

**Usage:**

```javascript
const { results, metrics } = await processConcurrently(
  items,
  async item => {
    return await processItem(item);
  },
  {
    limit: 50,
    timeout: 30000,
    getName: item => `process-${item.id}`,
    onProgress: (processed, total) => {
      console.log(`Progress: ${processed}/${total}`);
    },
  }
);
```

---

#### `writeCsv(data, outputPath)`

Writes an array of objects to a CSV file with header row.

**Parameters:**

- `data` (Array<Object>): Array of objects to write
- `outputPath` (string): Path to output CSV file

**Returns:** `Promise<void>`

**Throws:** `Error` if data is not a non-empty array

**Features:**

- Auto-generates header row from first object's keys
- Batches writes (1000 records per batch) for memory efficiency
- Handles missing values (empty string)

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
const data = [
  { npsn: '12345678', nama: 'School 1', provinsi: 'DKI Jakarta' },
  { npsn: '87654321', nama: 'School 2', provinsi: 'Jawa Barat' },
];
await writeCsv(data, '/output/schools.csv');
```

---

#### `formatStatus(status)`

Formats school status for display.

**Parameters:**

- `status` (string): Raw status value

**Returns:** `string` - Formatted status

**Mapping:**

- `null`/`undefined` → `'Tidak Diketahui'` (Unknown)
- `'N'` → `'Negeri'` (Public)
- `'S'` → `'Swasta'` (Private)
- Other values → Returned as-is (trimmed)

**Usage:**

```javascript
formatStatus('N'); // 'Negeri'
formatStatus('S'); // 'Swasta'
formatStatus(null); // 'Tidak Diketahui'
```

---

#### `formatEmptyValue(value, placeholder)`

Formats potentially empty values with a placeholder.

**Parameters:**

- `value` (any): Value to format
- `placeholder` (string, optional): Placeholder text (default: `'Tidak tersedia'`)

**Returns:** `string` - Formatted value or placeholder

**Behavior:**

- Returns `placeholder` if value is `null`, `undefined`, `''`, or whitespace-only
- Returns trimmed value otherwise

**Usage:**

```javascript
formatEmptyValue('Jakarta'); // 'Jakarta'
formatEmptyValue(''); // 'Tidak tersedia'
formatEmptyValue(null); // 'Tidak tersedia'
formatEmptyValue('  ', 'N/A'); // 'N/A'
```

---

#### `hasCoordinateData(school)`

Checks if school object has valid coordinate data.

**Parameters:**

- `school` (Object): School data object

**Returns:** `boolean` - `true` if coordinates are valid and non-zero

**Validation:**

- School must be an object
- Both `lat` and `lon` fields must exist
- Both values must be non-empty strings
- Neither value can be zero (0.0 is invalid coordinate)

**Usage:**

```javascript
hasCoordinateData({ lat: '-6.2088', lon: '106.8456' }); // true
hasCoordinateData({ lat: '0', lon: '0' }); // false
hasCoordinateData({ lat: '', lon: '' }); // false
hasCoordinateData(null); // false
```

---

#### `terminate(message, code)`

Logs a message and terminates the process with the given exit code. Centralizes process exit handling across all scripts for consistent error reporting.

**Parameters:**

- `message` (string): Message to log
- `code` (number, optional): Exit code (default: `1`)

**Behavior:**

- `code = 0`: Logs via `logger.info()` (success exit)
- `code = 1` (default): Logs via `logger.error()` and calls `process.exit(1)`
- All scripts should use this function instead of calling `process.exit()` directly

**Usage:**

```javascript
terminate('Schools CSV not found. Run ETL first.');
// Logs: ERROR: Schools CSV not found. Run ETL first.
// Then: process.exit(1)

terminate('Build completed successfully', 0);
// Logs: INFO: Build completed successfully
// Then: process.exit(0)
```

---

## Resilience Module (`scripts/resilience.js`)

### Purpose

Provides resilient patterns for integration operations: timeouts, retries, and circuit breakers.

### Classes

#### `IntegrationError`

Standardized error class for integration failures.

**Constructor:**

```javascript
new IntegrationError(message, code, details);
```

**Parameters:**

- `message` (string): Error description
- `code` (string): Error code from `ERROR_CODES`
- `details` (Object, optional): Additional context

**Properties:**

- `name` (string): `'IntegrationError'`
- `message` (string): Error description
- `code` (string): Error code
- `details` (Object): Error context
- `timestamp` (string): ISO-8601 timestamp

**Methods:**

- `toJSON()`: Returns serialized error object

**Error Codes:**

```javascript
ERROR_CODES = {
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
};
```

**Usage:**

```javascript
const error = new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR, {
  filePath: '/path/to/file.csv',
});
console.log(error.toJSON());
```

---

#### `CircuitBreaker`

Implements circuit breaker pattern to prevent cascade failures.

**Constructor:**

```javascript
new CircuitBreaker(options);
```

**Options:**

- `failureThreshold` (number, optional): Failures before opening (default: 5)
- `resetTimeoutMs` (number, optional): Time before attempting reset (default: 60000)
- `monitoringPeriodMs` (number, optional): Monitoring window (default: 10000)

**States:**

- `CLOSED`: Normal operation
- `OPEN`: Blocking operations
- `HALF_OPEN`: Testing recovery

**Methods:**

##### `execute(fn, operationName)`

Executes function with circuit breaker protection.

**Parameters:**

- `fn` (Function): Async function to execute
- `operationName` (string, optional): Operation name for logging (default: `'operation'`)

**Returns:** `Promise<any>` - Result from `fn`

**Throws:**

- `IntegrationError` with `CIRCUIT_BREAKER_OPEN` code if circuit is open
- Error from `fn` if execution fails

**Usage:**

```javascript
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});

try {
  const result = await breaker.execute(async () => {
    return await readFile('/path/to/file');
  }, 'readFile');
} catch (error) {
  if (error.code === ERROR_CODES.CIRCUIT_BREAKER_OPEN) {
    console.error('Circuit breaker is OPEN, retry later');
  }
}
```

##### `getState()`

Returns current circuit breaker state.

**Returns:** `Object`

```javascript
{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failureCount: number,
  lastFailureTime: number | null
}
```

##### `onStateChange(callback)`

Subscribes to state change events.

**Parameters:**

- `callback` (function): Callback with `{ from: state, to: state }`

**Returns:** `void`

##### `reset()`

Manually resets circuit breaker to CLOSED state.

**Returns:** `void`

---

### Functions

#### `isTransientError(error)`

Checks if error is transient (retryable).

**Parameters:**

- `error` (Error | any): Error to check

**Returns:** `boolean` - `true` if error is transient

**Transient Error Codes:** `EAGAIN`, `EIO`, `ENOSPC`, `EBUSY`, `ETIMEDOUT`

**Transient Error Messages:** Contains `timeout`, `ECONNRESET`, `EAGAIN`, `EIO`, `ENOSPC`, or `EBUSY`

**Usage:**

```javascript
if (isTransientError(error)) {
  // Retry the operation
}
```

---

#### `withTimeout(promise, timeoutMs, operationName)`

Wraps promise with timeout enforcement.

**Parameters:**

- `promise` (Promise): Promise to timeout
- `timeoutMs` (number): Timeout in milliseconds
- `operationName` (string, optional): Operation name for error message

**Returns:** `Promise<any>` - Promise result or timeout error

**Throws:** `IntegrationError` with `TIMEOUT` code if timeout exceeded

**Usage:**

```javascript
try {
  const data = await withTimeout(readFile('/large/file.csv'), 30000, 'readFile');
} catch (error) {
  if (error.code === ERROR_CODES.TIMEOUT) {
    console.error('Operation timed out');
  }
}
```

---

#### `retry(fn, options)`

Retries function with exponential backoff.

**Parameters:**

- `fn` (Function): Async function to retry
- `options` (Object, optional):
  - `maxAttempts` (number): Maximum retry attempts (default: 3)
  - `initialDelayMs` (number): Initial delay in ms (default: 100)
  - `maxDelayMs` (number): Maximum delay in ms (default: 10000)
  - `backoffMultiplier` (number): Backoff multiplier (default: 2)
  - `shouldRetry` (function): Function to determine if error is retryable (default: `isTransientError`)

**Returns:** `Promise<any>` - Function result

**Throws:** `IntegrationError` with `RETRY_EXHAUSTED` code if all retries fail

**Backoff Formula:** `min(initialDelayMs * multiplier^(attempt-1), maxDelayMs)`

**Usage:**

```javascript
try {
  const data = await retry(() => readFile('/unstable/file.csv'), {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 10000,
  });
} catch (error) {
  if (error.code === ERROR_CODES.RETRY_EXHAUSTED) {
    console.error('All retry attempts failed');
  }
}
```

---

## File System Module (`scripts/fs-safe.js`)

### Purpose

Resilient file system wrappers with timeout, retry, and circuit breaker protection.

### Exports

```javascript
module.exports = {
  createFsSafe: function,
  safeReadFile: function,
  safeWriteFile: function,
  safeMkdir: function,
  safeAccess: function,
  safeReaddir: function,
  safeStat: function,
  safeUnlink: function,
  resetCircuitBreakers: function,
  DEFAULT_FILE_TIMEOUT_MS: number,
  fileReadCircuitBreaker: CircuitBreaker,
  fileWriteCircuitBreaker: CircuitBreaker
};
```

### Circuit Breakers

- `fileReadCircuitBreaker`: File read operations (5 failures → OPEN, 60s reset)
- `fileWriteCircuitBreaker`: File write operations (5 failures → OPEN, 60s reset)

### Functions

#### `safeReadFile(filePath, options)`

Reads file with timeout, retry, and circuit breaker protection.

**Parameters:**

- `filePath` (string): Path to file
- `options` (Object, optional):
  - `encoding` (string): File encoding (default: `'utf8'`)
  - `timeoutMs` (number): Timeout in ms (default: 30000)
  - `maxAttempts` (number): Retry attempts (default: 3)

**Returns:** `Promise<string>` - File contents

**Throws:** `IntegrationError` with `FILE_READ_ERROR` code

**Timeout:** 30 seconds (default)
**Retries:** 3 attempts (default)
**Circuit Breaker:** 5 failures → OPEN for 60s

**Usage:**

```javascript
try {
  const data = await safeReadFile('/path/to/file.csv', {
    encoding: 'utf8',
    timeoutMs: 30000,
    maxAttempts: 3,
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `safeWriteFile(filePath, data, options)`

Writes file with timeout, retry, and circuit breaker protection.

**Parameters:**

- `filePath` (string): Path to file
- `data` (string): Content to write
- `options` (Object, optional):
  - `encoding` (string): File encoding (default: `'utf8'`)
  - `timeoutMs` (number): Timeout in ms (default: 30000)
  - `maxAttempts` (number): Retry attempts (default: 3)

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code

**Timeout:** 30 seconds (default)
**Retries:** 3 attempts (default)
**Circuit Breaker:** 5 failures → OPEN for 60s

**Usage:**

```javascript
try {
  await safeWriteFile('/path/to/file.html', htmlContent, {
    encoding: 'utf8',
    timeoutMs: 30000,
    maxAttempts: 3,
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `safeMkdir(dirPath, options)`

Creates directory with timeout and retry protection.

**Parameters:**

- `dirPath` (string): Directory path
- `options` (Object, optional):
  - `timeoutMs` (number): Timeout in ms (default: 5000)
  - `maxAttempts` (number): Retry attempts (default: 2)

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code

**Timeout:** 5 seconds (default)
**Retries:** 2 attempts (default)
**Special Handling:** Returns silently if directory exists (`EEXIST`)

**Usage:**

```javascript
try {
  await safeMkdir('/path/to/dir', {
    timeoutMs: 5000,
    maxAttempts: 2,
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `safeAccess(filePath, mode)`

Checks file existence with timeout protection.

**Parameters:**

- `filePath` (string): Path to file
- `mode` (number): Access mode (default: `fs.constants.F_OK`)

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_READ_ERROR` code

**Timeout:** 5 seconds

**Usage:**

```javascript
try {
  await safeAccess('/path/to/file.csv');
  console.log('File exists');
} catch (error) {
  console.error('File does not exist or cannot be accessed');
}
```

---

#### `safeReaddir(dirPath, options)`

Reads directory contents with timeout and retry protection.

**Parameters:**

- `dirPath` (string): Directory path
- `options` (Object, optional):
  - `timeoutMs` (number): Timeout in ms (default: 10000)
  - `maxAttempts` (number): Retry attempts (default: 3)

**Returns:** `Promise<string[]>` - Array of file/directory names

**Throws:** `IntegrationError` with `FILE_READ_ERROR` code

**Timeout:** 10 seconds (default)
**Retries:** 3 attempts (default)

**Usage:**

```javascript
try {
  const files = await safeReaddir('/path/to/dir', {
    timeoutMs: 10000,
    maxAttempts: 3,
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `safeStat(filePath, options)`

Gets file statistics with timeout and retry protection.

**Parameters:**

- `filePath` (string): Path to file
- `options` (Object, optional):
  - `timeoutMs` (number): Timeout in ms (default: 5000)
  - `maxAttempts` (number): Retry attempts (default: 3)

**Returns:** `Promise<fs.Stats>` - File statistics object

**Throws:** `IntegrationError` with `FILE_READ_ERROR` code

**Timeout:** 5 seconds (default)
**Retries:** 3 attempts (default)

**Usage:**

```javascript
try {
  const stats = await safeStat('/path/to/file.csv', {
    timeoutMs: 5000,
    maxAttempts: 3,
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `safeUnlink(filePath, options)`

Deletes a file with timeout and circuit breaker protection.

**Parameters:**

- `filePath` (string): Path to file to delete
- `options` (Object, optional):
  - `timeoutMs` (number): Timeout in ms (default: `DEFAULT_FILE_TIMEOUT_MS`)
  - `maxAttempts` (number): Retry attempts (default: 3)

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code

**Usage:**

```javascript
try {
  await safeUnlink('/path/to/stale-file.html');
} catch (error) {
  console.error(error.code, error.message);
}
```

---

#### `resetCircuitBreakers()`

Resets both file read and file write circuit breakers to CLOSED state. Used in testing to ensure clean state between test cases.

**Parameters:** None

**Returns:** `void`

**Usage:**

```javascript
const { resetCircuitBreakers } = require('./fs-safe');
resetCircuitBreakers();
```

---

#### `createFsSafe()`

Creates a fresh isolated instance of all file system safe wrappers with independent circuit breakers. Useful for testing and for creating isolated file system contexts.

**Returns:** `Object` - Object containing all safe file system functions with independent circuit breakers

```javascript
{
  (safeReadFile,
    safeWriteFile,
    safeMkdir,
    safeAccess,
    safeReaddir,
    safeStat,
    safeUnlink,
    fileReadCircuitBreaker,
    fileWriteCircuitBreaker,
    resetCircuitBreakers);
}
```

**Usage:**

```javascript
const { createFsSafe } = require('./fs-safe');
const fsSafe = createFsSafe();
await fsSafe.safeReadFile('/path/to/file.csv');
```

---

## Rate Limiter Module (`scripts/rate-limiter.js`)

### Purpose

Provides rate limiting for concurrent operations with backpressure, metrics, and queue timeout handling.

### Exports

```javascript
module.exports = {
  RateLimiter,
};
```

### Classes

#### `RateLimiter`

Implements rate limiting with concurrency control and queue management.

**Constructor:**

```javascript
new RateLimiter(options);
```

**Options:**

- `maxConcurrent` (number, optional): Maximum concurrent operations (default: 100)
- `rateLimitMs` (number, optional): Rate limit in milliseconds (default: 10, reserved for future use)
- `queueTimeoutMs` (number, optional): Queue timeout for operations (default: 30000)

**Methods:**

##### `execute(fn, operationName)`

Executes function with rate limiting and backpressure.

**Parameters:**

- `fn` (Function): Async function to execute
- `operationName` (string, optional): Operation name for tracking (default: `'operation'`)

**Returns:** `Promise<any>` - Result from `fn`

**Throws:**

- `IntegrationError` with `RETRY_EXHAUSTED` code if queue timeout exceeded

**Behavior:**

- Executes up to `maxConcurrent` operations simultaneously
- Queues additional operations when limit reached
- Rejects queued operations after `queueTimeoutMs`
- Tracks metrics for all operations

**Usage:**

```javascript
const limiter = new RateLimiter({
  maxConcurrent: 100,
  queueTimeoutMs: 30000,
});

try {
  const result = await limiter.execute(async () => {
    // Your operation here
    return await processData();
  }, 'processData');
} catch (error) {
  if (error.code === ERROR_CODES.RETRY_EXHAUSTED) {
    console.error('Operation timed out in queue');
  }
}
```

##### `getMetrics()`

Returns current metrics for the rate limiter.

**Returns:** `Object`

```javascript
{
  total: number,           // Total operations submitted
  completed: number,      // Successfully completed operations
  failed: number,         // Failed operations
  rejected: number,       // Rejected operations (queue timeout)
  queued: number,         // Currently queued operations
  maxQueueSize: number,   // Maximum queue size observed
  startTime: string,      // ISO-8601 timestamp of first operation
  active: number,         // Currently active operations
  queueLength: number,     // Current queue length
  throughput: string,      // Operations per second
  successRate: string     // Success percentage
}
```

**Usage:**

```javascript
const metrics = limiter.getMetrics();
console.log(`Throughput: ${metrics.throughput} ops/sec`);
console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Queue length: ${metrics.queueLength}`);
```

##### `reset()`

Resets all metrics and clears queue.

**Returns:** `void`

**Behavior:**

- Clears queued operations and timers
- Resets all metrics to zero
- Does not affect active operations

**Usage:**

```javascript
limiter.reset();
const metrics = limiter.getMetrics();
console.log(metrics.total); // 0
```

**Metrics Tracked:**

- **total**: Number of operations submitted
- **completed**: Successfully completed operations
- **failed**: Failed operations (execution errors)
- **rejected**: Rejected operations (queue timeout)
- **queued**: Currently queued operations
- **maxQueueSize**: Maximum queue size observed
- **active**: Currently executing operations
- **queueLength**: Current number of queued operations
- **throughput**: Operations per second (completed / elapsed time)
- **successRate**: Percentage of successful operations

---

## Slugify Module (`scripts/slugify.js`)

### Purpose

Converts text to URL-safe slugs with Indonesian character support and caching.

### Exports

```javascript
module.exports = slugify;
```

### Function

#### `slugify(text)`

Converts text to URL-safe slug.

**Parameters:**

- `text` (string): Text to slugify

**Returns:** `string` - URL-safe slug

**Throws:** N/A

**Transformations:**

1. Normalizes Unicode (NFD)
2. Removes diacritical marks
3. Converts to lowercase
4. Replaces non-alphanumeric characters with hyphens
5. Removes leading/trailing hyphens
6. Collapses multiple hyphens

**Cache:** Map-based cache with 10,000 entry limit

**Usage:**

```javascript
slugify('Jakarta Pusat'); // 'jakarta-pusat'
slugify('Sekolah Menengah Atas'); // 'sekolah-menengah-atas'
slugify('Yogyakarta'); // 'yogyakarta'
slugify('Jawa Barat'); // 'jawa-barat'
```

---

## ETL Module (`scripts/etl.js`)

### Purpose

Extract, Transform, Load operations for school data processing.

### Exports

```javascript
module.exports = {
  parseCsv: function,
  sanitize: function,
  normaliseRecord: function,
  validateRecord: function,
  validateLatLon: function,
  validateCategoricalField: function,
  checkNpsnUniqueness: function,
  generateDataQualityReport: function,
};
```

### Functions

#### `parseCsv(csvData)`

(Re-exported from `utils.js` - see above)

---

#### `sanitize(value)`

Sanitizes string by removing problematic characters.

**Parameters:**

- `value` (any): Value to sanitize

**Returns:** `string` - Sanitized string

**Throws:** N/A (returns `''` for non-string input)

**Sanitization Steps:**

1. Trim whitespace
2. Collapse multiple spaces
3. Remove control characters (U+0000 to U+001F)
4. Remove non-printable characters (except common Unicode)
5. Trim again

**Usage:**

```javascript
sanitize('  Jakarta  Pusat  '); // 'Jakarta Pusat'
sanitize(null); // ''
sanitize(123); // ''
sanitize('Hello\u0000World'); // 'HelloWorld'
```

---

#### `normaliseRecord(raw)`

Normalizes raw record to canonical schema.

**Parameters:**

- `raw` (Object): Raw record with flexible field names

**Returns:** `Object` - Normalized record

**Throws:** N/A (returns `{}` for invalid input)

**Schema:**

```javascript
{
  npsn: string,              // School ID
  nama: string,              // School name
  bentuk_pendidikan: string, // Education level
  status: string,            // School status
  alamat: string,            // Address
  kelurahan: string,         // Village
  kecamatan: string,         // District
  kab_kota: string,          // City/Regency
  provinsi: string,          // Province
  lat: string,               // Latitude
  lon: string,               // Longitude
  updated_at: string         // ISO date (YYYY-MM-DD)
}
```

**Field Mapping:** Supports multiple field name variants (e.g., `npsn` or `NPSN`)

**Usage:**

```javascript
const normalized = normaliseRecord({
  npsn: '12345678',
  nama_sekolah: 'SMA Negeri 1 Jakarta',
  jenjang: 'SMA',
  alamat_jalan: 'Jl. Sudirman No. 1',
  provinsi: 'DKI Jakarta',
  kabupaten: 'Jakarta Pusat',
  kecamatan: 'Menteng',
});
```

---

#### `validateRecord(record)`

Validates normalized record meets required criteria.

**Parameters:**

- `record` (Object): Normalized record

**Returns:** `boolean` - `true` if valid

**Throws:** N/A (returns `false` for invalid input)

**Validation Rules:**

- Record must be an object
- `npsn` field must exist
- `npsn` must be numeric (`^\d+$`)

**Usage:**

```javascript
validateRecord({ npsn: '12345678', nama: 'School' }); // true
validateRecord({ npsn: 'abc', nama: 'School' }); // false (not numeric)
validateRecord({ nama: 'School' }); // false (missing npsn)
validateRecord(null); // false
```

---

#### `validateLatLon(lat, lon)`

Validates latitude and longitude coordinates for Indonesia geographic bounds.

**Parameters:**

- `lat` (string): Latitude value
- `lon` (string): Longitude value

**Returns:** `boolean` - `true` if coordinates are within Indonesia bounds

**Validation Rules:**

- Latitude: -11 to 6 (Indonesia bounds)
- Longitude: 95 to 141 (Indonesia bounds)
- Returns `false` for empty, null, or non-numeric values

**Usage:**

```javascript
validateLatLon('-6.2088', '106.8456'); // true (Jakarta)
validateLatLon('0', '0'); // false (outside Indonesia bounds)
validateLatLon('', ''); // false (empty)
```

---

#### `validateCategoricalField(field, allowedValues)`

Validates a categorical field against a list of allowed values.

**Parameters:**

- `field` (string): Field value to validate
- `allowedValues` (Array<string>): Array of allowed values

**Returns:** `boolean` - `true` if field matches an allowed value

**Usage:**

```javascript
validateCategoricalField('N', ['N', 'S']); // true
validateCategoricalField('X', ['N', 'S']); // false
```

---

#### `checkNpsnUniqueness(records)`

Checks all NPSN values in the dataset for uniqueness.

**Parameters:**

- `records` (Array<Object>): Array of school records

**Returns:** `Object`

```javascript
{
  isUnique: boolean,
  duplicates: string[]
}
```

**Usage:**

```javascript
const { isUnique, duplicates } = checkNpsnUniqueness(schools);
if (!isUnique) {
  console.warn(`Duplicate NPSN found: ${duplicates.join(', ')}`);
}
```

---

#### `generateDataQualityReport(records)`

Generates comprehensive data quality metrics report for the school dataset.

**Parameters:**

- `records` (Array<Object>): Array of school records

**Returns:** `Object` - Data quality report with the following sections:

- `totalRecords` (number): Total number of records
- `fieldCompleteness` (Object): Per-field filled/missing/percentage stats
- `coordinateStats` (Object): Valid, missing, invalid coordinate counts
- `uniqueness` (Object): NPSN uniqueness summary with duplicate list
- `categoricalDistribution` (Object): Status and bentuk_pendidikan distribution

**Performance:** Single-pass computation of all metrics.

**Usage:**

```javascript
const report = generateDataQualityReport(schools);
console.log(`Valid coordinates: ${report.coordinateStats.validCoordinates}`);
```

---

## Page Builder Module (`src/services/PageBuilder.js`)

### Purpose

Service layer for page generation logic (path construction, data preparation, province page building).

### Exports

```javascript
module.exports = {
  buildSchoolPageData: function,
  getSchoolRelativePath: function,
  getUniqueDirectories: function,
  getUniqueProvinces: function,
  buildProvincePageData: function,
  groupSchoolsByProvince: function,
};
```

### Functions

#### `getSchoolRelativePath(school)`

Computes the relative file path for a school page without generating HTML. Used by manifest creation to avoid full HTML generation for path-only needs.

**Parameters:**

- `school` (Object): School data object

**Returns:** `string` - Relative file path

**Required Fields:** `['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama']`

**Path Format:** `provinsi/{provinsiSlug}/kabupaten/{kabKotaSlug}/kecamatan/{kecamatanSlug}/{npsn}-{namaSlug}.html`

**Dependencies:**

- `slugify` (from `scripts/slugify.js`)

**Usage:**

```javascript
const path = getSchoolRelativePath({
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
});
// Returns: 'provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng/12345678-sma-negeri-1-jakarta.html'
```

---

#### `buildSchoolPageData(school)`

Builds school page data with path and HTML content.

**Parameters:**

- `school` (Object): School data object

**Returns:** `Object`

```javascript
{
  relativePath: string,  // File path relative to DIST_DIR
  content: string        // HTML content
}
```

**Throws:**

- `Error` if `school` is not an object
- `Error` if required fields are missing

**Required Fields:** `['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama']`

**Path Format:** `provinsi/{provinsiSlug}/kabupaten/{kabKotaSlug}/kecamatan/{kecamatanSlug}/{npsn}-{namaSlug}.html`

**Dependencies:**

- `slugify` (from `scripts/slugify.js`)
- `generateSchoolPageHtml` (from `src/presenters/templates/school-page.js`)

**Usage:**

```javascript
const school = {
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
};

const pageData = buildSchoolPageData(school);
// Returns:
// {
//   relativePath: 'provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng/12345678-sma-negeri-1-jakarta.html',
//   content: '<!DOCTYPE html>...'
// }
```

---

#### `getUniqueDirectories(schools)`

Extracts unique directory paths from schools array.

**Parameters:**

- `schools` (Object[]): Array of school objects

**Returns:** `string[]` - Array of unique directory paths

**Throws:**

- `Error` if `schools` is not an array

**Path Format:** `provinsi/{provinsiSlug}/kabupaten/{kabKotaSlug}/kecamatan/{kecamatanSlug}`

**Dependencies:**

- `slugify` (from `scripts/slugify.js`)

**Usage:**

```javascript
const schools = [
  { provinsi: 'DKI Jakarta', kab_kota: 'Jakarta Pusat', kecamatan: 'Menteng' },
  { provinsi: 'DKI Jakarta', kab_kota: 'Jakarta Pusat', kecamatan: 'Menteng' },
  { provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Cicendo' },
];

const dirs = getUniqueDirectories(schools);
// Returns:
// [
//   'provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng',
//   'provinsi/jawa-barat/kabupaten/bandung/kecamatan/cicendo'
// ]
```

---

#### `getUniqueProvinces(schools)`

Extracts unique provinces from schools array with school counts.

**Parameters:**

- `schools` (Object[]): Array of school objects

**Returns:** `Object[]` - Array of province objects with name, slug, and count

**Throws:**

- `Error` if `schools` is not an array

**Usage:**

```javascript
const provinces = getUniqueProvinces(schools);
// Returns:
// [
//   { name: 'DKI Jakarta', slug: 'dki-jakarta', count: 1500 },
//   { name: 'Jawa Barat', slug: 'jawa-barat', count: 2200 },
// ]
```

---

#### `buildProvincePageData(provinceName, schools)`

Builds province page data with path and HTML content.

**Parameters:**

- `provinceName` (string): Province name
- `schools` (Array<Object>): Array of all school data objects

**Returns:** `Object`

```javascript
{
  relativePath: string,  // File path relative to DIST_DIR
  content: string        // HTML content
}
```

**Throws:**

- `Error` if `provinceName` is not a string
- `Error` if `schools` is not an array

**Path Format:** `provinsi/{provinceSlug}/index.html`

**Dependencies:**

- `slugify` (from `scripts/slugify.js`)
- `generateProvincePageHtml` (from `src/presenters/templates/province-page.js`)

**Usage:**

```javascript
const pageData = buildProvincePageData('DKI Jakarta', schools);
// Returns:
// {
//   relativePath: 'provinsi/dki-jakarta/index.html',
//   content: '<!DOCTYPE html>...'
// }
```

---

#### `groupSchoolsByProvince(schools)`

Groups all schools by province in a single O(n) pass. Used to eliminate O(n×p) filtering during province page generation.

**Parameters:**

- `schools` (Object[]): Array of school data objects

**Returns:** `Map<string, Array>` - Map keyed by province name, each value is array of schools in that province

**Throws:**

- `Error` if `schools` is not an array

**Dependencies:**

- None (standalone utility function)

**Usage:**

```javascript
const grouped = groupSchoolsByProvince(schools);
// Returns Map:
// {
//   'DKI Jakarta' => [school1, school2, ...],
//   'Jawa Barat' => [school3, school4, ...],
// }
const jakartaSchools = grouped.get('DKI Jakarta'); // Array of schools in Jakarta
```

**Performance:** Single pass O(n) — processes the entire schools array once. Province pages can then receive pre-filtered arrays with `skipFilter=true` to avoid redundant filtering.

---

## School Page Template Module (`src/presenters/templates/school-page.js`)

### Purpose

Presentation layer for school page HTML generation.

### Exports

```javascript
module.exports = {
  generateSchoolPageHtml: function,
  generateCanonicalUrl: function,
  generateEnrichmentSection: function,
};
```

### Functions

#### `generateSchoolPageHtml(school, relativePath)`

Generates complete HTML page for school.

**Parameters:**

- `school` (Object): School data object
- `relativePath` (string): Relative path to the page (used for canonical URL generation)

**Returns:** `string` - Complete HTML document

**Throws:**

- `Error` if `school` is not an object
- `Error` if required fields are missing

**Required Fields:** `['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama']`

**HTML Structure:**

- `<!DOCTYPE html>` declaration
- `<html lang="id">` - Indonesian language
- `<meta name="description">` for SEO
- Security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Strict-Transport-Security, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy)
- Theme color meta tags (light/dark mode support)
- Viewport meta tag for mobile responsiveness
- Open Graph meta tags for social sharing
- Schema.org JSON-LD structured data (School type)
- Skip link for keyboard navigation
- Semantic HTML5 structure (header, nav, main, article, section, footer)
- ARIA attributes for accessibility
- School details in definition list (dl/dt/dd) with copy-to-clipboard for NPSN
- External CSS via `<link rel="stylesheet" href="/styles.css">`

**Dependencies:**

- `escapeHtml` (from `scripts/utils.js`)
- `formatStatus` (from `scripts/utils.js`)
- `CONFIG` (from `scripts/config.js`)

**Usage:**

```javascript
const school = {
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
  bentuk_pendidikan: 'SMA',
  status: 'N',
  alamat: 'Jl. Sudirman No. 1',
};

const html = generateSchoolPageHtml(
  school,
  'provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng/12345678-sma-negeri-1-jakarta.html'
);
// Returns: '<!DOCTYPE html>\n<html lang="id">...'
```

---

#### `generateCanonicalUrl(relativePath)`

Generates full canonical URL from relative path and SITE_URL config.

**Parameters:**

- `relativePath` (string): Relative path to the HTML file

**Returns:** `string` - Full canonical URL

**Dependencies:**

- `CONFIG.SITE_URL` (from `scripts/config.js`)

**Usage:**

```javascript
const url = generateCanonicalUrl('provinsi/dki-jakarta/kabupaten/.../file.html');
// Returns: 'https://example.com/provinsi/dki-jakarta/.../file.html'
```

---

#### `generateEnrichmentSection(enrichment)`

Generates an enrichment data section for school pages, displaying additional information (e.g., accreditation, facilities, programs) when available.

**Parameters:**

- `enrichment` (Object|null): Enrichment data object or null if not available

**Returns:** `string` - HTML string for the enrichment section, or empty string if enrichment is null

**Dependencies:**

- `escapeHtml` (from `scripts/utils.js`)

**Usage:**

```javascript
const html = generateEnrichmentSection({
  accreditation: 'A',
  facilities: ['Lab', 'Perpustakaan'],
});
// Returns HTML section with enrichment data
```

---

## Homepage Template Module (`src/presenters/templates/homepage.js`)

### Purpose

Presentation layer for homepage HTML generation with search, filtering, and province navigation.

### Exports

```javascript
module.exports = {
  generateHomepageHtml: function,
  aggregateByProvince: function,
  aggregateProvinceAndFilters: function,
  prepareSchoolDataForSearch: function,
  extractFilterOptions: function,
};
```

### Functions

#### `generateHomepageHtml(schools)`

Generates complete HTML homepage with search, filtering, and province navigation.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `string` - Complete HTML document

**Features:**

- Client-side search with debouncing
- Province and education type filtering
- Responsive design with mobile support
- Keyboard navigation (/ to focus search, Escape to clear)
- Back-to-top button
- Embedded school data in JSON format for search (compact key structure)
- Accessibility: skip links, ARIA labels, screen reader support

**Usage:**

```javascript
const { generateHomepageHtml } = require('./templates/homepage');
const html = generateHomepageHtml(schools);
// Returns: '<!DOCTYPE html>\n<html lang="id">...'
```

---

#### `aggregateByProvince(schools)`

Aggregates school data by province for navigation.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Array<Object>` - Array of province objects with school count

```javascript
[
  { name: 'DKI Jakarta', slug: 'dki-jakarta', count: 1500 },
  { name: 'Jawa Barat', slug: 'jawa-barat', count: 2200 },
];
```

**Sorting:** Provinces are sorted alphabetically by Indonesian locale.

**Usage:**

```javascript
const { aggregateByProvince } = require('./templates/homepage');
const provinces = aggregateByProvince(schools);
provinces.forEach(p => console.log(`${p.name}: ${p.count}`));
```

---

#### `aggregateProvinceAndFilters(schools)`

Aggregates school data by province and extracts filter options in a single pass. Combines the functionality of `aggregateByProvince` and filter extraction to eliminate duplicate iteration.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Object`

```javascript
{
  provinces: [
    { name: 'DKI Jakarta', slug: 'dki-jakarta', count: 1500 },
  ],
  types: ['SMA', 'SMP', 'SD'],
}
```

**Performance:** Single-pass iteration instead of separate passes for province aggregation and filter extraction.

**Usage:**

```javascript
const { aggregateProvinceAndFilters } = require('./templates/homepage');
const { provinces, types } = aggregateProvinceAndFilters(schools);
```

---

#### `prepareSchoolDataForSearch(schools)`

Prepares school data into a compact format for client-side search. Converts school objects into flat arrays to minimize payload size.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Array<Array>` - Array of school records as flat arrays

```javascript
// Each record: [npsn, nama, bentuk, status, alamat, kecamatan, kota, provinsi, url]
[
  [
    '12345678',
    'SMA Negeri 1',
    'SMA',
    'N',
    'Jl. Sudirman',
    'Menteng',
    'Jakarta Pusat',
    'DKI Jakarta',
    '/provinsi/...',
  ],
];
```

**Array Indexes:** `0: npsn`, `1: nama`, `2: bentuk_pendidikan`, `3: status`, `4: alamat`, `5: kecamatan`, `6: kab_kota`, `7: provinsi`, `8: url`

**Usage:**

```javascript
const { prepareSchoolDataForSearch } = require('./templates/homepage');
const searchData = prepareSchoolDataForSearch(schools);
```

---

#### `extractFilterOptions(schools)`

Extracts unique filter options (education types) from school data.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Array<string>` - Sorted array of unique education types

```javascript
// Returns: ['SD', 'SMA', 'SMK', 'SMP']
```

**Usage:**

```javascript
const { extractFilterOptions } = require('./templates/homepage');
const types = extractFilterOptions(schools);
```

---

## Province Page Template Module (`src/presenters/templates/province-page.js`)

### Purpose

Presentation layer for province-level page HTML generation with kabupaten/kota navigation.

### Exports

```javascript
module.exports = {
  generateProvincePageHtml: function,
  filterSchoolsByProvince: function,
  aggregateByKabupaten: function,
};
```

### Functions

#### `generateProvincePageHtml(provinceName, schools)`

Generates complete HTML page for a specific province with kabupaten/kota navigation.

**Parameters:**

- `provinceName` (string): Province name to generate page for
- `schools` (Array<Object>): Array of all school data objects

**Returns:** `string` - Complete HTML document

**Features:**

- Lists all kabupaten/kota in the province
- Shows school count per kabupaten/kota
- Breadcrumb navigation
- Responsive design with mobile support
- Back-to-top button

**Usage:**

```javascript
const { generateProvincePageHtml } = require('./templates/province-page');
const html = generateProvincePageHtml('DKI Jakarta', schools);
// Returns: '<!DOCTYPE html>\n<html lang="id">...'
```

---

#### `filterSchoolsByProvince(schools, provinceName)`

Filters schools by province name.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects
- `provinceName` (string): Province name to filter by

**Returns:** `Array<Object>` - Filtered schools for the province

**Exact Match:** Uses strict equality (`===`) for province matching.

**Usage:**

```javascript
const { filterSchoolsByProvince } = require('./templates/province-page');
const jakartaSchools = filterSchoolsByProvince(schools, 'DKI Jakarta');
console.log(`Found ${jakartaSchools.length} schools`);
```

---

#### `aggregateByKabupaten(schools)`

Aggregates school data by kabupaten/kota within a province.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects (should be filtered by province)

**Returns:** `Array<Object>` - Array of kabupaten objects with school count

```javascript
[
  { name: 'Jakarta Pusat', slug: 'jakarta-pusat', count: 150 },
  { name: 'Jakarta Selatan', slug: 'jakarta-selatan', count: 200 },
];
```

**Sorting:** Kabupaten are sorted alphabetically by Indonesian locale.

**Usage:**

```javascript
const { aggregateByKabupaten } = require('./templates/province-page');
const kabupatens = aggregateByKabupaten(jakartaSchools);
kabupatens.forEach(k => console.log(`${k.name}: ${k.count}`));
```

---

### Path Format

Province pages are generated at:

```
/provinsi/{provinceSlug}/index.html
```

Example: `/provinsi/dki-jakarta/index.html`

## Build Pages Controller (`scripts/build-pages.js`)

### Purpose

Thin controller that orchestrates the static page build process by coordinating data loading, business logic, and file I/O operations.

### Exports

```javascript
module.exports = {
  writeSchoolPage: function,
  writeSchoolPagesConcurrently: function,
  ensureDistDir: function,
  loadSchools: function,
  generateExternalStyles: function,
  generateRobotsTxt: function,
  generateProvincePages: function,
  preCreateProvinceDirectories: function,
  writeSearchDataFile: function,
  build: function,
  buildIncremental: function,
  computeSchoolHash: function,
  createManifestFromSchools: function,
};
```

### Functions

#### `ensureDistDir()`

Ensures the distribution directory exists for generated files.

**Returns:** `Promise<void>`

**Throws:**

- `Error` if directory creation fails

**Usage:**

```javascript
await ensureDistDir();
```

---

#### `loadSchools()`

Loads processed school data from CSV file into array of objects.

**Returns:** `Promise<Array<Object>>` - Array of school records

**Throws:** `IntegrationError` with `FILE_EMPTY` code if CSV is empty or contains no records

**Usage:**

```javascript
const schools = await loadSchools();
console.log(`Loaded ${schools.length} schools`);
```

---

#### `writeSchoolPage(school)`

Writes a single school page to the file system.

**Parameters:**

- `school` (Object): School data object with required fields

**Returns:** `Promise<void>`

**Throws:**

- `Error` if page data generation fails
- `IntegrationError` if file write fails

**Path Format:** `{distDir}/{relativePath from PageBuilder}`

**Dependencies:**

- `buildSchoolPageData` (from `src/services/PageBuilder.js`)
- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await writeSchoolPage({
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
});
```

---

#### `generateExternalStyles()`

Generates the external CSS file for all school pages.

**Returns:** `Promise<void>`

**Throws:**

- `Error` if CSS generation fails
- `IntegrationError` if file write fails

**Output:** `dist/styles.css` - Single CSS file served by all school pages

**Dependencies:**

- `writeExternalStylesFile` (from `src/presenters/styles.js`)

**Usage:**

```javascript
await generateExternalStyles();
console.log('Generated styles.css');
```

---

#### `generateRobotsTxt(siteUrl)`

Generates a dynamic `robots.txt` file with the correct sitemap URL and writes it to the distribution directory.

**Parameters:**

- `siteUrl` (string): Base URL for the site (used to construct sitemap URL)

**Returns:** `Promise<void>`

**Throws:**

- `IntegrationError` if file write fails

**Output:** `dist/robots.txt`

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await generateRobotsTxt('https://example.com');
// Creates: dist/robots.txt with sitemap reference
```

---

#### `writeSearchDataFile(schools)`

Generates a searchable JSON data file (`schools.json`) from school records for client-side search functionality.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Promise<void>`

**Throws:**

- `IntegrationError` if file write fails

**Output:** `dist/schools.json` - Compact JSON payload for client-side search

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await writeSearchDataFile(schools);
// Creates: dist/schools.json (~1.1 MB for 3474 schools)
```

---

#### `preCreateProvinceDirectories(schools)`

Pre-creates all unique province directories (e.g., `dist/provinsi/{slug}/`).

**Parameters:**

- `schools` (Array<Object>): Array of school objects

**Returns:** `Promise<void>`

**Dependencies:**

- `getUniqueProvinces` (from `src/services/PageBuilder.js`)
- `safeMkdir` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await preCreateProvinceDirectories(schools);
```

---

#### `generateProvincePages(schools)`

Generates province-level index pages (e.g., `/provinsi/dki-jakarta/index.html`).

**Parameters:**

- `schools` (Array<Object>): Array of all school data objects

**Returns:** `Promise<Object>` - `{ successful: number, failed: number }`

**Process:**

1. Extracts unique provinces from school data
2. Pre-creates province directories
3. Generates province pages concurrently using `processConcurrently`

**Dependencies:**

- `getUniqueProvinces` (from `src/services/PageBuilder.js`)
- `buildProvincePageData` (from `src/services/PageBuilder.js`)

**Usage:**

```javascript
const { successful, failed } = await generateProvincePages(schools);
console.log(`Generated ${successful} province pages`);
```

---

#### `writeSchoolPagesConcurrently(schools, concurrencyLimit)`

Writes multiple school pages concurrently with controlled concurrency using `processConcurrently`.

**Parameters:**

- `schools` (Array<Object>): Array of school objects
- `concurrencyLimit` (number, optional): Max concurrent operations (default: `CONFIG.BUILD_CONCURRENCY_LIMIT`)

**Returns:** `Promise<Object>`

```javascript
{
  successful: number,  // Count of successfully generated pages
  failed: number        // Count of failed pages
}
```

**Behavior:**

- Pre-creates all unique directories first
- Uses `processConcurrently` for controlled concurrency
- Logs progress every 100 pages
- Outputs build metrics (total, completed, failed, throughput)

**Dependencies:**

- `processConcurrently` (from `scripts/utils.js`)
- `getUniqueDirectories()` (from `src/services/PageBuilder.js`) for pre-creating school page directories
- `writeSchoolPage()`

**Usage:**

```javascript
const { successful, failed } = await writeSchoolPagesConcurrently(schools, 100);
console.log(`Generated ${successful} pages (${failed} failed)`);
```

---

#### `computeSchoolHash(school)`

Computes a deterministic hash for a school record to detect changes for incremental builds.

**Parameters:**

- `school` (Object): School data object

**Returns:** `string` - Hash string

**Usage:**

```javascript
const hash = computeSchoolHash(school);
```

---

#### `createManifestFromSchools(schools)`

Creates a build manifest object from school records for incremental build tracking.

**Parameters:**

- `schools` (Array<Object>): Array of school records

**Returns:** `Object` - Manifest object with version, lastBuild timestamp, and per-school hashes

**Usage:**

```javascript
const manifest = createManifestFromSchools(schools);
```

---

#### `build(options)`

Main build function that orchestrates the complete build process.

**Parameters:**

- `options` (Object, optional):
  - `incremental` (boolean): If true, performs incremental build

**Returns:** `Promise<void>`

**Build Process (full):**

1. Ensures `dist/` directory exists
2. Generates external `styles.css` file
3. Loads school data from CSV
4. Generates homepage (`index.html`)
5. Generates province pages
6. Generates and writes all school pages concurrently
7. Saves build manifest for incremental builds

**Build Process (incremental):**

1. Ensures `dist/` directory exists
2. Generates external `styles.css` file
3. Loads school data from CSV
4. Loads previous manifest
5. Computes changed vs unchanged schools
6. Generates homepage (always)
7. Generates province pages (always)
8. Generates only changed school pages
9. Saves updated manifest

**Dependencies:**

- `ensureDistDir()`
- `generateExternalStyles()`
- `loadSchools()`
- `generateHomepageHtml` (from `src/presenters/templates/homepage.js`)
- `generateProvincePages()`
- `writeSchoolPagesConcurrently()`
- `loadManifest` / `saveManifest` (from `scripts/manifest.js`)

**Usage:**

```javascript
// Full build
await build();

// Incremental build
await build({ incremental: true });
```

---

## Sitemap Generator (`scripts/sitemap.js`)

### Purpose

Generates XML sitemap files respecting Google sitemap limits (50,000 URLs per file, 50MB per file) and creates a sitemap index.

### Exports

```javascript
module.exports = {
  collectUrls: function,
  collectUrlsFromSchools: function,
  writeSitemapFiles: function,
  writeSitemapIndex: function,
  escapeXml: function,
  generateSitemaps: function
};
```

### Functions

#### `collectUrls(dir, baseUrl)`

Collects all HTML file URLs from the distribution directory.

**Parameters:**

- `dir` (string): Directory path to walk
- `baseUrl` (string): Base URL for the site

**Returns:** `Promise<string[]>` - Array of complete URLs

**Behavior:**

- Recursively walks directory tree
- Filters for `.html` files only
- Builds full URLs with base URL

**Dependencies:**

- `walkDirectory` (from `scripts/utils.js`)

**Usage:**

```javascript
const urls = await collectUrls(CONFIG.DIST_DIR, 'https://example.com');
console.log(`Collected ${urls.length} URLs`);
```

---

#### `collectUrlsFromSchools(schools, baseUrl)`

Collects URLs from school data directly, avoiding filesystem walk. Generates homepage, province pages, and individual school page URLs.

**Parameters:**

- `schools` (Array<Object>): School data objects
- `baseUrl` (string): Base URL for the site (e.g. `https://example.com`)

**Returns:** `Array<Object>` - Array of URL entries with `url` and `lastmod` fields

**Behavior:**

- Generates homepage URL (`/`)
- Generates province page URLs (`/provinsi/{slug}/`)
- Generates individual school page URLs using `getSchoolRelativePath`
- Uses current date as lastmod for all entries

**Dependencies:**

- `getSchoolRelativePath` (from `src/services/PageBuilder.js`)
- `getUniqueProvinces` (from `src/services/PageBuilder.js`)

**Usage:**

```javascript
const urls = collectUrlsFromSchools(schools, 'https://example.com');
console.log(`Generated ${urls.length} URLs`);
```

---

#### `escapeXml(text)`

Escapes XML special characters to prevent XML injection attacks.

**Parameters:**

- `text` (string): Text to escape

**Returns:** `string` - XML-escaped text (returns `''` for non-string input)

**Escaped Characters:**

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&apos;`

**Usage:**

```javascript
const safe = escapeXml('<url>https://example.com&test</url>');
// Returns: '&lt;url&gt;https://example.com&amp;test&lt;/url&gt;'
```

---

#### `writeSitemapFiles(urls, outDir)`

Writes URLs to sitemap XML files, splitting them into chunks respecting `MAX_URLS_PER_SITEMAP` limit.

**Parameters:**

- `urls` (Array<string>): Array of URLs to include
- `outDir` (string): Output directory for sitemap files

**Returns:** `Promise<string[]>` - Array of generated sitemap filenames

**Sitemap Format:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page.html</loc></url>
  ...
</urlset>
```

**File Naming:** `sitemap-001.xml`, `sitemap-002.xml`, etc.

**Limits:**

- Max URLs per file: `CONFIG.MAX_URLS_PER_SITEMAP` (default: 50,000)
- Max file size: Not explicitly checked, but uses efficient string building

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
const files = await writeSitemapFiles(urls, CONFIG.DIST_DIR);
console.log(`Created ${files.length} sitemap files`);
```

---

#### `writeSitemapIndex(files, outDir, baseUrl)`

Writes a sitemap index XML file that references all sitemap files.

**Parameters:**

- `files` (Array<string>): Array of sitemap filenames
- `outDir` (string): Output directory
- `baseUrl` (string): Base URL for the site

**Returns:** `Promise<void>`

**Index Format:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-001.xml</loc></sitemap>
  ...
</sitemapindex>
```

**Output:** `sitemap-index.xml` in output directory

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await writeSitemapIndex(
  ['sitemap-001.xml', 'sitemap-002.xml'],
  CONFIG.DIST_DIR,
  'https://example.com'
);
```

---

#### `generateSitemaps(schools)`

Main function that orchestrates sitemap generation. Uses school data to generate URLs directly (faster, avoids filesystem I/O).

**Parameters:**

- `schools` (Array<Object>, optional): School data objects. If provided, uses `collectUrlsFromSchools` for URL generation. If omitted, falls back to filesystem walk via `collectUrls`.

**Returns:** `Promise<void>`

**Process:**

1. Collects all HTML file URLs (from school data or `dist/` directory)
2. Writes sitemap XML files (split by URL limit)
3. Writes sitemap index XML file
4. Logs summary with file count and total URLs

**Dependencies:**

- `collectUrlsFromSchools()` (data-driven path)
- `collectUrls()` (filesystem walk fallback)
- `writeSitemapFiles()`
- `writeSitemapIndex()`

**Usage:**

```javascript
await generateSitemaps();
// Output: "Generated 1 sitemap files with 3475 URLs total"
```

---

## Link Validator (`scripts/validate-links.js`)

### Purpose

Crawls generated HTML files and validates internal hyperlinks to ensure they resolve to existing files, reporting broken links.

### Exports

```javascript
module.exports = {
  extractLinks: function,
  validateLinksInFile: function,
  validateLinks: function
};
```

### Functions

#### `extractLinks(html)`

Extracts all `href` attribute values from HTML content.

**Parameters:**

- `html` (string): HTML content to parse

**Returns:** `Array<string>` - Array of href values

**Filters:**

- Includes relative links (not starting with `http://` or `https://`)
- Excludes absolute/external URLs
- Excludes fragment-only links (`#` or `#anchor`)

**Usage:**

```javascript
const links = extractLinks(
  '<a href="/page.html">Link</a><a href="https://example.com">External</a>'
);
// Returns: ['/page.html']
```

---

#### `validateLinksInFile(file, links, distDir)`

Validates all links in a single file and returns broken links.

**Parameters:**

- `file` (string): Path to the HTML file
- `links` (Array<string>): Array of link href values to validate
- `distDir` (string): Base distribution directory for resolving absolute paths

**Returns:** `Promise<Array<Object>>` - Array of broken links

```javascript
[
  {
    source: '/path/to/file.html',
    link: '/missing-page.html',
  },
];
```

**Validation Rules:**

- Skips empty links, fragments (`#`), and external URLs
- Resolves relative links relative to file's directory
- Resolves absolute links (`/path`) relative to `distDir`
- Checks if target exists using `safeAccess`
- Distinguishes between files and directories (directories not considered broken)

**Dependencies:**

- `safeAccess` (from `scripts/fs-safe.js`)
- `safeStat` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
const broken = await validateLinksInFile(
  '/path/to/file.html',
  ['/page1.html', '/missing.html'],
  '/dist'
);
console.log(`Found ${broken.length} broken links`);
```

---

#### `validateLinks()`

Main validation function that checks all links across all generated HTML files.

**Returns:** `Promise<boolean>` - `true` if no broken links found, `false` otherwise

**Process:**

1. Checks if `dist/` directory exists (returns early if not found)
2. Walks directory to find all HTML files
3. Validates links in each file concurrently using `RateLimiter`
4. Reports broken links if any found
5. Outputs validation metrics (total, completed, failed, throughput)

**Concurrency:** Controlled by `CONFIG.VALIDATION_CONCURRENCY_LIMIT` (default: 50)

**Dependencies:**

- `walkDirectory` (from `scripts/utils.js`)
- `RateLimiter` (from `scripts/rate-limiter.js`)
- `safeReadFile` (from `scripts/fs-safe.js`)
- `extractLinks()`
- `validateLinksInFile()`

**Usage:**

```javascript
const isValid = await validateLinks();
if (!isValid) {
  console.log('Some links are broken');
}
```

---

## Design System Module (`src/presenters/design-system.js`)

### Purpose

Central design system with design tokens for consistent styling across all generated pages.

### Exports

```javascript
module.exports = {
  DESIGN_TOKENS: object,
  getCssVariables: function
};
```

### Constants

#### `DESIGN_TOKENS`

Design token object containing all design system values.

**Structure:**

```javascript
{
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryFocus: '#3b82f6',
    text: { primary: '#111827', secondary: '#4b5563', light: '#6b7280' },
    background: { primary: '#ffffff', secondary: '#f9fafb', accent: '#f3f4f6' },
    border: '#d1d5db',
    focus: '#2563eb',
    skipLink: { background: '#000000', text: '#ffffff' }
  },
  spacing: {
    xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem'
  },
  typography: {
    fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' }
  },
  borderRadius: {
    sm: '0.25rem', md: '0.375rem', lg: '0.5rem', full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(37, 99, 235, 0.3)'
  },
  breakpoints: {
    sm: '640px', md: '768px', lg: '1024px', xl: '1280px'
  },
  transitions: {
    fast: '150ms', normal: '200ms', slow: '300ms'
  },
  zIndex: {
    base: '1', dropdown: '10', sticky: '20', fixed: '100', modal: '1000'
  }
}
```

**Usage:**

```javascript
const { DESIGN_TOKENS } = require('./design-system');
console.log(DESIGN_TOKENS.colors.primary); // '#2563eb'
```

---

### Functions

#### `getCssVariables()`

Generates CSS custom property declarations from design tokens.

**Returns:** `string` - CSS :root block with all variables

**CSS Output:**

```css
:root {
  --color-primary: #2563eb;
  --color-text-primary: #111827;
  --spacing-md: 1rem;
  --font-size-base: 1rem;
  ...
}
```

**Usage:**

```javascript
const css = getCssVariables();
console.log(css); // :root { ... }
```

---

## Styles Generator Module (`src/presenters/styles.js`)

### Purpose

Generates responsive CSS for school pages using design system tokens.

### Exports

```javascript
module.exports = {
  generateSchoolPageStyles: function,
  writeExternalStylesFile: function
};
```

### Functions

#### `generateSchoolPageStyles()`

Generates complete CSS string for school pages.

**Returns:** `string` - Complete CSS content

**CSS Sections:**

1. **Global Reset**: `* { box-sizing: border-box; }`
2. **HTML/Base Styles**: Font system, colors, line heights
3. **Accessibility Classes**:
   - `.skip-link`: Keyboard navigation (hidden until focused)
   - `.sr-only`: Screen reader only content
4. **Header/Nav**: Sticky header with navigation links (hover, focus states)
5. **Main Content**: Centered layout with max-width
6. **Article/Card**: School profile card with shadow
7. **School Details**: Definition list grid layout (`dt`/`dd`)
8. **Badges**: Status and education level badges
9. **Empty Values**: Styled placeholder text
10. **Responsive Breakpoints**:
    - Mobile (< 640px): Single column
    - Tablet (768px+): Medium spacing
    - Desktop (1024px+): Two-column grid
11. **Accessibility Media Queries**:
    - `prefers-reduced-motion`: Disables animations
    - `prefers-contrast`: High contrast mode

**Dependencies:**

- `getCssVariables` (from `./design-system.js`)
- `DESIGN_TOKENS` (from `./design-system.js`)

**Usage:**

```javascript
const css = generateSchoolPageStyles();
await safeWriteFile('/dist/styles.css', css);
```

---

#### `writeExternalStylesFile(distDir)`

Writes the generated CSS to an external file.

**Parameters:**

- `distDir` (string): Distribution directory path

**Returns:** `Promise<string>` - Path to written CSS file

**Output:** `{distDir}/styles.css`

**Dependencies:**

- `safeWriteFile` (from `scripts/fs-safe.js`)

**Usage:**

```javascript
await writeExternalStylesFile('/dist');
// Creates: /dist/styles.css
```

---

## Logger Module (`scripts/logger.js`)

### Purpose

Pino-based logging module with configurable log levels and child logger support.

### Exports

```javascript
module.exports = {
  logger: pino,
  log: function,
  info: function,
  warn: function,
  error: function,
  debug: function,
  trace: function,
  fatal: function,
  child: function,
  getLevel: function,
  setLevel: function
};
```

### Configuration

**Environment Variables:**

- `LOG_LEVEL` (optional): Set logging level. Options: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Default: `info`

### Functions

#### `logger.info(message, ...args)`

Log at info level.

**Parameters:**

- `message` (string): Log message
- `...args` (any): Additional arguments

**Returns:** `void`

**Usage:**

```javascript
const logger = require('./logger');
logger.info('Processing started');
logger.info('Processed %d records', count);
```

---

#### `logger.warn(message, ...args)`

Log at warn level.

**Parameters:**

- `message` (string): Log message
- `...args` (any): Additional arguments

**Returns:** `void`

**Usage:**

```javascript
logger.warn('Missing required field: %s', fieldName);
```

---

#### `logger.error(message, ...args)`

Log at error level.

**Parameters:**

- `message` (string): Log message
- `...args` (any): Additional arguments

**Returns:** `void`

**Usage:**

```javascript
logger.error('Failed to process file: %s', error.message);
```

---

#### `logger.debug(message, ...args)`

Log at debug level.

**Parameters:**

- `message` (string): Log message
- `...args` (any): Additional arguments

**Returns:** `void`

**Usage:**

```javascript
logger.debug('Processing school: %s', school.npsn);
```

---

#### `logger.child(bindings)`

Create a child logger with additional bindings.

**Parameters:**

- `bindings` (Object): Key-value pairs to add to all log entries

**Returns:** `pino` - Child logger instance

**Usage:**

```javascript
const etlLogger = logger.child({ module: 'etl' });
etlLogger.info('ETL process started');
// Log output: { "module": "etl", "level": 30, "time": ..., "msg": "ETL process started" }
```

---

#### `logger.getLevel()`

Get current log level.

**Returns:** `string` - Current log level

**Usage:**

```javascript
const currentLevel = logger.getLevel(); // 'info'
```

---

#### `logger.setLevel(level)`

Set log level dynamically.

**Parameters:**

- `level` (string): Log level to set

**Returns:** `void`

**Usage:**

```javascript
logger.setLevel('debug'); // Enable debug logging
```

## Data Freshness Module (`scripts/check-freshness.js`)

### Purpose

Checks the freshness of school data and generates quality metrics reports. Can be run locally or in CI/CD pipelines to ensure data is up-to-date.

### Exports

```javascript
module.exports = {
  getDataFreshness: function,
  getDataQualityMetrics: function
};
```

### Constants

- `DEFAULT_MAX_AGE_DAYS`: Maximum acceptable age of data in days (default: 7)

### Functions

#### `getDataFreshness()`

Gets the most recent update date from schools.csv and determines if data is fresh.

**Returns:** `Object` - Freshness information

```javascript
{
  exists: boolean,      // Whether schools.csv exists
  date: string|null,  // ISO date string or null
  daysAgo: number|null, // Days since last update or null
  recordCount: number, // Total number of school records
  isFresh: boolean    // true if data is within DEFAULT_MAX_AGE_DAYS
}
```

**Freshness Threshold:** Data is considered fresh if `daysAgo <= 7` (DEFAULT_MAX_AGE_DAYS)

**Usage:**

```javascript
const { getDataFreshness } = require('./check-freshness');
const freshness = getDataFreshness();

// If freshness.isFresh is false, data needs updating
if (!freshness.isFresh) {
  console.log(`Data is ${freshness.daysAgo} days old - consider refreshing`);
}
```

---

#### `getDataQualityMetrics()`

Calculates data quality metrics from schools.csv.

**Returns:** `Object|null` - Quality metrics or null if file doesn't exist

```javascript
{
  totalRecords: number,
  metrics: {
    coordinates: { count: number, percentage: string },
    address: { count: number, percentage: string },
    npsn: { count: number, percentage: string },
    province: { count: number, percentage: string }
  }
}
```

**Quality Metrics:**

- **coordinates**: Records with valid lat/lon values
- **address**: Records with non-empty address fields
- **npsn**: Records with valid NPSN (numeric)
- **province**: Records with province information

**Usage:**

```javascript
const { getDataQualityMetrics } = require('./check-freshness');
const quality = getDataQualityMetrics();
if (quality) {
  console.log(`Records with coordinates: ${quality.metrics.coordinates.percentage}%`);
}
```

---

### CLI Usage

The module can be run directly from the command line:

```bash
# Basic check
node scripts/check-freshness.js

# JSON output
node scripts/check-freshness.js --json

# Verbose output with quality metrics
node scripts/check-freshness.js --verbose
```

Exit Codes:

- `0`: Data is fresh
- `1`: Data is stale or error occurred

---

## Fetch Data Module (`scripts/fetch-data.js`)

### Purpose

Fetches the latest school data from external GitHub repositories. Supports cloning or updating external data sources.

### Exports

```javascript
module.exports = {
  fetchFromGitHub: function,
  findCsvFiles: function,
  copyToRaw: function,
  validateRepoUrl: function,
  validateBranchName: function
};
```

### Constants

- `DEFAULT_SOURCE_REPO`: Default GitHub repository URL
- `DEFAULT_BRANCH`: Default branch name (default: 'main')
- `EXTERNAL_DATA_DIR`: Directory for cloned external data

### Functions

#### `fetchFromGitHub(repoUrl, branch)`

Clones or updates the external data repository and finds the best CSV file.

**Parameters:**

- `repoUrl` (string, optional): Git repository URL
- `branch` (string, optional): Branch name

**Returns:** `string|null` - Path to CSV file or null if failed

**Behavior:**

- Clones repository if not exists
- Updates existing repository if already cloned
- Searches for CSV files with preferred names: sekolah.csv, data.csv, schools.csv, daftarsekolah.csv

**Usage:**

```javascript
const { fetchFromGitHub } = require('./fetch-data');
const csvPath = await fetchFromGitHub();
if (csvPath) {
  console.log(`Using: ${csvPath}`);
}
```

---

#### `findCsvFiles(dir)`

Recursively finds all CSV files in a directory.

**Parameters:**

- `dir` (string): Directory path to search

**Returns:** `string[]` - Array of CSV file paths

**Behavior:**

- Recursively traverses directory tree
- Only includes .csv files
- Excludes hidden directories (starting with '.')

**Usage:**

```javascript
const { findCsvFiles } = require('./fetch-data');
const files = findCsvFiles('/path/to/data');
console.log(`Found ${files.length} CSV files`);
```

---

#### `copyToRaw(sourcePath, destPath)`

Copies external CSV file to raw data location.

**Parameters:**

- `sourcePath` (string): Source CSV file path
- `destPath` (string): Destination path

**Returns:** `boolean` - Success status

**Behavior:**

- Creates destination directory if needed
- Uses fs.copyFileSync for reliable copying

**Usage:**

```javascript
const { copyToRaw } = require('./fetch-data');
const success = copyToRaw('/source/data.csv', '/path/to/raw.csv');
if (success) {
  console.log('File copied successfully');
}
```

---

#### `validateRepoUrl(url)`

Validates and sanitizes a Git repository URL to prevent command injection.

**Parameters:**

- `url` (string): The repository URL to validate

**Returns:** `string` - Sanitized URL

**Throws:** `Error` If URL is invalid or not a safe Git repository URL

**Security Validation:**

- Only allows http and https protocols
- Requires hostname to be present
- Must end with `.git`
- Reconstructs URL to remove any injected characters

**Usage:**

```javascript
const { validateRepoUrl } = require('./fetch-data');
const safeUrl = validateRepoUrl('https://github.com/user/repo.git');
// Returns: 'https://github.com/user/repo.git'

// Throws for invalid URLs:
validateRepoUrl('file:///etc/passwd'); // Error: Invalid protocol
validateRepoUrl('https://evil.com'); // Error: must end with .git
```

---

#### `validateBranchName(branch)`

Validates a Git branch name to prevent command injection.

**Parameters:**

- `branch` (string): Branch name to validate

**Returns:** `string` - Sanitized branch name

**Throws:** `Error` If branch name contains unsafe characters or patterns

**Security Validation:**

- Allows alphanumeric, hyphens, underscores, dots, and slashes
- Rejects branch names with special characters, spaces, or path traversal patterns

**Usage:**

```javascript
const { validateBranchName } = require('./fetch-data');
const safeBranch = validateBranchName('main'); // 'main'
validateBranchName('main; rm -rf /'); // Throws Error
```

---

### CLI Usage

The module can be run directly from the command line:

```bash
# Default fetch
node scripts/fetch-data.js

# Specify output path
node scripts/fetch-data.js --output custom/path.csv

# Specify source repository
node scripts/fetch-data.js --source https://github.com/user/repo.git
```

---

## Build Manifest Module (`scripts/manifest.js`)

### Purpose

Tracks built files with content hashes for incremental build support. Enables skipping unchanged school pages during rebuilds.

### Exports

```javascript
module.exports = {
  loadManifest: function,
  saveManifest: function,
  computeSchoolHash: function,
  getChangedSchools: function,
  getUnchangedSchools: function,
  clearManifest: function,
  MANIFEST_FILE: string
};
```

### Manifest Format

```javascript
{
  version: 1,
  lastBuild: "2026-01-07T12:34:56.789Z",
  schools: {
    "12345678": {
      hash: "a1b2c3d4e5f6...",
      builtAt: "2026-01-07T12:34:56.789Z",
      path: "provinsi/dki-jakarta/.../12345678-sma-negeri-1.html"
    }
  }
}
```

### Functions

#### `loadManifest()`

Loads the build manifest from disk.

**Returns:** `Promise<Object|null>` - Manifest object or `null` if not exists

**Behavior:**

- Returns `null` if manifest file doesn't exist
- Returns `null` if manifest version doesn't match `MANIFEST_VERSION`

**Usage:**

```javascript
const manifest = await loadManifest();
if (!manifest) {
  console.log('No previous build found');
}
```

---

#### `saveManifest(manifest)`

Saves the build manifest to disk.

**Parameters:**

- `manifest` (Object): Manifest object to save

**Returns:** `Promise<void>`

**Throws:** Error if file write fails

**Usage:**

```javascript
const manifest = {
  version: 1,
  lastBuild: new Date().toISOString(),
  schools: {},
};
await saveManifest(manifest);
```

---

#### `computeSchoolHash(school)`

Computes a hash for a school record based on its content.

**Parameters:**

- `school` (Object): School record

**Returns:** `string` - MD5 hash of relevant fields

**Hash Fields:**

- `npsn`, `nama`, `bentuk_pendidikan`, `status`, `alamat`
- `kelurahan`, `kecamatan`, `kab_kota`, `provinsi`, `lat`, `lon`

**Usage:**

```javascript
const hash = computeSchoolHash(school);
console.log(`Hash: ${hash}`);
```

---

#### `getChangedSchools(schools, manifest)`

Gets schools that have changed since last build.

**Parameters:**

- `schools` (Array<Object>): Current school records
- `manifest` (Object): Previous build manifest

**Returns:** `Object` - `{ changed: Array, unchanged: Array }`

**Behavior:**

- Returns all schools as `changed` if no manifest exists
- Returns schools with new NPSN as `changed`
- Returns schools with different hash as `changed`
- Returns schools with same hash as `unchanged`

**Usage:**

```javascript
const { changed, unchanged } = getChangedSchools(schools, manifest);
console.log(`Changed: ${changed.length}, Unchanged: ${unchanged.length}`);
```

---

#### `getUnchangedSchools(schools, manifest)`

Gets schools that haven't changed since last build.

**Parameters:**

- `schools` (Array<Object>): Current school records
- `manifest` (Object): Previous build manifest

**Returns:** `Array<Object>` - Unchanged schools

**Usage:**

```javascript
const unchanged = getUnchangedSchools(schools, manifest);
console.log(`Skipping ${unchanged.length} unchanged schools`);
```

---

#### `clearManifest()`

Clears the build manifest (forces full rebuild).

**Returns:** `Promise<void>`

**Usage:**

```javascript
await clearManifest();
console.log('Manifest cleared - next build will be full');
```

---

## Error Handling Standards

### IntegrationError Format

All integration errors use `IntegrationError` with consistent structure:

```javascript
{
  name: 'IntegrationError',
  message: 'Error description',
  code: 'ERROR_CODE',
  details: { ...context },
  timestamp: '2026-01-07T12:34:56.789Z'
}
```

### Error Code Mapping

| Code                     | Module          | Scenario                           |
| ------------------------ | --------------- | ---------------------------------- |
| `FILE_READ_ERROR`        | File operations | File reading failed                |
| `FILE_WRITE_ERROR`       | File operations | File writing failed                |
| `FILE_EMPTY`             | File operations | File exists but is empty           |
| `VALIDATION_ERROR`       | Data processing | Data validation failed             |
| `INVALID_URL`            | Data processing | URL format validation failed       |
| `INVALID_COORDINATES`    | Data processing | Coordinate out of Indonesia bounds |
| `INVALID_INPUT`          | Data processing | Invalid input provided             |
| `CONFIGURATION_ERROR`    | Configuration   | Configuration issue                |
| `MISSING_REQUIRED_FIELD` | Data processing | Required field is missing          |
| `TIMEOUT`                | All operations  | Operation exceeded time limit      |
| `RETRY_EXHAUSTED`        | All retries     | All retry attempts failed          |
| `CIRCUIT_BREAKER_OPEN`   | File I/O        | Circuit breaker is blocking        |

### Error Handling Patterns

#### Try-Catch Pattern

```javascript
try {
  await safeReadFile('/path/to/file.csv');
} catch (error) {
  if (error.name === 'IntegrationError') {
    console.error(`Integration error: ${error.code} - ${error.message}`);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

#### Circuit Breaker Monitoring

```javascript
fileReadCircuitBreaker.onStateChange(({ from, to }) => {
  console.log(`Circuit breaker: ${from} → ${to}`);
  console.log('State:', fileReadCircuitBreaker.getState());
});
```

---

## Module Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    config.js                                 │
│  (No dependencies)                                          │
└──────────────────────────┬──────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│   utils.js       │ │  slugify.js  │ │ resilience.js   │
│  (No deps)       │ │  (No deps)   │ │  (No deps)      │
└──────────────────┘ └──────────────┘ └─────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ rate-limiter.js │
                                    │  Depends:       │
                                    │  - resilience.js│
                                    └────────┬─────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    fs-safe.js                                │
│  Depends: resilience.js                                     │
└──────────────────────────┬──────────────────────────────────┘
                          │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│     etl.js       │ │  build-pages│ │  sitemap.js     │
│  Depends:        │ │  .js         │ │  Depends:       │
│  - utils.js      │ │  Depends:    │ │  - fs-safe.js   │
│  - config.js     │ │  - fs-safe.js│ │  - utils.js     │
│  - fs-safe.js    │ │  - slugify.js│ │  - config.js    │
└──────────────────┘ │  - utils.js  │ │                  │
                    │  - config.js │ └─────────────────┘
                    │  - services/ │
                    │    PageBuilder│
                    │  - rate-     │
                    │    limiter.js │
                    │              │
                    └──────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              src/services/PageBuilder.js                     │
│  Depends:                                                   │
│  - slugify.js                                               │
│  - src/presenters/templates/school-page.js                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         src/presenters/templates/school-page.js             │
│  Depends:                                                   │
│  - utils.js (escapeHtml)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. Always Use Resilient Wrappers

```javascript
// Good
await safeReadFile('/path/to/file.csv');

// Bad (no timeout, retry, or circuit breaker)
await fs.readFile('/path/to/file.csv', 'utf8');
```

### 2. Validate Input Early

```javascript
// Good
if (!school || typeof school !== 'object') {
  throw new Error('Invalid school object provided');
}

// Bad (fails unpredictably later)
const path = school.provinsi; // Could be undefined
```

### 3. Use IntegrationError for Integration Failures

```javascript
// Good
throw new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR, { filePath });

// Bad (generic error)
throw new Error('File read failed');
```

### 4. Set Appropriate Timeouts

```javascript
// Good (reasonable default)
await safeReadFile('/path/to/file.csv', { timeoutMs: 30000 });

// Bad (indefinite wait)
await safeReadFile('/path/to/file.csv', { timeoutMs: 0 });
```

### 5. Handle Circuit Breaker States

```javascript
// Good (check circuit breaker state)
const state = fileReadCircuitBreaker.getState();
if (state.state === 'OPEN') {
  console.log('Waiting for circuit breaker to reset');
}

// Bad (no awareness of circuit breaker)
await safeReadFile('/path/to/file.csv'); // May fail without context
```

### 6. Sanitize User Input

```javascript
// Good (escape HTML output)
const html = `<div>${escapeHtml(userContent)}</div>`;

// Bad (XSS vulnerability)
const html = `<div>${userContent}</div>`;
```

### 7. Use Meaningful Error Details

```javascript
// Good (context-rich error)
throw new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR, {
  filePath,
  circuitBreakerState: fileReadCircuitBreaker.getState(),
  originalError: error.message,
});

// Bad (no context)
throw new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR);
```

### 8. Use Rate Limiters for Concurrent Operations

```javascript
// Good (controlled concurrency with metrics)
const limiter = new RateLimiter({
  maxConcurrent: 100,
  queueTimeoutMs: 30000,
});

const results = await Promise.all(
  items.map(item => limiter.execute(async () => processItem(item), `process-${item.id}`))
);

console.log('Metrics:', limiter.getMetrics());

// Bad (uncontrolled concurrency, no backpressure)
const results = await Promise.all(items.map(item => processItem(item)));
```

---

## Testing Guidelines

### Unit Testing

- Test each function in isolation
- Mock dependencies (fs, slugify, etc.)
- Cover success and failure paths
- Test edge cases (null, undefined, empty strings)

### Integration Testing

- Test module interactions
- Validate data flow between layers
- Test error propagation
- Verify circuit breaker behavior

### Contract Testing

- Verify function signatures match API contracts
- Validate input/output types
- Test error codes
- Ensure backward compatibility

---

## Versioning

### Current Version: 1.0.0

### Breaking Changes

None - All APIs are backward compatible.

### Deprecation Notices

None.

---

## Changelog

### Version 1.1.0 (2026-01-10)

- Added Build Pages Controller documentation (scripts/build-pages.js)
- Added Sitemap Generator documentation (scripts/sitemap.js)
- Added Link Validator documentation (scripts/validate-links.js)
- Added Design System module documentation (src/presenters/design-system.js)
- Added Styles Generator documentation (src/presenters/styles.js)
- Added additional utility functions (walkDirectory, writeCsv, formatStatus, formatEmptyValue, hasCoordinateData)
- Updated Module Organization with new modules
- Updated Dependency Graph with new dependencies

### Version 1.0.0 (2026-01-07)

- Initial API documentation
- Standardized error format
- Resilience patterns implemented
- Module contracts defined
