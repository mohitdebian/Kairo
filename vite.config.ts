import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import million from 'million/compiler'

export default defineConfig({
  plugins: [
    million.vite({ auto: true }),
    react(),
    tailwindcss()
  ],
  root: 'src/renderer',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  }
})
