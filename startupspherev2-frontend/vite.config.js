import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Use HTTPS only when VITE_USE_HTTPS is set to 'true' and cert files exist.
    https: process.env.VITE_USE_HTTPS === 'true' && fs.existsSync(path.resolve(__dirname, 'cert.key')) ? {
      key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
      ca: fs.readFileSync(path.resolve(__dirname, 'ca.crt')),
    } : false,
    port: 5173,
    proxy: {
      // Proxy backend API calls during local development to avoid CORS and cookie issues
      '/auth': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/startups': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/stakeholders': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/startup-stakeholders': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/api': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/users': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/notifications': { target: 'http://localhost:54759', changeOrigin: true, secure: false },
      '/recents': { target: 'http://localhost:54759', changeOrigin: true, secure: false }
    }
  },
})
