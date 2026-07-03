import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.png'],
      manifest: {
        name: 'Levetidsberegner',
        short_name: 'Levetid',
        description:
          'Beregn din resterende levetid — med live nedtælling, dit liv i uger og fun facts.',
        lang: 'da',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don't SPA-fallback the standalone static legal/policy .html pages.
        navigateFallbackDenylist: [/\.html$/],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimizations (Vite 8 uses Rolldown + Oxc by default)
    minify: 'oxc',
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
