module.exports = {
  env: {
    node: true,
  },
  extends: ['eslint:recommended'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-empty': 'off',
    'no-unused-vars': 'off',
    'no-useless-catch': 'off',
  },
};
