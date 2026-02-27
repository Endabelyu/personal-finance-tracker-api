import js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore patterns
  {
    ignores: [
      'build/**',
      'dist/**',
      'node_modules/**',
      '.react-router/**',
      'coverage/**',
      'cli/dist/**',
      'cli/templates/**',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // Base config for all JS/TS files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        RequestInit: 'readonly',
        React: 'readonly',
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Unused vars - warn instead of error, allow underscore prefix
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'warn',
      // React Hooks - these are important
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Accessibility - warn only
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      // General
      'no-var': 'error',
      'eqeqeq': ['error', 'smart'],
      'no-undef': 'error',
      'no-redeclare': 'warn',
      'preserve-caught-error': 'off',
    },
  },

  // Test files and vitest setup
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'vitest.setup.ts'],
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
    rules: {
      'no-undef': 'off',
    },
  },

  // Server files that use vitest
  {
    files: ['server/lib/test-utils.ts'],
    languageOptions: {
      globals: {
        vi: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // Routes files - React Router specific
  {
    files: ['app/routes/**/*.tsx', 'app/routes/**/*.ts'],
    languageOptions: {
      globals: {
        json: 'readonly',
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off', // TS handles this
      'preserve-caught-error': 'off',
    },
  },
];
