import { describe, it, expect } from 'vitest'
import {
  MIN_AGE,
  MAX_AGE,
  RESTLEVETID_HUB,
  LEVEALDER_HUB,
  restlevetidSlug,
  parseRestlevetidSlug,
  restlevetidRoute,
  restlevetidFacts,
  restlevetidMeta,
  kommuneSlug,
  kommuner,
  kommuneFacts,
  kommuneMeta,
  PSEO_ROUTES,
  pseoMeta,
  fmtYears,
  rankLabel,
} from './pseo.js'
import { MAX_TITLE, MAX_DESCRIPTION, validateMeta } from './head.js'
import { ROUTE_META, SITE_URL } from '../routes.meta.js'
import { SITEMAP_ROUTES, buildSitemap } from '../../scripts/gen-sitemap.mjs'
import { readFileSync } from 'node:fs'

// Known values from DST HISB8 (the period in LIFE_TABLE_META): TAVLE 3, e_x per exact age.
// If scripts/refresh-data.mjs brings a newer period, update these literals from the new table.
describe('restlevetid data loader (DST HISB8)', () => {
  it('returns the published e_x for known ages and both sexes', () => {
    expect(restlevetidFacts(45, 'mand').e).toBe(36.44)
    expect(restlevetidFacts(45, 'kvinde').e).toBe(39.79)
    expect(restlevetidFacts(20, 'mand').e).toBe(60.72)
    expect(restlevetidFacts(70, 'kvinde').e).toBe(17.3)
    expect(restlevetidFacts(90, 'mand').e).toBe(3.8)
    expect(restlevetidFacts(90, 'kvinde').e).toBe(4.6)
  })

  it('derives expected age, the other sex and the average from the same table', () => {
    const f = restlevetidFacts(45, 'mand')
    expect(f.expectedAge).toBeCloseTo(81.44, 5)
    expect(f.eOther).toBe(39.79)
    expect(f.eAverage).toBeCloseTo((36.44 + 39.79) / 2, 5)
    expect(f.diffOther).toBeCloseTo(3.35, 5)
  })

  it('derives survival odds from l_x (survivors)', () => {
    const f = restlevetidFacts(45, 'mand')
    const to80 = f.survival.find((s) => s.toAge === 80)
    expect(to80.probability).toBeCloseTo(60514 / 97821, 6)
    // Only ages above the current one are listed.
    expect(restlevetidFacts(85, 'mand').survival.every((s) => s.toAge > 85)).toBe(true)
  })

  it('rejects ages outside 20-90 and unknown sexes', () => {
    expect(MIN_AGE).toBe(20)
    expect(MAX_AGE).toBe(90)
    expect(() => restlevetidFacts(19, 'mand')).toThrow()
    expect(() => restlevetidFacts(91, 'mand')).toThrow()
    expect(() => restlevetidFacts(45, 'andet')).toThrow()
  })

  it('formats years with a Danish decimal comma', () => {
    expect(fmtYears(36.44)).toBe('36,4')
    expect(fmtYears(4.6)).toBe('4,6')
  })
})

describe('restlevetid slugs and routes', () => {
  it('matches the query wording', () => {
    expect(restlevetidSlug(45, 'mand')).toBe('45-aarig-mand')
    expect(restlevetidRoute(70, 'kvinde')).toBe('/restlevetid/70-aarig-kvinde')
  })

  it('round-trips and rejects anything else', () => {
    expect(parseRestlevetidSlug('45-aarig-mand')).toEqual({ age: 45, sex: 'mand' })
    for (const bad of ['19-aarig-mand', '91-aarig-kvinde', '45-aarig-andet', '045-aarig-mand', '45-aarig-mand/', 'x']) {
      expect(parseRestlevetidSlug(bad)).toBeNull()
    }
  })

  it('covers ages 20-90 for both sexes exactly once', () => {
    const routes = PSEO_ROUTES.filter((r) => r.startsWith(`${RESTLEVETID_HUB}/`))
    expect(routes).toHaveLength((MAX_AGE - MIN_AGE + 1) * 2)
    expect(new Set(routes).size).toBe(routes.length)
    expect(routes).toContain('/restlevetid/20-aarig-mand')
    expect(routes).toContain('/restlevetid/90-aarig-kvinde')
  })
})

describe('restlevetid titles', () => {
  it('puts the figure and the DST year in the title', () => {
    expect(restlevetidMeta(45, 'mand').title).toBe('Restlevetid for en 45-årig mand: 36,4 år (DST 2025)')
    expect(restlevetidMeta(70, 'kvinde').title).toBe('Restlevetid for en 70-årig kvinde: 17,3 år (DST 2025)')
  })

  it('answers the query in the description with both sexes', () => {
    const d = restlevetidMeta(45, 'mand').description
    expect(d).toContain('36,4')
    expect(d).toContain('39,8')
    expect(d).toContain('81,4')
  })
})

