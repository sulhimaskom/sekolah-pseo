module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs'
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
};
