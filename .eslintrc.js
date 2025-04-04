
module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier',
      'plugin:prettier/recommended'
    ],
    plugins: ['@typescript-eslint'],
    env: {
      node: true,
      es6: true,
      mocha: true
    },
    rules: {
      // 自定义规则
    }
  };