'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const logger = require('./logger');

describe('logger', () => {
  describe('log level configuration', () => {
    it('should export logger instance', () => {
      assert.ok(logger.logger);
      assert.ok(typeof logger.logger.info === 'function');
      assert.ok(typeof logger.logger.warn === 'function');
      assert.ok(typeof logger.logger.error === 'function');
    });

    it('should default to info level', () => {
      assert.strictEqual(logger.getLevel(), 'info');
    });

    it('should be able to set log level to debug', () => {
      logger.setLevel('debug');
      assert.strictEqual(logger.getLevel(), 'debug');
    });

    it('should be able to set log level to warn', () => {
      logger.setLevel('warn');
      assert.strictEqual(logger.getLevel(), 'warn');
    });

    it('should be able to set log level to error', () => {
      logger.setLevel('error');
      assert.strictEqual(logger.getLevel(), 'error');
    });

    it('should be able to set log level back to info', () => {
      logger.setLevel('info');
      assert.strictEqual(logger.getLevel(), 'info');
    });
  });

  describe('convenience methods', () => {
    it('should export log method', () => {
      assert.strictEqual(typeof logger.log, 'function');
    });

    it('should export info method', () => {
      assert.strictEqual(typeof logger.info, 'function');
    });

    it('should export warn method', () => {
      assert.strictEqual(typeof logger.warn, 'function');
    });

    it('should export error method', () => {
      assert.strictEqual(typeof logger.error, 'function');
    });

    it('should export debug method', () => {
      assert.strictEqual(typeof logger.debug, 'function');
    });

    it('should export trace method', () => {
      assert.strictEqual(typeof logger.trace, 'function');
    });

    it('should export fatal method', () => {
      assert.strictEqual(typeof logger.fatal, 'function');
    });
  });

  describe('child logger', () => {
    it('should export child method', () => {
      assert.strictEqual(typeof logger.child, 'function');
    });

    it('should create child logger with bindings', () => {
      const child = logger.child({ module: 'test' });
      assert.ok(child);
      assert.strictEqual(typeof child.info, 'function');
    });
  });
});
