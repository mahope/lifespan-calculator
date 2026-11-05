// Site-wide constants and the list of indexable URLs (shared by astro.config.mjs,
// the sitemap and the page templates).
import { allAgePages, evaluateAgePages } from './agePages.js'

export const SITE = 'https://levetidsberegner.dk'
export const OG_IMAGE = `${SITE}/og-image.png`

/** Hand-written routes that are always indexable. */
export const STATIC_ROUTES = [
  '/',
  '/hvor-lang-tid-har-jeg-tilbage',
  '/pensionsalder',
  '/levetid-beregner-danmark',
  '/levealder-kommuner',
]

/** Static routes plus the generated age pages that pass the guard. */
export function indexablePaths() {
  const passing = evaluateAgePages(allAgePages()).filter((r) => r.pass).map((r) => r.id)
  return [...STATIC_ROUTES, ...passing]
}
