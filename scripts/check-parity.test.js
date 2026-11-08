import { describe, it, expect } from 'vitest'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES } from './gen-sitemap.mjs'
import { compare, headSummary, sitemapLocs } from './check-parity.mjs'

const reference = JSON.parse(readFileSync(new URL('./fixtures/spa-parity.json', import.meta.url), 'utf8'))
// The production SPA (e2e/fixtures/legacy-prod) is an independent second copy of the old site.
const LEGACY = fileURLToPath(new URL('../e2e/fixtures/legacy-prod/', import.meta.url))

describe('the SPA reference', () => {
  it('covers every route and the sitemap', () => {
    expect(Object.keys(reference.routes).sort()).toEqual([...ROUTES].sort())
    expect(reference.sitemap).toHaveLength(ROUTES.length - 1)
  })
  it('matches what production serves today (e2e/fixtures/legacy-prod)', () => {
    // The SPA had no FAQPage in its HTML, so nothing counts as added here.
    expect(compare(reference, LEGACY, { added: {} })).toEqual([])
  })
})

describe('compare', () => {
  const copy = () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-'))
    cpSync(LEGACY, dir, { recursive: true })
    return dir
  }
  const edit = (dir, file, from, to) => {
    const p = join(dir, file)
    const s = readFileSync(p, 'utf8')
    expect(s).toContain(from)
    writeFileSync(p, s.replace(from, to))
  }

  it('reports a changed title, description, canonical or JSON-LD', () => {
    const dir = copy()
    edit(dir, 'dodsalder-calculator/index.html', 'Forventet dødsalder: beregn', 'Forventet dødsalder - beregn')
    edit(dir, 'pensionsalder/index.html', 'href="https://levetidsberegner.dk/pensionsalder"', 'href="https://levetidsberegner.dk/pensionsalder/"')
    edit(dir, 'livsstil-og-levetid/index.html', '"BreadcrumbList"', '"Breadcrumbs"')
    const problems = compare(reference, dir, { added: {} })
    expect(problems.some((p) => p.startsWith('/dodsalder-calculator: title'))).toBe(true)
    expect(problems.some((p) => p.startsWith('/pensionsalder: canonical'))).toBe(true)
    expect(problems.some((p) => p.startsWith('/livsstil-og-levetid: JSON-LD'))).toBe(true)
  })
  it('reports a missing page and a changed sitemap', () => {
    const dir = copy()
    edit(dir, 'sitemap.xml', '<loc>https://levetidsberegner.dk/pensionsalder</loc>', '<loc>https://levetidsberegner.dk/pension</loc>')
    cpSync(join(dir, 'index.html'), join(dir, 'embed', 'index.html'))
    const problems = compare(reference, dir, { added: {} })
    expect(problems.some((p) => p.startsWith('sitemap differs'))).toBe(true)
    expect(problems.some((p) => p.startsWith('/embed:'))).toBe(true)
  })
})

describe('headSummary', () => {
  it('ignores attribute order and markers, and decodes entities', () => {
    const a = headSummary('<head><title data-prerender="true">A &amp; B</title><meta name="description" content="x &quot;y&quot;" /></head>')
    const b = headSummary('<head><title>A &amp; B</title><meta content="x &quot;y&quot;" name="description"></head>')
    expect(a).toEqual(b)
    expect(a.title).toEqual(['A & B'])
    expect(a.meta.description).toBe('x "y"')
  })
  it('reads sitemap locations', () => {
    expect(sitemapLocs('<url><loc>https://a/</loc></url><url><loc>https://a/b</loc></url>')).toEqual(['https://a/', 'https://a/b'])
  })
})
