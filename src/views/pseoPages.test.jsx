import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import RestlevetidPage from './RestlevetidPage'
import RestlevetidHubPage from './RestlevetidHubPage'
import KommunePage from './KommunePage'
import LevealderHubPage from './LevealderHubPage'
import { PSEO_ROUTES, kommuner } from '../lib/pseo.js'

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])

describe('/restlevetid/<alder>-aarig-<køn>', () => {
  const html = renderToString(<RestlevetidPage age={45} sex="mand" />)

  it('answers first with the DST figure and expected age', () => {
    expect(text(html)).toContain('En 45-årig mand har statistisk 36,4 år tilbage og bliver i gennemsnit 81,4 år')
    expect(html).toContain('<h1')
    expect(text(html)).toContain('Restlevetid for en 45-årig mand')
  })

  it('shows the other sex and cites the source', () => {
    expect(text(html)).toContain('39,8 år')
    expect(text(html)).toContain('Danmarks Statistik, tabel HISB8')
  })

  it('links the neighbouring ages and the hub, and only to pages that exist', () => {
    const links = hrefs(html)
    expect(links).toContain('/restlevetid/45-aarig-kvinde')
    expect(links).toContain('/restlevetid/40-aarig-mand')
    expect(links).toContain('/restlevetid/50-aarig-kvinde')
    expect(links).toContain('/restlevetid')
    for (const l of links.filter((h) => h.startsWith('/restlevetid/'))) expect(PSEO_ROUTES).toContain(l)
  })

  it('works at both ends of the age range', () => {
    expect(() => renderToString(<RestlevetidPage age={20} sex="kvinde" />)).not.toThrow()
    expect(text(renderToString(<RestlevetidPage age={90} sex="mand" />))).toContain('3,8 år tilbage')
  })
})

describe('/restlevetid hub', () => {
  const html = renderToString(<RestlevetidHubPage />)
  it('links every age and sex once in the table', () => {
    const links = hrefs(html).filter((h) => h.startsWith('/restlevetid/'))
    expect(links.sort()).toEqual(PSEO_ROUTES.filter((r) => r.startsWith('/restlevetid/')).sort())
  })
})

describe('/forventet-levealder/<kommune>', () => {
  const html = renderToString(<KommunePage slug="koebenhavn" />)
  it('shows the municipality figures, the rank and the source', () => {
    const t = text(html)
    expect(t).toContain('78,7 år for mænd og 83,1 år for kvinder')
    expect(t).toContain('Danmarks Statistik, tabel HISBK')
  })
  it('links to the hub and to nearby municipalities that exist', () => {
    const links = hrefs(html)
    expect(links).toContain('/forventet-levealder')
    for (const l of links.filter((h) => h.startsWith('/forventet-levealder/'))) expect(PSEO_ROUTES).toContain(l)
  })
  it('renders for every municipality', () => {
    for (const k of kommuner()) expect(() => renderToString(<KommunePage slug={k.slug} />), k.slug).not.toThrow()
  })
})

describe('/forventet-levealder hub', () => {
  it('links every municipality', () => {
    const links = hrefs(renderToString(<LevealderHubPage />)).filter((h) => h.startsWith('/forventet-levealder/'))
    expect(links.sort()).toEqual(PSEO_ROUTES.filter((r) => r.startsWith('/forventet-levealder/')).sort())
  })
})
