import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

// Static checks of the serving layer. The real behaviour (status codes, headers, framing) is tested end to end
// against the Caddy image in e2e/static-contract.e2e.js and e2e/embed.e2e.js.
const url = (p) => new URL(`../${p}`, import.meta.url)
const read = (p) => readFileSync(url(p), 'utf8')
const caddy = read('Caddyfile')

describe('policy pages', () => {
  it('ship from public/ (real files), with no stray copy in the repo root', () => {
    for (const f of ['privatlivspolitik', 'cookiepolitik']) {
      expect(existsSync(url(`public/${f}.html`))).toBe(true)
      expect(existsSync(url(`${f}.html`))).toBe(false)
    }
  })

  it('are served at the clean URL (try_files {path}.html) and kept offline by the service worker', () => {
    expect(caddy).toMatch(/try_files \{path\}\/index\.html \{path\}\.html \{path\}/)
    expect(read('scripts/build-sw.mjs')).toMatch(/'\/privatlivspolitik', '\/cookiepolitik'/)
  })

  it('are linked from the footer with plain anchors', () => {
    const footer = read('src/components/Footer.jsx')
    expect(footer).toContain('href="/privatlivspolitik"')
    expect(footer).toContain('href="/cookiepolitik"')
  })
})

describe('Caddyfile', () => {
  it('lets only /embed be framed, with noindex', () => {
    const embed = caddy.match(/header @embed \{([^}]*)\}/)[1]
    expect(caddy).toMatch(/@embed path \/embed \/embed\/\n/)
    expect(embed).toContain('-X-Frame-Options')
    expect(embed).toContain('Content-Security-Policy "frame-ancestors *"')
    expect(embed).toContain('X-Robots-Tag noindex')
    expect(caddy.match(/X-Frame-Options SAMEORIGIN/g)).toHaveLength(1)
  })

  it('has no SPA fallback: unknown paths get 404.html with status 404', () => {
    expect(caddy).not.toMatch(/try_files[^\n]*index\.html\s*$/m)
    expect(caddy).toMatch(/rewrite \* \/404\.html\s+file_server \{\s+status 404/)
  })

  it('marks only hashed build files immutable', () => {
    expect(caddy).toMatch(/@hashed \{\s+path \/_astro\/\*\s+file\s+\}\s+header @hashed Cache-Control "public, max-age=31536000, immutable"/)
    expect(caddy).toContain('header ?Cache-Control no-cache')
  })

  it('serves the health file as text and listens on :3000', () => {
    expect(read('public/api/health').trim()).toBe('ok')
    expect(caddy).toMatch(/^:3000 \{/m)
    expect(caddy).toMatch(/@health path \/api\/health\s+header @health Content-Type "text\/plain; charset=utf-8"/)
  })
})

describe('Dockerfile', () => {
  const docker = read('Dockerfile')
  it('builds with Node 22 and serves with a pinned Caddy as a non-root user', () => {
    expect(docker).toMatch(/^FROM node:22-alpine AS build$/m)
    expect(docker).toMatch(/^FROM caddy:\d+\.\d+\.\d+-alpine$/m)
    expect(docker).toMatch(/^USER web$/m)
    expect(docker).toMatch(/^COPY Caddyfile \/etc\/caddy\/Caddyfile$/m)
    expect(docker).toMatch(/^EXPOSE 3000$/m)
  })
  it('uses the same Caddy image as the e2e suite and the performance budget', () => {
    const tag = docker.match(/^FROM (caddy:\S+)$/m)[1]
    expect(read('playwright.config.js')).toContain(`const CADDY_IMAGE = '${tag}'`)
    expect(read('scripts/lighthouse-budget.mjs')).toContain(`const CADDY_IMAGE = '${tag}'`)
  })
  it('has a healthcheck on /api/health and curl for Dokploy', () => {
    expect(docker).toMatch(/HEALTHCHECK[^\n]*\n\s+CMD curl -fsS http:\/\/127\.0\.0\.1:3000\/api\/health/)
    expect(docker).toMatch(/apk add --no-cache curl/)
  })
})
