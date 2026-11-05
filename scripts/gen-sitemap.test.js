import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ROUTES, SITE_URL, buildSitemap } from './gen-sitemap.mjs'

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