describe('kommune data', () => {
  it('reads the HISBK municipality figures and skips suppressed ones', () => {
    const list = kommuner()
    expect(list).toHaveLength(94)
    const kbh = list.find((k) => k.name === 'København')
    expect(kbh).toMatchObject({ code: '101', total: 80.9, male: 78.7, female: 83.1, slug: 'koebenhavn' })
    expect(list.find((k) => k.code === '411')).toBeUndefined()
    // "Hele landet" is in the HISBK rows but is the national comparison, not a municipality.
    expect(list.find((k) => k.code === '000')).toBeUndefined()
    expect(list.find((k) => k.slug === 'hele-landet')).toBeUndefined()
    const c = kommuneFacts('koebenhavn').country
    expect(c).toMatchObject({ total: 81.6, male: 79.7, female: 83.5 })
    expect(c.period).toBe(kommuneFacts('koebenhavn').period)
  })

  it('makes unique ASCII slugs', () => {
    expect(kommuneSlug('København')).toBe('koebenhavn')
    expect(kommuneSlug('Aabenraa')).toBe('aabenraa')
    expect(kommuneSlug('Faaborg-Midtfyn')).toBe('faaborg-midtfyn')
    expect(kommuneSlug('Lyngby-Taarbæk')).toBe('lyngby-taarbaek')
    expect(kommuneSlug('Tårnby')).toBe('taarnby')
    const slugs = kommuner().map((k) => k.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z]+(-[a-z]+)*$/)
  })

  it('ranks municipalities by total, best first', () => {
    const list = kommuner()
    const ranks = list.map((k) => k.rank)
    expect(Math.min(...ranks)).toBe(1)
    const best = list.find((k) => k.rank === 1)
    expect(best.total).toBe(Math.max(...list.map((k) => k.total)))
    const f = kommuneFacts('koebenhavn')
    expect(f.rank).toBe(list.find((k) => k.slug === 'koebenhavn').rank)
    expect(f.count).toBe(94)
  })

  it('names every municipality that shares the top figure and marks shared ranks', () => {
    const list = kommuner()
    const top = Math.max(...list.map((k) => k.total))
    const tops = list.filter((k) => k.total === top)
    const f = kommuneFacts(tops[0].slug)
    for (const k of tops) expect(f.best.names).toContain(k.name)
    expect(f.best.total).toBe(top)
    expect(rankLabel(tops[0])).toBe(tops.length > 1 ? 'delt nr. 1' : 'nr. 1')
    expect(list.filter((k) => k.shared).every((k) => list.some((o) => o !== k && o.total === k.total))).toBe(true)
  })

  it('has one page per municipality, titled with the figure', () => {
    const routes = PSEO_ROUTES.filter((r) => r.startsWith(`${LEVEALDER_HUB}/`))
    expect(routes).toHaveLength(94)
    expect(kommuneMeta('koebenhavn').title).toBe('Forventet levealder i København: 80,9 år (DST 2021-25)')
  })
})

describe('every generated page', () => {
  const metas = PSEO_ROUTES.map((r) => [r, pseoMeta(r)])

  it('has meta for each route and none for anything else', () => {
    for (const [, m] of metas) expect(m).toBeTruthy()
    expect(pseoMeta('/restlevetid/19-aarig-mand')).toBeNull()
    expect(pseoMeta('/forventet-levealder/findes-ikke')).toBeNull()
  })

  it('has a unique title and description within the limits, also against the static routes', () => {
    const all = { ...ROUTE_META, ...Object.fromEntries(metas) }
    const routes = [...Object.keys(ROUTE_META), ...PSEO_ROUTES]
    expect(validateMeta(routes, all)).toEqual([])
    for (const [r, m] of metas) {
      expect(m.title.length, r).toBeLessThanOrEqual(MAX_TITLE)
      expect(m.description.length, r).toBeLessThanOrEqual(MAX_DESCRIPTION)
      expect(m.noindex, r).toBe(false)
    }
  })

  it('is in the sitemap with its own canonical URL', () => {
    const xml = buildSitemap(SITEMAP_ROUTES)
    for (const r of PSEO_ROUTES) {
      expect(SITEMAP_ROUTES, r).toContain(r)
      expect(xml).toContain(`<loc>${SITE_URL}${r}</loc>`)
    }
    expect(new Set(SITEMAP_ROUTES).size).toBe(SITEMAP_ROUTES.length)
    expect(readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')).toBe(xml)
  })
})

describe('hubs', () => {
  it('are static routes with meta, in the sitemap', () => {
    for (const hub of [RESTLEVETID_HUB, LEVEALDER_HUB]) {
      expect(ROUTE_META[hub], hub).toBeTruthy()
      expect(ROUTE_META[hub].noindex, hub).toBeFalsy()
      expect(SITEMAP_ROUTES).toContain(hub)
    }
  })
})
