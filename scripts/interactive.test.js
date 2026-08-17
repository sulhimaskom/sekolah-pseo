'use strict';

const { describe, it, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert');
const childProcess = require('child_process');
const readline = require('readline');

function mockReadline(answers = []) {
  let callCount = 0;
  return {
    async question() {
      const answer = answers[callCount] ?? '';
      callCount += 1;
      return answer;
    },
  };
}

/** Scripted fake rl: drives menu answers, counts question/close, can throw. */
function createScriptedRl(answers, { throwOnQuestion = false } = {}) {
  const calls = { question: 0, close: 0 };
  return {
    async question() {
      calls.question += 1;
      if (throwOnQuestion) {
        throw new Error('simulated readline failure');
      }
      if (calls.question > answers.length) {
        throw new Error('Unexpected extra question: menu did not terminate');
      }
      return answers[calls.question - 1];
    },
    close() {
      calls.close += 1;
    },
    calls,
  };
}

// Mock execSync so menu tests that actually select a command never run a real
// npm script. Must be installed BEFORE the interactive module is first required
// (the module destructures `execSync` at load time).
// Preserves the failure semantics used by the existing runCommand tests.
before(() => {
  mock.method(childProcess, 'execSync', cmd => {
    if (cmd === 'nonexistent-command-xyz-12345') {
      const err = new Error(`Command failed: ${cmd}`);
      err.status = 1;
      throw err;
    }
    return Buffer.from('mocked output');
  });
});

after(() => {
  mock.restoreAll();
});

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
      process.stdout.write = chunk => {
        captured.push(chunk.toString());
      };
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
      process.stdout.write = chunk => {
        captured.push(chunk.toString());
      };
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
      process.stdout.write = chunk => {
        captured.push(chunk.toString());
      };
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

  describe('runCommand', () => {
    it('returns true on success', () => {
      const result = mod.runCommand('echo "test"', 'echo test');
      assert.strictEqual(result, true);
    });

    it('returns false on failure', () => {
      const result = mod.runCommand('nonexistent-command-xyz-12345', 'bad command');
      assert.strictEqual(result, false);
    });
  });

  describe('pickFromList', () => {
    const items = [
      { label: 'First', desc: 'first description' },
      { label: 'Second' },
      { label: 'Third', desc: 'third description' },
    ];

    it('returns 0-based index for a valid numeric choice', async () => {
      const rl = mockReadline(['2']);
      const result = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(result, 1);
    });

    it('returns -1 when the back option is selected', async () => {
      const rl = mockReadline([String(items.length + 1)]);
      const result = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(result, -1);
    });

    it('returns -2 for non-numeric input', async () => {
      const rl = mockReadline(['abc']);
      const result = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(result, -2);
    });

    it('returns -2 for out-of-range input', async () => {
      const rl = mockReadline([String(items.length + 2)]);
      const result = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(result, -2);
    });

    it('returns -2 for input below the valid range', async () => {
      const rl = mockReadline(['0']);
      const result = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(result, -2);
    });

    it('prints the title, numbered items with descriptions, and back option', async () => {
      let captured = '';
      const originalLog = console.log;
      console.log = (...chunks) => {
        captured += chunks.join(' ') + '\n';
      };
      try {
        const rl = mockReadline(['1']);
        await mod.pickFromList('Test Menu', items, rl);
      } finally {
        console.log = originalLog;
      }
      assert.ok(captured.includes('Test Menu'));
      assert.ok(captured.includes(' 1. First'));
      assert.ok(captured.includes('     first description'));
      assert.ok(captured.includes(' 2. Second'));
      assert.ok(captured.includes(' 3. Third'));
      assert.ok(captured.includes('     third description'));
      assert.ok(captured.includes('Back to main menu'));
    });

    it('consumes one answer per call for retry flow', async () => {
      const rl = mockReadline(['bad', '3']);
      const first = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(first, -2);
      const second = await mod.pickFromList('Test Menu', items, rl);
      assert.strictEqual(second, 2);
    });
  });

  describe('main() CLI flags', () => {
    let captured;

    beforeEach(() => {
      captured = [];
      process.stdout.write = chunk => {
        captured.push(chunk.toString());
      };
    });

    it('--help flag routes to printHelp', () => {
      process.argv = ['node', 'interactive.js', '--help'];
      process.stdin.isTTY = false;
      delete require.cache[require.resolve('./interactive')];
      require('./interactive');
      const text = captured.join('');
      assert.ok(text.includes('Usage:'));
      assert.ok(text.includes('--help'));
      assert.ok(text.includes('--list'));
      assert.ok(text.includes('Categories:'));
    });

    it('--list flag routes to printListAsJson', () => {
      captured = [];
      process.argv = ['node', 'interactive.js', '--list'];
      process.stdin.isTTY = false;
      delete require.cache[require.resolve('./interactive')];
      require('./interactive');
      const output = captured.join('');
      assert.doesNotThrow(() => JSON.parse(output));
      const parsed = JSON.parse(output);
      assert.ok(parsed.Development);
      assert.ok(parsed.Testing);
    });

    it('--list=flat flag routes to printFlatList', () => {
      captured = [];
      process.argv = ['node', 'interactive.js', '--list=flat'];
      process.stdin.isTTY = false;
      delete require.cache[require.resolve('./interactive')];
      require('./interactive');
      const output = captured.join('');
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(output);
        assert.ok(Array.isArray(parsed));
      });
      const parsed = JSON.parse(output);
      assert.ok(parsed.length > 0);
      assert.ok(parsed[0].category);
      assert.ok(parsed[0].label);
      assert.ok(parsed[0].cmd);
    });

    it('non-TTY mode prints npm scripts listing', () => {
      captured = [];
      process.argv = ['node', 'interactive.js'];
      process.stdin.isTTY = false;
      delete require.cache[require.resolve('./interactive')];
      require('./interactive');
      const text = captured.join('');
      assert.ok(text.includes('Sekolah PSEO Interactive CLI'));
      assert.ok(text.includes('npm run'));
      assert.ok(text.includes('test'));
      assert.ok(text.includes('build'));
    });
  });

  describe('main() interactive menu (TTY mode)', () => {
    async function driveMenu(answers, { throwOnQuestion = false } = {}) {
      const rl = createScriptedRl(answers, { throwOnQuestion });
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const logCalls = [];
      const errorCalls = [];
      const originals = {
        log: console.log,
        error: console.error,
        clear: console.clear,
        createInterface: readline.createInterface,
        isTTY: process.stdin.isTTY,
        argv: process.argv,
        exit: process.exit,
      };

      console.log = (...chunks) => {
        logCalls.push(chunks.join(' '));
      };
      console.error = (...chunks) => {
        errorCalls.push(chunks.join(' '));
      };
      console.clear = () => {};
      readline.createInterface = () => rl;
      process.stdin.isTTY = true;
      process.argv = ['node', 'interactive.js'];
      process.exit = code => {
        throw new Error(`PROCESS_EXIT:${code}`);
      };

      try {
        await mod.main();
      } finally {
        console.log = originals.log;
        console.error = originals.error;
        console.clear = originals.clear;
        readline.createInterface = originals.createInterface;
        process.stdin.isTTY = originals.isTTY;
        process.argv = originals.argv;
        process.exit = originals.exit;
      }
      return { rl, logCalls, errorCalls, exitOption };
    }

    it('exits immediately when the exit option is selected', async () => {
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu([exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      assert.ok(logCalls.some(l => l.includes('Goodbye!')));
      assert.ok(logCalls.some(l => l.includes('Development')));
      assert.ok(logCalls.some(l => l.includes('Utilities')));
    });

    it('shows an invalid-option message and keeps looping for non-numeric input', async () => {
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu(['abc', '', exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      assert.ok(
        logCalls.some(l => l.includes('Invalid option. Please try again.')),
        'should print invalid-option message'
      );
    });

    it('rejects out-of-range options and keeps looping', async () => {
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu(['99', '', exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      assert.ok(logCalls.some(l => l.includes('Invalid option. Please try again.')));
    });

    it('returns to the main menu when Back is selected inside a category', async () => {
      const firstCategoryItems = mod.SCRIPTS[Object.keys(mod.SCRIPTS)[0]];
      const backOption = String(firstCategoryItems.length + 1);
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu(['1', backOption, exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      assert.ok(logCalls.some(l => l.includes(firstCategoryItems[0].label)));
      assert.ok(logCalls.some(l => l.includes('Back to main menu')));
    });

    it('retries the item picker on an invalid item choice', async () => {
      const firstCategoryItems = mod.SCRIPTS[Object.keys(mod.SCRIPTS)[0]];
      const backOption = String(firstCategoryItems.length + 1);
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu(['1', 'xyz', '', backOption, exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      assert.ok(
        logCalls.some(l => l.includes('Invalid option. Please try again.')),
        'item picker should report invalid input'
      );
    });

    it('runs the selected command then returns to the category menu', async () => {
      const firstCategoryItems = mod.SCRIPTS[Object.keys(mod.SCRIPTS)[0]];
      const backOption = String(firstCategoryItems.length + 1);
      const exitOption = String(Object.keys(mod.SCRIPTS).length + 1);
      const { rl, logCalls } = await driveMenu(['1', '1', '', backOption, exitOption]);
      assert.strictEqual(rl.calls.close, 1);
      const label = firstCategoryItems[0].label;
      assert.ok(logCalls.some(l => l.includes(`Running: ${label}`)));
      assert.ok(logCalls.some(l => l.includes(`✓ ${label} completed successfully.`)));
    });

    it('logs the error and terminates when the menu loop throws', async () => {
      let threw = false;
      try {
        await driveMenu([], { throwOnQuestion: true });
      } catch (err) {
        threw = true;
        assert.match(String(err.message), /PROCESS_EXIT:1/);
      }
      assert.ok(threw, 'expected main() to terminate with PROCESS_EXIT:1');
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
