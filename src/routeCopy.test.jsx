import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ROUTE_META } from './routes.meta.js'
import { answerFirst } from './utils/answerFirst'
import HomePage from './pages/HomePage'
import HvorLangTidPage from './pages/HvorLangTidPage'
import DodsalderPage from './pages/DodsalderPage'
import DanmarkPage from './pages/DanmarkPage'
import LivsstilPage from './pages/LivsstilPage'

const PAGES = {
  '/': HomePage,
  '/hvor-lang-tid-har-jeg-tilbage': HvorLangTidPage,
  '/dodsalder-calculator': DodsalderPage,
  '/levetid-beregner-danmark': DanmarkPage,
  '/livsstil-og-levetid': LivsstilPage,
}
const ANSWER = {
  '/hvor-lang-tid-har-jeg-tilbage': 'hvorLangTid',
  '/dodsalder-calculator': 'dodsalder',
  '/levetid-beregner-danmark': 'danmark',
  '/livsstil-og-levetid': 'livsstil',
}
const unescape = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')

const render = (Page) =>
  renderToString(
    <HelmetProvider context={{}}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    </HelmetProvider>
  )

const routes = Object.keys(PAGES)
const html = Object.fromEntries(routes.map((r) => [r, render(PAGES[r])]))
const h1 = (r) => unescape(html[r].match(/<h1[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]+>/g, '').trim())

describe('route copy', () => {
  it('has five routes with unique titles within 60 characters and descriptions within 155', () => {
    expect(routes).toHaveLength(5)
    const titles = routes.map((r) => ROUTE_META[r].title)
    expect(new Set(titles).size).toBe(5)
    for (const r of routes) {
      expect(ROUTE_META[r].title.length).toBeLessThanOrEqual(60)
      expect(ROUTE_META[r].description.length).toBeLessThanOrEqual(155)
    }
  })
  it('renders five unique H1s', () => {
    const h1s = routes.map(h1)
    h1s.forEach((t) => expect(t.length).toBeGreaterThan(0))
    expect(new Set(h1s.map((t) => t.toLowerCase())).size).toBe(5)
  })
  it('only the home page targets "hvor gammel bliver jeg" in title, description and H1', () => {
    for (const r of routes) {
      const text = `${ROUTE_META[r].title} ${ROUTE_META[r].description} ${h1(r)}`.toLowerCase()
      expect(text.includes('hvor gammel bliver jeg')).toBe(r === '/')
    }
  })
  it('landing pages render the answer-first text and link to the calculator', () => {
    for (const [r, key] of Object.entries(ANSWER)) {
      expect(html[r]).toContain(unescape(answerFirst[key]()).replace(/'/g, '&#x27;'))
      expect(html[r]).toMatch(/<a [^>]*href="\/"/)
    }
  })
  it('the calculator links to every landing page', () => {
    for (const r of routes.filter((x) => x !== '/')) expect(html['/']).toContain(`href="${r}"`)
  })
  it('names no WHO or location data', () => {
    for (const r of routes) expect(html[r]).not.toMatch(/\bWHO\b|Verdenssundhed/)
  })
})
