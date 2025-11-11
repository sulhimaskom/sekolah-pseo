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
  
  // Use a more efficient approach for processing records
  const result = [];
  for (const line of lines) {
    const values = parseCsvLine(line);
    const record = {};
    for (let i = 0; i < header.length; i++) {
      record[header[i]] = values[i] || '';
    }
    result.push(record);
  }
  
  return result;
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

module.exports = {
  parseCsv
};