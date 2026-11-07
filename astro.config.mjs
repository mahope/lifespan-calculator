import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/postcss'
import { ROUTES } from './scripts/gen-sitemap.mjs'
import { ROUTE_META, SITE_URL } from './src/routes.meta.js'
import { validateMeta } from './src/lib/head.js'

// Duplicate or too long titles/descriptions stop the build before anything is written.
const problems = validateMeta(ROUTES, ROUTE_META)
if (problems.length) throw new Error(`route meta invalid:\n  ${problems.join('\n  ')}`)

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE_URL,
  // dist/<route>/index.html, the same files the SPA build wrote, served at /<route> by Caddy.
  build: { format: 'directory', assets: '_astro' },
  trailingSlash: 'ignore',
  // Islands (the calculator, the pension form and the embed widget) are React; everything else ships as HTML.
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    // Tailwind 4 through PostCSS, as before (Astro does not pick up postcss.config.js on its own here).
    css: { postcss: { plugins: [tailwindcss()] } },
    build: { sourcemap: 'hidden' },
  },
})
