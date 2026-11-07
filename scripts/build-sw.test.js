import { describe, it, expect } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ROUTES } from './gen-sitemap.mjs'
import { OFFLINE_PAGES, buildServiceWorker, precacheList } from './build-sw.mjs'

const template = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')

function fakeDist(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'build-sw-'))
  const files = {
    'index.html': '<h1>home</h1>',
    'privatlivspolitik.html': 'p',
    'cookiepolitik.html': 'c',
    '_astro/client.abc.js': 'js',
    '_astro/client.abc.js.map': 'map',
    '_astro/site.def.css': 'css',
    'fonts/inter.woff2': 'font',
    'og-image.png': 'png',
    'favicon.svg': 'svg',
    ...Object.fromEntries(ROUTES.filter((r) => r !== '/').map((r) => [`${r.slice(1)}/index.html`, r])),
    ...extra,
  }
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), body)
  }
  return dir
}

describe('precacheList', () => {
  it('covers every page but the iframe widget, plus the policy pages', () => {
    expect(OFFLINE_PAGES).not.toContain('/embed')
    expect(OFFLINE_PAGES).toEqual(expect.arrayContaining(['/', '/pensionsalder', '/privatlivspolitik', '/cookiepolitik']))
  })
  it('takes the hashed scripts and styles, fonts and the favicon, never source maps or images', () => {
    expect(precacheList(fakeDist()).files).toEqual(['/_astro/client.abc.js', '/_astro/site.def.css', '/favicon.svg', '/fonts/inter.woff2'])
  })
  it('fails the build when a page is missing', () => {
    expect(() => precacheList(fakeDist())).not.toThrow()
    const broken = mkdtempSync(join(tmpdir(), 'build-sw-'))
    writeFileSync(join(broken, 'index.html'), 'x')
    expect(() => precacheList(broken)).toThrow(/pages missing/)
  })
})

describe('buildServiceWorker', () => {
  it('fills every placeholder and gives a new cache name when any precached file changes', () => {
    const a = buildServiceWorker(fakeDist(), template)
    expect(a.source).not.toMatch(/__[A-Z]+__/)
    expect(a.source).toContain(`const CACHE = 'levetid-${a.version}'`)
    const b = buildServiceWorker(fakeDist({ '_astro/client.abc.js': 'changed' }), template)
    const c = buildServiceWorker(fakeDist({ 'pensionsalder/index.html': 'changed' }), template)
    const same = buildServiceWorker(fakeDist({ 'og-image.png': 'not precached' }), template)
    expect(b.version).not.toBe(a.version)
    expect(c.version).not.toBe(a.version)
    expect(same.version).toBe(a.version)
  })
  it('is valid JavaScript', () => {
    expect(() => new Function(buildServiceWorker(fakeDist(), template).source)).not.toThrow()
  })
})

describe('sw-template', () => {
  it('never lets install fail, deletes the old Workbox cache and has no SPA fallback', () => {
    expect(template).toContain('Promise.allSettled')
    expect(template).not.toMatch(/addAll\(/)
    expect(template).toMatch(/keys\.filter\(\(key\) => key !== CACHE\)\.map\(\(key\) => caches\.delete\(key\)\)/)
    expect(template).toContain('const LEGACY_CACHE = /^workbox-/')
    expect(template).not.toMatch(/navigateFallback|createHandlerBoundToURL/)
    expect(template).toMatch(/if \(PAGE_SET\.has\(key\)\) event\.respondWith\(networkFirst/)
  })
})
