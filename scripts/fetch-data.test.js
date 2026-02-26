const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { fetchFromGitHub, findCsvFiles, copyToRaw } = require('./fetch-data');

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
  });
});
