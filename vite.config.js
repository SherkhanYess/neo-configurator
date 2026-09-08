import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Honour an externally assigned port (dev tooling, CI) instead of always
    // grabbing 5173 and drifting to 5174 when that is taken.
    port: Number(process.env.PORT) || 5173,
  },
})
