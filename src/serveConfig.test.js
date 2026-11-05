import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

const url = (p) => new URL(`../${p}`, import.meta.url)
const read = (p) => readFileSync(url(p), 'utf8')

describe('policy pages', () => {
  it('ship from public/ (real files), with no stray copy in the repo root', () => {
    for (const f of ['privatlivspolitik', 'cookiepolitik']) {
      expect(existsSync(url(`public/${f}.html`))).toBe(true)
      expect(existsSync(url(`${f}.html`))).toBe(false)
    }
  })

  it('are not rewritten to the SPA and are kept away from the service worker fallback', () => {
    const { rewrites } = JSON.parse(read('public/serve.json'))
    expect(rewrites.map((r) => r.source).filter((s) => /politik/.test(s))).toEqual([])
    expect(read('vite.config.js')).toMatch(/privatlivspolitik\|cookiepolitik/)
  })

  it('are linked from the footer with plain anchors (the router Link would show the 404 route)', () => {
    const footer = read('src/components/Footer.jsx')
    expect(footer).toContain('href="/privatlivspolitik"')
    expect(footer).toContain('href="/cookiepolitik"')
  })
})
