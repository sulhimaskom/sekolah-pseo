const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
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
  fileReadCircuitBreaker,
  fileWriteCircuitBreaker,
} = require('../scripts/fs-safe');

test('DEFAULT_FILE_TIMEOUT_MS is a positive number', () => {
  assert.strictEqual(typeof DEFAULT_FILE_TIMEOUT_MS, 'number');
  assert.ok(DEFAULT_FILE_TIMEOUT_MS > 0, 'timeout should be positive');
});

test('fileReadCircuitBreaker is a CircuitBreaker instance', () => {
  assert.ok(fileReadCircuitBreaker, 'should exist');
  assert.strictEqual(typeof fileReadCircuitBreaker.execute, 'function');
  assert.strictEqual(typeof fileReadCircuitBreaker.getState, 'function');
});

test('fileWriteCircuitBreaker is a CircuitBreaker instance', () => {
  assert.ok(fileWriteCircuitBreaker, 'should exist');
  assert.strictEqual(typeof fileWriteCircuitBreaker.execute, 'function');
  assert.strictEqual(typeof fileWriteCircuitBreaker.getState, 'function');
});

test('safeReadFile reads file content', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'test.txt');
  const testContent = 'Hello, World!';

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.writeFile(testFile, testContent);

  try {
    const content = await safeReadFile(testFile);
    assert.strictEqual(content, testContent);
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeReadFile throws on non-existent file', async () => {
  const nonExistentFile = path.join(os.tmpdir(), `nonexistent-${Date.now()}.txt`);

  await assert.rejects(() => safeReadFile(nonExistentFile), { name: 'IntegrationError' });
});

test('safeReadFile accepts custom timeout', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'test.txt');
  const testContent = 'Test content';

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.writeFile(testFile, testContent);

  try {
    const content = await safeReadFile(testFile, { timeoutMs: 5000 });
    assert.strictEqual(content, testContent);
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeWriteFile writes content to file', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'output.txt');
  const testContent = 'Output content';

  await fs.promises.mkdir(testDir, { recursive: true });

  try {
    await safeWriteFile(testFile, testContent);
    const content = await fs.promises.readFile(testFile, 'utf8');
    assert.strictEqual(content, testContent);
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeWriteFile throws on read-only directory', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'output.txt');

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.chmod(testDir, 0o444);

  try {
    await assert.rejects(() => safeWriteFile(testFile, 'test'), { name: 'IntegrationError' });
  } finally {
    await fs.promises.chmod(testDir, 0o755);
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeMkdir creates directory recursively', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`, 'nested', 'dir');

  try {
    await safeMkdir(testDir);
    const exists = await fs.promises
      .access(testDir)
      .then(() => true)
      .catch(() => false);
    assert.strictEqual(exists, true);
  } finally {
    await fs.promises.rm(path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`), {
      recursive: true,
      force: true,
    });
  }
});

test('safeMkdir handles existing directory', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);

  await fs.promises.mkdir(testDir, { recursive: true });

  // Should not throw for existing directory
  await safeMkdir(testDir);

  await fs.promises.rm(testDir, { recursive: true, force: true });
});

test('safeAccess returns true for existing file with default mode', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'test.txt');

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.writeFile(testFile, 'test');

  try {
    await safeAccess(testFile);
    // If we get here, the file exists and is accessible
    assert.ok(true);
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeAccess throws for non-existent file', async () => {
  const nonExistentFile = path.join(os.tmpdir(), `nonexistent-${Date.now()}.txt`);

  await assert.rejects(() => safeAccess(nonExistentFile), { name: 'IntegrationError' });
});

test('safeReaddir reads directory contents', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile1 = path.join(testDir, 'file1.txt');
  const testFile2 = path.join(testDir, 'file2.txt');

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.writeFile(testFile1, 'content1');
  await fs.promises.writeFile(testFile2, 'content2');

  try {
    const files = await safeReaddir(testDir);
    assert.ok(Array.isArray(files));
    assert.strictEqual(files.length, 2);
    assert.ok(files.includes('file1.txt'));
    assert.ok(files.includes('file2.txt'));
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeReaddir throws for non-existent directory', async () => {
  const nonExistentDir = path.join(os.tmpdir(), `nonexistent-${Date.now()}`);

  await assert.rejects(() => safeReaddir(nonExistentDir), { name: 'IntegrationError' });
});

test('safeStat returns file stats', async () => {
  const testDir = path.join(os.tmpdir(), `fs-safe-test-${Date.now()}`);
  const testFile = path.join(testDir, 'test.txt');
  const testContent = 'test content';

  await fs.promises.mkdir(testDir, { recursive: true });
  await fs.promises.writeFile(testFile, testContent);

  try {
    const stats = await safeStat(testFile);
    assert.ok(stats.isFile(), 'should be a file');
    assert.strictEqual(stats.size, Buffer.byteLength(testContent));
  } finally {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  }
});

test('safeStat throws for non-existent file', async () => {
  const nonExistentFile = path.join(os.tmpdir(), `nonexistent-${Date.now()}.txt`);

  await assert.rejects(() => safeStat(nonExistentFile), { name: 'IntegrationError' });
});
