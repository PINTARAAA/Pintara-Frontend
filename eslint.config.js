import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  /*
   * Batas lapisan (dependensi hanya boleh mengalir ke bawah):
   *   app → features → components → hooks → lib
   * lib   : TypeScript murni, tanpa React/JSX, tidak meng-import lapisan atas.
   * hooks : hook React generik, tidak meng-import komponen atau fitur.
   */
  {
    files: ['src/lib/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/*', '@/features/*', '@/hooks/*', '@/app/*', 'react', 'react-dom'],
              message: 'src/lib berisi TypeScript murni: jangan import React, komponen, hook, atau fitur.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/hooks/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/*', '@/features/*', '@/app/*'],
              message: 'src/hooks berisi hook generik: jangan import komponen atau fitur.',
            },
          ],
        },
      ],
    },
  },
])
