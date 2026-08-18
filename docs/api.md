# API Documentation

## Overview

This document defines the internal API contracts for all modules in the Sekolah PSEO project. These contracts ensure consistency, maintainability, and testability across the codebase.

## Module Organization

```
scripts/ # Controllers, utilities, and CLI tools
├── etl.js # ETL operations (extract, transform, load)
├── build-pages.js # Page build controller (delegates to BuildOrchestrator)
├── build-performance.js # Build performance tracking and budgets
├── sitemap.js # Sitemap generator
├── validate-links.js # Link validation
├── fetch-data.js # External data fetch from GitHub
├── enrichment.js # School data enrichment (Wikipedia API)
├── check-freshness.js # Data freshness check
├── freshness-report.js # Data freshness report generation
├── data-quality.js # Data quality analysis and scoring
├── manifest.js # Build manifest for incremental builds
├── interactive.js # CLI interactive menu
├── check-workflow-security.js # Workflow security validation (CI)
└── test-helpers.js # Shared test utilities

src/
├── core/ # Shared infrastructure layer
│   ├── config.js # Configuration module
│   ├── data-schema.js # Centralized data schema definition
│   ├── fs-safe.js # Resilient file system wrappers
│   ├── logger.js # Pino-based logging
│   ├── rate-limiter.js # Rate limiting for concurrent operations
│   ├── resilience.js # Resilience patterns (retry, timeout, circuit breaker)
│   ├── slugify.js # URL slug generation
│   └── utils.js # Shared utility functions (CSV, HTML, directory walk)
├── services/
│   ├── PageBuilder.js # Page data builders (paths, grouping, search)
│   ├── BuildOrchestrator.js # Build pipeline orchestration service
│   ├── SearchDataService.js # Search data artifact generation (schools.json + gzip)
│   └── ExportService.js # Static artifact exports (styles.css, schools.csv)
└── presenters/
    ├── design-system.js # Design tokens
    ├── styles.js # CSS generator
    └── templates/
        ├── school-page.js # School page HTML template
        ├── homepage.js # Homepage HTML template
        ├── province-page.js # Province page HTML template
        ├── kabupaten-page.js # Kabupaten/kota page HTML template
        ├── kecamatan-page.js # Kecamatan page HTML template
        └── shared/
            ├── head-meta.js # Shared HTML head prefix (security headers, meta)
            ├── back-to-top.js # Shared back-to-top button HTML + script
            ├── navigation.js # Shared breadcrumb navigation component
            ├── footer.js # Shared footer component
            ├── hero.js # Shared hero section component (title, description, stats)
            ├── index-head.js # Shared index-page <head> block (SEO meta + stylesheet)
            ├── comparison.js # Shared school comparison tray (Bandingkan)
            └── translations.js # Shared pre-escaped translations (T)
```

## Configuration Module (`src/core/config.js`)

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

## Data Schema Module (`src/core/data-schema.js`)

### Purpose

Centralized data schema definition that serves as the single source of truth for the school dataset. Provides field definitions with types, constraints, allowed values, raw field name mappings, and validation functions.

### Exports

```javascript
module.exports = {
  SCHEMA_VERSION, // Schema version string
  INDONESIA_BOUNDS, // Geographic bounding box
  ALLOWED_VALUES, // Categorical field allowed values
  FIELDS, // All field definitions
  CSV_FIELD_ORDER, // Canonical CSV column order
  SEARCH_DATA_FIELDS, // Field order for client-side search payload (schools.json)
  REQUIRED_FIELDS, // Required field names
  REQUIRED_SCHOOL_FIELDS, // Fields required for school page rendering
  isNonEmpty, // Value emptiness check
  isValidCoordinate, // Coordinate bounds check
  isValidCategoricalValue, // Categorical value check
  matchesPattern, // Regex pattern matcher
  validateRecord, // Full record validator
  validateCoordinates, // Coordinate validator
  checkCoordinateQuality, // Coordinate quality assessment
  mapRawField, // Raw field name mapper
  getSchemaInfo, // Schema metadata getter
};
```

### Constants

#### `SCHEMA_VERSION`

- **Type:** `string`
- **Value:** `'1.0'`
- **Description:** Schema version identifier for forward-compatible schema evolution.

#### `INDONESIA_BOUNDS`

- **Type:** `Object`
- **Properties:**
  - `LAT_MIN` (number): `-11` — Minimum Indonesia latitude
  - `LAT_MAX` (number): `6` — Maximum Indonesia latitude
  - `LON_MIN` (number): `95` — Minimum Indonesia longitude
  - `LON_MAX` (number): `141` — Maximum Indonesia longitude
- **Description:** Geographic bounding box for Indonesia coordinate validation.

#### `ALLOWED_VALUES`

- **Type:** `Object<string, string[]>`
- **Properties:**
  - `status`: `['N', 'S']` — Negeri (Public) or Swasta (Private)
  - `bentuk_pendidikan`: `['SD', 'SMP', 'SMA', 'SMK', 'SLB', 'SDLB', 'SMLB', 'SMPLB']`
- **Description:** Allowed categorical values per field, used for validation at the ETL boundary.

#### `FIELDS`

- **Type:** `Object<string, Object>`
- **Description:** Registry of all 12 field definitions. Each entry contains:
  - `type` (string): Data type (`'string'`)
  - `required` (boolean): Whether the field is mandatory
  - `description` (string): Human-readable description
  - `allowedValues` (string[]|undefined): Categorical constraints (only for categorical fields)
  - `pattern` (RegExp|undefined): Validation regex pattern
  - `min`/`max` (number|undefined): Numerical bounds (for lat/lon)
  - `rawMappings` (string[]): Raw CSV column name aliases for ETL normalisation

**Fields:**

| Field               | Required | Type   | Constraints                                        |
| ------------------- | -------- | ------ | -------------------------------------------------- |
| `npsn`              | yes      | string | Must be numeric (`/^\d+$/`)                        |
| `nama`              | yes      | string | —                                                  |
| `bentuk_pendidikan` | yes      | string | Allowed: SD, SMP, SMA, SMK, SLB, SDLB, SMLB, SMPLB |
| `status`            | no       | string | Allowed: N, S                                      |
| `alamat`            | no       | string | —                                                  |
| `kelurahan`         | no       | string | —                                                  |
| `kecamatan`         | yes      | string | —                                                  |
| `kab_kota`          | yes      | string | —                                                  |
| `provinsi`          | yes      | string | —                                                  |
| `lat`               | no       | string | -11 to 6 (Indonesia bounds)                        |
| `lon`               | no       | string | 95 to 141 (Indonesia bounds)                       |
| `updated_at`        | no       | string | ISO date (YYYY-MM-DD)                              |

#### `CSV_FIELD_ORDER`

- **Type:** `string[]`
- **Value:** `['npsn', 'nama', 'bentuk_pendidikan', 'status', 'alamat', 'kelurahan', 'kecamatan', 'kab_kota', 'provinsi', 'lat', 'lon', 'updated_at']`
- **Description:** Canonical column order for CSV output files (e.g., `data/schools.csv`).

#### `REQUIRED_FIELDS`

- **Type:** `string[]`
- **Value:** `['npsn', 'nama', 'bentuk_pendidikan', 'provinsi', 'kab_kota', 'kecamatan']`
- **Description:** Fields that must be non-empty for a valid school record.

#### `REQUIRED_SCHOOL_FIELDS`

- **Type:** `string[]`
- **Value:** `['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama']`
- **Description:** Fields required for school page rendering / path building (subset of `REQUIRED_FIELDS`, excludes `bentuk_pendidikan`). Single source of truth shared by `PageBuilder.js` (service layer) and `school-page.js` (template layer).

#### `SEARCH_DATA_FIELDS`

