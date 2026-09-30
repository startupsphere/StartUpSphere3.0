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
    proxy: {
      '/groq-proxy': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/groq-proxy/, ''),
      },
      '/xai-proxy': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/xai-proxy/, ''),
      },
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
      ca: fs.readFileSync(path.resolve(__dirname, 'ca.crt')),
    },
    port: 5173,
  },
})
