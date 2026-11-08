import { describe, it, expect } from 'vitest'
import { ROUTES } from '../../scripts/gen-sitemap.mjs'
import { ROUTE_META, NOT_FOUND_META } from '../routes.meta.js'
import { faqJsonLd } from '../utils/pensionFaq'
import { MAX_TITLE, MAX_DESCRIPTION, validateMeta, headTags, notFoundTags, ldJson } from './head.js'

const count = (html, re) => (html.match(re) || []).length
const blocks = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))

describe('ROUTE_META', () => {
  it('has exactly one entry per route in ROUTES', () => {
    expect(Object.keys(ROUTE_META).sort()).toEqual([...ROUTES].sort())
  })
  it('passes validation: unique titles/descriptions within the length limits', () => {
    expect(validateMeta(ROUTES, ROUTE_META)).toEqual([])
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

describe('headTags', () => {
  const route = '/hvor-lang-tid-har-jeg-tilbage'
  const html = headTags(ROUTE_META[route], route)

  it('writes one of each tag with the route values, a large twitter card and an absolute og:image', () => {
    for (const re of [/<title/g, /name="description"/g, /name="robots"/g, /property="og:title"/g, /name="twitter:card"/g, /rel="canonical"/g]) {
      expect(count(html, re)).toBe(1)
    }
    expect(html).toContain(`<title>${ROUTE_META[route].title}</title>`)
    expect(html).toContain('<link rel="canonical" href="https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage" />')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('property="og:image" content="https://levetidsberegner.dk/og-image.png"')
    expect(html).not.toContain('data-prerender')
  })
  it('writes parseable WebApplication and BreadcrumbList JSON-LD', () => {
    const b = blocks(html)
    expect(b.map((x) => x['@type'])).toEqual(['WebApplication', 'BreadcrumbList'])
    expect(b[1].itemListElement.map((i) => i.item)).toEqual([
      'https://levetidsberegner.dk/',
      'https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage',
    ])
  })
  it('gives the home page a WebApplication but no breadcrumb, and noindex only when flagged', () => {
    const home = headTags(ROUTE_META['/'], '/')
    expect(count(home, /application\/ld\+json/g)).toBe(1)
    expect(home).toContain('content="index, follow"')
    expect(headTags(ROUTE_META['/embed'], '/embed')).toContain('content="noindex, follow"')
  })
  it('appends page-specific JSON-LD (the pension FAQ)', () => {
    const b = blocks(headTags(ROUTE_META['/pensionsalder'], '/pensionsalder', [faqJsonLd]))
    expect(b.map((x) => x['@type'])).toEqual(['WebApplication', 'BreadcrumbList', 'FAQPage'])
  })
  it('escapes attribute values and keeps </script> out of JSON-LD', () => {
    const out = headTags({ ...ROUTE_META['/'], description: 'a "b" <c> & d' }, '/')
    expect(out).toContain('content="a &quot;b&quot; &lt;c&gt; &amp; d"')
    expect(ldJson({ x: '</script>' })).toBe('{"x":"\\u003c/script>"}')
  })
})

describe('notFoundTags', () => {
  it('is noindex with no canonical or social tags', () => {
    const html = notFoundTags(NOT_FOUND_META)
    expect(html).toContain('content="noindex, follow"')
    expect(html).toContain(`<title>${NOT_FOUND_META.title}</title>`)
    expect(html).not.toMatch(/canonical|og:|twitter:/)
  })
})
