#!/usr/bin/env node

/**
 * @module data-schema
 * @description Centralized data schema definition for the Indonesian School PSEO project.
 *
 * Provides the single source of truth for:
 *   - Field definitions with types, constraints, and allowed values
 *   - Schema versioning for forward compatibility
 *   - Validation functions that use the schema
 *   - Field mapping registry for normalising raw CSV column names
 *
 * Usage:
 *   const SCHEMA = require('./data-schema');
 *   const errors = SCHEMA.validateRecord(record);
 *   const isValid = SCHEMA.isValidCategoricalValue('status', 'N');
 */

'use strict';

// ── Schema Version ──────────────────────────────────────────────────────────

const SCHEMA_VERSION = '1.0';

// ── Indonesia Geographic Bounds ────────────────────────────────────────────

const INDONESIA_BOUNDS = {
  LAT_MIN: -11,
  LAT_MAX: 6,
  LON_MIN: 95,
  LON_MAX: 141,
};

// ── Allowed Categorical Values ─────────────────────────────────────────────

const ALLOWED_VALUES = {
  status: ['N', 'S'],
  bentuk_pendidikan: ['SD', 'SMP', 'SMA', 'SMK', 'SLB', 'SDLB', 'SMLB', 'SMPLB'],
};

// ── Field Definitions ──────────────────────────────────────────────────────

/**
 * Every field in the school data schema.
 * Each entry defines: type, required (in ETL validation), allowedValues (if categorical),
 * description, min/max (for numeric), and raw field name mappings.
 *
 * @type {Object<string, {type: string, required: boolean, description: string,
 *   allowedValues?: string[], min?: number, max?: number, rawMappings: string[]}>}
 */
const FIELDS = {
  npsn: {
    type: 'string',
    required: true,
    pattern: /^\d+$/,
    description: 'NPSN (Nomor Pokok Sekolah Nasional) — numeric unique identifier',
    rawMappings: ['npsn', 'NPSN'],
  },
  nama: {
    type: 'string',
    required: true,
    description: 'School name',
    rawMappings: ['nama', 'nama_sekolah', 'Nama'],
  },
  bentuk_pendidikan: {
    type: 'string',
    required: true,
    allowedValues: ALLOWED_VALUES.bentuk_pendidikan,
    description: 'Education level (SD, SMP, SMA, SMK, SLB, SDLB, SMLB, SMPLB)',
    rawMappings: ['bentuk_pendidikan', 'jenjang'],
  },
  status: {
    type: 'string',
    required: false,
    allowedValues: ALLOWED_VALUES.status,
    description: 'School status: N (Negeri/Public) or S (Swasta/Private)',
    rawMappings: ['status', 'status_sekolah'],
  },
  alamat: {
    type: 'string',
    required: false,
    description: 'Street address',
    rawMappings: ['alamat', 'alamat_jalan'],
  },
  kelurahan: {
    type: 'string',
    required: false,
    description: 'Village/urban ward (kelurahan/desa)',
    rawMappings: ['kelurahan', 'desa'],
  },
  kecamatan: {
    type: 'string',
    required: true,
    description: 'District (kecamatan)',
    rawMappings: ['kecamatan'],
  },
  kab_kota: {
    type: 'string',
    required: true,
    description: 'City or regency (kabupaten/kota)',
    rawMappings: ['kabupaten', 'kab_kota', 'kota'],
  },
  provinsi: {
    type: 'string',
    required: true,
    description: 'Province',
    rawMappings: ['provinsi'],
  },
  lat: {
    type: 'string',
    required: false,
    description: 'Latitude in decimal degrees',
    min: INDONESIA_BOUNDS.LAT_MIN,
    max: INDONESIA_BOUNDS.LAT_MAX,
    rawMappings: ['lat', 'latitude'],
  },
  lon: {
    type: 'string',
    required: false,
    description: 'Longitude in decimal degrees',
    min: INDONESIA_BOUNDS.LON_MIN,
    max: INDONESIA_BOUNDS.LON_MAX,
    rawMappings: ['lon', 'longitude'],
  },
  updated_at: {
    type: 'string',
    required: false,
    description: 'ISO date string of when the record was last updated',
    rawMappings: [],
  },
};

