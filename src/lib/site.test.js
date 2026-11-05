import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { STATIC_ROUTES, indexablePaths, breadcrumb } from './site.js'

const pageFile = (route) => new URL(`../pages${route === '/' ? '/index' : route}.astro`, import.meta.url)

describe('route list (replaces the SPA gen-sitemap tests)', () => {
  it('every static route has a page file', () => {
    for (const r of STATIC_ROUTES) expect(existsSync(pageFile(r)), r).toBe(true)
  })

  it('the sitemap list holds the static routes and the required generated pages, no duplicates', () => {
    const all = indexablePaths()
    for (const r of [...STATIC_ROUTES, '/levetid/mand/40', '/levetid/kvinde/65', '/levetid/mand/45', '/levetid/kvinde/60']) expect(all).toContain(r)
    expect(new Set(all).size).toBe(all.length)
    expect(all.every((p) => p.startsWith('/'))).toBe(true)
    expect(all).not.toContain('/404')
  })

  it('breadcrumb positions start at Forside and use absolute URLs', () => {
    const b = breadcrumb(['Pensionsalder', '/pensionsalder'])
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2])
    expect(b.itemListElement[1].item).toBe('https://levetidsberegner.dk/pensionsalder')
  })
})
