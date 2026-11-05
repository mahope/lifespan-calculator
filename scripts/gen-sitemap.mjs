// Generates public/sitemap.xml from the single ROUTES list below.
// Run automatically via `prebuild`. A test keeps ROUTES in sync with
// src/App.jsx and with the rewrites in public/serve.json.
import { writeFileSync } from 'node:fs'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'

export const SITE_URL = 'https://levetidsberegner.dk'

export const ROUTES = [
  '/',
  '/hvor-lang-tid-har-jeg-tilbage',
  '/dodsalder-calculator',
  '/levetid-beregner-danmark',
  '/livsstil-og-levetid',
  '/pensionsalder',
]

export function buildSitemap(routes) {
  const urls = routes.map((r) => `  <url>\n    <loc>${SITE_URL}${r}</loc>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = new URL('../public/sitemap.xml', import.meta.url)
  writeFileSync(out, buildSitemap(ROUTES))
  process.stdout.write(`sitemap: wrote ${ROUTES.length} routes to public/sitemap.xml` + '\n')
}
