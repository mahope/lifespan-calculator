import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ROUTES, NOINDEX_ROUTES, SITEMAP_ROUTES, SITE_URL, buildSitemap } from './gen-sitemap.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('route list', () => {
  it('matches the routes declared in App.jsx', () => {
    const app = read('../src/App.jsx')
    const declared = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1])
    expect([...ROUTES].sort()).toEqual(declared.sort())
  })

  it('is served from generated dist/<route>/index.html, so serve.json has no rewrites', () => {
    // serve applies rewrites before it looks at the filesystem; a rewrite would hide the
    // per-route HTML written by scripts/prerender-head.mjs.
    const cfg = JSON.parse(read('../public/serve.json'))
    expect(cfg.rewrites).toBeUndefined()
  })

  it('keeps the iframe widget out of the sitemap but indexes its info page', () => {
    expect(NOINDEX_ROUTES).toEqual(['/embed'])
    expect(ROUTES).toContain('/embed')
    expect(ROUTES).toContain('/embed-levetidsberegner')
    expect(read('../public/sitemap.xml')).not.toMatch(/<loc>[^<]*\/embed<\/loc>/)
  })

  it('allows framing only for dist/embed/index.html; every other file keeps SAMEORIGIN', () => {
    // The real behaviour (serve matching these globs) is checked end-to-end in e2e/embed.e2e.js.
    const cfg = JSON.parse(read('../public/serve.json'))
    const withKey = (key) => cfg.headers.filter((h) => h.headers.some((x) => x.key === key))
    const xfo = withKey('X-Frame-Options')
    expect(xfo).toHaveLength(1)
    expect(xfo[0].headers.find((x) => x.key === 'X-Frame-Options').value).toBe('SAMEORIGIN')
    const embed = cfg.headers.find((h) => h.source === '/embed/index.html')
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
    const xml = buildSitemap(SITEMAP_ROUTES)
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(SITEMAP_ROUTES.map((r) => SITE_URL + r))
  })
  it('is checked in and up to date', () => {
    expect(read('../public/sitemap.xml')).toBe(buildSitemap(SITEMAP_ROUTES))
  })
})
