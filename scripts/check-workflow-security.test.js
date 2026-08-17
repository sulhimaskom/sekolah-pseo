'use strict';

/**
 * Tests for scripts/check-workflow-security.js — the CI/pre-commit security
 * regression gate. Covers every rule in RULES, the per-file violation
 * collector, workflow-file discovery, and the CLI contract (exit codes + JSON
 * output shape consumed by the pre-commit hook).
 */

const { describe, it, before, after, mock } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  RULES,
  ALLOWED_OVERRIDES,
  WORKFLOW_DIR,
  findWorkflowFiles,
  checkFile,
  run,
} = require('./check-workflow-security');

// ── Helpers ─────────────────────────────────────────────────────────────────

function rule(id) {
  const found = RULES.find(r => r.id === id);
  assert.ok(found, `RULES should contain rule ${id}`);
  return found;
}

function makeFile(content, filename = 'sample.yml', filePath = `/tmp/${filename}`) {
  return { content, filename, path: filePath };
}

// ── RULES presence ──────────────────────────────────────────────────────────

describe('check-workflow-security RULES', () => {
  it('exports the five documented rules with severity metadata', () => {
    const ids = RULES.map(r => r.id);
    assert.ok(ids.includes('DUPLICATE_API_KEY'));
    assert.ok(ids.includes('ID_TOKEN_WRITE'));
    assert.ok(ids.includes('ACTIONS_WRITE_NON_MERGE'));
    assert.ok(ids.includes('GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN'));
    assert.ok(ids.includes('CHECKOUT_TOKEN_DISCREPANCY'));
    for (const r of RULES) {
      assert.ok(typeof r.check === 'function', `${r.id} has a check function`);
      assert.ok(r.severity, `${r.id} declares a severity`);
    }
  });

  it('declares on-pull.yml as the only allowed override', () => {
    assert.deepStrictEqual(ALLOWED_OVERRIDES, ['on-pull.yml']);
  });
});

// ── DUPLICATE_API_KEY ───────────────────────────────────────────────────────

describe('DUPLICATE_API_KEY rule', () => {
  const r = rule('DUPLICATE_API_KEY');

  it('passes when no API_KEY or GEMINI_API_KEY is present', () => {
    const result = r.check('env:\n  OTHER: ${{ secrets.OTHER }}');
    assert.strictEqual(result.pass, true);
  });

  it('passes when only API_KEY is present', () => {
    const result = r.check('env:\n  API_KEY: ${{ secrets.IFLOW_API_KEY }}');
    assert.strictEqual(result.pass, true);
  });

  it('passes when only GEMINI_API_KEY is present', () => {
    const result = r.check('env:\n  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}');
    assert.strictEqual(result.pass, true);
  });

  it('passes when API_KEY references a distinct secret from GEMINI_API_KEY', () => {
    const content =
      'env:\n  API_KEY: ${{ secrets.IFLOW_API_KEY }}\n  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}';
    const result = r.check(content);
    assert.strictEqual(result.pass, true);
  });

  it('fails when API_KEY duplicates the GEMINI_API_KEY secret', () => {
    const content =
      'env:\n  API_KEY: ${{ secrets.GEMINI_API_KEY }}\n  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}';
    const result = r.check(content);
    assert.strictEqual(result.pass, false);
    assert.match(result.message, /API_KEY references same secret/);
  });

  it('does not flag GEMINI_API_KEY as a bare API_KEY (word-boundary safe)', () => {
    // \bAPI_KEY must not match inside GEMINI_API_KEY
    const content = 'env:\n  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}';
    assert.strictEqual(r.check(content).pass, true);
  });
});

// ── ID_TOKEN_WRITE ──────────────────────────────────────────────────────────

describe('ID_TOKEN_WRITE rule', () => {
  const r = rule('ID_TOKEN_WRITE');

  it('passes when id-token is absent', () => {
    const result = r.check('permissions:\n  contents: read', 'ci.yml');
    assert.strictEqual(result.pass, true);
  });

  it('fails when id-token: write appears in a non-merge workflow', () => {
    const content = 'permissions:\n  id-token: write\n  contents: read';
    const result = r.check(content, 'ci.yml');
    assert.strictEqual(result.pass, false);
    assert.strictEqual(result.line, 2);
    assert.match(result.message, /id-token: write/);
  });

  it('passes when id-token: write appears in an allowed override workflow', () => {
    const result = r.check('permissions:\n  id-token: write', 'on-pull.yml');
    assert.strictEqual(result.pass, true);
    assert.match(result.note, /on-pull.yml/);
  });
});

// ── ACTIONS_WRITE_NON_MERGE ─────────────────────────────────────────────────

