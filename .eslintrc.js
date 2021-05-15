module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['standard', 'standard-with-typescript', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/promise-function-async': [
      'error',
      {
        allowedPromiseNames: ['Thenable'],
        checkArrowFunctions: true,
        checkFunctionDeclarations: true,
        checkFunctionExpressions: true,
        checkMethodDeclarations: true
      }
    ],
    'prettier/prettier': 'error'
  }
}
