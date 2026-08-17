/**
 * @module logger
 * @description Logging utility for the Indonesian School PSEO project.
 * Uses pino for structured logging with convenience methods matching console.* API.
 * Log level can be configured via LOG_LEVEL environment variable.
 */

'use strict';

const pino = require('pino');

// Map string log levels to pino levels
const levelMap = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

// Get LOG_LEVEL from environment, default to 'info'
const envLogLevel = process.env.LOG_LEVEL || 'info';
const normalizedLevel = envLogLevel.toLowerCase();

// Validate the log level
const validLevel = levelMap[normalizedLevel] !== undefined ? normalizedLevel : 'info';

const logger = pino({
  level: validLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => {
      return { level: label };
    },
  },
});

// Export convenience methods that match console.* API for easy migration
module.exports = {
  // Core pino instance
  logger,

  // Convenience methods matching console.* API
  log: logger.info.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),

  // Additional pino methods
  debug: logger.debug.bind(logger),
  trace: logger.trace.bind(logger),
  fatal: logger.fatal.bind(logger),

  // Child logger for module-specific logging
  child: bindings => logger.child(bindings),

  // Get current level
  getLevel: () => logger.level,
  setLevel: level => {
    logger.level = level;
  },
};
