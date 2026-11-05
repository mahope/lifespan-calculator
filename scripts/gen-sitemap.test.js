import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ROUTES, NOINDEX_ROUTES, SITE_URL, buildSitemap } from './gen-sitemap.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('route list', () => {
  it('matches the routes declared in App.jsx', () => {
    const app = read('../src/App.jsx')
    const declared = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1])
    expect([...ROUTES, ...NOINDEX_ROUTES].sort()).toEqual(declared.sort())
  })

  it('is mirrored by the rewrites in public/serve.json', () => {
    const cfg = JSON.parse(read('../public/serve.json'))
    const rewritten = cfg.rewrites.map((r) => r.source)
    const served = [...ROUTES, ...NOINDEX_ROUTES]
    for (const route of served) {
      if (route !== '/') expect(rewritten).toContain(route)
    }
    for (const r of cfg.rewrites) {
      expect(r.destination).toBe(r.source === '/embed' ? '/embed.html' : '/index.html')
    }
    expect(rewritten.filter((s) => s !== '/' && !served.includes(s))).toEqual([])
  })

  it('keeps /embed out of the sitemap', () => {
    expect(ROUTES).not.toContain('/embed')
  })

  it('allows framing only for embed.html; every other file keeps SAMEORIGIN', () => {
    // The real behaviour (serve matching these globs) is checked end-to-end with serve itself.
    const cfg = JSON.parse(read('../public/serve.json'))
    const withKey = (key) => cfg.headers.filter((h) => h.headers.some((x) => x.key === key))
    const xfo = withKey('X-Frame-Options')
    expect(xfo.map((h) => h.source)).toEqual(['/**/!(embed.html)'])
    expect(xfo[0].headers.find((x) => x.key === 'X-Frame-Options').value).toBe('SAMEORIGIN')
    const embed = cfg.headers.find((h) => h.source === '/embed.html')
    const get = (k) => embed.headers.find((x) => x.key === k)?.value
    expect(get('Content-Security-Policy')).toBe('frame-ancestors *')
    expect(get('X-Robots-Tag')).toBe('noindex')
    expect(get('X-Frame-Options')).toBeUndefined()
  })
})

describe('serving layer files', () => {
  it('ships health, 404 and serve.json in public/', () => {
    for (const f of ['../public/api/health', '../public/404.html', '../public/serve.json']) {
      expect(read(f).length).toBeGreaterThan(0)
    }
  })
  it('serves in non-SPA mode (no -s flag) so unknown paths return 404', () => {
    const cmd = read('../Dockerfile').match(/^CMD (.*)$/m)[1]
    expect(cmd).toContain('"serve"')
    expect(cmd).not.toMatch(/"-s"|"--single"/)
  })
})

describe('buildSitemap', () => {
  it('lists every route exactly once with absolute URLs', () => {
    const xml = buildSitemap(ROUTES)
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(ROUTES.map((r) => SITE_URL + r))
  })
  it('is checked in and up to date', () => {
    expect(read('../public/sitemap.xml')).toBe(buildSitemap(ROUTES))
  })
})
