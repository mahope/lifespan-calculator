// Generates public/sitemap.xml from the single ROUTES list below.
// Run automatically via `prebuild`. Tests keep ROUTES in sync with the pages in
// src/pages/*.astro and with ROUTE_META in src/routes.meta.js.
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
  '/embed-levetidsberegner',
  '/embed',
]

// Served by the app (and prerendered) but kept out of the sitemap: the iframe widget is noindex.
export const NOINDEX_ROUTES = ['/embed']
export const SITEMAP_ROUTES = ROUTES.filter((r) => !NOINDEX_ROUTES.includes(r))

export function buildSitemap(routes) {
  const urls = routes.map((r) => `  <url>\n    <loc>${SITE_URL}${r}</loc>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = new URL('../public/sitemap.xml', import.meta.url)
  writeFileSync(out, buildSitemap(SITEMAP_ROUTES))
  process.stdout.write(`sitemap: wrote ${SITEMAP_ROUTES.length} routes to public/sitemap.xml` + '\n')
}
