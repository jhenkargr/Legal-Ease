import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'], // ✅ don’t pre-bundle pdfjs-dist
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'] // ✅ put pdfjs in a separate chunk
        }
      }
    }
  }
})
