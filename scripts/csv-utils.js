/*
 * CSV utility functions for parsing and writing CSV files.
 * Provides more robust CSV handling than the simple split-based approach.
 */

const fs = require('fs');

/**
 * Parse a CSV string into an array of objects.
 * Handles quoted fields and escaped quotes properly.
 *
 * @param {string} csvData - The CSV data as a string
 * @returns {Array<Object>} - Array of objects representing the CSV rows
 */
function parseCsv(csvData) {
  const lines = csvData.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Parse header
  const header = parseCsvRow(lines[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    const values = parseCsvRow(lines[i]);
    const record = {};
    header.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    data.push(record);
  }
  
  return data;
}

/**
 * Parse a single CSV row, handling quoted fields and escaped quotes.
 *
 * @param {string} row - A single CSV row
 * @returns {Array<string>} - Array of field values
 */
function parseCsvRow(row) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = i < row.length - 1 ? row[i + 1] : '';
    
    if (char === '"' && !inQuotes) {
      // Start of quoted field
      inQuotes = true;
    } else if (char === '"' && nextChar === '"') {
      // Escaped quote
      currentValue += '"';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes) {
      // End of quoted field
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(currentValue);
      currentValue = '';
    } else {
      // Regular character
      currentValue += char;
    }
  }
  
  // Add the last field
  values.push(currentValue);
  
  return values;
}

/**
 * Convert an array of objects to CSV format.
 *
 * @param {Array<Object>} data - Array of objects to convert to CSV
 * @returns {string} - CSV formatted string
 */
function toCsv(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if necessary
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

module.exports = {
  parseCsv,
  toCsv
};