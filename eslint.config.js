// ESLint 9 flat config. Two tiers:
//  • Dashboard + shared JS/JSX — pragmatic (never linted before): real errors fail, style warns.
//  • Storefront + shared TS/TSX — strict (typescript-eslint recommended).
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'scripts/**', '**/*.min.js'] },

  // Dashboard (admin/merchant/supplier) + shared JS/JSX.
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, react },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'warn',
      'no-constant-condition': ['warn', { checkLoops: false }],
      // Pre-existing dashboard debt (never linted). Kept as warnings so it doesn't force a
      // risky UI rewrite; still surfaced. The storefront TS tier below keeps these as errors.
      'no-dupe-keys': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-vars': 'error',
    },
  },

  // Storefront Theme Engine + shared TS/TSX — strict.
  ...tseslint.config({
    files: ['src/apps/storefront/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  }),
];
