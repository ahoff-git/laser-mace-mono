export default [
  {
    files: ['**/*.js', '**/*.jsx'],
    ignores: ['node_modules'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {},
  },
];