- **Type:** `string[]`
- **Value:** `['npsn', 'nama', 'bentuk_pendidikan', 'status', 'alamat', 'kecamatan', 'kab_kota', 'provinsi', 'url']`
- **Description:** Field order for the compact flat-array client-side search payload (`dist/schools.json`). Single source of truth shared by the server-side serializer (`PageBuilder.prepareSchoolDataForSearch`) and the client-side converter (embedded as a literal in the homepage's generated search script by `homepage.js`). `url` is the derived last field (built at render time from `getSchoolRelativePath()`); the other 8 fields are a subset of `FIELDS` ordered for payload size. Changing this order only requires updating the constant — server and client stay in sync.

### Functions

#### `isNonEmpty(value)`

Checks if a value is non-empty.

**Parameters:**

- `value` (*): Value to check

**Returns:** `boolean` — `true` if value is not null, not undefined, and (if string) not empty after trimming

**Error Handling:** N/A (returns boolean)

**Usage:**

```javascript
isNonEmpty(null); // false
isNonEmpty(''); // false
isNonEmpty('text'); // true
```

#### `matchesPattern(value, pattern)`

Validates that a string matches a regex pattern.

**Parameters:**

- `value` (string): String to test
- `pattern` (RegExp): Regex pattern

**Returns:** `boolean` — `true` if value matches pattern after trimming

**Error Handling:** Returns `false` for non-string input (no throw)

**Usage:**

```javascript
matchesPattern('12345', /^\d+$/); // true
matchesPattern('abc', /^\d+$/); // false
```

#### `isValidCoordinate(value, min, max)`

Validates a coordinate value is within specified numeric bounds.

**Parameters:**

- `value` (string|number): Coordinate value
- `min` (number): Minimum bound (inclusive)
- `max` (number): Maximum bound (inclusive)

**Returns:** `boolean` — `true` if value is a non-zero number within [min, max]

**Error Handling:** Returns `false` for null, undefined, NaN, or zero values

**Usage:**

```javascript
isValidCoordinate('-6.2', -11, 6); // true
isValidCoordinate('0', -11, 6); // false (zero = unset)
isValidCoordinate('100', 95, 141); // false (out of bounds)
```

#### `isValidCategoricalValue(field, value)`

Checks if a value is in the allowed list for a categorical field.

**Parameters:**

- `field` (string): Canonical field name
- `value` (string): Value to validate

**Returns:** `boolean`

- Returns `true` if the field is not categorical (free-text pass-through)
- Returns `true` if value is in the allowed list
- Returns `false` for null/undefined values on categorical fields

**Error Handling:** Returns `true` for non-categorical fields — no throw

**Usage:**

```javascript
isValidCategoricalValue('status', 'N'); // true
isValidCategoricalValue('status', 'X'); // false
isValidCategoricalValue('nama', 'SMA Negeri 1'); // true (free-text field)
```

#### `validateRecord(record)`

Validates a normalized school record against the schema. Checks required fields, regex patterns, categorical values, optional-field patterns (e.g., `updated_at` ISO date), and coordinate bounds (non-empty, non-zero `lat`/`lon` within Indonesia bounds — zero or empty coordinates pass as unset).

**Parameters:**

- `record` (Object): Normalized school record

**Returns:** `string[]` — Array of error messages (empty array means record is valid)

**Error Handling:**

- Non-object/null/array input → returns `['Record must be a non-null object']`
- Missing required fields → returns descriptive error per field
- Pattern violations → returns format-specific message
- Invalid categorical values → returns allowed values in message
- Out-of-bounds/non-numeric coordinates → returns bounds range in message
- Malformed `updated_at` → returns pattern message (must match `YYYY-MM-DD`)

**Usage:**

```javascript
const errors = validateRecord({ npsn: '123', nama: 'SDN 1', ... });
if (errors.length > 0) {
  errors.forEach(e => console.error(e));
}
```

#### `validateCoordinates(record)`

Validates lat/lon fields for a record against Indonesia geographic bounds.

**Parameters:**

- `record` (Object): School record with `lat` and/or `lon` fields

**Returns:** `Object`

```javascript
{
  lat: { valid: boolean, error?: string },
  lon: { valid: boolean, error?: string }
}
```

**Error Handling:** Returns `{ valid: true }` for each field if the value is empty or valid. Returns error with bounds range for out-of-range values.

**Usage:**

```javascript
validateCoordinates({ lat: '-6.2', lon: '106.8' });
// { lat: { valid: true }, lon: { valid: true } }

validateCoordinates({ lat: '100', lon: '200' });
// { lat: { valid: false, error: 'Latitude "100" outside Indonesia bounds [-11, 6]' },
//   lon: { valid: false, error: 'Longitude "200" outside Indonesia bounds [95, 141]' } }
```

#### `checkCoordinateQuality(record)`

Returns an aggregate quality assessment for coordinate data.

**Parameters:**

- `record` (Object): School record

**Returns:** `Object`

```javascript
{ hasData: boolean, isValid: boolean }
```

- `hasData`: `true` if either `lat` or `lon` is non-empty
- `isValid`: `true` if all present coordinates are within Indonesia bounds

**Usage:**

```javascript
checkCoordinateQuality({}); // { hasData: false, isValid: false }
checkCoordinateQuality({ lat: '-6.2', lon: '106.8' }); // { hasData: true, isValid: true }
```

#### `mapRawField(raw, fieldName)`

Maps a raw input field value to a canonical field name by trying each raw mapping in order.

**Parameters:**

- `raw` (Object): Raw input record from CSV parsing
- `fieldName` (string): Canonical field name from `FIELDS`

**Returns:** `string` — First non-empty value found from raw mappings, or `''` if none found

**Dependencies:**

- `FIELDS` — reads the field's `rawMappings` array

**Usage:**

```javascript
mapRawField({ NPSN: '123', latitude: '-6.2' }, 'npsn'); // '123'
mapRawField({ nama: 'SDN 1' }, 'npsn'); // '' (no matching raw field)
mapRawField({ alamat_jalan: 'Jl. Merdeka' }, 'alamat'); // 'Jl. Merdeka'
```

#### `getSchemaInfo()`

Returns schema metadata in a serializable format for documentation and reporting.

**Parameters:** None

**Returns:** `Object`

```javascript
{
  version: string,            // SCHEMA_VERSION
  fields: Array<{             // All field definitions
    name, type, required, description, allowedValues, constraints
  }>,
  csvFieldOrder: string[],    // CSV_FIELD_ORDER
  requiredFields: string[],   // REQUIRED_FIELDS
  indonesiaBounds: Object,    // INDONESIA_BOUNDS copy
}
```

**Usage:**

```javascript
const info = getSchemaInfo();
console.log(info.version); // '1.0'
console.log(info.fields.length); // 12
```

### Dependencies

None — this is a standalone module. It is consumed by:

- `scripts/etl.js` — Uses `mapRawField`, `validateRecord` for ETL pipeline validation and field normalisation
- `scripts/data-quality.js` — Uses `REQUIRED_FIELDS`, `INDONESIA_BOUNDS`, `isNonEmpty`, `isValidCoordinate`

### Source

- `src/core/data-schema.js` (392 lines)
- `scripts/data-schema.test.js` (33 tests)

---

## Utility Module (`src/core/utils.js`)

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
  fileExists: function,
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
- Processes directory entries concurrently (parallel `safeReaddir`/`safeStat` and parallel subdirectory recursion); result order matches the sequential traversal order (depth-first, readdir order)
- Filters for `.html` files only
- Passes full path, relative path, entry name, and stat to callback
- Collects non-undefined callback results

**Dependencies:**

- `safeReaddir` (from `src/core/fs-safe.js`)
- `safeStat` (from `src/core/fs-safe.js`)

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

- `RateLimiter` (from `src/core/rate-limiter.js`)

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

- `safeWriteFile` (from `src/core/fs-safe.js`)

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

#### `fileExists(filePath)`

Checks whether a file or directory exists, using `safeAccess()` from `fs-safe.js` so existence checks benefit from the standard resilience wrappers (timeout, retry, circuit breaker). This is the canonical existence check for the codebase — it replaced the inconsistent patterns previously spread across modules (raw `fs.existsSync` in `check-freshness.js`/`data-quality.js`, try/catch on `safeAccess`/`safeUnlink` in `manifest.js`).

**Parameters:**

- `filePath` (string): Path to check

**Returns:** `Promise<boolean>` - `true` if the path exists, `false` otherwise (never throws for missing paths)

**Error Handling:** Returns `false` for any `safeAccess()` failure (missing path, permission denied, etc.) — existence checks are intentionally non-throwing.

**Usage:**

```javascript
const { fileExists } = require('./utils');

if (await fileExists(CONFIG.SCHOOLS_CSV_PATH)) {
  const content = await safeReadFile(CONFIG.SCHOOLS_CSV_PATH);
}
```

---

## Resilience Module (`src/core/resilience.js`)

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

  // Network / External service errors
  HTTP_ERROR: 'HTTP_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
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

**HALF_OPEN single-probe guard:** while in `HALF_OPEN`, exactly one probe call is allowed at a time. Concurrent callers are rejected immediately with `CIRCUIT_BREAKER_OPEN` (the circuit stays `OPEN` from their perspective) instead of cascading onto a recovering service. The probe flag is cleared when the probe settles, via `finally` (also on failure), and by `reset()`.

**Methods:**

##### `execute(fn, operationName)`

Executes function with circuit breaker protection.

**Parameters:**

- `fn` (Function): Async function to execute
- `operationName` (string, optional): Operation name for logging (default: `'operation'`)

**Returns:** `Promise<any>` - Result from `fn`

**Throws:**

- `IntegrationError` with `CIRCUIT_BREAKER_OPEN` code if circuit is open (or if another probe is already in flight in `HALF_OPEN`)
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
  lastFailureTime: number | null,
  probeInFlight: boolean
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

Checks if error is transient (retryable). Covers file system, network, and HTTP-level transient conditions.

**Parameters:**

- `error` (Error | any): Error to check

**Returns:** `boolean` - `true` if error is transient

**Transient System Error Codes:** `EAGAIN`, `EIO`, `ENOSPC`, `EBUSY`, `ETIMEDOUT`

**Transient Network Error Codes:** `ECONNRESET`, `ENOTFOUND`, `ECONNREFUSED`, `ECONNABORTED`, `EPIPE`, `EPROTO`, `EAI_AGAIN`, `ESOCKETTIMEDOUT`

**Transient HTTP Status Codes:** `429`, `500`, `502`, `503`, `504`

**Transient Error Messages:** Contains `timeout`, `ECONNRESET`, `ENOTFOUND`, `ECONNREFUSED`, `ECONNABORTED`, `EPIPE`, `EPROTO`, `EAI_AGAIN`, `ESOCKETTIMEDOUT`, `EAGAIN`, `EIO`, `ENOSPC`, `EBUSY`, `socket hang up`, `socket closed`, `read ETIMEDOUT`, `status 429`, `status 500`, `status 50x`

**Usage:**

```javascript
if (isTransientError(error)) {
  // Retry the operation
}
```

---

#### `withTimeout(promise, timeoutMs, operationName, onTimeout)`

Wraps promise with timeout enforcement.

**Parameters:**

- `promise` (Promise): Promise to timeout
- `timeoutMs` (number): Timeout in milliseconds
- `operationName` (string, optional): Operation name for error message
- `onTimeout` (function, optional): Callback invoked just before the `TIMEOUT` error is rejected — used to release underlying resources (e.g. abort an in-flight HTTP request). Errors thrown by the callback are swallowed so they never mask the `TIMEOUT` error.

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

#### `withTimeoutSync(syncFn, timeoutMs, operationName)`

Executes a synchronous function with a timeout. Designed for wrapping `execSync`/`execFileSync` calls that may hang indefinitely. Passes `{ timeout, killSignal: 'SIGTERM' }` options to the wrapped function.

**Parameters:**

- `syncFn` (Function): Synchronous function that accepts `{ timeout, killSignal }` options
- `timeoutMs` (number): Timeout in milliseconds
- `operationName` (string, optional): Name for this operation

**Returns:** `*` - Result of the synchronous function

**Throws:** `IntegrationError` with `TIMEOUT` code if the child process is killed by timeout, or the original error otherwise

**Behavior:**

- Detects killed processes (`error.killed`, `error.signal === 'SIGTERM'`)
- Re-throws non-timeout errors (e.g. command not found) unchanged
- Does NOT wrap the sync function return value

**Usage:**

```javascript
const { execSync } = require('child_process');
const { withTimeoutSync } = require('./resilience');

try {
  const output = withTimeoutSync(
    opts => execSync('git clone --depth 1 https://github.com/user/repo.git', opts),
    120000,
    'git clone repo'
  );
} catch (error) {
  if (error.code === ERROR_CODES.TIMEOUT) {
    console.error('Git clone timed out after 2 minutes');
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
  - `jitter` (boolean): Randomize each backoff delay (full jitter, `random() × backoff`) to de-synchronize concurrent retries (default: `false`)

**Returns:** `Promise<any>` - Function result

**Throws:** `IntegrationError` with `RETRY_EXHAUSTED` code if all retries fail

**Backoff Formula:** `min(initialDelayMs * multiplier^(attempt-1), maxDelayMs)`, then:

1. If `jitter` is enabled, the delay is randomized to `random() × backoff`.
2. If the last error carries a positive numeric `retryAfterMs` (e.g. parsed from an HTTP `429 Retry-After` header), the delay is raised to at least that value, capped at `maxDelayMs` — the client never retries sooner than the server asked.

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

## File System Module (`src/core/fs-safe.js`)

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

## Rate Limiter Module (`src/core/rate-limiter.js`)

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
- `rateLimitMs` (number, optional): Minimum spacing between task starts in ms (default: `0` = pacing disabled). When > 0, the limiter enforces a global start rate of at most 1 task per `rateLimitMs` — use for external-service integrations that must respect upstream rate limits (e.g. Wikipedia API).
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
- When `rateLimitMs` > 0, enforces a global start rate of 1 task per `rateLimitMs` (pacing), serialized through a start-gate promise chain
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

## Slugify Module (`src/core/slugify.js`)

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
  enforceNpsnUniqueness: function,
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

Validates normalized record against the centralized schema (`data-schema.js`). Delegates to `SCHEMA.validateRecord()` — the ETL boundary enforces the exact same constraints as every other consumer (single source of truth).

**Parameters:**

- `record` (Object): Normalized record

**Returns:** `boolean` - `true` if the schema reports zero errors

**Throws:** N/A (returns `false` for invalid input)

**Validation Rules:**

- Record must be an object
- Required fields (`npsn`, `nama`, `bentuk_pendidikan`, `provinsi`, `kab_kota`, `kecamatan`) must be non-empty
- `npsn` must be numeric (`^\d+$`)
- Categorical values (`status`, `bentuk_pendidikan`) must be in the allowed lists
- Non-empty, non-zero `lat`/`lon` must be within Indonesia bounds (zero/empty = unset, valid)
- `updated_at` must match `YYYY-MM-DD` when present

**Usage:**

```javascript
validateRecord({ npsn: '12345678', nama: 'School' }); // false (missing required fields)
validateRecord({ npsn: 'abc', nama: 'School' }); // false (not numeric)
validateRecord({ nama: 'School' }); // false (missing npsn)
validateRecord(null); // false
```

---

#### `validateLatLon(lat, lon)`

Validates latitude and longitude coordinates for Indonesia geographic bounds. Delegates to `SCHEMA.isValidCoordinate()` using `SCHEMA.INDONESIA_BOUNDS` (single source of truth).

**Parameters:**

- `lat` (string): Latitude value
- `lon` (string): Longitude value

**Returns:** `boolean` - `true` if coordinates are within Indonesia bounds

**Validation Rules:**

- Latitude: -11 to 6 (Indonesia bounds)
- Longitude: 95 to 141 (Indonesia bounds)
- Returns `false` for empty, `'0'` (unset), null, or non-numeric values

**Usage:**

```javascript
validateLatLon('-6.2088', '106.8456'); // true (Jakarta)
validateLatLon('0', '0'); // false (zero = unset)
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

#### `enforceNpsnUniqueness(records)`

Enforces the NPSN primary-key constraint: keeps the first occurrence of each NPSN and rejects subsequent duplicates. Called by `run()` before enrichment and CSV output so `data/schools.csv` never contains duplicate NPSNs — duplicates would otherwise resolve to the same school page path (`{npsn}-{slug}.html`) and silently overwrite each other (data loss).

**Parameters:**

- `records` (Array<Object>): Normalized, schema-valid school records

**Returns:** `Object`

```javascript
{
  kept: Array<Object>,     // Unique records (first occurrence per NPSN, input order)
  rejected: Array<{ npsn: string, reason: string }>  // Duplicate records with reasons
}
```

**Usage:**

```javascript
const { kept, rejected } = enforceNpsnUniqueness(validatedRecords);
if (rejected.length > 0) {
  logger.warn(`Rejected ${rejected.length} duplicate NPSN record(s)`);
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
  buildKabupatenPageData: function,
  buildKecamatanPageData: function,
  groupSchoolsByProvince: function,
  groupSchoolsByKabupaten: function,
  groupSchoolsByKecamatan: function,
  prepareSchoolDataForSearch: function,
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

- `slugify` (from `src/core/slugify.js`)

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

- `slugify` (from `src/core/slugify.js`)
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

- `slugify` (from `src/core/slugify.js`)

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

#### `buildProvincePageData(provinceName, schools, skipFilter)`

Builds province page data with path and HTML content.

**Parameters:**

- `provinceName` (string): Province name
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this province when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, passes through to `generateProvincePageHtml` to skip internal province filtering. Defaults to `false` for backward compatibility.

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

- `slugify` (from `src/core/slugify.js`)
- `generateProvincePageHtml` (from `src/presenters/templates/province-page.js`)

**Usage:**

```javascript
// Default: pass all schools, internal filtering applied
const pageData = buildProvincePageData('DKI Jakarta', schools);

// Optimized: pass pre-filtered schools via groupSchoolsByProvince
const grouped = groupSchoolsByProvince(schools);
const pageData2 = buildProvincePageData('DKI Jakarta', grouped.get('DKI Jakarta'), true);
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

#### `buildKabupatenPageData(provinceName, kabupatenName, schools, skipFilter)`

Builds kabupaten page data with path and HTML content.

**Parameters:**

- `provinceName` (string): Province name
- `kabupatenName` (string): Kabupaten/kota name
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this province/kabupaten when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, passes through to `generateKabupatenPageHtml` to skip internal filtering. Defaults to `false` for backward compatibility.

**Returns:** `Object`

```javascript
{
  relativePath: string,  // File path relative to DIST_DIR
  content: string        // HTML content
}
```

**Throws:**

- `Error` if `provinceName` is not a string
- `Error` if `kabupatenName` is not a string
- `Error` if `schools` is not an array

**Path Format:** `provinsi/{provinceSlug}/kabupaten/{kabupatenSlug}/index.html`

**Dependencies:**

- `slugify` (from `src/core/slugify.js`)
- `generateKabupatenPageHtml` (from `src/presenters/templates/kabupaten-page.js`)

**Usage:**

```javascript
// Default: pass all schools, internal filtering applied
const pageData = buildKabupatenPageData('DKI Jakarta', 'Jakarta Pusat', schools);

// Optimized: pass pre-filtered schools via groupSchoolsByKabupaten
const grouped = groupSchoolsByKabupaten(schools);
const pageData2 = buildKabupatenPageData(
  'DKI Jakarta',
  'Jakarta Pusat',
  grouped.get('DKI Jakarta\u0000Jakarta Pusat'),
  true
);
```

---

#### `buildKecamatanPageData(provinceName, kabupatenName, kecamatanName, schools, skipFilter)`

Builds kecamatan page data with path and HTML content.

**Parameters:**

- `provinceName` (string): Province name
- `kabupatenName` (string): Kabupaten/kota name
- `kecamatanName` (string): Kecamatan name
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this full location when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, passes through to `generateKecamatanPageHtml` to skip internal filtering. Defaults to `false` for backward compatibility.

**Returns:** `Object`

```javascript
{
  relativePath: string,  // File path relative to DIST_DIR
  content: string        // HTML content
}
```

**Throws:**

- `Error` if `provinceName` is not a string
- `Error` if `kabupatenName` is not a string
- `Error` if `kecamatanName` is not a string
- `Error` if `schools` is not an array

**Path Format:** `provinsi/{provinceSlug}/kabupaten/{kabupatenSlug}/kecamatan/{kecamatanSlug}/index.html`

**Dependencies:**

- `slugify` (from `src/core/slugify.js`)
- `generateKecamatanPageHtml` (from `src/presenters/templates/kecamatan-page.js`)

**Usage:**

```javascript
// Default: pass all schools, internal filtering applied
const pageData = buildKecamatanPageData('DKI Jakarta', 'Jakarta Pusat', 'Gambir', schools);

// Optimized: pass pre-filtered schools via groupSchoolsByKecamatan
const grouped = groupSchoolsByKecamatan(schools);
const pageData2 = buildKecamatanPageData(
  'DKI Jakarta',
  'Jakarta Pusat',
  'Gambir',
  grouped.get('DKI Jakarta\u0000Jakarta Pusat\u0000Gambir'),
  true
);
```

---

#### `groupSchoolsByKabupaten(schools)`

Groups all schools by province and kabupaten in a single O(n) pass. Used to eliminate O(n×p) filtering during kabupaten page generation.

**Parameters:**

- `schools` (Object[]): Array of school data objects

**Returns:** `Map<string, Array>` - Map keyed by `province\0kabupaten` (NUL-joined composite key), each value is array of schools in that province/kabupaten

**Throws:**

- `Error` if `schools` is not an array

**Dependencies:**

- None (standalone utility function)

**Usage:**

```javascript
const grouped = groupSchoolsByKabupaten(schools);
// Returns Map:
// {
//   'DKI Jakarta\u0000Jakarta Pusat' => [school1, school2, ...],
//   'Jawa Barat\u0000Bandung' => [school3, school4, ...],
// }
const jakartaPusatSchools = grouped.get('DKI Jakarta\u0000Jakarta Pusat'); // Array of schools
```

**Performance:** Single pass O(n) — processes the entire schools array once. Kabupaten pages can then receive pre-filtered arrays with `skipFilter=true` to avoid redundant filtering.

---

#### `groupSchoolsByKecamatan(schools)`

Groups all schools by province, kabupaten, and kecamatan in a single O(n) pass. Used to eliminate O(n×p) filtering during kecamatan page generation.

**Parameters:**

- `schools` (Object[]): Array of school data objects

**Returns:** `Map<string, Array>` - Map keyed by `province\0kabupaten\0kecamatan` (NUL-joined composite key), each value is array of schools in that full location

**Throws:**

- `Error` if `schools` is not an array

**Dependencies:**

- None (standalone utility function)

**Usage:**

```javascript
const grouped = groupSchoolsByKecamatan(schools);
// Returns Map:
// {
//   'DKI Jakarta\u0000Jakarta Pusat\u0000Gambir' => [school1, school2, ...],
//   'Jawa Barat\u0000Bandung\u0000Coblong' => [school3, school4, ...],
// }
const gambirSchools = grouped.get('DKI Jakarta\u0000Jakarta Pusat\u0000Gambir'); // Array of schools
```

**Performance:** Single pass O(n) — processes the entire schools array once. Kecamatan pages can then receive pre-filtered arrays with `skipFilter=true` to avoid redundant filtering.

---

#### `prepareSchoolDataForSearch(schools)`

Prepares school data into a compact format for client-side search. Converts school objects into flat arrays to minimize payload size. The field order is defined by `SEARCH_DATA_FIELDS` (single source of truth in `src/core/data-schema.js`) — the same constant is embedded into the homepage's generated client script, so server and client stay in sync automatically.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Array<Array>` - Array of school records as flat arrays, ordered per `SEARCH_DATA_FIELDS`

```javascript
// Each record follows SEARCH_DATA_FIELDS: [npsn, nama, bentuk, status, alamat, kecamatan, kota, provinsi, url]
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

**Field Order (from `SEARCH_DATA_FIELDS`):** `0: npsn`, `1: nama`, `2: bentuk_pendidikan`, `3: status`, `4: alamat`, `5: kecamatan`, `6: kab_kota`, `7: provinsi`, `8: url` (derived)

**Usage:**

```javascript
const { prepareSchoolDataForSearch } = require('../src/services/PageBuilder');
const searchData = prepareSchoolDataForSearch(schools);
```

---

## Build Orchestrator Service (`src/services/BuildOrchestrator.js`)

### Purpose

Build pipeline orchestration service that encapsulates the static site generation pipeline — data loading, page generation, file output, manifest tracking, performance reporting, and shared resource generation (homepage, province pages). Controllers (`scripts/build-pages.js`) delegate to this service rather than implementing pipeline logic directly.

Specialized output concerns are delegated to focused service modules (see [Search Data Service](#search-data-service-srcservicessearchdataservicejs) and [Export Service](#export-service-srcservicesexportservicejs)):

- `writeSearchDataFile()` → owned by `SearchDataService.js`, re-exported here for backward compatibility
- `exportSchoolsCsv()`, `writeExternalStylesFile()` → owned by `ExportService.js`, re-exported here for backward compatibility

### Exports

```javascript
module.exports = {
  // Build pipeline
  build: function,
  buildIncremental: function,
  prepareBuildEnvironment: function,
  finalizeBuild: function,

  // Step functions
  ensureDistDir: function,
  loadSchools: function,
  writeSchoolPage: function,
  writeSchoolPagesConcurrently: function,
  preCreateDirectories: function,
  preCreateProvinceDirectories: function,
  generateProvincePages: function,
  generateKabupatenPages: function,
  generateKecamatanPages: function,
  generateRobotsTxt: function,
  generateExternalStyles: function,
  // Re-exported from SearchDataService / ExportService (see sections below)
  writeExternalStylesFile: function,
  writeSearchDataFile: function,
  exportSchoolsCsv: function,
  createManifestFromSchools: function,

  // Re-exported for convenience
  computeSchoolHash: function,
};
```

### Functions

#### `build(options)`

Main build function that orchestrates the complete build process.

**Parameters:**

- `options` (Object, optional):
  - `incremental` (boolean): If true, performs incremental build

**Returns:** `Promise<void>`

**Build Process (full):**

1. Prepares build environment — ensures `dist/`, generates `styles.css` and `robots.txt`
2. Loads school data from CSV and enrichment data
3. Generates homepage (`index.html`), province pages, and schools.json **in parallel** with school page writing
4. Writes all school pages concurrently using `processInBatches`
5. Saves build manifest for future incremental builds
6. Exports schools.csv to `dist/data/schools.csv`

**Build Process (incremental):**

1. Same environment preparation as full build
2. Loads previous manifest and filters to changed schools only
3. Homepage, province pages, and schools.json are always regenerated (aggregate data)
4. Only changed school pages are written
5. Manifest updated; CSV export skipped (data unchanged)

**Dependencies:**

- `ensureDistDir()`, `generateExternalStyles()`, `generateRobotsTxt()`
- `loadSchools()`, `loadEnrichmentData()` (from `scripts/enrichment.js`)
- `buildHomepageData()`, `buildProvincePageData()` (from `./PageBuilder.js`)
- `writeSchoolPagesConcurrently()`, `generateProvincePages()`
- `loadManifest` / `saveManifest` (from `scripts/manifest.js`)
- `BuildPerformanceTracker` (from `scripts/build-performance.js`)

**Usage:**

```javascript
// Full build
await build();

// Incremental build
await build({ incremental: true });
```

---

#### `loadSchools()`

Loads processed school data from CSV file.

**Returns:** `Promise<Array<Object>>` — Array of school records

**Throws:** `IntegrationError` with `FILE_EMPTY` code if CSV is empty or contains no records

**Usage:**

```javascript
const schools = await loadSchools();
console.log(`Loaded ${schools.length} schools`);
```

---

#### `writeSchoolPage(school, enrichment)`

Writes a single school page using `fastWriteFile` (no retry/timeout/circuit-breaker for bulk writes).

**Parameters:**

- `school` (Object): School data object
- `enrichment` (Object, optional): Enrichment data (e.g., Wikipedia extract)

**Returns:** `Promise<void>`

**Dependencies:**

- `buildSchoolPageData` (from `./PageBuilder.js`)
- `fastWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
await writeSchoolPage(school);
await writeSchoolPage(school, enrichmentMap[school.npsn]);
```

---

#### `writeSchoolPagesConcurrently(schools, concurrencyLimit, enrichmentMap)`

Writes multiple school pages concurrently using batch-based concurrency (`processInBatches`) instead of RateLimiter — eliminates per-item Promise+setTimeout overhead for 3474+ fast filesystem writes.

**Parameters:**

- `schools` (Array<Object>): Array of school records
- `concurrencyLimit` (number, optional): Max concurrent operations (default: `CONFIG.BUILD_CONCURRENCY_LIMIT`)
- `enrichmentMap` (Object, optional): Optional map of NPSN → enrichment data

**Returns:** `Promise<Object>`

```javascript
{
  successful: number,  // Count of successfully generated pages
  failed: number       // Count of failed pages
}
```

**Behavior:**

- Pre-creates all unique directories via `preCreateDirectories()`
- Uses `processInBatches` with configurable batch size
- Reports progress every 100 pages
- Logs failure details (up to 5 examples) when pages fail

**Usage:**

```javascript
const { successful, failed } = await writeSchoolPagesConcurrently(schools, 100);
```

---

#### `preCreateDirectories(schools)`

Pre-creates all unique school page directories to reduce redundant `fs.mkdir` calls. Failed directories are tracked and reported — the build continues but downstream writes to missing directories will fail.

**Parameters:**

- `schools` (Array<Object>): School records

**Returns:** `Promise<string[]>` — Array of directory paths that failed to create

**Usage:**

```javascript
const failures = await preCreateDirectories(schools);
if (failures.length > 0) console.warn('Some directories failed');
```

---

#### `preCreateProvinceDirectories(schools, provinces)`

Pre-creates all unique province directories. Accepts an optional pre-computed provinces array to avoid redundant `getUniqueProvinces()` calls.

**Parameters:**

- `schools` (Array<Object>): School records (used if provinces not provided)
- `provinces` (Array<Object>, optional): Pre-computed province objects with `slug`/`name`/`count`

**Returns:** `Promise<void>`

**Usage:**

```javascript
await preCreateProvinceDirectories(schools);
await preCreateProvinceDirectories(schools, provinces);
```

---

#### `generateProvincePages(schools)`

Generates all province-level index pages using O(n) province pre-grouping to avoid redundant per-province filtering.

**Parameters:**

- `schools` (Array<Object>): Array of all school data objects

**Returns:** `Promise<Object>` — `{ successful: number, failed: number }`

**Process:**

1. Groups schools by province in a single O(n) pass
2. Derives province list from the grouped Map (eliminates second O(n) pass)
3. Pre-creates province directories
4. Generates province pages concurrently using `processInBatches` with `skipFilter=true`

**Dependencies:**

- `groupSchoolsByProvince`, `buildProvincePageData` (from `./PageBuilder.js`)
- `slugify` (from `src/core/slugify.js`)

**Usage:**

```javascript
const { successful, failed } = await generateProvincePages(schools);
```

---

#### `generateKabupatenPages(schools)`

Generates all kabupaten/kota-level index pages using O(n) pre-grouping to avoid redundant per-kabupaten filtering.

**Parameters:**

- `schools` (Array<Object>): Array of all school data objects

**Returns:** `Promise<Object>` — `{ successful: number, failed: number }`

**Process:**

1. Groups schools by `provinsi` + `kab_kota` in a single O(n) pass
2. Derives the kabupaten list from the grouped Map
3. Pre-creates kabupaten directories (recursive `fastMkdir` — safe when running concurrently with school-page directory creation)
4. Generates kabupaten pages concurrently using `processInBatches` with `skipFilter=true`

**Dependencies:**

- `groupSchoolsByKabupaten`, `buildKabupatenPageData` (from `./PageBuilder.js`)
- `slugify` (from `src/core/slugify.js`)
- `fastMkdir`, `fastWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
const { successful, failed } = await generateKabupatenPages(schools);
```

---

#### `generateKecamatanPages(schools)`

Generates all kecamatan-level index pages using O(n) pre-grouping to avoid redundant per-kecamatan filtering.

**Parameters:**

- `schools` (Array<Object>): Array of all school data objects

**Returns:** `Promise<Object>` — `{ successful: number, failed: number }`

**Process:**

1. Groups schools by `provinsi` + `kab_kota` + `kecamatan` in a single O(n) pass
2. Derives the kecamatan list from the grouped Map
3. Pre-creates kecamatan directories (recursive `fastMkdir` — safe when running concurrently with school-page directory creation)
4. Generates kecamatan pages concurrently using `processInBatches` with `skipFilter=true`

**Dependencies:**

- `groupSchoolsByKecamatan`, `buildKecamatanPageData` (from `./PageBuilder.js`)
- `slugify` (from `src/core/slugify.js`)
- `fastMkdir`, `fastWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
const { successful, failed } = await generateKecamatanPages(schools);
```

---

#### `generateRobotsTxt(siteUrl)`

Generates a `robots.txt` file with the correct sitemap URL.

**Parameters:**

- `siteUrl` (string): Base URL for the site

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code if write fails

**Output:** `dist/robots.txt`

**Usage:**

```javascript
await generateRobotsTxt('https://example.com');
```

---

#### `generateExternalStyles()`

Generates the external `styles.css` file using the design system.

**Returns:** `Promise<void>`

**Dependencies:**

- `generateSchoolPageStyles` (from `src/presenters/styles.js`)

**Usage:**

```javascript
await generateExternalStyles();
```

---

#### `writeSearchDataFile(schools)`

Generates `schools.json` for lazy-loaded client-side search and a pre-compressed `schools.json.gz` (gzip level 6, ~86% transfer reduction).

**Ownership:** Implemented in `SearchDataService.js`; re-exported by BuildOrchestrator for backward compatibility (imports from `scripts/build-pages.js` and tests continue to resolve).

**Parameters:**

- `schools` (Array<Object>): School records

**Returns:** `Promise<void>`

**Dependencies:**

- `prepareSchoolDataForSearch` (from `./PageBuilder.js`)
- `safeWriteFile` (from `src/core/fs-safe.js`)

**Output:** `dist/schools.json`, `dist/schools.json.gz`

**Usage:**

```javascript
await writeSearchDataFile(schools);
```

---

#### `exportSchoolsCsv()`

Exports `schools.csv` to `dist/data/schools.csv` for user download. Only runs during full builds.

**Ownership:** Implemented in `ExportService.js`; re-exported by BuildOrchestrator for backward compatibility.

**Returns:** `Promise<void>`

**Usage:**

```javascript
await exportSchoolsCsv();
```

---

#### `createManifestFromSchools(schools)`

Creates a build manifest object from school records for incremental build tracking.

**Parameters:**

- `schools` (Array<Object>): School records

**Returns:** `Object` — Manifest object with `version`, `lastBuild`, and per-school hashes

**Usage:**

```javascript
const manifest = createManifestFromSchools(schools);
```

---

#### `prepareBuildEnvironment()`

Prepares the build environment and shared page generation. Extracted to eliminate duplication between full and incremental builds. Fires homepage, search data, and province page generation as a background promise that overlaps with school page writing.

**Returns:** `Promise<Object>`

```javascript
{
  schools: Array,                   // Loaded school records
  enrichmentMap: Object,            // NPSN -> enrichment data
  sharedPagesPromise: Promise<void> // Background page generation
}
```

**Usage:** Internal — called by `build()`.

---

#### `finalizeBuild(tracker)`

Stops the performance tracker, logs the report, and optionally writes a GitHub Actions step summary.

**Parameters:**

- `tracker` (BuildPerformanceTracker): Build performance tracker instance

**Returns:** `void`

**Usage:** Internal — called by `build()` in a `finally` block.

---

## Search Data Service (`src/services/SearchDataService.js`)

### Purpose

Service-layer module owning search-data artifact generation for the static site build. Extracted from BuildOrchestrator (ADR-0005 layer separation) so changes to the search-data format or compression policy stay isolated from the orchestration flow.

### Exports

```javascript
module.exports = {
  writeSearchDataFile: function,
};
```

### Functions

#### `writeSearchDataFile(schools)`

Generates `schools.json` for lazy-loaded client-side search and a pre-compressed `schools.json.gz` (gzip level 6, ~86% transfer reduction).

**Parameters:**

- `schools` (Array<Object>): School records

**Returns:** `Promise<void>`

**Dependencies:**

- `prepareSchoolDataForSearch` (from `./PageBuilder.js`)
- `safeWriteFile` (from `src/core/fs-safe.js`)

**Output:** `dist/schools.json`, `dist/schools.json.gz`

**Usage:**

```javascript
const { writeSearchDataFile } = require('./SearchDataService');
await writeSearchDataFile(schools);
```

---

## Export Service (`src/services/ExportService.js`)

### Purpose

Service-layer module owning static artifact exports for the build: the external stylesheet (`styles.css`) and the school data CSV copy into the distributable output. Extracted from BuildOrchestrator (ADR-0005 layer separation) so artifact export concerns stay isolated from the orchestration flow.

### Exports

```javascript
module.exports = {
  writeExternalStylesFile: function,
  exportSchoolsCsv: function,
};
```

### Functions

#### `writeExternalStylesFile(targetDir)`

Writes the external `styles.css` file to disk. CSS generation (pure presentation) lives in `src/presenters/styles.js`; file I/O lives here.

**Parameters:**

- `targetDir` (string): Path to the dist directory

**Returns:** `Promise<string>` — Path to the written `styles.css` file

**Dependencies:**

- `generateSchoolPageStyles` (from `src/presenters/styles.js`)
- `safeMkdir`, `safeWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
const { writeExternalStylesFile } = require('./ExportService');
const stylesPath = await writeExternalStylesFile(CONFIG.DIST_DIR);
```

#### `exportSchoolsCsv()`

Exports `schools.csv` to `dist/data/schools.csv` for user download. Only runs during full builds.

**Returns:** `Promise<void>`

**Dependencies:**

- `safeReadFile`, `safeWriteFile`, `safeMkdir` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
const { exportSchoolsCsv } = require('./ExportService');
await exportSchoolsCsv();
```

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

- `escapeHtml` (from `src/core/utils.js`)
- `formatStatus` (from `src/core/utils.js`)
- `CONFIG` (from `src/core/config.js`)

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

- `CONFIG.SITE_URL` (from `src/core/config.js`)

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

- `escapeHtml` (from `src/core/utils.js`)

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
  aggregateProvinceAndFilters: function,
};
```

### Functions

#### `generateHomepageHtml(schools)`

Generates complete HTML homepage with search, filtering, and province navigation.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `string` - Complete HTML document

**Features:**

- Client-side search with 150ms debounce
- Province, education type, and status filtering
- Autocomplete suggestions (max 10) with keyboard navigation (arrow keys, Enter)
- Result rendering capped at 200 rows; count label reports the true match total
- CSV download of filtered results
- Responsive design with mobile support
- Keyboard shortcuts (`/` to focus search; Escape clears the query only when the search input is focused — filters are never reset)
- Back-to-top button
- Search data lazy-loaded from `/schools.json` (compact flat-array format) instead of embedded in the HTML
- Accessibility: skip links, ARIA labels/roles (combobox/listbox), `aria-live` result count, filter selects disabled until search data loads (with a failure message on load error)

**Usage:**

```javascript
const { generateHomepageHtml } = require('./templates/homepage');
const html = generateHomepageHtml(schools);
// Returns: '<!DOCTYPE html>\n<html lang="id">...'
```

---

#### `aggregateProvinceAndFilters(schools)`

Aggregates school data by province and extracts filter options in a single pass. Combines province aggregation and filter extraction to eliminate duplicate iteration (replaces the removed `aggregateByProvince`/`extractFilterOptions` pair).

**Parameters:**

- `schools` (Array<Object>): Array of school data objects

**Returns:** `Object`

```javascript
{
  provinces: [
    { name: 'DKI Jakarta', slug: 'dki-jakarta', count: 1500 },
  ],
  filterOptions: {
    provinces: ['DKI Jakarta', 'Jawa Barat'],
    types: ['SMA', 'SMP', 'SD'],
    statuses: ['N', 'S'],
  },
}
```

**Performance:** Single-pass iteration instead of separate passes for province aggregation and filter extraction.

**Usage:**

```javascript
const { aggregateProvinceAndFilters } = require('./templates/homepage');
const { provinces, filterOptions } = aggregateProvinceAndFilters(schools);
const { types } = filterOptions;
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

