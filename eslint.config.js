import js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore patterns
  {
    ignores: [
      'build/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'cli/dist/**',
      'cli/templates/**',
      '*.config.js',
      '*.config.ts',
      'scripts/**/*.cjs',
    ],
  },

  // Base config for all JS/TS files
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        RequestInit: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-var': 'error',
      'eqeqeq': ['error', 'smart'],
      'no-undef': 'off', // TS handles undef
      'no-redeclare': 'warn',
    },
  },

  // k6 test files
  {
    files: ['tests/load/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
      },
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'vitest.setup.ts', 'server/lib/test-utils.ts', 'tests/setup/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.vitest,
        vi: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  // CLI files
  {
    files: ['cli/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];

