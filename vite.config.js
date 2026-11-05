import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// serve matches header rules against the file it ends up sending, so /embed needs a file
// of its own (rewritten to /embed.html in public/serve.json) to get frame-friendly headers.
const embedHtml = () => ({
  name: 'embed-html',
  enforce: 'post',
  generateBundle(_, bundle) {
    const index = bundle['index.html']
    if (!index) return
    this.emitFile({ type: 'asset', fileName: 'embed.html', source: index.source })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    embedHtml(),
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
        globIgnores: ['**/404.html'],
        // Don't SPA-fallback the standalone static legal/policy .html pages.
        navigateFallbackDenylist: [/\.html$/, /^\/api\//, /\.(txt|xml)$/],
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