#### `generateProvincePageHtml(provinceName, schools, skipFilter)`

Generates complete HTML page for a specific province with kabupaten/kota navigation.

**Parameters:**

- `provinceName` (string): Province name to generate page for
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this province when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, skips internal `filterSchoolsByProvince` call (schools array is assumed to be pre-filtered for this province). Defaults to `false` for backward compatibility.

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

// Default: pass all schools, function filters internally
const html = generateProvincePageHtml('DKI Jakarta', schools);

// Optimized: pass pre-filtered schools, skip redundant filtering
const grouped = groupSchoolsByProvince(schools);
const html2 = generateProvincePageHtml('DKI Jakarta', grouped.get('DKI Jakarta'), true);
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

---

## Kabupaten Page Template Module (`src/presenters/templates/kabupaten-page.js`)

### Purpose

Presentation layer for kabupaten/kota-level page HTML generation with kecamatan navigation. Restores the previously-broken Province → Kabupaten → Kecamatan → School navigation hierarchy (TASK-092).

### Exports

```javascript
module.exports = {
  generateKabupatenPageHtml: function,
  filterSchoolsByProvinceAndKabupaten: function,
  aggregateByKecamatan: function,
};
```

### Functions

#### `generateKabupatenPageHtml(provinceName, kabupatenName, schools, skipFilter)`

