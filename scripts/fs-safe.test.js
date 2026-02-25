const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const {
  safeReadFile,
  safeWriteFile,
  safeMkdir,
  safeAccess,
  safeReaddir,
  safeStat,
  DEFAULT_FILE_TIMEOUT_MS,
} = require('./fs-safe');

describe('fs-safe', () => {
  // Test fixtures - defined at top level
  let testDir;
  let testFile;
  let testSubdir;

  // Setup before all tests
  before(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-safe-test-'));
    testFile = path.join(testDir, 'test-file.txt');
    testSubdir = path.join(testDir, 'test-subdir');
  });

  // Cleanup after all tests
  after(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('safeReadFile', () => {
    it('reads file content successfully', async () => {
      const testContent = 'Hello, World!';
      await fs.writeFile(testFile, testContent);

      const result = await safeReadFile(testFile);
      assert.strictEqual(result, testContent);
    });

    it('reads file with custom encoding', async () => {
      const testContent = 'Test content';
      await fs.writeFile(testFile, testContent);

      const result = await safeReadFile(testFile, { encoding: 'utf8' });
      assert.strictEqual(result, testContent);
    });

    it('throws error for non-existent file', async () => {
      const nonExistentFile = path.join(testDir, 'non-existent.txt');

      await assert.rejects(safeReadFile(nonExistentFile), error =>
        error.message.includes('Failed to read file')
      );
    });

    it('respects custom timeout', async () => {
      const testContent = 'Quick read';
      await fs.writeFile(testFile, testContent);

      const result = await safeReadFile(testFile, { timeoutMs: 5000 });
      assert.strictEqual(result, testContent);
    });
  });

  describe('safeWriteFile', () => {
    it('writes content to file successfully', async () => {
      const testContent = 'New content';

      await safeWriteFile(testFile, testContent);

      const result = await fs.readFile(testFile, 'utf8');
      assert.strictEqual(result, testContent);
    });

    it('writes to new file if it does not exist', async () => {
      const newFile = path.join(testDir, 'new-file.txt');
      const testContent = 'Brand new content';

      await safeWriteFile(newFile, testContent);

      const result = await fs.readFile(newFile, 'utf8');
      assert.strictEqual(result, testContent);
    });

    it('overwrites existing file content', async () => {
      await fs.writeFile(testFile, 'Old content');
      const newContent = 'Updated content';

      await safeWriteFile(testFile, newContent);

      const result = await fs.readFile(testFile, 'utf8');
      assert.strictEqual(result, newContent);
    });

    it('respects custom timeout', async () => {
      const testContent = 'Quick write';

      await safeWriteFile(testFile, testContent, { timeoutMs: 5000 });

      const result = await fs.readFile(testFile, 'utf8');
      assert.strictEqual(result, testContent);
    });
  });

  describe('safeMkdir', () => {
    it('creates directory successfully', async () => {
      await safeMkdir(testSubdir);

      const stats = await fs.stat(testSubdir);
      assert.strictEqual(stats.isDirectory(), true);
    });

    it('does not throw if directory already exists', async () => {
      const existingDir = path.join(testDir, 'already-exists');
      await fs.mkdir(existingDir);

      // Should not throw
      await safeMkdir(existingDir);

      const stats = await fs.stat(existingDir);
      assert.strictEqual(stats.isDirectory(), true);
    });

    it('creates nested directories', async () => {
      const nestedDir = path.join(testDir, 'a', 'b', 'c');

      await safeMkdir(nestedDir);

      const stats = await fs.stat(nestedDir);
      assert.strictEqual(stats.isDirectory(), true);
    });

    it('respects custom timeout', async () => {
      const newDir = path.join(testDir, 'timeout-test');

      await safeMkdir(newDir, { timeoutMs: 5000 });

      const stats = await fs.stat(newDir);
      assert.strictEqual(stats.isDirectory(), true);
    });
  });

  describe('safeAccess', () => {
    it('checks file access successfully', async () => {
      await fs.writeFile(testFile, 'test');

      // Should not throw
      await safeAccess(testFile);
    });

    it('throws error for non-existent file', async () => {
      const nonExistent = path.join(testDir, 'not-exist.txt');

      await assert.rejects(safeAccess(nonExistent), error =>
        error.message.includes('File access check failed')
      );
    });

    it('respects custom timeout', async () => {
      await fs.writeFile(testFile, 'test');

      await safeAccess(testFile, fs.constants.F_OK, { timeoutMs: 5000 });
    });
  });

  describe('safeReaddir', () => {
    it('reads directory contents successfully', async () => {
      const readdirTestDir = path.join(testDir, 'readdir-test');
      await fs.mkdir(readdirTestDir);
      await fs.writeFile(path.join(readdirTestDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(readdirTestDir, 'file2.txt'), 'content2');

      const entries = await safeReaddir(readdirTestDir);

      assert.strictEqual(entries.length, 2);
      assert(entries.includes('file1.txt'));
      assert(entries.includes('file2.txt'));
    });

    it('returns empty array for empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.mkdir(emptyDir);

      const entries = await safeReaddir(emptyDir);

      assert.strictEqual(entries.length, 0);
    });

    it('throws error for non-existent directory', async () => {
      const nonExistent = path.join(testDir, 'not-exist');

      await assert.rejects(safeReaddir(nonExistent), error =>
        error.message.includes('Failed to read directory')
      );
    });

    it('respects custom timeout', async () => {
      await fs.writeFile(path.join(testDir, 'file3.txt'), 'content');

      const entries = await safeReaddir(testDir, { timeoutMs: 5000 });
      assert(entries.length > 0);
    });
  });

  describe('safeStat', () => {
    it('gets file stats successfully', async () => {
      await fs.writeFile(testFile, 'test content');

      const stats = await safeStat(testFile);

      assert.strictEqual(stats.isFile(), true);
      assert(stats.size > 0);
    });

    it('gets directory stats successfully', async () => {
      const stats = await safeStat(testDir);

      assert.strictEqual(stats.isDirectory(), true);
    });

    it('throws error for non-existent path', async () => {
      const nonExistent = path.join(testDir, 'not-exist.txt');

      await assert.rejects(safeStat(nonExistent), error =>
        error.message.includes('Failed to get file stats')
      );
    });

    it('respects custom timeout', async () => {
      await fs.writeFile(testFile, 'test');

      const stats = await safeStat(testFile, { timeoutMs: 5000 });
      assert(stats.isFile());
    });
  });

  describe('DEFAULT_FILE_TIMEOUT_MS', () => {
    it('is defined as a positive number', () => {
      assert.strictEqual(typeof DEFAULT_FILE_TIMEOUT_MS, 'number');
      assert(DEFAULT_FILE_TIMEOUT_MS > 0);
    });
  });
});