/**
 * Ordered list of field names for CSV output.
 * This determines the column order in data/schools.csv.
 */
const CSV_FIELD_ORDER = [
  'npsn',
  'nama',
  'bentuk_pendidikan',
  'status',
  'alamat',
  'kelurahan',
  'kecamatan',
  'kab_kota',
  'provinsi',
  'lat',
  'lon',
  'updated_at',
];

/**
 * Required fields for a valid school record (must be non-empty).
 * @type {string[]}
 */
const REQUIRED_FIELDS = ['npsn', 'nama', 'bentuk_pendidikan', 'provinsi', 'kab_kota', 'kecamatan'];

// ── Validation Helpers ─────────────────────────────────────────────────────

/**
 * Check if a value is non-empty.
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Validate that a string matches a regex pattern.
 * @param {string} value
 * @param {RegExp} pattern
 * @returns {boolean}
 */
function matchesPattern(value, pattern) {
  if (typeof value !== 'string') return false;
  return pattern.test(value.trim());
}

/**
 * Validate a coordinate value within Indonesia bounds.
 * @param {string|number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function isValidCoordinate(value, min, max) {
  if (!isNonEmpty(value)) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (num === 0) return false; // zero typically means unset
  return num >= min && num <= max;
}

/**
 * Check if a categorical value is in the allowed list.
 * @param {string} field - Field name
 * @param {string} value - Value to validate
 * @returns {boolean}
 */
function isValidCategoricalValue(field, value) {
  const fieldDef = FIELDS[field];
  if (!fieldDef || !fieldDef.allowedValues) return true; // not a categorical field
  if (!value || typeof value !== 'string') return false;
  return fieldDef.allowedValues.includes(value.trim());
}

// ── Record Validation ──────────────────────────────────────────────────────

/**
 * Validate a normalized school record against the schema.
 * Returns an array of error messages (empty array = valid).
 *
 * @param {Object} record - Normalized school record
 * @returns {string[]} Array of validation error messages
 */
function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return ['Record must be a non-null object'];
  }

  // Check required fields
  for (const fieldName of REQUIRED_FIELDS) {
    const fieldDef = FIELDS[fieldName];
    const value = record[fieldName];

    if (!isNonEmpty(value)) {
      errors.push(`Missing required field "${fieldName}"`);
      continue;
    }

    // Type-specific validation
    if (fieldDef.pattern && !matchesPattern(value, fieldDef.pattern)) {
      errors.push(`Field "${fieldName}" value "${value}" does not match required pattern`);
    }

    // Categorical validation
    if (fieldDef.allowedValues && !isValidCategoricalValue(fieldName, value)) {
      errors.push(
        `Field "${fieldName}" has invalid value "${value}"; allowed: ${fieldDef.allowedValues.join(', ')}`
      );
    }
  }

  // Check optional categorical fields
  for (const fieldName of Object.keys(FIELDS)) {
    if (REQUIRED_FIELDS.includes(fieldName)) continue;
    const fieldDef = FIELDS[fieldName];
    const value = record[fieldName];

    if (isNonEmpty(value) && fieldDef.allowedValues && !isValidCategoricalValue(fieldName, value)) {
      errors.push(
        `Field "${fieldName}" has invalid value "${value}"; allowed: ${fieldDef.allowedValues.join(', ')}`
      );
    }
  }

  // Check numeric pattern for npsn (legacy /^\d+$/ check)
  if (isNonEmpty(record.npsn) && !/^\d+$/.test(String(record.npsn).trim())) {
    errors.push(`Field "npsn" value "${record.npsn}" must be numeric`);
  }

  return errors;
}

