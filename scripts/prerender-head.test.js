import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROUTES } from './gen-sitemap.mjs'
import { ROUTE_META } from '../src/routes.meta.js'
import { MAX_TITLE, MAX_DESCRIPTION, validateMeta, renderRoute, prerender } from './prerender-head.mjs'

const TEMPLATE = `<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <title>Old title</title>
    <meta name="description" content="old" />
    <meta property="og:title" content="old" />
    <meta name="twitter:card" content="summary" />
    <link rel="canonical" href="https://example.com/" />
    <script type="application/ld+json">{"old":true}</script>
  </head>
  <body><div id="root"></div></body>
</html>`

const count = (html, re) => (html.match(re) || []).length

describe('ROUTE_META', () => {
  it('has exactly one entry per route in ROUTES', () => {
    expect(Object.keys(ROUTE_META).sort()).toEqual([...ROUTES].sort())
  })
  it('passes validation: unique titles/descriptions within the length limits', () => {
    expect(validateMeta(ROUTES, ROUTE_META)).toEqual([])
    expect(new Set(ROUTES.map((r) => ROUTE_META[r].title)).size).toBe(ROUTES.length)
    expect(new Set(ROUTES.map((r) => ROUTE_META[r].description)).size).toBe(ROUTES.length)
  })
})

describe('validateMeta', () => {
  const ok = { title: 'A', description: 'a' }
  it('flags duplicate titles and descriptions', () => {
    const problems = validateMeta(['/a', '/b'], { '/a': ok, '/b': { ...ok } })
    expect(problems.some((p) => /title duplicates/.test(p))).toBe(true)
    expect(problems.some((p) => /description duplicates/.test(p))).toBe(true)
  })
  it('flags over-long titles and descriptions', () => {
    const problems = validateMeta(['/a'], {
      '/a': { title: 'x'.repeat(MAX_TITLE + 1), description: 'y'.repeat(MAX_DESCRIPTION + 1) },
    })
    expect(problems).toHaveLength(2)
  })
  it('flags a route without metadata', () => {
    expect(validateMeta(['/a'], {})).toHaveLength(1)
  })
})

describe('renderRoute', () => {
  const route = '/hvor-lang-tid-har-jeg-tilbage'
  const html = renderRoute(TEMPLATE, ROUTE_META[route], route)

  it('replaces the old head tags instead of appending', () => {
    expect(html).not.toContain('Old title')
    expect(html).not.toContain('example.com')
    expect(html).not.toContain('"old"')
    expect(count(html, /<title/g)).toBe(1)
    expect(count(html, /name="description"/g)).toBe(1)
    expect(count(html, /property="og:title"/g)).toBe(1)
    expect(count(html, /name="twitter:card"/g)).toBe(1)
    expect(count(html, /rel="canonical"/g)).toBe(1)
    expect(html).toContain('<meta charset="UTF-8" />')
  })
  it('writes the route values, a large twitter card and an absolute og:image', () => {
    expect(html).toContain(`<title data-prerender="true">${ROUTE_META[route].title}</title>`)
    expect(html).toContain('href="https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('property="og:image" content="https://levetidsberegner.dk/og-image.png"')
  })
  it('injects parseable WebApplication and BreadcrumbList JSON-LD', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
      JSON.parse(m[1]),
    )
    expect(blocks.map((b) => b['@type'])).toEqual(['WebApplication', 'BreadcrumbList'])
    expect(blocks[1].itemListElement.map((i) => i.item)).toEqual([
      'https://levetidsberegner.dk/',
      'https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage',
    ])
  })
  it('gives the home page a WebApplication but no breadcrumb, and noindex only when flagged', () => {
    const home = renderRoute(TEMPLATE, ROUTE_META['/'], '/')
    expect(count(home, /application\/ld\+json/g)).toBe(1)
    expect(home).toContain('content="index, follow"')
    const hidden = renderRoute(TEMPLATE, { ...ROUTE_META['/'], noindex: true }, '/')
    expect(hidden).toContain('content="noindex, follow"')
  })
  it('can be re-run on its own output (one of each tag, stable result)', () => {
    const again = renderRoute(html, ROUTE_META[route], route)
    expect(count(again, /<title/g)).toBe(1)
    expect(count(again, /rel="canonical"/g)).toBe(1)
    expect(count(again, /application\/ld\+json/g)).toBe(2)
    expect(renderRoute(again, ROUTE_META[route], route)).toBe(again)
  })
  it('escapes attribute values', () => {
    const out = renderRoute(TEMPLATE, { ...ROUTE_META['/'], description: 'a "b" <c> & d' }, '/')
    expect(out).toContain('content="a &quot;b&quot; &lt;c&gt; &amp; d"')
  })
})

describe('prerender', () => {
  it('writes dist/index.html and one directory per route', () => {
    const dir = mkdtempSync(join(tmpdir(), 'prerender-'))
    writeFileSync(join(dir, 'index.html'), TEMPLATE)
    mkdirSync(join(dir, 'assets'))
    expect(prerender(pathToFileURL(dir + '/'))).toBe(ROUTES.length)
    const titles = new Set()
    for (const r of ROUTES) {
      const file = r === '/' ? join(dir, 'index.html') : join(dir, r, 'index.html')
      expect(existsSync(file)).toBe(true)
      titles.add(readFileSync(file, 'utf8').match(/<title[^>]*>([^<]*)<\/title>/)[1])
    }
    expect(titles.size).toBe(ROUTES.length)
  })
  it('throws on invalid metadata so the build fails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'prerender-'))
    writeFileSync(join(dir, 'index.html'), TEMPLATE)
    const dup = { '/': ROUTE_META['/'], '/a': ROUTE_META['/'] }
    expect(() => prerender(pathToFileURL(dir + '/'), ['/', '/a'], dup)).toThrow(/duplicates/)
  })
})
