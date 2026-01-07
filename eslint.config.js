const globals = require('globals');

module.exports = [
  {
    files: ['scripts/**/*.js'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'off',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
];
