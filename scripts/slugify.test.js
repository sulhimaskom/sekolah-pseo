const test = require('node:test');
const assert = require('node:assert');
const slugify = require('../scripts/slugify');

test('slugify converts string to lowercase', () => {
  assert.strictEqual(slugify('Hello World'), 'hello-world');
});

test('slugify replaces spaces with hyphens', () => {
  assert.strictEqual(slugify('hello world'), 'hello-world');
});

test('slugify removes special characters', () => {
  assert.strictEqual(slugify('hello@world!'), 'hello-world');
});

test('slugify handles accented characters', () => {
  assert.strictEqual(slugify('café'), 'cafe');
});

test('slugify handles empty string', () => {
  assert.strictEqual(slugify(''), '');
});

test('slugify handles non-string input', () => {
  assert.strictEqual(slugify(null), '');
  assert.strictEqual(slugify(undefined), '');
  assert.strictEqual(slugify(123), '');
});

test('slugify returns untitled for special characters only', () => {
  assert.strictEqual(slugify('!@#$%'), 'untitled');
  assert.strictEqual(slugify('!!!'), 'untitled');
  assert.strictEqual(slugify('---'), 'untitled');
});

test('slugify handles numbers only', () => {
  assert.strictEqual(slugify('123'), '123');
  assert.strictEqual(slugify('456 789'), '456-789');
});

test('slugify handles whitespace-only input', () => {
  assert.strictEqual(slugify('   '), '');
  assert.strictEqual(slugify('\t\n'), '');
});

test('slugify caching - repeated calls return cached results', () => {
  const input = 'SMA Negeri 1 Jakarta';
  // First call computes
  const result1 = slugify(input);
  // Second call should return cached result
  const result2 = slugify(input);
  // Third call should also return cached result
  const result3 = slugify(input);
  
  assert.strictEqual(result1, 'sma-negeri-1-jakarta');
  assert.strictEqual(result2, 'sma-negeri-1-jakarta');
  assert.strictEqual(result3, 'sma-negeri-1-jakarta');
});

test('slugify caching - many unique values', () => {
  // Simulate processing many schools (unique inputs)
  const inputs = [];
  for (let i = 0; i < 100; i++) {
    inputs.push(`School ${i}`);
  }
  
  // All should produce consistent results
  const results = inputs.map(input => slugify(input));
  
  // Verify all results are consistent
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(slugify(inputs[i]), results[i]);
  }
});

test('slugify caching - repeated values across schools', () => {
  // Simulate schools in same province/kabupaten/kecamatan
  const provinces = ['Jawa Barat', 'Jawa Timur', 'Jawa Tengah'];
  const schools = ['SMA 1', 'SMA 2', 'SMA 3', 'SMA 4', 'SMA 5'];
  
  // Same province called multiple times
  provinces.forEach(province => {
    const slug1 = slugify(province);
    const slug2 = slugify(province);
    const slug3 = slugify(province);
    
    assert.strictEqual(slug1, slug2);
    assert.strictEqual(slug2, slug3);
  });
  
  // Same school names in different contexts
  schools.forEach(school => {
    const slug1 = slugify(school);
    const slug2 = slugify(school);
    assert.strictEqual(slug1, slug2);
  });
});
