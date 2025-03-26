import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: js.configs.recommended, allConfig: js.configs.all });

export default [
  { ignores: ['**/.eslintrc.js', 'documentation/**/*', 'dist/**/*', 'node_modules/**/*', '.notes/**/*', 'logs/**/*', 'scripts/**/*'] },
  ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:promise/recommended'),
  {
    plugins: { 
      '@typescript-eslint': typescriptEslintEslintPlugin, 
      promise,
      '@stylistic': stylistic,
    },

    languageOptions: {
      globals: { ...globals.node, ...globals.jest },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: { project: 'tsconfig.json', tsconfigRootDir: __dirname },
    },

    rules: {
      'lines-between-class-members': ['warn', 'always', { exceptAfterSingleLine: true }],

      'max-params': ['warn', 8],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',

      // Rules to detect unused code
      '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
      'no-unused-expressions': 'warn',
      'no-unused-labels': 'warn',

      // Stylistic rules (replacing Prettier)
      '@stylistic/indent': ['warn', 2],
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/comma-dangle': ['warn', 'always-multiline'],
      '@stylistic/max-len': ['warn', { code: 150, tabWidth: 2, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      '@stylistic/brace-style': ['warn', '1tbs'],
      '@stylistic/comma-spacing': ['warn', { before: false, after: true }],
      '@stylistic/eol-last': ['warn', 'always'],
      '@stylistic/key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      '@stylistic/keyword-spacing': ['warn', { before: true, after: true }],
      '@stylistic/object-curly-spacing': ['warn', 'always'],
      '@stylistic/space-before-blocks': ['warn', 'always'],
      '@stylistic/space-before-function-paren': ['warn', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      '@stylistic/space-in-parens': ['warn', 'never'],
      '@stylistic/space-infix-ops': 'warn',
      '@stylistic/max-statements-per-line': ['warn', { max: 2 }],
      '@stylistic/no-extra-parens': ['warn', 'functions'],
    },
  },
];