Generates complete HTML page for a specific kabupaten/kota with kecamatan navigation.

**Parameters:**

- `provinceName` (string): Province name
- `kabupatenName` (string): Kabupaten/kota name to generate page for
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this province/kabupaten when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, skips internal `filterSchoolsByProvinceAndKabupaten` call (schools array is assumed to be pre-filtered). Defaults to `false` for backward compatibility.

**Returns:** `string` - Complete HTML document

**Features:**

- Lists all kecamatan in the kabupaten/kota
- Shows school count per kecamatan
- Breadcrumb navigation (Home → Province → Kabupaten)
- Responsive design with mobile support
- Back-to-top button

**Usage:**

```javascript
const { generateKabupatenPageHtml } = require('./templates/kabupaten-page');

// Default: pass all schools, function filters internally
const html = generateKabupatenPageHtml('DKI Jakarta', 'Jakarta Pusat', schools);

// Optimized: pass pre-filtered schools, skip redundant filtering
const grouped = groupSchoolsByKabupaten(schools);
const html2 = generateKabupatenPageHtml(
  'DKI Jakarta',
  'Jakarta Pusat',
  grouped.get('DKI Jakarta\u0000Jakarta Pusat'),
  true
);
```

---

#### `filterSchoolsByProvinceAndKabupaten(schools, provinceName, kabupatenName)`

Filters schools by province and kabupaten/kota name.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects
- `provinceName` (string): Province name to filter by
- `kabupatenName` (string): Kabupaten/kota name to filter by

**Returns:** `Array<Object>` - Filtered schools for the province/kabupaten

**Exact Match:** Uses strict equality (`===`) for both matching.

**Usage:**

```javascript
const { filterSchoolsByProvinceAndKabupaten } = require('./templates/kabupaten-page');
const jakartaPusatSchools = filterSchoolsByProvinceAndKabupaten(
  schools,
  'DKI Jakarta',
  'Jakarta Pusat'
);
console.log(`Found ${jakartaPusatSchools.length} schools`);
```

---

#### `aggregateByKecamatan(schools)`

Aggregates school data by kecamatan within a kabupaten/kota.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects (should be filtered by province and kabupaten)

**Returns:** `Array<Object>` - Array of kecamatan objects with school count

```javascript
[
  { name: 'Gambir', slug: 'gambir', count: 12 },
  { name: 'Menteng', slug: 'menteng', count: 8 },
];
```

**Sorting:** Kecamatan are sorted alphabetically by Indonesian locale.

**Usage:**

```javascript
const { aggregateByKecamatan } = require('./templates/kabupaten-page');
const kecamatans = aggregateByKecamatan(jakartaPusatSchools);
kecamatans.forEach(k => console.log(`${k.name}: ${k.count}`));
```

---

### Path Format

Kabupaten pages are generated at:

```
/provinsi/{provinceSlug}/kabupaten/{kabupatenSlug}/index.html
```

Example: `/provinsi/dki-jakarta/kabupaten/jakarta-pusat/index.html`

---

## Kecamatan Page Template Module (`src/presenters/templates/kecamatan-page.js`)

### Purpose

Presentation layer for kecamatan-level page HTML generation with direct school links. Restores the previously-broken Province → Kabupaten → Kecamatan → School navigation hierarchy (TASK-092).

### Exports

```javascript
module.exports = {
  generateKecamatanPageHtml: function,
  filterSchoolsByLocation: function,
  generateSchoolLinksHtml: function,
};
```

### Functions

#### `generateKecamatanPageHtml(provinceName, kabupatenName, kecamatanName, schools, skipFilter)`

Generates complete HTML page for a specific kecamatan with school links.

**Parameters:**

- `provinceName` (string): Province name
- `kabupatenName` (string): Kabupaten/kota name
- `kecamatanName` (string): Kecamatan name to generate page for
- `schools` (Array<Object>): Array of school data objects (all schools, or pre-filtered for this full location when `skipFilter` is true)
- `skipFilter` (boolean, optional): When `true`, skips internal `filterSchoolsByLocation` call (schools array is assumed to be pre-filtered). Defaults to `false` for backward compatibility.

**Returns:** `string` - Complete HTML document

**Features:**

- Lists all schools in the kecamatan with status/type badges
- Breadcrumb navigation (Home → Province → Kabupaten → Kecamatan)
- Responsive design with mobile support
- Back-to-top button

**Usage:**

```javascript
const { generateKecamatanPageHtml } = require('./templates/kecamatan-page');

// Default: pass all schools, function filters internally
const html = generateKecamatanPageHtml('DKI Jakarta', 'Jakarta Pusat', 'Gambir', schools);

// Optimized: pass pre-filtered schools, skip redundant filtering
const grouped = groupSchoolsByKecamatan(schools);
const html2 = generateKecamatanPageHtml(
  'DKI Jakarta',
  'Jakarta Pusat',
  'Gambir',
  grouped.get('DKI Jakarta\u0000Jakarta Pusat\u0000Gambir'),
  true
);
```

---

#### `filterSchoolsByLocation(schools, provinceName, kabupatenName, kecamatanName)`

Filters schools by full location (province, kabupaten, kecamatan).

**Parameters:**

- `schools` (Array<Object>): Array of school data objects
- `provinceName` (string): Province name to filter by
- `kabupatenName` (string): Kabupaten/kota name to filter by
- `kecamatanName` (string): Kecamatan name to filter by

**Returns:** `Array<Object>` - Filtered schools for the full location

**Exact Match:** Uses strict equality (`===`) for all three matching.

**Usage:**

```javascript
const { filterSchoolsByLocation } = require('./templates/kecamatan-page');
const gambirSchools = filterSchoolsByLocation(schools, 'DKI Jakarta', 'Jakarta Pusat', 'Gambir');
console.log(`Found ${gambirSchools.length} schools`);
```

---

#### `generateSchoolLinksHtml(schools, provinceSlug, kabupatenSlug)`

Generates the school link list HTML for a kecamatan page.

**Parameters:**

- `schools` (Array<Object>): Array of school data objects (pre-filtered to this kecamatan)
- `provinceSlug` (string): URL slug of the province
- `kabupatenSlug` (string): URL slug of the kabupaten/kota

**Returns:** `string` - HTML list of school links with badges

**Link Format:** `/provinsi/{provinceSlug}/kabupaten/{kabupatenSlug}/kecamatan/{kecamatanSlug}/{npsn}-{namaSlug}.html`

**Usage:**

```javascript
const { generateSchoolLinksHtml } = require('./templates/kecamatan-page');
const linksHtml = generateSchoolLinksHtml(gambirSchools, 'dki-jakarta', 'jakarta-pusat');
```

---

### Path Format

Kecamatan pages are generated at:

```
/provinsi/{provinceSlug}/kabupaten/{kabupatenSlug}/kecamatan/{kecamatanSlug}/index.html
```

Example: `/provinsi/dki-jakarta/kabupaten/jakarta-pusat/kecamatan/gambir/index.html`

---

## Shared Template Modules (`src/presenters/templates/shared/`)

Shared components extracted from individual templates to eliminate duplication across school pages, province pages, and homepage.

### Head Meta Module (`src/presenters/templates/shared/head-meta.js`)

#### Purpose

Provides the shared HTML document head prefix used by all page templates. Extracting this boilerplate to a single constant eliminates ~1.2KB of duplication per page — saving ~4MB of total output across all 3474+ generated pages while keeping security configuration in one place.

#### Exports

```javascript
module.exports = {
  HTML_HEAD_PREFIX: string,
};
```

#### Constants

##### `HTML_HEAD_PREFIX`

A constant string containing the shared HTML head tags that are identical across all page types.

**Value (abbreviated):**

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'..." />
    <meta http-equiv="X-Content-Type-Options" content="nosniff" />
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN" />
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    <meta http-equiv="Permissions-Policy" content="accelerometer=(), camera=(), ..." />
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin" />
    <meta http-equiv="Cross-Origin-Resource-Policy" content="same-origin" />
    <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
    <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
</html>
```

**Dependencies:** None (standalone constant)

**Usage:**

```javascript
const { HTML_HEAD_PREFIX } = require('./shared/head-meta');

// Each template appends its own title, description, canonical URL,
// OG tags, and stylesheet link after this prefix
const fullHtml = HTML_HEAD_PREFIX + `  <title>School Name</title>\n</head>\n...`;
```

---

### Back-to-Top Module (`src/presenters/templates/shared/back-to-top.js`)

#### Purpose

Provides the back-to-top button HTML and scroll-to-top JavaScript that appear on all page types. Extracted to eliminate code duplication across school-page, province-page, and homepage templates.

#### Exports

```javascript
module.exports = {
  generateBackToTopHtml: function,
  generateBackToTopScript: function,
};
```

#### Functions

##### `generateBackToTopHtml()`

Generates the HTML for a back-to-top button with an SVG chevron-up icon.

**Parameters:** None

**Returns:** `string` — HTML string containing a `<button>` element with the `.back-to-top` class and `aria-label="Kembali ke atas"`

**Usage:**

```javascript
const { generateBackToTopHtml } = require('./shared/back-to-top');
const html = generateBackToTopHtml();
// Returns: '<button class="back-to-top" aria-label="Kembali ke atas">...'
```

---

##### `generateBackToTopScript()`

Generates the JavaScript for scroll-based visibility toggling and smooth scrolling for the back-to-top button.

**Parameters:** None

**Returns:** `string` — Inline `<script>` tag

**Behavior:**

- Shows the button after scrolling past 300px
- Hides the button when near the top
- Scrolls smoothly to top on click (respects `prefers-reduced-motion`)
- Uses a passive scroll listener for performance

**Usage:**

```javascript
const { generateBackToTopScript } = require('./shared/back-to-top');
const script = generateBackToTopScript();
```

---

### Navigation Module (`src/presenters/templates/shared/navigation.js`)

#### Purpose

Provides the shared breadcrumb navigation component used by all page templates. Extracted to eliminate duplicate breadcrumb pattern code across school-page, province-page, and homepage templates.

#### Exports

```javascript
module.exports = {
  generateBreadcrumbHtml: function,
};
```

#### Functions

##### `generateBreadcrumbHtml(items)`

Generates a breadcrumb navigation HTML block with semantic `<nav>` and `aria-label` attributes.

**Parameters:**

- `items` (Array<{label: string, url?: string}>): Breadcrumb trail. The last item should omit `url` to render as a `<span>` with `aria-current="page"`. Labels must be HTML-escaped by the caller.

**Returns:** `string` — Navigation HTML string (empty string if items is empty or not an array)

**Semantic Structure:**

```html
<nav aria-label="Navigasi utama">
  <a href="/">Beranda</a> /
  <span aria-current="page">Province Name</span>
