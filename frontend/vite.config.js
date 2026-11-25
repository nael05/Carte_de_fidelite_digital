import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En développement, /api est relayé vers le backend local (même comportement qu'en production derrière Nginx).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': { target: process.env.VITE_BACKEND_URL || 'http://localhost:5000', changeOrigin: true }
    }
  },
  build: {
    sourcemap: false
  }
})