/**
 * Validate coordinate fields (lat, lon) for a record.
 * Returns an object with validity status per coordinate.
 *
 * @param {Object} record
 * @returns {{ lat: {valid: boolean, error?: string}, lon: {valid: boolean, error?: string} }}
 */
function validateCoordinates(record) {
  const result = { lat: { valid: true }, lon: { valid: true } };

  const latField = FIELDS.lat;
  const lonField = FIELDS.lon;

  if (isNonEmpty(record.lat)) {
    if (!isValidCoordinate(record.lat, latField.min, latField.max)) {
      result.lat = {
        valid: false,
        error: `Latitude "${record.lat}" outside Indonesia bounds [${latField.min}, ${latField.max}]`,
      };
    }
  }

  if (isNonEmpty(record.lon)) {
    if (!isValidCoordinate(record.lon, lonField.min, lonField.max)) {
      result.lon = {
        valid: false,
        error: `Longitude "${record.lon}" outside Indonesia bounds [${lonField.min}, ${lonField.max}]`,
      };
    }
  }

  return result;
}

/**
 * Check if any coordinate data exists and is valid.
 * @param {Object} record
 * @returns {{ hasData: boolean, isValid: boolean }}
 */
function checkCoordinateQuality(record) {
  const hasLat = isNonEmpty(record.lat);
  const hasLon = isNonEmpty(record.lon);

  if (!hasLat && !hasLon) {
    return { hasData: false, isValid: false };
  }

  const latValid = hasLat && isValidCoordinate(record.lat, FIELDS.lat.min, FIELDS.lat.max);
  const lonValid = hasLon && isValidCoordinate(record.lon, FIELDS.lon.min, FIELDS.lon.max);

  return { hasData: true, isValid: latValid && lonValid };
}

// ── Normalisation Helpers ──────────────────────────────────────────────────

/**
 * Map a raw field value from the input data to a canonical field name.
 * Tries each raw mapping in order and returns the first non-empty value.
 *
 * @param {Object} raw - Raw input record
 * @param {string} fieldName - Canonical field name
 * @returns {string} The mapped value (or empty string)
 */
function mapRawField(raw, fieldName) {
  const fieldDef = FIELDS[fieldName];
  if (!fieldDef || !fieldDef.rawMappings || fieldDef.rawMappings.length === 0) {
    return '';
  }

  for (const mapping of fieldDef.rawMappings) {
    const value = raw[mapping];
    if (value !== null && value !== undefined && value !== '') {
      return String(value);
    }
  }

  return '';
}

/**
 * Get the schema in a serialisable format for documentation and reporting.
 * @returns {Object} Schema metadata
 */
function getSchemaInfo() {
  return {
    version: SCHEMA_VERSION,
    fields: Object.entries(FIELDS).map(([name, def]) => ({
      name,
      type: def.type,
      required: def.required,
      description: def.description,
      allowedValues: def.allowedValues || null,
      constraints: {
        ...(def.pattern ? { pattern: def.pattern.source } : {}),
        ...(def.min !== undefined ? { min: def.min } : {}),
        ...(def.max !== undefined ? { max: def.max } : {}),
      },
    })),
    csvFieldOrder: CSV_FIELD_ORDER,
    requiredFields: REQUIRED_FIELDS,
    indonesiaBounds: { ...INDONESIA_BOUNDS },
  };
}

// ── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  SCHEMA_VERSION,
  INDONESIA_BOUNDS,
  ALLOWED_VALUES,
  FIELDS,
  CSV_FIELD_ORDER,
  REQUIRED_FIELDS,
  isNonEmpty,
  isValidCoordinate,
  isValidCategoricalValue,
  matchesPattern,
  validateRecord,
  validateCoordinates,
  checkCoordinateQuality,
  mapRawField,
  getSchemaInfo,
};