</nav>
```

**Usage:**

```javascript
const { generateBreadcrumbHtml } = require('./shared/navigation');

// Current page (last item has no url)
const html = generateBreadcrumbHtml([
  { label: 'Beranda', url: '/' },
  { label: 'DKI Jakarta', url: '/provinsi/dki-jakarta/' },
  { label: 'SMA Negeri 1 Jakarta' },
]);

// With escapeHtml for user-generated labels
const safeHtml = generateBreadcrumbHtml([
  { label: escapeHtml('Beranda'), url: '/' },
  { label: escapeHtml(school.provinsi) },
]);
```

---

### Footer Module (`src/presenters/templates/shared/footer.js`)

#### Purpose

Provides the shared footer component used by all page templates. Extracted to eliminate duplicate footer HTML across the codebase.

#### Exports

```javascript
module.exports = {
  generateFooterHtml: function,
};
```

#### Constants

- `CURRENT_YEAR`: Computed once at module load via `new Date().getFullYear()`

#### Functions

##### `generateFooterHtml(options)`

Generates a consistent footer HTML block with semantic `<footer role="contentinfo">`.

**Parameters:**

- `options` (Object, optional):
  - `siteName` (string): Site name displayed in copyright (default: `'Sekolah PSEO'`)
  - `extraContent` (string): Additional HTML content injected after the copyright line (default: `''`)

**Returns:** `string` — Footer HTML string

**Output Structure:**

```html
<footer role="contentinfo">
  <p>&copy; 2026 Sekolah PSEO. Data sekolah berasal dari Dapodik.</p>
</footer>
```

**Usage:**

```javascript
const { generateFooterHtml } = require('./shared/footer');

// Default footer
const html = generateFooterHtml();

// Custom footer with additional links
const html = generateFooterHtml({
  siteName: 'Sekolah PSEO',
  extraContent: '<p class="footer-links"><a href="/sitemap-index.xml">Sitemap</a></p>',
});
```

---

### Hero Module (`src/presenters/templates/shared/hero.js`)

#### Purpose

Provides the shared hero section component (`.homepage-hero` with an `h1` title, `.hero-description` paragraph and `.hero-stats` stat items). The hero block was duplicated verbatim across four templates — homepage, province-page, kabupaten-page and kecamatan-page — so it is extracted to keep all four heroes structurally identical (same classes, same semantics) and prevent one-off edits from drifting between templates.

#### Exports

```javascript
module.exports = {
  generateHeroHtml: function,
};
```

#### Functions

##### `generateHeroHtml({ title, description, stats })`

Generates a hero section HTML block.

**Parameters:**

- `options` (Object, required):
  - `title` (string): Hero heading rendered as `<h1>` (must be pre-escaped)
  - `description` (string): Hero description text rendered inside `<p class="hero-description">` (must be pre-escaped)
  - `stats` (Array, optional): Stat items rendered inside `.hero-stats` (default: `[]`). Each item is `{ value: string, label: string }` where both values must be pre-escaped.

**Returns:** `string` — Hero HTML string

**Output Structure:**

```html
<div class="homepage-hero">
  <h1>Provinsi Jawa Barat</h1>
  <p class="hero-description">…</p>
  <div class="hero-stats">
    <div class="stat-item">
      <span class="stat-value">123</span>
      <span class="stat-label">Total Sekolah</span>
    </div>
  </div>
</div>
```

**Usage:**

```javascript
const { generateHeroHtml } = require('./shared/hero');

const html = generateHeroHtml({
  title: 'Provinsi Jawa Barat',
  description: 'Jelajahi daftar sekolah-sekolah di Provinsi Jawa Barat.',
  stats: [
    { value: totalSchools.toLocaleString('id-ID'), label: 'Total Sekolah' },
    { value: kabupatenList.length, label: 'Kabupaten/Kota' },
  ],
});
```

**Note:** The first line carries no leading indentation — templates embed the result via a `${generateHeroHtml(...)}` placeholder whose indentation pads the opening `<div>`, matching the hand-written markup the component replaces.

---

### Index Page Head Module (`src/presenters/templates/shared/index-head.js`)

#### Purpose

Provides the shared `<head>` block for index pages (province, kabupaten, kecamatan). The description / title / canonical / Open Graph block plus the stylesheet link was duplicated verbatim across the three index templates. Extracting it keeps the SEO meta block consistent — the plain tags and their `og:` counterparts always stay in sync — and removes the duplication from every index template.

#### Exports

```javascript
module.exports = {
  generateIndexPageHead: function,
};
```

#### Functions

##### `generateIndexPageHead({ title, description, canonicalUrl })`

Generates the `<head>` block shared by index pages (appended after `HTML_HEAD_PREFIX`).

**Parameters:**

- `options` (Object, required):
  - `title` (string): Page title used for `<title>` and `og:title` (must be pre-escaped)
  - `description` (string): Meta description used for the `description` and `og:description` meta tags (must be pre-escaped)
  - `canonicalUrl` (string): Canonical URL used for the canonical link and `og:url` (must be pre-escaped)

**Returns:** `string` — Head block HTML string ending with the `<link rel="stylesheet" href="/styles.css">` line

**Usage:**

```javascript
const { generateIndexPageHead } = require('./shared/index-head');

const head = generateIndexPageHead({
  title: `Daftar Sekolah di Provinsi ${escapeHtml(provinceName)} - Sekolah PSEO`,
  description: escapeHtml(metaDescription),
  canonicalUrl: escapeHtml(canonicalUrl),
});
```

---

### Translations Module (`src/presenters/templates/shared/translations.js`)

#### Purpose

Provides the shared pre-escaped translations object (`T`) used by all page templates. UI text is read from `CONFIG.TEXT` and HTML-escaped **once at module load**, so every template accesses translations through the same interface and never calls `escapeHtml()` at the use site. This consolidates the previously inconsistent access patterns (school-page pre-escaped locally; homepage wrapped `CONFIG.TEXT` reads in `escapeHtml()`; province-page hardcoded strings) into a single canonical pattern (REFACTOR-009).

#### Exports

```javascript
module.exports = {
  T: Object, // Pre-escaped CONFIG.TEXT values, frozen
};
```

#### Constants

##### `T`

A frozen plain object mapping every `CONFIG.TEXT` key to its HTML-escaped value.

**Behavior:**

- Keys and values mirror `CONFIG.TEXT` exactly (one key per translation, no extras)
- Values are pre-escaped via `escapeHtml()` (single-pass regex, bounded cache)
- The object is frozen (`Object.freeze`) — templates share one module-level instance across all page renders, so mutation would leak between pages
- New keys added to `CONFIG.TEXT` are automatically available as `T.<KEY>` in every template

**Dependencies:** `src/core/utils.js` (`escapeHtml`), `src/core/config.js` (`CONFIG.TEXT`)

**Usage:**

```javascript
const { T } = require('./shared/translations');

// Values are already HTML-escaped — safe for attribute and text contexts
const html = `<span aria-label="${T.COPY_NPSN}">${T.NPSN}</span>`;
```

---

### Comparison Module (`src/presenters/templates/shared/comparison.js`)

#### Purpose

Provides the shared school comparison tray (FEAT-005) — the "Bandingkan" widget that lets visitors compare up to 3 schools side by side. Pure front-end composition with no external dependencies. Each school page embeds its own data as a `<script type="application/json" id="school-data">` payload; the "Bandingkan" button on the school page adds that school to a tray persisted in `localStorage` (max 3). The tray is injected via the shared footer so it is present on every page type and survives navigation between static pages. Mirrors the `back-to-top.js` generator pattern (Html + Script pair).

#### Exports

```javascript
module.exports = {
  COMPARISON_STORAGE_KEY: string,
  COMPARISON_MAX: number,
  COMPARISON_METRICS: Array<{ key: string, label: string }>,
  generateComparisonTrayHtml: () => string,
  generateComparisonScript: () => string,
};
```

#### Constants

##### `COMPARISON_STORAGE_KEY`

`'sekolah-pseo:comparison:v1'` — `localStorage` key for the persisted comparison tray.

##### `COMPARISON_MAX`

`3` — maximum number of schools in the tray; a 4th selection is blocked.

##### `COMPARISON_METRICS`

Metrics compared side-by-side, in display order: `npsn`, `status`, `bentuk_pendidikan`, `kecamatan`, `kab_kota`, `provinsi`, `koordinat`.

#### Functions

##### `generateComparisonTrayHtml()`

Returns the tray widget markup (`<aside class="comparison-tray">`), hidden until schools are added. Includes the toggle button, tray list, status region (`role="status"` + `aria-live="polite"`), and the side-by-side comparison table.

##### `generateComparisonScript()`

Returns the client-side script that restores the tray from `localStorage` on load, wires `.btn-compare` buttons on school pages (adds the current `#school-data`), rejects duplicates, blocks a 4th selection, allows removal, and renders the side-by-side table (visible for ≥ 2 selections). All school-derived strings are rendered via `textContent` (never `innerHTML`) to prevent XSS; `localStorage` failures fall back to session-only behavior.

**Dependencies:** None (standalone module)

**Usage:**

```javascript
const { generateComparisonTrayHtml, generateComparisonScript } = require('./shared/comparison');

const trayHtml = generateComparisonTrayHtml();
const trayScript = generateComparisonScript();
```

---

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

#### `writeSchoolPage(school, enrichment)`

Writes a single school page to the file system.

**Parameters:**

- `school` (Object): School data object with required fields
- `enrichment` (Object|null, optional): Optional enrichment data for this school (e.g., Wikipedia extract, accreditation info). Pass `null` or omit when no enrichment is available.

**Returns:** `Promise<void>`

**Throws:**

- `Error` if page data generation fails
- `IntegrationError` if file write fails

**Path Format:** `{distDir}/{relativePath from PageBuilder}`

**Dependencies:**

- `buildSchoolPageData` (from `src/services/PageBuilder.js`)
- `safeWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
// Without enrichment
await writeSchoolPage({
  provinsi: 'DKI Jakarta',
  kab_kota: 'Jakarta Pusat',
  kecamatan: 'Menteng',
  npsn: '12345678',
  nama: 'SMA Negeri 1 Jakarta',
});

// With enrichment data
await writeSchoolPage(school, {
  wikipedia: { title: 'SMA Negeri 1 Jakarta', extract: '...', url: '...' },
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

- `generateSchoolPageStyles` (from `src/presenters/styles.js`)
- `safeWriteFile` (from `src/core/fs-safe.js`)

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

- `safeWriteFile` (from `src/core/fs-safe.js`)

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

- `safeWriteFile` (from `src/core/fs-safe.js`)

**Usage:**

```javascript
await writeSearchDataFile(schools);
// Creates: dist/schools.json (~877 KB for 3474 schools, flat array format)
// Also creates: dist/schools.json.gz (~125 KB) for gzip_static servers
```

---

#### `preCreateProvinceDirectories(schools)`

Pre-creates all unique province directories (e.g., `dist/provinsi/{slug}/`).

**Parameters:**

- `schools` (Array<Object>): Array of school objects

**Returns:** `Promise<void>`

**Dependencies:**

- `getUniqueProvinces` (from `src/services/PageBuilder.js`)
- `safeMkdir` (from `src/core/fs-safe.js`)

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

#### `writeSchoolPagesConcurrently(schools, concurrencyLimit, enrichmentMap)`

Writes multiple school pages concurrently with controlled concurrency using `processConcurrently`.

**Parameters:**

- `schools` (Array<Object>): Array of school objects
- `concurrencyLimit` (number, optional): Max concurrent operations (default: `CONFIG.BUILD_CONCURRENCY_LIMIT`)
- `enrichmentMap` (Map<string, Object>|null, optional): Map of NPSN → enrichment data for each school. Pass `null` or omit when no enrichment data is available.

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

- `processConcurrently` (from `src/core/utils.js`)
- `getUniqueDirectories()` (from `src/services/PageBuilder.js`) for pre-creating school page directories
- `writeSchoolPage()`

**Usage:**

```javascript
// Without enrichment
const { successful, failed } = await writeSchoolPagesConcurrently(schools, 100);
console.log(`Generated ${successful} pages (${failed} failed)`);

// With enrichment map
const { successful, failed } = await writeSchoolPagesConcurrently(schools, 100, enrichmentMap);
```

---

#### `computeSchoolHash(school)`

Computes a deterministic hash for a school record to detect changes for incremental builds. Fields are serialized with length prefixes (`"<len>:<value>"` joined by `|`) so empty fields and delimiter-containing values cannot produce ambiguous hash input. See the manifest module docs for the full field list.

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

- `walkDirectory` (from `src/core/utils.js`)

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

- `safeWriteFile` (from `src/core/fs-safe.js`)

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

- `safeWriteFile` (from `src/core/fs-safe.js`)

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
  validateLinks: function,
  isRelativeLink: function,
  statExistsCached: function
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

#### `validateLinksInFile(file, links, distDir, statCache?)`

Validates all links in a single file and returns broken links.

**Parameters:**

- `file` (string): Path to the HTML file
- `links` (Array<string>): Array of link href values to validate
- `distDir` (string): Base distribution directory for resolving absolute paths
- `statCache` (Map, optional): Shared memoized target-existence cache. When
  validating many files, pass one cache so identical targets across files are
  stat'ed once per run instead of once per file. Defaults to a fresh cache per
  call (unchanged direct-call behavior).

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

- `safeAccess` (from `src/core/fs-safe.js`)
- `safeStat` (from `src/core/fs-safe.js`)

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

#### `statExistsCached(cache, targetPath)`

Memoized target-existence probe for link validation. Caches the promise (not
the boolean) so concurrent in-flight probes of the same target are also
deduplicated. Safe because the `dist/` tree is immutable during a validation
run; the cache lives and dies with one `validateLinks()` call.

At 5,014-page scale this reduces stat calls from ~15,067 to 27 unique targets
(a 558x reduction), since every school page links to the same shared assets
(`styles.css`, `favicon.svg`, `/`).

**Parameters:**

- `cache` (Map): `targetPath` → existence promise
- `targetPath` (string): Absolute resolved target path

**Returns:** `Promise<boolean>` - `true` if the target exists, `false` otherwise

**Usage:**

```javascript
const statCache = new Map();
const exists = await statExistsCached(statCache, '/dist/styles.css');
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

- `walkDirectory` (from `src/core/utils.js`)
- `RateLimiter` (from `src/core/rate-limiter.js`)
- `safeReadFile` (from `src/core/fs-safe.js`)
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
  generateSchoolPageStyles: function
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

## Logger Module (`src/core/logger.js`)

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

Gets the most recent update date from schools.csv and determines if data is fresh. Async — reads via `fileExists()` + `safeReadFile()` from `fs-safe.js`, so the underlying file access benefits from the standard resilience wrappers (timeout, retry, circuit breaker).

**Returns:** `Promise<Object>` - Freshness information

```javascript
{
  exists: boolean,      // Whether schools.csv exists
  date: string|null,  // ISO date string or null
  daysAgo: number|null, // Days since last update or null
  recordCount: number, // Total number of school records
  isFresh: boolean    // true if data is within DEFAULT_MAX_AGE_DAYS
}
```

