import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

describe('static serving config', () => {
  it('keeps SPA fallback in serve.json, excluding the static policy pages', () => {
    const { rewrites } = JSON.parse(read('public/serve.json'))
    expect(rewrites).toEqual([
      { source: '!/{privatlivspolitik,cookiepolitik}', destination: '/index.html' },
    ])
  })

  it('does not use serve -s (it overrides serve.json and breaks clean policy URLs)', () => {
    for (const f of ['Dockerfile', 'nixpacks.toml']) {
      expect(read(f)).not.toMatch(/serve(@\S+)?\s+(-s|--single)\b/)
      expect(read(f)).not.toMatch(/\bserve\s+dist\s+-s\b/)
    }
  })

  it('pins serve to an exact version', () => {
    expect(read('Dockerfile')).toMatch(/serve@\d+\.\d+\.\d+/)
    expect(read('nixpacks.toml')).toMatch(/serve@\d+\.\d+\.\d+/)
  })
})
