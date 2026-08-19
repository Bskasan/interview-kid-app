const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  // 1. Base configs
  ...(Array.isArray(expoConfig) ? expoConfig : [expoConfig]),
  ...(Array.isArray(prettierConfig) ? prettierConfig : [prettierConfig]),

  // 2. General rules for ALL files
  {
    rules: {
      'no-console': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // 3. TypeScript-only rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // 4. Jest Testing Globals (THIS fixes the 'jest' is not defined error)
  {
    files: ['jest.setup.js', '**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  // 5. Global ignores
  {
    ignores: ['dist/*', '.expo-export/*'],
  },
]);