**Throws:** `IntegrationError` (`FILE_READ_ERROR`) if reading schools.csv fails

**Freshness Threshold:** Data is considered fresh if `daysAgo <= 7` (DEFAULT_MAX_AGE_DAYS)

**Usage:**

```javascript
const { getDataFreshness } = require('./check-freshness');
const freshness = await getDataFreshness();

// If freshness.isFresh is false, data needs updating
if (!freshness.isFresh) {
  console.log(`Data is ${freshness.daysAgo} days old - consider refreshing`);
}
```

---

#### `getDataQualityMetrics()`

Calculates data quality metrics from schools.csv. Async — reads via `fileExists()` + `safeReadFile()` from `fs-safe.js`, so the underlying file access benefits from the standard resilience wrappers (timeout, retry, circuit breaker).

**Returns:** `Promise<Object|null>` - Quality metrics or null if file doesn't exist

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

**Throws:** `IntegrationError` (`FILE_READ_ERROR`) if reading schools.csv fails

**Quality Metrics:**

- **coordinates**: Records with valid lat/lon values
- **address**: Records with non-empty address fields
- **npsn**: Records with valid NPSN (numeric)
- **province**: Records with province information

**Usage:**

```javascript
const { getDataQualityMetrics } = require('./check-freshness');
const quality = await getDataQualityMetrics();
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

Fetches the latest school data from external sources (GitHub) with resilience hardening: timeouts, retries, circuit breaker, and cached fallback.

### Exports

```javascript
module.exports = {
  fetchFromGitHub: function,
  findCsvFiles: function,
  copyToRaw: function,
  validateRepoUrl: function,
  validateBranchName: function,
  execGitCommand: function,
  useCachedData: function,
  fetchCircuitBreaker: CircuitBreaker,
};
```

### Resilience Configuration

| Setting                       | Value  | Description                           |
| ----------------------------- | ------ | ------------------------------------- |
| GIT_OPERATION_TIMEOUT_MS      | 120000 | Git clone/fetch timeout (2 minutes)   |
| GIT_RETRY_MAX_ATTEMPTS        | 3      | Max retries on transient git failures |
| GIT_RETRY_INITIAL_DELAY_MS    | 1000   | Initial backoff delay (1 second)      |
| GIT_CIRCUIT_BREAKER_THRESHOLD | 3      | Failures before circuit opens         |
| GIT_CIRCUIT_BREAKER_RESET_MS  | 120000 | Circuit reset timeout (2 minutes)     |

### Functions

#### `execGitCommand(command, execOptions, operationName)`

Executes a git command synchronously with timeout protection.

**Parameters:**

- `command` (string): Git command to execute
- `execOptions` (Object): Options for execSync (cwd, stdio, etc.)
- `operationName` (string): Human-readable name for the operation

**Returns:** `Buffer|string` - stdout from the command

**Throws:** `IntegrationError` with `TIMEOUT` code if the command exceeds `GIT_OPERATION_TIMEOUT_MS`

**Usage:**

```javascript
const output = execGitCommand(
  'git fetch origin',
  { cwd: '/path/to/repo', stdio: 'inherit' },
  'git fetch origin'
);
```

---

#### `useCachedData(destPath)`

Attempts to use cached (previously fetched) data as fallback when the external source is unavailable.

**Parameters:**

- `destPath` (string): Path where raw data should be written

**Returns:** `boolean` - Whether cached data was found and used. Checks the destination path first, then falls back to CSV files in the `external-data/` directory.

**Usage:**

```javascript
if (!useCachedData('/path/to/raw.csv')) {
  console.error('No cached data available either');
}
```

---

#### `fetchCircuitBreaker`

A dedicated `CircuitBreaker` instance for the external data source. Isolated from file system circuit breakers to prevent file operation failures from affecting data fetch, and vice versa.

- **Failure threshold**: 3
- **Reset timeout**: 120 seconds
- **State**: `CLOSED` (normal), `OPEN` (blocking), `HALF_OPEN` (testing recovery)

---

#### `findCsvFiles(dir)`

Recursively finds CSV files under the given directory.

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

**Returns:** `Promise<string|null>` - Resolves to the path of the CSV file or null if no data source is available. The function is async (circuit breaker + retry); callers must `await` it (F001).

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
  MANIFEST_FILE: string,
  MANIFEST_VERSION: number
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
- Throws `IntegrationError` with `FILE_READ_ERROR` code if file exists but cannot be read or parsed

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

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code if file write fails

**Usage:**

```javascript
const manifest = {
  version: MANIFEST_VERSION,
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
- `kecamatan`, `kab_kota`, `provinsi`

**Excluded Fields** (do not affect generated page content): `kelurahan`, `lat`, `lon`

**Serialization:**

Fields are serialized with a byte-length prefix (`"<len>:<value>"`) joined by `|`, so field boundaries are unambiguous even when a field is empty or contains the `|` delimiter. The previous `filter(Boolean).join('|')` could produce identical hash input for different records (e.g. `{nama:'A', alamat:'B'}` and `{nama:'A', kecamatan:'B'}` both serialized to `'A|B'`), which could silently skip rebuilding a changed page. Missing fields hash identically to empty strings (same rendered output).

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

## Enrichment Module (`scripts/enrichment.js`)

### Purpose

Provides AI-powered data enrichment for school records using external data sources (Wikipedia API). The enrichment pipeline uses safety-first principles: feature-flagged (disabled by default, opt-in via `--enrich` flag or `ENRICHMENT_ENABLED` env var), graceful degradation (failures never block the ETL pipeline), and resilience patterns (dedicated circuit breaker, timeouts, retries, and rate limiting for API calls).

### Exports

```javascript
module.exports = {
  isEnrichmentEnabled: function,
  enrichSchool: function,
  enrichSchoolViaWikipedia: function,
  enrichSchools: function,
  saveEnrichmentData: function,
  loadEnrichmentData: function,
  logEnrichmentSummary: function,
  buildWikipediaSearchUrl: function,
  buildWikipediaExtractUrl: function,
  fetchJson: function,
  wikipediaCircuitBreaker: CircuitBreaker,
  wikipediaRateLimiter: RateLimiter,
  ENRICHMENT_DATA_PATH: string,
  WIKIPEDIA_API_URL: string,
  WIKIPEDIA_MAX_CONCURRENT: number,
  WIKIPEDIA_RATE_LIMIT_MS: number,
};
```

### Constants

#### `ENRICHMENT_DATA_PATH`

- **Type:** `string`
- **Value:** `data/enrichment.json`
- **Description:** File path for persisted enrichment data.

#### `WIKIPEDIA_API_URL`

- **Type:** `string`
- **Value:** `https://id.wikipedia.org/w/api.php`
- **Description:** Indonesian Wikipedia API endpoint.

#### `WIKIPEDIA_CIRCUIT_BREAKER_THRESHOLD`

- **Type:** `number`
- **Value:** `3`
- **Description:** Consecutive failure count that trips the Wikipedia circuit breaker.

#### `WIKIPEDIA_CIRCUIT_BREAKER_RESET_MS`

- **Type:** `number`
- **Value:** `120000` (2 minutes)
- **Description:** Reset timeout for the Wikipedia circuit breaker — after this window elapses, a single probe request is allowed (half-open state).

#### `WIKIPEDIA_MAX_CONCURRENT`

- **Type:** `number`
- **Value:** `2`
- **Description:** Maximum concurrent Wikipedia API requests allowed by `wikipediaRateLimiter`.

#### `WIKIPEDIA_RATE_LIMIT_MS`

- **Type:** `number`
- **Value:** `300`
- **Description:** Minimum spacing (ms) between Wikipedia API request starts — caps the global start rate at ~3.3 req/sec, well under Wikipedia's anonymous-access etiquette limits.

### Rate Limiting

Every Wikipedia API HTTP request passes through `wikipediaRateLimiter` (a `RateLimiter` from `src/core/rate-limiter.js`) before hitting the network. The limiter combines a concurrency cap (`WIKIPEDIA_MAX_CONCURRENT` = 2) with start-spacing pacing (`WIKIPEDIA_RATE_LIMIT_MS` = 300ms), so `enrichSchools`' batch concurrency cannot burst requests past the upstream rate limit. Pacing is serialized through the limiter's start-gate promise chain and applies per HTTP request (each school triggers two: search + extract).

#### `wikipediaRateLimiter`

- **Type:** `RateLimiter`
- **Config:** `{ maxConcurrent: 2, rateLimitMs: 300, queueTimeoutMs: 30000 }`
- **Description:** Dedicated rate limiter for Wikipedia API traffic, isolated from the general-purpose limiters used by build/validation (which stay unpaced at `rateLimitMs: 0`).

### Functions

#### `isEnrichmentEnabled()`

Checks whether enrichment is enabled via environment variable or CLI flag.

**Returns:** `boolean` — `true` if `ENRICHMENT_ENABLED=true`/`1` or `--enrich` flag is present in `process.argv`

**Usage:**

```javascript
if (isEnrichmentEnabled()) {
  logger.info('Enrichment is enabled');
}
```

---

#### `enrichSchool(school)`

Enriches a single school record using all available enrichment sources (currently Wikipedia). Returns an empty object on failure (graceful degradation).

**Parameters:**

- `school` (Object): School record with at least `nama`

**Returns:** `Promise<Object>` — Enrichment data keyed by source name

```javascript
{
  wikipedia: {
    wikipediaUrl: string,       // URL to the Wikipedia page
    wikipediaTitle: string,     // Wikipedia page title
    wikipediaExtract: string,   // First 500 chars of extract
    enrichedAt: string,         // ISO-8601 timestamp
    source: 'wikipedia'
  }
}
```

**Error Handling:** Returns `{}` for null/non-object input, or if enrichment fails at any step (graceful degradation — enrichment failures never propagate).

**Usage:**

```javascript
const enrichment = await enrichSchool(school);
if (enrichment.wikipedia) {
  console.log(`Found Wikipedia page: ${enrichment.wikipedia.wikipediaTitle}`);
}
```

---

#### `enrichSchoolViaWikipedia(school)`

Enriches a single school using the Indonesian Wikipedia API. Searches by school name (optionally scoped by province), fetches page extracts, and returns the best match.

**Parameters:**

- `school` (Object): School record with at least `nama` and optionally `provinsi`

**Returns:** `Promise<Object>` — Wikipedia enrichment data or `{}` if no results

**API Flow:**

1. Builds search URL with `buildWikipediaSearchUrl(schoolName, province)`
2. Fetches search results via `fetchJson()` with retry and timeout
3. Builds extract URL with `buildWikipediaExtractUrl(pageTitles)`
4. Fetches page extracts
5. Returns the first valid page with extract truncated to 500 characters

**Resilience:**

- Timeout: 10 seconds per API call
- Retries: Up to 3 attempts with 1s initial delay
- Retry conditions: HTTP 429, 5xx, or transient network errors
- Non-transient errors (e.g., parse failures) are NOT retried

**Usage:**

```javascript
const wikiData = await enrichSchoolViaWikipedia({
  nama: 'SMA Negeri 1 Jakarta',
  provinsi: 'DKI Jakarta',
});
```

---

#### `enrichSchools(schools, options)`

Enriches multiple school records concurrently with controlled concurrency.

**Parameters:**

- `schools` (Array<Object>): Array of school records
- `options` (Object, optional):
  - `concurrency` (number): Max concurrent API calls (default: 10)
  - `onProgress` (Function): Progress callback `(processed, total) => void`

**Returns:** `Promise<Object>` — Object mapping NPSN to enrichment data

```javascript
{
  "12345678": { wikipedia: { ... } },
  "87654321": { wikipedia: { ... } }
}
```

**Behavior:**

- Processes schools in batches to control API concurrency
- Silently skips schools without NPSN
- Only includes schools where enrichment returned non-empty data
- Reports progress via callback

**Usage:**

```javascript
const enrichmentMap = await enrichSchools(schools, {
  concurrency: 5,
  onProgress: (processed, total) => {
    console.log(`Enriched ${processed}/${total}`);
  },
});
```

---

#### `saveEnrichmentData(enrichmentData)`

Persists enrichment data to the enrichment data file as JSON.

**Parameters:**

- `enrichmentData` (Object): Enrichment data keyed by NPSN

**Returns:** `Promise<void>`

**Throws:** `IntegrationError` with `FILE_WRITE_ERROR` code if the file cannot be written

**Output:** `data/enrichment.json` — Pretty-printed JSON (human-readable for debugging)

**Usage:**

```javascript
await saveEnrichmentData(enrichmentMap);
// Logs: "Saved enrichment data for 1500 schools (240 KB)"
```

---

#### `loadEnrichmentData()`

Loads enrichment data from the enrichment data file.

**Returns:** `Promise<Object>` — Enrichment data keyed by NPSN, or `{}` if file doesn't exist or is invalid

**Error Handling:** Returns `{}` for missing file, corrupt JSON, or any read error (graceful degradation)

**Usage:**

```javascript
const enrichmentMap = await loadEnrichmentData();
console.log(`Loaded ${Object.keys(enrichmentMap).length} enriched schools`);
```

---

#### `logEnrichmentSummary(enrichmentData, totalSchools)`

Logs enrichment summary statistics showing coverage rates and breakdown by source.

**Parameters:**

- `enrichmentData` (Object): Enrichment data keyed by NPSN
- `totalSchools` (number): Total number of schools processed

**Returns:** `void`

**Usage:**

```javascript
logEnrichmentSummary(enrichmentMap, schools.length);
// Output:
// === Enrichment Summary ===
// Total schools: 3474
// Enriched schools: 1500
// Coverage: 43.2%
//
// Enrichment by source:
//   wikipedia: 1500 schools
```

---

#### `buildWikipediaSearchUrl(schoolName, province)`

Builds a Wikipedia API search URL for a school query.

**Parameters:**

- `schoolName` (string): School name to search for
- `province` (string, optional): Province to narrow the search

**Returns:** `string` — Wikipedia API URL

**Usage:**

```javascript
const url = buildWikipediaSearchUrl('SMA Negeri 1', 'DKI Jakarta');
// Returns: 'https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=SMA+Negeri+1+DKI+Jakarta&srlimit=3&format=json&origin=*'
```

---

#### `buildWikipediaExtractUrl(pageTitles)`

Builds a Wikipedia API URL to fetch page extracts for a set of page titles.

**Parameters:**

- `pageTitles` (Array<string>): Page titles to fetch extracts for

**Returns:** `string` — Wikipedia API URL

**Usage:**

```javascript
const url = buildWikipediaExtractUrl(['SMA Negeri 1 Jakarta', 'SMAN 1 Jakarta']);
```

---

#### `fetchJson(url, timeoutMs)`

Fetches a URL and parses the response as JSON, protected by timeout, retry, and the Wikipedia circuit breaker. On timeout the underlying HTTP request is aborted (`destroy()`), releasing the socket instead of leaking it until the remote end closes.

**Parameters:**

- `url` (string): URL to fetch
- `timeoutMs` (number, optional): Timeout in milliseconds (default `10000`)

**Returns:** `Promise<Object>` — Parsed JSON response

**Retry Policy:**

- Max 3 attempts with exponential backoff (1s initial delay), full **jitter** enabled
- **Retryable**: `IntegrationError` with code `TIMEOUT` (request deadline exceeded), HTTP `429`, HTTP `5xx`, and other transient network errors (`isTransientError`)
- **Retry-After honored**: an HTTP `429` response's `Retry-After` header (delta-seconds or HTTP-date) is parsed into `retryAfterMs` on the error; `retry()` waits at least that long before the next attempt (capped at 10s)
- **Non-retryable**: parse failures (`HTTP_ERROR` — invalid JSON or non-2xx with unrecoverable status), since retrying would produce the same result

**Circuit Breaker:** 3 consecutive failures → `OPEN` for 120s. When open, requests reject immediately with `CIRCUIT_BREAKER_OPEN` without hitting the network, giving the Wikipedia API time to recover. In `HALF_OPEN` only one probe request runs at a time.

**Usage:**

```javascript
const data = await fetchJson('https://id.wikipedia.org/w/api.php?action=query');
```

---

#### `parseRetryAfterMs(headerValue)`

Parses an HTTP `Retry-After` header value into a retry delay in milliseconds. Supports both valid RFC 7231 forms.

**Parameters:**

- `headerValue` (string | undefined): Raw `Retry-After` header value

**Returns:** `number | undefined` — Retry delay in milliseconds, or `undefined` when the value is missing, empty, or unparseable

**Behavior:**

- Delta-seconds form (`"120"`) → `120000`
- HTTP-date form (absolute timestamp) → `max(0, dateMs - now)`
- Anything else (including values that look numeric but are not delta-seconds, e.g. `"12.5"`) → `undefined`

---

#### `wikipediaCircuitBreaker`

A dedicated `CircuitBreaker` instance for the Wikipedia API. Isolated from file system circuit breakers (`fs-safe.js`) so a Wikipedia outage cannot cascade into unrelated file operations, and vice versa.

- **Failure threshold**: 3
- **Reset timeout**: 120 seconds
- **State**: `CLOSED` (normal), `OPEN` (blocking), `HALF_OPEN` (testing recovery)

---

## Build Performance Module (`scripts/build-performance.js`)

### Purpose

Tracks build performance metrics (duration, memory, throughput) and enforces configurable performance budgets. Generates structured reports for CI/CD visibility, including GitHub Actions step summaries. Used by `BuildOrchestrator.js` to monitor build pipeline performance.

### Exports

```javascript
module.exports = {
  BuildPerformanceTracker: class,
  monitorBuild: function,
  DEFAULT_BUDGETS: Object,
};
```

### Constants

#### `DEFAULT_BUDGETS`

Default performance budgets, configurable via environment variables:

| Budget              | Env Variable             | Default | Description                     |
| ------------------- | ------------------------ | ------- | ------------------------------- |
| `MAX_BUILD_TIME_MS` | `PERF_MAX_BUILD_TIME_MS` | 300000  | Maximum build time (5 minutes)  |
| `MAX_MEMORY_BYTES`  | `PERF_MAX_MEMORY_BYTES`  | 2 GB    | Maximum heap memory usage       |
| `MIN_THROUGHPUT`    | `PERF_MIN_THROUGHPUT`    | 10      | Minimum pages/second throughput |
| `MAX_FAILED_PAGES`  | `PERF_MAX_FAILED_PAGES`  | 0       | Maximum allowed failed pages    |

### Classes

#### `BuildPerformanceTracker`

Tracks build metrics from start to finish and generates reports with budget compliance checking.

**Constructor:**

```javascript
new BuildPerformanceTracker(budgets);
```

**Parameters:**

- `budgets` (Object, optional): Override default performance budgets

**Methods:**

##### `start()`

Starts the performance tracking timer. Call this before the build begins.

**Returns:** `void`

---

##### `stop()`

Stops the performance tracking timer and records end state. Call this after the build completes.

**Returns:** `void`

---

##### `setBuildType(type)`

Sets the build type for context in reports.

**Parameters:**

- `type` (string): `'full'` or `'incremental'`

**Returns:** `void`

---

##### `recordPageCounts(total, failed)`

Records page counts at the end of the build.

**Parameters:**

- `total` (number): Total pages processed
- `failed` (number): Failed pages count

**Returns:** `void`

---

##### `getElapsedMs()`

Calculates elapsed build time in milliseconds.

**Returns:** `number` — Milliseconds since start (0 if start/end not set)

---

##### `getThroughput()`

Calculates throughput in pages per second.

**Returns:** `number` — Pages/second (0 if no elapsed time or total pages)

---

##### `getMemoryDelta()`

Gets peak memory usage delta (heap used).

**Returns:** `number` — Memory increase in bytes

---

##### `getPeakRss()`

Gets the peak RSS (Resident Set Size) in bytes.

**Returns:** `number` — Peak RSS in bytes

---

##### `checkBudgets()`

Checks all budgets against actual metrics and records violations.

**Returns:** `Array<Object>` — Array of violation objects

```javascript
[
  {
    budget: 'MAX_BUILD_TIME_MS',
    threshold: 300000,
    actual: 350000,
    message: 'Build time 350000ms exceeds budget of 300000ms',
  },
];
```

---

##### `formatBytes(bytes)`

Formats bytes to a human-readable string (B, KB, MB, GB).

**Parameters:**

- `bytes` (number): Value in bytes

**Returns:** `string` — e.g., `'256.00 MB'`

---

##### `generateReport()`

Generates a structured performance report with metrics, budgets, and violations.

**Returns:** `Object`

```javascript
{
  buildType: 'full',
  status: 'PASS' | 'VIOLATION',
  passed: boolean,
  timestamp: 'ISO-8601',
  metrics: {
    elapsedMs: number,
    elapsedFormatted: string,
    totalPages: number,
    failedPages: number,
    throughput: number,
    throughputFormatted: string,
    memoryDelta: string,
    peakRss: string,
  },
  budgets: { ... },
  violations: [ ... ],
}
```

---

##### `logReport()`

Logs the performance report to the console using the project's Pino logger.

**Returns:** `void`

---

##### `getGitHubSummary()`

Generates a GitHub Actions step summary compatible markdown string.

**Returns:** `string` — Markdown table for `GITHUB_STEP_SUMMARY`

---

### Functions

#### `monitorBuild(buildFn, options)`

Factory function that creates a tracker, wraps an async build function, and logs the report on completion.

**Parameters:**

- `buildFn` (Function): Async function `(tracker) => Promise<any>` that performs the build
- `options` (Object, optional):
  - `buildType` (string): `'full'` or `'incremental'` (default: `'full'`)
  - `budgets` (Object): Override performance budgets
  - `throwOnViolation` (boolean): If true, throws `IntegrationError` with `PERFORMANCE_BUDGET_VIOLATION` code when budgets are exceeded (default: `false`)

**Returns:** `Promise<Object>`

```javascript
{
  result: any,       // Return value of buildFn
  report: Object,    // Performance report object
}
```

**Throws:** `IntegrationError` with `PERFORMANCE_BUDGET_VIOLATION` code if `throwOnViolation` is true and budgets are exceeded

**Usage:**

```javascript
const { result, report } = await monitorBuild(
  async tracker => {
    tracker.recordPageCounts(3474, 0);
    return 'build complete';
  },
  { buildType: 'full' }
);

console.log(report.status); // 'PASS' or 'VIOLATION'
```

---

## Data Quality Module (`scripts/data-quality.js`)

### Purpose

Generates comprehensive data quality metrics for the school dataset, including field completeness per required field, coordinate validity (Indonesia geographic bounds), NPSN uniqueness detection, categorical distribution analysis (province, education type, status), and an overall quality score. Can be run locally or in CI/CD with configurable thresholds.

### Exports

```javascript
module.exports = {
  analyzeQuality: function,
  checkThresholds: function,
  isValidCoordinate: function,
  isNonEmpty: function,
  pct: function,
  createBar: function,
  formatHuman: function,
  formatJson: function,
  main: function,
  REQUIRED_FIELDS: string[],
  INDONESIA_BOUNDS: Object,
  DEFAULT_THRESHOLDS: Object,
};
```

### Constants

#### `DEFAULT_THRESHOLDS`

```javascript
{
  MIN_COMPLETENESS_PCT: 90,     // Minimum field completeness percentage
  MAX_DUPLICATE_NPSN: 0,        // Maximum allowed duplicate NPSN groups
  MIN_COORDINATE_PCT: 50,       // Minimum coordinate validity percentage
}
```

### Functions

#### `analyzeQuality(schools)`

Computes comprehensive quality metrics for the school dataset in a single pass. Returns a structured report with field completeness, coordinate validity, NPSN uniqueness, categorical distribution, and an overall quality score.

**Parameters:**

- `schools` (Array<Object>): Parsed school records

**Returns:** `Object`

```javascript
{
  summary: {
    totalSchools: number,
    overallScore: number,    // 0-100 weighted composite:
    schemaVersion: string,   // 40% completeness, 30% coordinates, 30% uniqueness
  },
  fieldCompleteness: {
    npsn: { present: number, missing: number, completenessPct: number },
    // ... per required field
  },
  coordinates: {
    valid: number,          // Both lat/lon within Indonesia bounds
    missing: number,        // Both fields empty
    zero: number,           // One or both are 0 (unset)
    outOfBounds: number,    // Outside Indonesia bounds
    total: number,
  },
  npsnUniqueness: {
    unique: number,
    duplicates: number,      // Number of NPSN values that appear more than once
    duplicateCount: number,  // Total records with duplicate NPSNs
    duplicateNpsns: [{ npsn: string, count: number }],
  },
  categoricalDistribution: {
    provinces: { 'DKI Jakarta': number, ... },
    educationTypes: { 'SMA': number, ... },
    statuses: { 'Negeri': number, 'Swasta': number },
  },
}
```

**Overall Score Calculation:**

- Completeness (40%): Average completeness across all required fields
- Coordinate validity (30%): Percentage of records with valid coordinates
- Uniqueness (30%): 100% if no duplicates, penalty proportional to duplicate ratio

**Usage:**

```javascript
const report = analyzeQuality(schools);
console.log(`Quality score: ${report.summary.overallScore}/100`);
```

---

#### `checkThresholds(report, thresholds)`

Checks if a quality report meets configurable thresholds.

**Parameters:**

- `report` (Object): Report from `analyzeQuality()`
- `thresholds` (Object, optional): Threshold overrides (defaults to `DEFAULT_THRESHOLDS`)

**Returns:** `Object`

```javascript
{
  passed: boolean,          // True if all checks pass
  failures: string[]        // Descriptive failure messages
}
```

**Usage:**

```javascript
const result = checkThresholds(report);
if (!result.passed) {
  result.failures.forEach(f => console.error(f));
}
```

---

#### `formatHuman(report)`

Formats the quality report as a human-readable ASCII string with progress bars.

**Parameters:**

- `report` (Object): Report from `analyzeQuality()`

**Returns:** `string` — Formatted report with bars, tables, and section headers

---

#### `formatJson(report)`

Formats the quality report as pretty-printed JSON.

**Parameters:**

- `report` (Object): Report from `analyzeQuality()`

**Returns:** `string` — JSON string

**Usage:**

```javascript
// CLI: node scripts/data-quality.js --json
console.log(formatJson(report));
```

---

### CLI Usage

The module can be run directly from the command line:

```bash
node scripts/data-quality.js                   # Human-readable report
node scripts/data-quality.js --json            # JSON output
node scripts/data-quality.js --threshold       # Exit 1 if quality below threshold
node scripts/data-quality.js --verbose         # Detailed per-record stats
```

`main()` is async and reads schools.csv via `fileExists()` + `safeReadFile()` from `fs-safe.js`, so the underlying file access benefits from the standard resilience wrappers (timeout, retry, circuit breaker).

**Exit Codes:**

- `0`: Quality meets thresholds (or thresholds not enforced)
- `1`: Quality below thresholds (only with `--threshold`)

---

## Freshness Report Module (`scripts/freshness-report.js`)

### Purpose

Generates a static HTML report page showing data freshness and quality metrics, written to `dist/freshness-report/index.html`. Can be served alongside the rest of the static site for transparency about data age and quality.

### Exports

```javascript
module.exports = {
  generateHtml: function,
  getReportData: function,
  main: function,
};
```

### Functions

#### `main()`

CLI entry point. Parses `process.argv` for the `--json` (print report data as JSON to stdout), `--stdout` (print generated HTML to stdout), or default (write report to `dist/freshness-report/index.html`) modes. Terminates with exit code 1 when `schools.csv` is missing.

#### `generateHtml(freshness, quality)`

Generates a complete HTML report page with cards for status, last updated, school count, threshold, and a data quality metrics section with visual bars.

**Parameters:**

- `freshness` (Object): Data freshness info from `getDataFreshness()`
- `quality` (Object|null): Data quality metrics from `getDataQualityMetrics()`

**Returns:** `string` — Complete HTML document

**Features:**

- Status badge (Fresh/Stale) with color coding
- Last updated date with "X days ago" label
- Total school record count
- Data age threshold display
- Quality metric bars with color thresholds (green ≥99%, yellow ≥90%, red <90%)
- Dark mode support via `prefers-color-scheme`
- Responsive grid layout using design system tokens

**Dependencies:**

- `DESIGN_TOKENS` (from `src/presenters/design-system.js`)

**Usage:**

```javascript
const { getDataFreshness, getDataQualityMetrics } = require('./check-freshness');
const html = generateHtml(await getDataFreshness(), await getDataQualityMetrics());
await safeWriteFile('dist/freshness-report/index.html', html);
```

---

#### `getReportData()`

Returns a combined report data object with freshness, quality, and generation timestamp. Async — delegates to the async `getDataFreshness()` / `getDataQualityMetrics()` from `check-freshness.js`.

**Returns:** `Promise<Object>`

```javascript
{
  exists: boolean,
  date: string|null,
  daysAgo: number|null,
  recordCount: number,
  isFresh: boolean,
  maxAgeDays: number,
  quality: { totalRecords: number, metrics: Object } | null,
  generatedAt: 'ISO-8601',
}
```

**Usage:**

```javascript
const data = await getReportData();
console.log(data.isFresh ? 'Data is fresh' : 'Data is stale');
```

---

### CLI Usage

```bash
node scripts/freshness-report.js                    # Generate report to dist/freshness-report/index.html
node scripts/freshness-report.js --stdout           # Print HTML to stdout
node scripts/freshness-report.js --json             # Print JSON report data
```

---

## Interactive CLI Module (`scripts/interactive.js`)

### Purpose

Provides an interactive terminal menu for common development tasks using Node.js built-in `readline` (zero external dependencies). Organizes tasks into categories: Development, Data Pipeline, Testing, Validation, and Utilities. Falls back to non-interactive mode when stdin is not a TTY.

### Exports

```javascript
module.exports = {
  SCRIPTS: Object,
  runCommand: function,
  pickFromList: function,
  printListAsJson: function,
  printFlatList: function,
  printHelp: function,
  main: function,
};
```

### Constants

#### `SCRIPTS`

Predefined script categories and their commands:

```javascript
{
  Development: [
    { label: 'Dev (lint + test JS)', desc: '...', cmd: 'npm run dev' },
    { label: 'Build all pages (full)', desc: '...', cmd: 'npm run build' },
    // ...
  ],
  'Data Pipeline': [ /* ETL, fetch, freshness, quality */ ],
  Testing: [ /* all, JS, Python, pytest, coverage */ ],
  Validation: [ /* validate-links, sitemap */ ],
  Utilities: [ /* lint, format, format:check */ ],
}
```

### Functions

#### `runCommand(cmd, label)`

Runs a shell command and returns its status.

**Parameters:**

- `cmd` (string): Shell command to execute
- `label` (string): Human-readable label for display

**Returns:** `boolean` — `true` if command succeeded, `false` otherwise

**Behavior:**

- Uses `execSync` with `stdio: 'inherit'` for real-time output
- Logs success/failure to console

---

#### `pickFromList(title, items, rl)`

Displays a numbered list and prompts for selection.

**Parameters:**

- `title` (string): Section title
- `items` (Array<{label: string, desc?: string}>): Selectable items
- `rl` (readline.Interface): Readline interface

**Returns:** `Promise<number>` — 0-based index, `-1` for back, `-2` for invalid input

---

#### `main()`

CLI entry point. Parses `process.argv` for `--help`, `--list`, `--list=flat`, falls back to the non-TTY scripts listing when stdin is not a TTY, and otherwise drives the interactive category/item menu loop (via `mainMenu()` and `pressEnter()`) with a `readline.Interface`.

---

### CLI Usage

```bash
node scripts/interactive.js                          # Start interactive menu
node scripts/interactive.js --help                   # Show help text
node scripts/interactive.js --list                   # List commands as JSON
node scripts/interactive.js --list=flat              # List commands as flat JSON array
```

**Non-TTY Mode:** When stdin is not a TTY (CI/CD pipes), prints available npm scripts instead.

---

## Workflow Security Module (`scripts/check-workflow-security.js`)

### Purpose

Automated security regression checker for GitHub Actions workflow files. Validates `.github/workflows/*.yml` files against known security invariants that have regressed multiple times in this repository. Prevents future regressions by failing CI/pre-commit when forbidden patterns appear.

### Exports

The module runs as a standalone CLI script and does not export functions for programmatic use (ran as `node scripts/check-workflow-security.js`).

### Security Rules

| Rule ID                            | Severity | Description                                                      |
| ---------------------------------- | -------- | ---------------------------------------------------------------- |
| `DUPLICATE_API_KEY`                | CRITICAL | `API_KEY` must not reference the same secret as `GEMINI_API_KEY` |
| `ID_TOKEN_WRITE`                   | HIGH     | `id-token: write` must not appear in non-OIDC workflows          |
| `ACTIONS_WRITE_NON_MERGE`          | HIGH     | `actions: write` must not appear in non-merge workflows          |
| `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN` | HIGH     | `secrets.GH_TOKEN` should be `secrets.GITHUB_TOKEN`              |
| `CHECKOUT_TOKEN_DISCREPANCY`       | MEDIUM   | `actions/checkout` should use `GITHUB_TOKEN` not `GH_TOKEN`      |

### Allowed Overrides

- `on-pull.yml`: Allowed elevated permissions (merge PR handler)

### CLI Usage

```bash
node scripts/check-workflow-security.js           # Check all workflow files (exit 0 if clean)
node scripts/check-workflow-security.js --fix     # Read-only check (no automated fix)
node scripts/check-workflow-security.js --json    # JSON output for CI integration
```

**Exit Codes:**

- `0`: All checks passed — no security regressions
- `1`: Violations found — security regressions detected

Both human-readable and `--json` modes exit non-zero when violations are found, so `--json` works as a CI gate (F027).

**JSON Output:**

```javascript
{
  passed: boolean,
  totalFiles: number,
  totalViolations: number,
  violations: [{
    rule: string,
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM',
    description: string,
    file: string,
    line: number | null,
    message: string
  }],
  checkedAt: 'ISO-8601'
}
```

---

## Test Helpers Module (`scripts/test-helpers.js`)

### Purpose

Shared utilities for the JavaScript test suite (`scripts/*.test.js`). Many modules read global configuration from the shared CONFIG singleton (`src/core/config.js`). Mutating CONFIG directly inside a test body is brittle: if the test fails before restoring the original value, every later test in the same file observes the mutated state — order-dependent, cascading failures. These helpers make CONFIG overrides exception-safe so tests stay isolated regardless of pass/fail.

### Exports

```javascript
module.exports = {
  withConfig: async (overrides: Object<string, *>, fn: Function) => Promise<*>,
};
```

### Functions

#### `withConfig(overrides, fn)`

Temporarily overrides CONFIG values for the duration of `fn`, restoring the originals afterward — even if `fn` throws or rejects. Accepts partial overrides so callers only touch the keys they need; all other CONFIG keys are left untouched.

**Arguments:**

- `overrides` — partial CONFIG overrides, e.g. `{ DIST_DIR: '/tmp/x' }`
- `fn` — sync or async function to run while the overrides are applied

**Returns:** the resolved value of `fn`.

**Usage:**

```javascript
const { withConfig } = require('./test-helpers');

await withConfig({ SCHOOLS_CSV_PATH: '/tmp/schools.csv' }, async () => {
  const result = await getDataFreshness();
  assert.strictEqual(result.exists, true);
});
```

**Dependencies:** `src/core/config.js` (CONFIG singleton)

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

| Code                           | Module          | Scenario                              |
| ------------------------------ | --------------- | ------------------------------------- |
| `FILE_READ_ERROR`              | File operations | File reading failed                   |
| `FILE_WRITE_ERROR`             | File operations | File writing failed                   |
| `FILE_EMPTY`                   | File operations | File exists but is empty              |
| `VALIDATION_ERROR`             | Data processing | Data validation failed                |
| `INVALID_URL`                  | Data processing | URL format validation failed          |
| `INVALID_COORDINATES`          | Data processing | Coordinate out of Indonesia bounds    |
| `INVALID_INPUT`                | Data processing | Invalid input provided                |
| `CONFIGURATION_ERROR`          | Configuration   | Configuration issue                   |
| `MISSING_REQUIRED_FIELD`       | Data processing | Required field is missing             |
| `TIMEOUT`                      | All operations  | Operation exceeded time limit         |
| `RETRY_EXHAUSTED`              | All retries     | All retry attempts failed             |
| `CIRCUIT_BREAKER_OPEN`         | File I/O        | Circuit breaker is blocking           |
| `HTTP_ERROR`                   | Network         | HTTP request failed                   |
| `NETWORK_ERROR`                | Network         | Network communication failure         |
| `EXTERNAL_SERVICE_ERROR`       | Network         | External service operation failed     |
| `FETCH_ERROR`                  | Network         | Data fetch operation failed           |
| `PERFORMANCE_BUDGET_VIOLATION` | Performance     | Performance budget threshold exceeded |

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
                         ┌─────────────────────┐
                         │     config.js        │
                         │  (No dependencies)   │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│    utils.js      │     │   slugify.js     │     │   resilience.js     │
│  (No deps)       │     │  (No deps)       │     │  (No deps)          │
└────────┬─────────┘     └──────────────────┘     └──────────┬──────────┘
         │                                                    │
         │                                                    ▼
         │                                     ┌──────────────────────┐
         │                                     │   rate-limiter.js    │
         │                                     │  Depends:            │
         │                                     │  - resilience.js     │
         │                                     └──────────┬───────────┘
         │                                                    │
         │                                                    ▼
         │                              ┌──────────────────────────────┐
         │                              │       fs-safe.js             │
         │                              │  Depends: resilience.js      │
         │                              └──────────┬───────────────────┘
         │                                         │
         │         ┌───────────────────────────────┼───────────────┐
         │         │                               │               │
         ▼         ▼                               ▼               ▼
┌──────────────┐ ┌──────────────────┐   ┌──────────────────┐ ┌──────────────┐
│  etl.js      │ │  enrichment.js   │   │  manifest.js     │ │  sitemap.js  │
│  Depends:    │ │  Depends:        │   │  Depends:        │ │  Depends:    │
│  - utils.js  │ │  - fs-safe.js    │   │  - fs-safe.js    │ │  - fs-safe.js│
│  - config.js │ │  - resilience.js │   │  - config.js     │ │  - utils.js  │
│  - fs-safe.js│ │  - config.js     │   │  - resilience.js │ │  - config.js │
└──────────────┘ └──────────────────┘   │  - logger.js     │ └──────────────┘
                                        └──────────────────┘

         ┌──────────────────────────────────────────────────────────┐
         │                build-pages.js (Controller)               │
         │  Delegates to: src/services/BuildOrchestrator.js         │
         └──────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────────┐
         │        src/services/BuildOrchestrator.js                 │
         │  Depends:                                                │
         │  - src/core/slugify.js, src/core/utils.js                  │
         │  - src/core/logger.js, src/core/config.js                  │
         │  - src/core/resilience.js, src/core/fs-safe.js             │
         │  - scripts/manifest.js, scripts/build-performance.js     │
         │  - scripts/enrichment.js                                 │
         │  - src/services/PageBuilder.js                           │
         └──────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────────┐
         │              src/services/PageBuilder.js                  │
         │  Depends:                                                │
         │  - slugify.js                                            │
         │  - resilience.js (IntegrationError)                      │
         │  - src/presenters/templates/school-page.js               │
         │  - src/presenters/templates/province-page.js             │
         │  - src/presenters/templates/kabupaten-page.js            │
         │  - src/presenters/templates/kecamatan-page.js            │
         │  - src/presenters/templates/homepage.js                  │
         └──────────────────────────┬───────────────────────────────┘
                                    │
          ┌─────────────────────────┼────────────────────────┐
          │                         │                        │
          ▼                         ▼                        ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  school-page.js     │ │  homepage.js        │ │  province-page.js   │
│  Depends:           │ │  Depends:           │ │  Depends:           │
│  - utils.js         │ │  - utils.js         │ │  - utils.js         │
│  - shared/*         │ │  - shared/*         │ │  - shared/*         │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
          │                         │                        │
          ▼                         ▼                        ▼
┌─────────────────────┐ ┌─────────────────────┐
│  kabupaten-page.js  │ │  kecamatan-page.js  │
│  Depends:           │ │  Depends:           │
│  - utils.js         │ │  - utils.js         │
│  - shared/*         │ │  - shared/*         │
└─────────────────────┘ └─────────────────────┘
          │                         │
          └─────────────────────────┼────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────────┐
         │              Shared Template Modules                     │
         │  (src/presenters/templates/shared/)                      │
         ├──────────────────────────────────────────────────────────┤
         │  head-meta.js     │  Depends: None (standalone)          │
         │  back-to-top.js   │  Depends: None (standalone)          │
         │  navigation.js    │  Depends: None (standalone)          │
         │  footer.js        │  Depends: None (standalone)          │
         │  hero.js          │  Depends: None (standalone)          │
         │  index-head.js    │  Depends: None (standalone)          │
         │  comparison.js    │  Depends: None (standalone)          │
         │  translations.js  │  Depends: utils.js, config.js        │
         └──────────────────────────────────────────────────────────┘
```

## Best Practices

### 1. Always Use Resilient Wrappers

```javascript
// Good
await safeReadFile('/path/to/file.csv');

// Bad (no timeout, retry, or circuit breaker)
await fs.readFile('/path/to/file.csv', 'utf8');
```

### 2. Validate Input Early with IntegrationError

```javascript
// Good (typesafe validation with IntegrationError)
if (!school || typeof school !== 'object') {
  throw new IntegrationError('Invalid school object provided', ERROR_CODES.INVALID_INPUT, {
    field: 'school',
    expectedType: 'object',
  });
}

// Good (missing required fields with specific error code)
if (missingFields.length > 0) {
  throw new IntegrationError(
    `School object missing required fields: ${missingFields.join(', ')}`,
    ERROR_CODES.MISSING_REQUIRED_FIELD,
    { missingFields }
  );
}

// Bad (generic error, no error code)
throw new Error('Invalid school object provided');
```

### 3. Use IntegrationError for Integration Failures

```javascript
// Good
throw new IntegrationError('Failed to read file', ERROR_CODES.FILE_READ_ERROR, { filePath });

// Bad (generic error, can't distinguish from validation errors)
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

### Version 2.2.0 (2026-08-17)

- Added Hero Module documentation (`shared/hero.js`) — shared hero section component (`generateHeroHtml`) used by homepage + province/kabupaten/kecamatan templates
- Added Index Page Head Module documentation (`shared/index-head.js`) — shared index-page `<head>` block (`generateIndexPageHead`) used by province/kabupaten/kecamatan templates
- Updated Module Organization tree with `hero.js` and `index-head.js`
- Updated Dependency Graph Shared Template Modules with `hero.js` and `index-head.js` (both standalone)

### Version 2.1.0 (2026-08-17)

- Updated Module Organization tree with 5 missing modules: `kabupaten-page.js`, `kecamatan-page.js` (templates), `comparison.js` (shared), `SearchDataService.js`, `ExportService.js` (services)
- Updated Dependency Graph with kabupaten/kecamatan template modules and `comparison.js`

### Version 2.0.0 (2026-07-20)

- Added Build Orchestrator Service documentation (src/services/BuildOrchestrator.js) — full build pipeline, step functions, concurrent page generation, incremental build flow
- Added Enrichment Module documentation (scripts/enrichment.js) — Wikipedia enrichment pipeline with retry/timeout/graceful degradation
- Added Build Performance Module documentation (scripts/build-performance.js) — BuildPerformanceTracker, monitorBuild, configurable budgets, CI step summary
- Added Data Quality Module documentation (scripts/data-quality.js) — analyzeQuality, checkThresholds, weighted scoring, human/JSON output
- Added Freshness Report Module documentation (scripts/freshness-report.js) — HTML report generation, design system styling, JSON data export
- Added Interactive CLI Module documentation (scripts/interactive.js) — interactive menu, script categories, readline-based TUI
- Added Workflow Security Module documentation (scripts/check-workflow-security.js) — security regression checker rules, CLI usage, JSON output
- Added shared template documentation (navigation.js, footer.js) — breadcrumb navigation and footer components
- Added PERFORMANCE_BUDGET_VIOLATION error code to Error Code Mapping table
- Added 6 new modules to Module Organization list
- Added BuildOrchestrator, navigation.js, footer.js to Dependency Graph descriptions

### Version 1.2.0 (2026-06-29)

- Added Shared Template Modules documentation (head-meta.js, back-to-top.js)
- Updated Module Organization with `shared/` subdirectory
- Updated Dependency Graph with shared module dependencies
- Added 4 missing network error codes to Error Code Mapping table (HTTP_ERROR, NETWORK_ERROR, EXTERNAL_SERVICE_ERROR, FETCH_ERROR)

### Version 1.2.0 (2026-07-04)

- Added IntegrationError standardization best practice (validation errors use INVALID_INPUT / MISSING_REQUIRED_FIELD codes)
- Updated manifest.js docs: loadManifest throws IntegrationError on corrupt files, saveManifest throws IntegrationError on write failure
- Added enrichment.js module to module organization

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
