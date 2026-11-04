import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Два входа: index.html — конструктор на корне, catalog-shell.html — витрина
  // /catalog со своим лёгким входом (без кода конструктора и без 3D в шапке).
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        catalog: 'catalog-shell.html',
      },
    },
  },
  server: {
    // Honour an externally assigned port (dev tooling, CI) instead of always
    // grabbing 5173 and drifting to 5174 when that is taken.
    port: Number(process.env.PORT) || 5173,
  },
})
