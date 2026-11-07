import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { CONTENT_PAGES, ISLAND_BUDGET, checkBudget, scriptFiles } from './check-js-budget.mjs'

const fileOf = (route) => (route === '/' ? 'index.html' : route === '/404' ? '404.html' : `${route.slice(1)}/index.html`)

function dist(pages = {}, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'js-budget-'))
  const write = (name, body) => {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), body)
  }
  const island = '<astro-island component-url="/_astro/App.js" renderer-url="/_astro/client.js"></astro-island>'
  for (const r of CONTENT_PAGES) write(fileOf(r), pages[r] ?? '<script>inline()</script><h1>x</h1>')
  for (const r of Object.keys(ISLAND_BUDGET)) write(fileOf(r), pages[r] ?? island)
  write('_astro/App.js', 'import{a}from"./shared.js";import("./lazy.js");')
  write('_astro/shared.js', 'export const a=1')
  write('_astro/lazy.js', 'x'.repeat(10))
  write('_astro/client.js', 'export default 1')
  for (const [name, body] of Object.entries(files)) write(name, body)
  return dir
}

describe('check-js-budget', () => {
  it('passes when content pages have inline scripts only', () => {
    expect(checkBudget(dist()).problems).toEqual([])
  })
  it('follows static imports but not dynamic import()', () => {
    const d = dist()
    expect(scriptFiles(d, '<astro-island component-url="/_astro/App.js"></astro-island>').sort()).toEqual(['/_astro/App.js', '/_astro/shared.js'])
  })
  it('fails a content page with a script file or an island', () => {
    const d = dist({
      '/dodsalder-calculator': '<script type="module" src="/_astro/shared.js"></script>',
      '/livsstil-og-levetid': '<astro-island component-url="/_astro/App.js"></astro-island>',
    })
    const { problems } = checkBudget(d)
    expect(problems.some((p) => p.startsWith('/dodsalder-calculator: content page loads'))).toBe(true)
    expect(problems.some((p) => p.startsWith('/livsstil-og-levetid: content page has an island'))).toBe(true)
  })
  it('fails an island page over its budget', () => {
    // Random data does not compress: about 136 KB of base64 stays above the 90 KB budget of /.
    const big = randomBytes(100 * 1024).toString('base64')
    const { problems } = checkBudget(dist({}, { '_astro/shared.js': `export const a="${big}"` }))
    expect(problems.some((p) => p.startsWith('/: ') && /brotli/.test(p))).toBe(true)
  })
})
