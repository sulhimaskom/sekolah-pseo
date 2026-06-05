const globals = require('globals');

module.exports = [
  {
    files: ['scripts/**/*.js', 'src/**/*.js'],
    ignores: ['dist/**', 'node_modules/**', '**/*.test.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Error prevention
      'no-unused-vars': 'error',
      'no-console': 'off',
      'no-undef': 'error',

      // Style
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-var': 'error',
      'prefer-const': 'error',

      // Security (important for quality assurance)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-throw-literal': 'error',
      'no-proto': 'error',
      'no-param-reassign': 'error',
    },
  },
  // Test files: apply same rules but include Node test runner globals
  {
    files: ['scripts/**/*.test.js', 'src/**/*.test.js'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        // Node.js built-in test runner globals
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        mock: 'readonly',
        test: 'readonly',
        suite: 'readonly',
      },
    },
    rules: {
      // Error prevention
      'no-unused-vars': 'error',
      'no-console': 'off',
      'no-undef': 'error',

      // Style
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-var': 'error',
      'prefer-const': 'error',

      // Security (important for quality assurance)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-throw-literal': 'error',
      'no-proto': 'error',
      'no-param-reassign': 'error',
    },
  },
];
