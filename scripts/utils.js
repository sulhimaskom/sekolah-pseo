/*
 * Shared utility functions for the Indonesian School PSEO project
 */

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
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both parameters must be numbers');
  }
  return a + b;
}

module.exports = {
  parseCsv,
  addNumbers
};