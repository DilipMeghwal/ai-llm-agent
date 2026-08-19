import babelParser from '@babel/eslint-parser';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'allure-results/', 'allure-report/'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
        },
      },
    },
    plugins: {
      playwright: playwright,
      prettier: prettier,
    },
    rules: {
      ...playwright.configs['recommended'].rules,
      'prettier/prettier': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/valid-expect': 'error',
    },
  },
];
