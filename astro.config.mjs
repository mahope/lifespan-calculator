import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { AstroPWAIntegration } from '@vite-pwa/astro'
import { SITE, indexablePaths } from './src/lib/site.js'

const indexable = new Set(indexablePaths())

// https://astro.build/config
export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    react(),
    // Only pages that pass the guard (and are not noindex) go in the sitemap.
    sitemap({ filter: (page) => indexable.has(new URL(page).pathname) }),
    AstroPWAIntegration({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Levetidsberegner',
        short_name: 'Levetid',
        description: 'Beregn din resterende levetid med live nedtælling, dit liv i uger og fun facts.',
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
        // Precache only what the calculator needs offline: its JS/CSS, the home page and the icon.
        globPatterns: ['_astro/*.{js,css}', 'index.html', 'favicon.svg'],
        // No SPA fallback: every URL is a real file, unknown URLs must stay real 404s.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // HTML: network first, so a deploy is picked up immediately; cache only when offline.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'html', networkTimeoutSeconds: 3, expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
})
