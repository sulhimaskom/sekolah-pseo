const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const {
  fetchFromGitHub,
  findCsvFiles,
  copyToRaw,
  validateRepoUrl,
  validateBranchName,
} = require('./fetch-data');

describe('fetch-data', () => {
  describe('findCsvFiles', () => {
    it('returns empty array when directory does not exist', () => {
      const result = findCsvFiles('/non/existent/directory');
      assert.deepStrictEqual(result, []);
    });

    it('returns empty array for empty directory', () => {
      const tempDir = path.join(process.cwd(), 'test-temp-empty-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        const result = findCsvFiles(tempDir);
        assert.deepStrictEqual(result, []);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('finds CSV files in directory', () => {
      const tempDir = path.join(process.cwd(), 'test-temp-csv-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.writeFileSync(path.join(tempDir, 'test1.csv'), 'col1,col2\nval1,val2');
        fs.writeFileSync(path.join(tempDir, 'test2.csv'), 'col1,col2\nval3,val4');
        fs.writeFileSync(path.join(tempDir, 'test3.txt'), 'not a csv');

        const result = findCsvFiles(tempDir);
        assert.strictEqual(result.length, 2);
        assert.ok(result.some(f => f.endsWith('test1.csv')));
        assert.ok(result.some(f => f.endsWith('test2.csv')));
        assert.ok(!result.some(f => f.endsWith('test3.txt')));
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('recursively finds CSV files in subdirectories', () => {
      const tempDir = path.join(process.cwd(), 'test-temp-recursive-' + Date.now());
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir, { recursive: true });

      try {
        fs.writeFileSync(path.join(tempDir, 'root.csv'), 'col1\nval1');
        fs.writeFileSync(path.join(subDir, 'nested.csv'), 'col1\nval2');

        const result = findCsvFiles(tempDir);
        assert.strictEqual(result.length, 2);
        assert.ok(result.some(f => f.endsWith('root.csv')));
        assert.ok(result.some(f => f.endsWith('nested.csv')));
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('ignores hidden directories and files', () => {
      const tempDir = path.join(process.cwd(), 'test-temp-hidden-' + Date.now());
      const hiddenDir = path.join(tempDir, '.hidden');
      fs.mkdirSync(hiddenDir, { recursive: true });

      try {
        fs.writeFileSync(path.join(tempDir, 'visible.csv'), 'col1\nval1');
        fs.writeFileSync(path.join(hiddenDir, 'hidden.csv'), 'col1\nval2');

        const result = findCsvFiles(tempDir);
        assert.strictEqual(result.length, 1);
        assert.ok(result[0].endsWith('visible.csv'));
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('copyToRaw', () => {
    it('returns false when source file does not exist', () => {
      const result = copyToRaw('/non/existent/file.csv', '/tmp/dest.csv');
      assert.strictEqual(result, false);
    });

    it('successfully copies file when source exists', () => {
      const tempDir = path.join(process.cwd(), 'test-temp-copy-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      const sourcePath = path.join(tempDir, 'source.csv');
      const destPath = path.join(tempDir, 'dest.csv');

      try {
        fs.writeFileSync(sourcePath, 'col1,col2\nval1,val2');

        const result = copyToRaw(sourcePath, destPath);
        assert.strictEqual(result, true);
        assert.ok(fs.existsSync(destPath));

        const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
        const destContent = fs.readFileSync(destPath, 'utf-8');
        assert.strictEqual(sourceContent, destContent);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('creates destination directory if it does not exist', () => {
      const baseTempDir = path.join(process.cwd(), 'test-temp-mkdir-' + Date.now());

      const sourceDir = path.join(baseTempDir, 'source');
      fs.mkdirSync(sourceDir, { recursive: true });
      const sourcePath = path.join(sourceDir, 'source.csv');
      fs.writeFileSync(sourcePath, 'col1\nval1');

      const destDir = path.join(baseTempDir, 'nested', 'dir');
      const destPath = path.join(destDir, 'dest.csv');

      try {
        const result = copyToRaw(sourcePath, destPath);
        assert.strictEqual(result, true);
        assert.ok(fs.existsSync(destPath));
      } finally {
        fs.rmSync(baseTempDir, { recursive: true, force: true });
      }
    });
  });

  describe('module exports', () => {
    it('exports fetchFromGitHub function', () => {
      assert.strictEqual(typeof fetchFromGitHub, 'function');
    });

    it('exports findCsvFiles function', () => {
      assert.strictEqual(typeof findCsvFiles, 'function');
    });

    it('exports copyToRaw function', () => {
      assert.strictEqual(typeof copyToRaw, 'function');
    });

    it('exports validateRepoUrl function', () => {
      assert.strictEqual(typeof validateRepoUrl, 'function');
    });

    it('exports validateBranchName function', () => {
      assert.strictEqual(typeof validateBranchName, 'function');
    });
  });

  describe('validateRepoUrl', () => {
    it('accepts valid https GitHub URL', () => {
      const result = validateRepoUrl('https://github.com/user/repo.git');
      assert.strictEqual(result, 'https://github.com/user/repo.git');
    });

    it('accepts valid http URL', () => {
      const result = validateRepoUrl('http://example.com/repo.git');
      assert.strictEqual(result, 'http://example.com/repo.git');
    });

    it('rejects URL without .git extension', () => {
      assert.throws(() => validateRepoUrl('https://github.com/user/repo'), {
        name: 'IntegrationError',
      });
    });

    it('rejects non-http protocols like ftp', () => {
      assert.throws(() => validateRepoUrl('ftp://example.com/repo.git'), {
        name: 'IntegrationError',
      });
    });

    it('rejects URL with no hostname', () => {
      assert.throws(() => validateRepoUrl('https:///repo.git'), {
        name: 'IntegrationError',
      });
    });

    it('rejects invalid URL strings', () => {
      assert.throws(() => validateRepoUrl('not-a-url'), {
        name: 'IntegrationError',
      });
    });

    it('sanitizes URL by removing extra characters', () => {
      const result = validateRepoUrl('https://github.com/user/repo.git');
      assert.ok(result.startsWith('https://'));
      assert.ok(result.endsWith('.git'));
    });
  });

  describe('validateBranchName', () => {
    it('accepts simple branch name', () => {
      const result = validateBranchName('main');
      assert.strictEqual(result, 'main');
    });

    it('accepts branch name with hyphens', () => {
      const result = validateBranchName('feature-branch');
      assert.strictEqual(result, 'feature-branch');
    });

    it('accepts branch name with slashes', () => {
      const result = validateBranchName('feature/my-branch');
      assert.strictEqual(result, 'feature/my-branch');
    });

    it('accepts branch name with underscores', () => {
      const result = validateBranchName('my_branch');
      assert.strictEqual(result, 'my_branch');
    });

    it('rejects branch name with spaces', () => {
      assert.throws(() => validateBranchName('my branch'), {
        name: 'IntegrationError',
      });
    });

    it('rejects empty string', () => {
      assert.throws(() => validateBranchName(''), {
        name: 'IntegrationError',
      });
    });

    it('rejects non-string input', () => {
      assert.throws(() => validateBranchName(null), {
        name: 'IntegrationError',
      });
    });

    it('rejects branch name starting with dot', () => {
      assert.throws(() => validateBranchName('.hidden'), {
        name: 'IntegrationError',
      });
    });

    it('rejects branch name with path traversal', () => {
      assert.throws(() => validateBranchName('../etc/passwd'), {
        name: 'IntegrationError',
      });
    });

    it('rejects branch name with shell metacharacters', () => {
      assert.throws(() => validateBranchName('branch;rm -rf /'), {
        name: 'IntegrationError',
      });
    });
  });
});
