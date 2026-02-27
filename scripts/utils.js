/*
 * Shared utility functions for the Indonesian School PSEO project
 */

const path = require('path');
const { safeReaddir, safeStat } = require('./fs-safe');

/**
 * Recursively walk a directory tree and process each file with a callback.
 * This is a shared utility to eliminate code duplication between scripts.
 *
 * @param {string} dir - Directory path to walk
 * @param {Function} callback - Callback function for each HTML file.
 *                              Receives (fullPath, relativePath, entry, stat)
 *                              Returns a value to be included in results array.
 * @returns {Array} - Array of results returned by the callback for each HTML file
 */
async function walkDirectory(dir, callback) {
  const results = [];

  async function walk(current, relative) {
    const entries = await safeReaddir(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry);
      const relPath = path.join(relative, entry);
      const stat = await safeStat(fullPath);

      if (stat.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.endsWith('.html') && typeof callback === 'function') {
        const result = await callback(fullPath, relPath, entry, stat);
        if (result !== undefined) {
          results.push(result);
        }
      }
    }
  }

  await walk(dir, '');
  return results;
}

/**
 * Parse a CSV string into an array of objects. This parser handles quoted fields
 * that may contain commas, which is a more robust approach than simple splitting.
 *
 * @param {string} csvData
 * @returns {Array<Object>}
 */
function parseCsv(csvData) {
  // Handle empty or invalid CSV data
  if (!csvData || typeof csvData !== 'string') {
    return [];
  }

  const lines = csvData.trim().split(/\r?\n/);

  // Handle empty CSV
  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headerLine = lines.shift();
  const header = parseCsvLine(headerLine);

  // Handle CSV with only header
  if (lines.length === 0) {
    return [];
  }

  return lines.map(line => {
    const values = parseCsvLine(line);
    const record = {};
    header.forEach((h, i) => {
      record[h] = values[i] || '';
    });
    return record;
  });
}

/**
 * Parse a single CSV line, handling quoted fields that may contain commas.
 *
 * @param {string} line
 * @returns {Array<string>}
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && !inQuotes) {
      // Start of quoted field
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      // End of quoted field or escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // End of quoted field
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      // Regular character
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Function to compute the sum of two numbers
 *
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Sum of the two numbers
 */
function addNumbers(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both parameters must be finite numbers');
  }
  return a + b;
}

function escapeHtml(text) {
  if (text === null || text === undefined) {
    return '';
  }
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStatus(status) {
  if (!status) return 'Tidak Diketahui';
  const normalized = status.trim().toUpperCase();
  if (normalized === 'N') return 'Negeri';
  if (normalized === 'S') return 'Swasta';
  return status;
}

function formatEmptyValue(value, placeholder = 'Tidak tersedia') {
  if (value === null || value === undefined || value === '') {
    return placeholder;
  }
  const trimmed = String(value).trim();
  return trimmed || placeholder;
}

function hasCoordinateData(school) {
  if (!school) return false;
  if (!school.lat || !school.lon) return false;
  if (school.lat === '' || school.lon === '') return false;
  if (parseFloat(school.lat) === 0 || parseFloat(school.lon) === 0) return false;
  return true;
}

/**
 * Write array of objects to CSV file with header row.
 * This is a simple CSV serializer that handles basic cases.
 * For complex CSV data with quoted fields containing commas,
 * consider using a robust library like `csv-stringify`.
 *
 * @param {Array<Object>} data - Array of objects to write
 * @param {string} outputPath - Path to output CSV file
 * @returns {Promise<void>}
 */
async function writeCsv(data, outputPath) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }

  const { safeWriteFile } = require('./fs-safe');

  const header = Object.keys(data[0]);
  const lines = [header.join(',')];

  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchLines = batch.map(rec => header.map(h => escapeCsvField(rec[h] || '')).join(','));
    lines.push(...batchLines);
  }

  await safeWriteFile(outputPath, lines.join('\n'));
}

/**
 * Escape a CSV field value according to RFC 4180.
 * Fields containing commas, quotes, or newlines must be enclosed in double quotes.
 * Double quotes within the field must be escaped by doubling them.
 * Additionally, formula injection protection is applied by prefixing dangerous
 * characters (=, +, -, @, tab) with a single quote to prevent spreadsheet formula execution.
 *
 * @param {string} value - The field value to escape
 * @returns {string} - The escaped field value
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Formula injection protection: prefix dangerous characters with single quote
  // This prevents spreadsheet applications from interpreting cells as formulas
  // Dangerous characters: =, +, -, @, tab (\t)
  const firstChar = str.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t') {
    return '"' + str;
  }

  // Check if the field needs quoting
  const needsQuoting =
    str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsQuoting) {
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str;
}
module.exports = {
  parseCsv,
  addNumbers,
  escapeHtml,
  escapeCsvField,
  walkDirectory,
  writeCsv,
  formatStatus,
  formatEmptyValue,
  hasCoordinateData,
};
