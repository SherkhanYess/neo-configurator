import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Серверные функции Netlify и скрипты сборки работают в Node.
    files: ['netlify/**/*.{js,mjs}', 'scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Входы приложения ничего не экспортируют — правило быстрой перезагрузки
    // к ним не относится.
    files: ['src/catalog-main.jsx', 'src/main.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // В текстах гидов перед тире стоит неразрывный пробел — чтобы тире не
    // начинало строку. Это типографика, а не опечатка.
    files: ['src/catalog/guides/**/*.jsx'],
    rules: { 'no-irregular-whitespace': ['error', { skipStrings: true, skipJSXText: true, skipComments: true, skipTemplates: true }] },
  },
])
