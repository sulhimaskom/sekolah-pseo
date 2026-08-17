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

// Drop pino output inside node:test test-file children. The test runner parses
// child STDOUT as a binary protocol AND relays child STDERR into its own stdout
// stream; a pino NDJSON write landing after the test-end marker desyncs the
// protocol framing ("Unable to deserialize cloned data" ERR_TEST_FAILURE).
// A null sink removes the async write entirely, so no output can race the
// end-of-test message. CLI children spawned from tests (execSync) run the
// script, not a *.test.js, so their stdout report streams (parsed by
// check-freshness/freshness-report tests) are unaffected.
const isTestFileChild =
  process.env.NODE_TEST_CONTEXT !== undefined &&
  typeof process.argv[1] === 'string' &&
  process.argv[1].endsWith('.test.js');

const nullSink = { write() {} };

const logger = pino(
  {
    level: validLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: label => {
        return { level: label };
      },
    },
  },
  isTestFileChild ? nullSink : undefined
);

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