describe('ACTIONS_WRITE_NON_MERGE rule', () => {
  const r = rule('ACTIONS_WRITE_NON_MERGE');

  it('passes when actions permission is absent', () => {
    const result = r.check('permissions:\n  contents: read', 'ci.yml');
    assert.strictEqual(result.pass, true);
  });

  it('fails when actions: write appears in a non-merge workflow', () => {
    const content = 'name: ci\npermissions:\n  actions: write';
    const result = r.check(content, 'ci.yml');
    assert.strictEqual(result.pass, false);
    assert.strictEqual(result.line, 3);
    assert.match(result.message, /actions: write/);
  });

  it('passes when actions: write appears in an allowed override workflow', () => {
    const result = r.check('permissions:\n  actions: write', 'on-pull.yml');
    assert.strictEqual(result.pass, true);
  });
});

// ── GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN ────────────────────────────────────────

describe('GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN rule', () => {
  const r = rule('GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN');

  it('passes when only secrets.GITHUB_TOKEN is used', () => {
    const result = r.check('with:\n  token: ${{ secrets.GITHUB_TOKEN }}');
    assert.strictEqual(result.pass, true);
  });

  it('fails and reports the occurrence count for secrets.GH_TOKEN', () => {
    const content = 'with:\n  token: ${{ secrets.GH_TOKEN }}\n  other: ${{ secrets.GH_TOKEN }}';
    const result = r.check(content);
    assert.strictEqual(result.pass, false);
    assert.match(result.message, /2 occurrence\(s\)/);
  });

  it('passes when no token is referenced at all', () => {
    const result = r.check('run: echo hello');
    assert.strictEqual(result.pass, true);
  });
});

// ── CHECKOUT_TOKEN_DISCREPANCY ──────────────────────────────────────────────

describe('CHECKOUT_TOKEN_DISCREPANCY rule', () => {
  const r = rule('CHECKOUT_TOKEN_DISCREPANCY');

  it('is a documented no-op that always passes (covered by GH_TOKEN rule)', () => {
    assert.strictEqual(r.check('anything at all').pass, true);
  });
});

// ── checkFile ───────────────────────────────────────────────────────────────

describe('checkFile', () => {
  it('returns no violations for a clean workflow file', () => {
    const violations = checkFile(makeFile('name: clean\npermissions:\n  contents: read\n'));
    assert.deepStrictEqual(violations, []);
  });

  it('collects one violation object with rule metadata for a bad file', () => {
    const violations = checkFile(makeFile('permissions:\n  id-token: write\n', 'bad.yml'));
    assert.strictEqual(violations.length, 1);
    const v = violations[0];
    assert.strictEqual(v.rule, 'ID_TOKEN_WRITE');
    assert.strictEqual(v.severity, 'HIGH');
    assert.strictEqual(v.file, 'bad.yml');
    assert.strictEqual(v.line, 2);
    assert.ok(v.message);
  });

  it('collects multiple violations from different rules in one file', () => {
    const content = 'permissions:\n  id-token: write\n  actions: write\n';
    const violations = checkFile(makeFile(content, 'multi.yml'));
    const ids = violations.map(v => v.rule).sort();
    assert.deepStrictEqual(ids, ['ACTIONS_WRITE_NON_MERGE', 'ID_TOKEN_WRITE']);
  });

  it('reports a throwing rule as an ERROR-severity violation instead of crashing', () => {
    const originalRules = RULES.slice();
    RULES.push({
      id: 'THROWS_FOR_TEST',
      severity: 'HIGH',
      description: 'test rule that throws',
      check: () => {
        throw new Error('boom');
      },
    });
    try {
      const violations = checkFile(makeFile('anything'));
      assert.strictEqual(violations.length, 1);
      const v = violations[0];
      assert.strictEqual(v.rule, 'THROWS_FOR_TEST');
      assert.strictEqual(v.severity, 'ERROR');
      assert.match(v.message, /Check threw exception: boom/);
    } finally {
      RULES.length = 0;
      RULES.push(...originalRules);
    }
  });
});

// ── findWorkflowFiles ───────────────────────────────────────────────────────

