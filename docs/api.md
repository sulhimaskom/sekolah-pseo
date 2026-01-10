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
└── validate-links.js # Link validation

src/
├── services/
│   └── PageBuilder.js  # Page builder service layer
└── presenters/
    └── templates/
        └── school-page.js  # HTML template generation
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
Shared utility functions for CSV parsing, HTML escaping, and arithmetic operations.

### Exports

```javascript
module.exports = {
  parseCsv: function,
  escapeHtml: function,
  addNumbers: function
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

## Resilience Module (`scripts/resilience.js`)

### Purpose
Provides resilient patterns for integration operations: timeouts, retries, and circuit breakers.

### Classes

#### `IntegrationError`
Standardized error class for integration failures.

**Constructor:**
```javascript
new IntegrationError(message, code, details)
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
  TIMEOUT: 'TIMEOUT',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
};
```

**Usage:**
```javascript
const error = new IntegrationError(
  'Failed to read file',
  ERROR_CODES.FILE_READ_ERROR,
  { filePath: '/path/to/file.csv' }
);
console.log(error.toJSON());
```

---

#### `CircuitBreaker`
Implements circuit breaker pattern to prevent cascade failures.

**Constructor:**
```javascript
new CircuitBreaker(options)
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
  resetTimeoutMs: 60000
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
  const data = await withTimeout(
    readFile('/large/file.csv'),
    30000,
    'readFile'
  );
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
  const data = await retry(
    () => readFile('/unstable/file.csv'),
    { maxAttempts: 3, initialDelayMs: 100, maxDelayMs: 10000 }
  );
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
  safeReadFile: function,
  safeWriteFile: function,
  safeMkdir: function,
  safeAccess: function,
  safeReaddir: function,
  safeStat: function,
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
    maxAttempts: 3
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
    maxAttempts: 3
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
    maxAttempts: 2
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
    maxAttempts: 3
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
    maxAttempts: 3
  });
} catch (error) {
  console.error(error.code, error.message);
}
```

---

## Rate Limiter Module (`scripts/rate-limiter.js`)

### Purpose
Provides rate limiting for concurrent operations with backpressure, metrics, and queue timeout handling.

### Exports

```javascript
module.exports = {
  RateLimiter
};
```

### Classes

#### `RateLimiter`
Implements rate limiting with concurrency control and queue management.

**Constructor:**
```javascript
new RateLimiter(options)
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
  queueTimeoutMs: 30000
});

try {
  const result = await limiter.execute(
    async () => {
      // Your operation here
      return await processData();
    },
    'processData'
  );
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
slugify('Jakarta Pusat');          // 'jakarta-pusat'
slugify('Sekolah Menengah Atas');   // 'sekolah-menengah-atas'
slugify('Yogyakarta');              // 'yogyakarta'
slugify('Jawa Barat');             // 'jawa-barat'
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
  validateRecord: function
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
sanitize('  Jakarta  Pusat  ');        // 'Jakarta Pusat'
sanitize(null);                        // ''
sanitize(123);                         // ''
sanitize('Hello\u0000World');          // 'HelloWorld'
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
  kecamatan: 'Menteng'
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
validateRecord({ npsn: '12345678', nama: 'School' });  // true
validateRecord({ npsn: 'abc', nama: 'School' });        // false (not numeric)
validateRecord({ nama: 'School' });                     // false (missing npsn)
validateRecord(null);                                     // false
```

---

## Page Builder Module (`src/services/PageBuilder.js`)

### Purpose
Service layer for page generation logic (path construction, data preparation).

### Exports

```javascript
module.exports = {
  buildSchoolPageData: function,
  getUniqueDirectories: function
};
```

### Functions

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
  nama: 'SMA Negeri 1 Jakarta'
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
  { provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Cicendo' }
];

const dirs = getUniqueDirectories(schools);
// Returns:
// [
//   'provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/menteng',
//   'provinsi/jawa-barat/kabupaten/bandung/kecamatan/cicendo'
// ]
```

---

## School Page Template Module (`src/presenters/templates/school-page.js`)

### Purpose
Presentation layer for school page HTML generation.

### Exports

```javascript
module.exports = {
  generateSchoolPageHtml: function
};
```

### Functions

#### `generateSchoolPageHtml(school)`
Generates complete HTML page for school.

**Parameters:**
- `school` (Object): School data object

**Returns:** `string` - Complete HTML document

**Throws:**
- `Error` if `school` is not an object
- `Error` if required fields are missing

**Required Fields:** `['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama']`

**HTML Structure:**
- `<!DOCTYPE html>` declaration
- `<html lang="id">` - Indonesian language
- Security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection)
- Viewport meta tag for mobile responsiveness
- Schema.org JSON-LD structured data
- Skip link for keyboard navigation
- Semantic HTML5 structure (header, nav, main, article, section, footer)
- ARIA attributes for accessibility
- School details in definition list (dl/dt/dd)
- Inline CSS for accessibility features

**Dependencies:**
- `escapeHtml` (from `scripts/utils.js`)

**Usage:**
```javascript
const school = {
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
  bentuk_pendidikan: 'SMA',
  status: 'Negeri',
  alamat: 'Jl. Sudirman No. 1'
};

const html = generateSchoolPageHtml(school);
// Returns: '<!DOCTYPE html>\n<html lang="id">...'
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

| Code | Module | Scenario |
|------|--------|----------|
| `TIMEOUT` | All operations | Operation exceeded time limit |
| `RETRY_EXHAUSTED` | All retries | All retry attempts failed |
| `CIRCUIT_BREAKER_OPEN` | File I/O | Circuit breaker is blocking |
| `FILE_READ_ERROR` | File operations | File reading failed |
| `FILE_WRITE_ERROR` | File operations | File writing failed |
| `VALIDATION_ERROR` | Data processing | Data validation failed |
| `CONFIGURATION_ERROR` | Configuration | Configuration issue |

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
throw new IntegrationError(
  'Failed to read file',
  ERROR_CODES.FILE_READ_ERROR,
  { filePath }
);

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
throw new IntegrationError(
  'Failed to read file',
  ERROR_CODES.FILE_READ_ERROR,
  {
    filePath,
    circuitBreakerState: fileReadCircuitBreaker.getState(),
    originalError: error.message
  }
);

// Bad (no context)
throw new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR);
```

### 8. Use Rate Limiters for Concurrent Operations
```javascript
// Good (controlled concurrency with metrics)
const limiter = new RateLimiter({
  maxConcurrent: 100,
  queueTimeoutMs: 30000
});

const results = await Promise.all(
  items.map(item =>
    limiter.execute(async () => processItem(item), `process-${item.id}`)
  )
);

console.log('Metrics:', limiter.getMetrics());

// Bad (uncontrolled concurrency, no backpressure)
const results = await Promise.all(
  items.map(item => processItem(item))
);
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

### Version 1.0.0 (2026-01-07)
- Initial API documentation
- Standardized error format
- Resilience patterns implemented
- Module contracts defined
