import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { ROUTES, NOINDEX_ROUTES, SITEMAP_ROUTES, SITE_URL, buildSitemap } from './gen-sitemap.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

// Every .astro file in src/pages is a route (404.astro is the error page, not a route).
const astroRoutes = () =>
  readdirSync(new URL('../src/pages/', import.meta.url), { recursive: true })
    .filter((f) => f.endsWith('.astro') && f !== '404.astro')
    .map((f) => (f === 'index.astro' ? '/' : `/${f.replace(/\.astro$/, '').replace(/\/index$/, '')}`))

describe('route list', () => {
  it('matches the pages in src/pages', () => {
    expect([...ROUTES].sort()).toEqual(astroRoutes().sort())
  })

  it('has no React page component left in src/pages (Astro would route it)', () => {
    const files = readdirSync(new URL('../src/pages/', import.meta.url), { recursive: true })
    expect(files.filter((f) => !f.endsWith('.astro'))).toEqual([])
  })

  it('keeps the iframe widget out of the sitemap but indexes its info page', () => {
    expect(NOINDEX_ROUTES).toEqual(['/embed'])
    expect(ROUTES).toContain('/embed')
    expect(ROUTES).toContain('/embed-levetidsberegner')
    expect(read('../public/sitemap.xml')).not.toMatch(/<loc>[^<]*\/embed<\/loc>/)
  })
})

describe('buildSitemap', () => {
  it('lists every route exactly once with absolute URLs', () => {
    const xml = buildSitemap(SITEMAP_ROUTES)
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(SITEMAP_ROUTES.map((r) => SITE_URL + r))
  })
  it('is checked in and up to date', () => {
    expect(read('../public/sitemap.xml')).toBe(buildSitemap(SITEMAP_ROUTES))
  })
})
