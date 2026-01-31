import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimizations
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split react-router into its own chunk
          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'router'
          }
        }
      }
    }
  }
})
