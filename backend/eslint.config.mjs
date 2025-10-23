import globals from 'globals';
import stylisticTs from '@stylistic/eslint-plugin-ts'
import tseslint from 'typescript-eslint';


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ['**/*.{js,mjs,cjs,ts}']},
  {ignores: ['src/sequelize/*.ts']},
  {languageOptions: { globals: globals.node }},
  {plugins: {
    '@stylistic/ts': stylisticTs
  }},
  {rules: {
    '@stylistic/ts/quotes': ['error', 'single'],
  }},
  ...tseslint.configs.recommended,
];