describe('findWorkflowFiles', () => {
  let tempDir;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-test-'));
    fs.writeFileSync(path.join(tempDir, 'a.yml'), 'name: a\n');
    fs.writeFileSync(path.join(tempDir, 'b.yaml'), 'name: b\n');
    fs.writeFileSync(path.join(tempDir, 'ignored.json'), '{}');
    fs.writeFileSync(path.join(tempDir, 'ignored.txt'), 'text');
  });

  after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('discovers only .yml and .yaml files with content and paths', () => {
    const files = findWorkflowFiles(tempDir);
    const names = files.map(f => f.filename).sort();
    assert.deepStrictEqual(names, ['a.yml', 'b.yaml']);
    for (const f of files) {
      assert.ok(f.content.length > 0, `${f.filename} content is read`);
      assert.strictEqual(f.path, path.join(tempDir, f.filename));
    }
  });

  it('returns an empty array for an empty directory', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-empty-'));
    try {
      assert.deepStrictEqual(findWorkflowFiles(emptyDir), []);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('exits non-zero with an error message when the directory is missing', () => {
    const result = spawnSync(
      process.execPath,
      ['-e', "require('./scripts/check-workflow-security').findWorkflowFiles('/nonexistent/cws')"],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
    );
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /Error reading workflow directory/);
  });

  it('defaults to the repository workflows directory', () => {
    assert.ok(WORKFLOW_DIR.endsWith(path.join('.github', 'workflows')));
    assert.ok(fs.existsSync(WORKFLOW_DIR));
  });
});

// ── run (JSON + human output, exit codes) ───────────────────────────────────

describe('run', () => {
  let cleanDir;
  let dirtyDir;

  before(() => {
    cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-clean-'));
    fs.writeFileSync(
      path.join(cleanDir, 'clean.yml'),
      'name: clean\npermissions:\n  contents: read\n'
    );

    dirtyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-dirty-'));
    fs.writeFileSync(
      path.join(dirtyDir, 'dirty.yml'),
      'permissions:\n  id-token: write\n  actions: write\n'
    );
  });

  after(() => {
    mock.restoreAll();
    fs.rmSync(cleanDir, { recursive: true, force: true });
    fs.rmSync(dirtyDir, { recursive: true, force: true });
  });

  function captureLog(fn) {
    mock.method(console, 'log');
    const code = fn();
    const calls = console.log.mock.calls.map(c => c.arguments[0]);
    mock.restoreAll();
    return { code, calls };
  }

  it('returns exit code 0 and a passed JSON report for a clean directory', () => {
    const { code, calls } = captureLog(() => run({ dir: cleanDir, json: true }));
    assert.strictEqual(code, 0);
    const report = JSON.parse(calls[0]);
    assert.strictEqual(report.passed, true);
    assert.strictEqual(report.totalFiles, 1);
    assert.strictEqual(report.totalViolations, 0);
    assert.deepStrictEqual(report.violations, []);
    assert.ok(typeof report.checkedAt === 'string' && !Number.isNaN(Date.parse(report.checkedAt)));
  });

  it('returns exit code 1 and a failing JSON report for a dirty directory', () => {
    const { code, calls } = captureLog(() => run({ dir: dirtyDir, json: true }));
    assert.strictEqual(code, 1);
    const report = JSON.parse(calls[0]);
    assert.strictEqual(report.passed, false);
    assert.strictEqual(report.totalFiles, 1);
    assert.ok(report.totalViolations > 0);
    assert.ok(Array.isArray(report.violations));
  });

  it('human output announces success and returns 0 for a clean directory', () => {
    const { code, calls } = captureLog(() => run({ dir: cleanDir }));
    assert.strictEqual(code, 0);
    const output = calls.join('\n');
    assert.match(output, /Workflow Security Regression Check/);
    assert.match(output, /All checks passed/);
  });

  it('human output lists violations and returns 1 for a dirty directory', () => {
    const { code, calls } = captureLog(() => run({ dir: dirtyDir }));
    assert.strictEqual(code, 1);
    const output = calls.join('\n');
    assert.match(output, /Found 2 violation\(s\)/);
    assert.match(output, /ID_TOKEN_WRITE/);
    assert.match(output, /ACTIONS_WRITE_NON_MERGE/);
  });
});

// ── CLI contract ────────────────────────────────────────────────────────────

describe('CLI', () => {
  const repoRoot = path.join(__dirname, '..');

  it('--json emits parseable JSON and exit code matches the passed flag', () => {
    const result = spawnSync(process.execPath, ['scripts/check-workflow-security.js', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const report = JSON.parse(result.stdout);
    assert.ok(report.totalFiles >= 1);
    assert.ok(Array.isArray(report.violations));
    assert.strictEqual(report.passed, report.totalViolations === 0);
    // JSON mode doubles as a CI gate: exit code must reflect the passed flag.
    // (The repo carries documented baseline violations, so this is not a clean exit.)
    assert.strictEqual(result.status, report.passed ? 0 : 1);
  });

  it('default human mode prints the report banner and exits 0 or 1', () => {
    const result = spawnSync(process.execPath, ['scripts/check-workflow-security.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.ok(result.status === 0 || result.status === 1);
    assert.match(result.stdout, /Workflow Security Regression Check/);
  });
});
