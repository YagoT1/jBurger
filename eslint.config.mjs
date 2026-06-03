import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', 'storybook-static/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: { '@typescript-eslint/no-explicit-any': 'error' }
  }
];
