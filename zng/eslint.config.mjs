import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/.eslintrc.js',
      'documentation/**/*',
      'dist/**/*',
      'node_modules/**/*',
      '.notes/**/*',
      'logs/**/*',
      'scripts/**/*',
    ],
  },
  ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslintEslintPlugin,
      promise,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      'lines-between-class-members': [
        'warn',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],

      'max-params': ['warn', 8],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',

      'prettier/prettier': [
        'warn',
        {
          printWidth: 120,
          singleQuote: true,
          trailingComma: 'es5',
          tabWidth: 2,
          semi: true,
          usePrettierrc: false,
          endOfLine: 'auto',
          trailingComma: 'es5',
          objectWrap: 'preserve',
          parser: 'typescript',
          singleAttributePerLine: false,
        },
      ],

      'max-len': [
        'warn',
        {
          code: 120,
          tabWidth: 2,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
];
