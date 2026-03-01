const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Clear module cache to get fresh config
delete require.cache[require.resolve('./config')];

const CONFIG = require('./config');

describe('config', () => {
  describe('validatePath', () => {
    it('returns true when path is inside base path', () => {
      const result = CONFIG.validatePath('/project/src', '/project');
      assert.strictEqual(result, true);
    });

    it('returns true for exact base path match', () => {
      const result = CONFIG.validatePath('/project', '/project');
      assert.strictEqual(result, true);
    });

    it('returns false when path is outside base path', () => {
      const result = CONFIG.validatePath('/etc/passwd', '/project');
      assert.strictEqual(result, false);
    });

    it('returns false for path traversal attempt', () => {
      const result = CONFIG.validatePath('/project/../etc/passwd', '/project');
      assert.strictEqual(result, false);
    });

    it('handles nested paths correctly', () => {
      const result = CONFIG.validatePath('/project/src/components', '/project/src');
      assert.strictEqual(result, true);
    });
  });

  describe('ROOT_DIR', () => {
    it('is defined', () => {
      assert.ok(CONFIG.ROOT_DIR);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.ROOT_DIR), true);
    });

    it('points to project root', () => {
      // In CI/sandbox, the directory might be named /app or similar
      // instead of sekolah-pseo, so we check for a known file
      const fs = require('fs');
      assert.ok(fs.existsSync(path.join(CONFIG.ROOT_DIR, 'package.json')));
    });
  });

  describe('DIST_DIR', () => {
    it('is defined', () => {
      assert.ok(CONFIG.DIST_DIR);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.DIST_DIR), true);
    });

    it('is inside ROOT_DIR', () => {
      assert.ok(CONFIG.DIST_DIR.startsWith(CONFIG.ROOT_DIR));
    });
  });

  describe('DATA_DIR', () => {
    it('is defined', () => {
      assert.ok(CONFIG.DATA_DIR);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.DATA_DIR), true);
    });

    it('is inside ROOT_DIR', () => {
      assert.ok(CONFIG.DATA_DIR.startsWith(CONFIG.ROOT_DIR));
    });
  });

  describe('EXTERNAL_DIR', () => {
    it('is defined', () => {
      assert.ok(CONFIG.EXTERNAL_DIR);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.EXTERNAL_DIR), true);
    });

    it('is inside ROOT_DIR', () => {
      assert.ok(CONFIG.EXTERNAL_DIR.startsWith(CONFIG.ROOT_DIR));
    });
  });

  describe('SCHOOLS_CSV_PATH', () => {
    it('is defined', () => {
      assert.ok(CONFIG.SCHOOLS_CSV_PATH);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.SCHOOLS_CSV_PATH), true);
    });

    it('is inside DATA_DIR', () => {
      assert.ok(CONFIG.SCHOOLS_CSV_PATH.startsWith(CONFIG.DATA_DIR));
    });
  });

  describe('RAW_DATA_PATH', () => {
    it('is defined', () => {
      assert.ok(CONFIG.RAW_DATA_PATH);
    });

    it('is an absolute path', () => {
      assert.strictEqual(path.isAbsolute(CONFIG.RAW_DATA_PATH), true);
    });
  });

  describe('SITE_URL', () => {
    it('is defined', () => {
      assert.ok(CONFIG.SITE_URL);
    });

    it('has valid URL format', () => {
      assert.ok(CONFIG.SITE_URL.startsWith('http://') || CONFIG.SITE_URL.startsWith('https://'));
    });

    it('defaults to example.com when env not set', () => {
      assert.strictEqual(CONFIG.SITE_URL, 'https://example.com');
    });
  });

  describe('BUILD_CONCURRENCY_LIMIT', () => {
    it('is defined', () => {
      assert.ok(CONFIG.BUILD_CONCURRENCY_LIMIT !== undefined);
    });

    it('is a positive number', () => {
      assert.strictEqual(CONFIG.BUILD_CONCURRENCY_LIMIT > 0, true);
    });

    it('respects environment variable', () => {
      const originalEnv = process.env.BUILD_CONCURRENCY_LIMIT;
      process.env.BUILD_CONCURRENCY_LIMIT = '50';

      // Clear require cache to get fresh config
      delete require.cache[require.resolve('./config')];
      const CONFIG2 = require('./config');

      assert.strictEqual(CONFIG2.BUILD_CONCURRENCY_LIMIT, 50);

      // Restore
      if (originalEnv === undefined) {
        delete process.env.BUILD_CONCURRENCY_LIMIT;
      } else {
        process.env.BUILD_CONCURRENCY_LIMIT = originalEnv;
      }
    });

    it('enforces minimum of 1', () => {
      const originalEnv = process.env.BUILD_CONCURRENCY_LIMIT;
      process.env.BUILD_CONCURRENCY_LIMIT = '-5';

      delete require.cache[require.resolve('./config')];
      const CONFIG2 = require('./config');

      assert.strictEqual(CONFIG2.BUILD_CONCURRENCY_LIMIT, 1);

      if (originalEnv === undefined) {
        delete process.env.BUILD_CONCURRENCY_LIMIT;
      } else {
        process.env.BUILD_CONCURRENCY_LIMIT = originalEnv;
      }
    });

    it('enforces maximum of 1000', () => {
      const originalEnv = process.env.BUILD_CONCURRENCY_LIMIT;
      process.env.BUILD_CONCURRENCY_LIMIT = '5000';

      delete require.cache[require.resolve('./config')];
      const CONFIG2 = require('./config');

      assert.strictEqual(CONFIG2.BUILD_CONCURRENCY_LIMIT, 1000);

      if (originalEnv === undefined) {
        delete process.env.BUILD_CONCURRENCY_LIMIT;
      } else {
        process.env.BUILD_CONCURRENCY_LIMIT = originalEnv;
      }
    });
  });

  describe('VALIDATION_CONCURRENCY_LIMIT', () => {
    it('is defined', () => {
      assert.ok(CONFIG.VALIDATION_CONCURRENCY_LIMIT !== undefined);
    });

    it('is a positive number', () => {
      assert.strictEqual(CONFIG.VALIDATION_CONCURRENCY_LIMIT > 0, true);
    });

    it('respects environment variable', () => {
      const originalEnv = process.env.VALIDATION_CONCURRENCY_LIMIT;
      process.env.VALIDATION_CONCURRENCY_LIMIT = '25';

      delete require.cache[require.resolve('./config')];
      const CONFIG2 = require('./config');

      assert.strictEqual(CONFIG2.VALIDATION_CONCURRENCY_LIMIT, 25);

      if (originalEnv === undefined) {
        delete process.env.VALIDATION_CONCURRENCY_LIMIT;
      } else {
        process.env.VALIDATION_CONCURRENCY_LIMIT = originalEnv;
      }
    });
  });

  describe('MAX_URLS_PER_SITEMAP', () => {
    it('is defined', () => {
      assert.ok(CONFIG.MAX_URLS_PER_SITEMAP !== undefined);
    });

    it('is a positive number', () => {
      assert.strictEqual(CONFIG.MAX_URLS_PER_SITEMAP > 0, true);
    });

    it('respects environment variable', () => {
      const originalEnv = process.env.MAX_URLS_PER_SITEMAP;
      process.env.MAX_URLS_PER_SITEMAP = '1000';

      delete require.cache[require.resolve('./config')];
      const CONFIG2 = require('./config');

      assert.strictEqual(CONFIG2.MAX_URLS_PER_SITEMAP, 1000);

      if (originalEnv === undefined) {
        delete process.env.MAX_URLS_PER_SITEMAP;
      } else {
        process.env.MAX_URLS_PER_SITEMAP = originalEnv;
      }
    });
  });

  describe('CONFIG object', () => {
    it('exports all required properties', () => {
      const requiredProps = [
        'ROOT_DIR',
        'DIST_DIR',
        'DATA_DIR',
        'EXTERNAL_DIR',
        'RAW_DATA_PATH',
        'SCHOOLS_CSV_PATH',
        'SITE_URL',
        'BUILD_CONCURRENCY_LIMIT',
        'VALIDATION_CONCURRENCY_LIMIT',
        'MAX_URLS_PER_SITEMAP',
        'validatePath',
      ];

      for (const prop of requiredProps) {
        assert.ok(CONFIG[prop] !== undefined, `Missing property: ${prop}`);
      }
    });
  });
});
