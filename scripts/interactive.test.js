'use strict';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');

// Save originals
const originalIsTTY = process.stdin.isTTY;
const originalArgv = process.argv;
const originalStdoutWrite = process.stdout.write;

describe('interactive CLI', () => {
  let mod;

  before(() => {
    // Non-interactive mode for data structure tests
    process.stdin.isTTY = false;
    delete require.cache[require.resolve('./interactive')];
    mod = require('./interactive');
  });

  after(() => {
    process.stdin.isTTY = originalIsTTY;
    process.argv = originalArgv;
    process.stdout.write = originalStdoutWrite;
  });

  describe('printListAsJson', () => {
    let captured;

    beforeEach(() => {
      captured = [];
      process.stdout.write = chunk => { captured.push(chunk.toString()); };
    });

    it('should output valid JSON', () => {
      mod.printListAsJson();
      const output = captured.join('');
      assert.doesNotThrow(() => JSON.parse(output));
    });

    it('should contain all category keys', () => {
      mod.printListAsJson();
      const parsed = JSON.parse(captured.join(''));
      assert.ok(parsed.Development);
      assert.ok(parsed['Data Pipeline']);
      assert.ok(parsed.Testing);
      assert.ok(parsed.Validation);
      assert.ok(parsed.Utilities);
    });

    it('each category should have items with label, desc, cmd', () => {
      mod.printListAsJson();
      const parsed = JSON.parse(captured.join(''));
      for (const [category, items] of Object.entries(parsed)) {
        assert.ok(Array.isArray(items), `${category} should be array`);
        for (const item of items) {
          assert.ok(typeof item.label === 'string');
          assert.ok(typeof item.desc === 'string');
          assert.ok(typeof item.cmd === 'string');
        }
      }
    });
  });

  describe('printFlatList', () => {
    let captured;

    beforeEach(() => {
      captured = [];
      process.stdout.write = chunk => { captured.push(chunk.toString()); };
    });

    it('should output valid JSON array', () => {
      mod.printFlatList();
      const output = captured.join('');
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(output);
        assert.ok(Array.isArray(parsed));
      });
    });

    it('every entry should have category, label, desc, cmd', () => {
      mod.printFlatList();
      const parsed = JSON.parse(captured.join(''));
      for (const entry of parsed) {
        assert.ok(typeof entry.category === 'string');
        assert.ok(typeof entry.label === 'string');
        assert.ok(typeof entry.desc === 'string');
        assert.ok(typeof entry.cmd === 'string');
      }
    });

    it('should flatten all categories into one array', () => {
      mod.printFlatList();
      const parsed = JSON.parse(captured.join(''));
      const categoryCount = new Set(parsed.map(e => e.category)).size;
      assert.equal(categoryCount, Object.keys(mod.SCRIPTS).length);
    });
  });

  describe('printHelp', () => {
    let captured;

    beforeEach(() => {
      captured = [];
      process.stdout.write = chunk => { captured.push(chunk.toString()); };
    });

    it('should mention --help and --list flags', () => {
      mod.printHelp();
      const text = captured.join('');
      assert.ok(text.includes('--help'));
      assert.ok(text.includes('--list'));
    });

    it('should list all category names', () => {
      mod.printHelp();
      const text = captured.join('');
      for (const category of Object.keys(mod.SCRIPTS)) {
        assert.ok(text.includes(category), `Help should mention ${category}`);
      }
    });
  });

  describe('SCRIPTS data structure', () => {
    it('should be an object with category keys', () => {
      const keys = Object.keys(mod.SCRIPTS);
      assert.ok(keys.length >= 4, 'should have at least 4 categories');
      assert.ok(keys.includes('Development'));
      assert.ok(keys.includes('Data Pipeline'));
      assert.ok(keys.includes('Testing'));
      assert.ok(keys.includes('Validation'));
      assert.ok(keys.includes('Utilities'));
    });

    it('each item should have label, desc, and cmd fields', () => {
      for (const [category, items] of Object.entries(mod.SCRIPTS)) {
        assert.ok(Array.isArray(items), `${category} should be an array`);
        for (const item of items) {
          assert.ok(typeof item.label === 'string', `${category}: label must be string`);
          assert.ok(
            typeof item.desc === 'string',
            `${category}: desc must be string for "${item.label}"`
          );
          assert.ok(
            typeof item.cmd === 'string',
            `${category}: cmd must be string for "${item.label}"`
          );
          assert.ok(item.cmd.startsWith('npm '), `${category}: cmd must start with "npm "`);
        }
      }
    });

    it('should include data quality scripts', () => {
      const dataPipeline = mod.SCRIPTS['Data Pipeline'];
      const hasDataQuality = dataPipeline.some(i => i.cmd.includes('data-quality'));
      assert.ok(hasDataQuality, 'Data Pipeline should include data-quality commands');
    });

    it('should include pytest and coverage scripts in Testing', () => {
      const testing = mod.SCRIPTS.Testing;
      assert.ok(testing.some(i => i.cmd.includes('test:py:pytest')));
      assert.ok(testing.some(i => i.cmd.includes('test:ci')));
      assert.ok(testing.some(i => i.cmd.includes('test:all')));
      assert.ok(testing.some(i => i.cmd.includes('coverage')));
    });
  });

  describe('npm script coverage', () => {
    let pkgScripts;

    before(() => {
      const pkg = require('../package.json');
      pkgScripts = pkg.scripts || {};
    });

    it('should cover all non-trivial npm scripts', () => {
      // Collect all commands referenced in the menu
      const menuCmds = new Set();
      for (const items of Object.values(mod.SCRIPTS)) {
        for (const item of items) {
          menuCmds.add(item.cmd);
        }
      }

      // Check each npm script has a menu entry (skip cli itself)
      for (const [name] of Object.entries(pkgScripts)) {
        // cli is the menu itself - skip
        if (name === 'cli') continue;
        // test:js:coverage is similar to coverage:report
        if (name === 'test:js:coverage') continue;
        if (name === 'test:js:coverage:report') continue;

        const npmCmd = `npm run ${name}`;
        const npmTestCmd = name === 'test' ? 'npm test' : null;

        const found = menuCmds.has(npmCmd) || (npmTestCmd && menuCmds.has(npmTestCmd));
        assert.ok(found, `npm script "${name}" should be covered in interactive menu (${npmCmd})`);
      }
    });
  });
});
