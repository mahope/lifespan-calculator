import { describe, it, expect } from 'vitest'
import { checkHtmlPages, visibleText } from './check-guard.mjs'
import { buildAgePage } from '../src/lib/agePages.js'

const html = (p, { noindex = false } = {}) =>
  `<html><head>${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">'}</head><body><main><h1>${p.h1}</h1><p>${p.text}</p><svg><text>99</text></svg></main></body></html>`

describe('check-guard on finished HTML', () => {
  const a = buildAgePage('mand', 40)
  const b = buildAgePage('mand', 45)

  it('strips svg, scripts and tags', () => {
    expect(visibleText('<main><svg><text>77</text></svg><p>hej <b>1,5</b></p><script>x=1</script></main>')).toBe('hej 1,5')
  })

  it('accepts distinct pages that are indexable', () => {
    const { problems } = checkHtmlPages([
      { id: a.id, html: html(a) },
      { id: b.id, html: html(b) },
    ])
    expect(problems).toEqual([])
  })

  it('FAILS the build for a deliberately duplicated page that is still indexable or in the sitemap', () => {
    const dup = { id: b.id, html: html(a) } // 45-year-old page carrying the 40-year-old text
    const { results, problems } = checkHtmlPages([{ id: a.id, html: html(a) }, dup], `<loc>https://levetidsberegner.dk${b.id}</loc>`)
    expect(results.every((r) => !r.pass)).toBe(true)
    expect(problems.some((p) => /indexable/.test(p))).toBe(true)
    expect(problems.some((p) => /sitemap/.test(p))).toBe(true)
  })

  it('accepts a failing page when it is noindex and not in the sitemap', () => {
    const { problems } = checkHtmlPages([
      { id: a.id, html: html(a, { noindex: true }) },
      { id: b.id, html: html({ ...b, text: a.text }, { noindex: true }) },
    ])
    expect(problems.filter((p) => /indexable|sitemap/.test(p))).toEqual([])
  })
})
