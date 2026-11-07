// Post-build guard for the Astro port (#88): the built site must keep every URL, the sitemap and each
// page's SEO head (title, meta, canonical, Open Graph, Twitter, JSON-LD) exactly as the SPA served them.
// The reference is scripts/fixtures/spa-parity.json, taken from the SPA build of master ddb8c1c with
// `node scripts/check-parity.mjs --write-fixture <spa-dist>`. Run after `astro build` (postbuild).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ROUTES } from './gen-sitemap.mjs'

const FIXTURE = fileURLToPath(new URL('./fixtures/spa-parity.json', import.meta.url))

// Deliberate additions, nothing else may differ. /pensionsalder: the FAQPage block the SPA only added at
// runtime (react-helmet-async) is now in the HTML itself.
export const ADDED_JSON_LD = { '/pensionsalder': ['FAQPage'] }

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`))
  return m ? decode(m[1]) : undefined
}

// The SEO-relevant part of a page's <head>, normalised so attribute order and markers do not matter.
export function headSummary(html) {
  const head = html.slice(0, html.indexOf('</head>'))
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/g) || []
  const meta = {}
  for (const tag of head.match(/<meta\b[^>]*>/g) || []) {
    const key = attr(tag, 'name') || attr(tag, 'property')
    if (!key || !/^(description|keywords|robots|author|language|og:.+|twitter:.+)$/.test(key)) continue
    if (key in meta) meta[key] = [].concat(meta[key], attr(tag, 'content'))
    else meta[key] = attr(tag, 'content')
  }
  const canonical = (head.match(/<link\b[^>]*rel="canonical"[^>]*>/g) || []).map((t) => attr(t, 'href'))
  const jsonLd = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  )
  return {
    title: title.map((t) => decode(t.replace(/<[^>]+>/g, ''))),
    meta: Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b))),
    canonical,
    jsonLd,
  }
}

export const sitemapLocs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

const routeFile = (dist, route) => join(dist, route === '/' ? 'index.html' : `${route.slice(1)}/index.html`)

export function snapshot(dist, routes = ROUTES) {
  return {
    sitemap: sitemapLocs(readFileSync(join(dist, 'sitemap.xml'), 'utf8')),
    routes: Object.fromEntries(routes.map((r) => [r, headSummary(readFileSync(routeFile(dist, r), 'utf8'))])),
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Returns a list of problems; empty means the build matches the SPA.
export function compare(reference, dist) {
  const problems = []
  const locs = sitemapLocs(readFileSync(join(dist, 'sitemap.xml'), 'utf8'))
  if (!same(locs, reference.sitemap)) problems.push(`sitemap differs: ${JSON.stringify(locs)} vs ${JSON.stringify(reference.sitemap)}`)
  for (const [route, want] of Object.entries(reference.routes)) {
    const file = routeFile(dist, route)
    if (!existsSync(file)) {
      problems.push(`${route}: no ${file}`)
      continue
    }
    const got = headSummary(readFileSync(file, 'utf8'))
    const added = ADDED_JSON_LD[route] || []
    const extra = got.jsonLd.filter((d) => added.includes(d['@type']))
    const jsonLd = got.jsonLd.filter((d) => !added.includes(d['@type']))
    if (extra.length !== added.length) problems.push(`${route}: expected added JSON-LD ${added.join(', ')}`)
    for (const key of ['title', 'meta', 'canonical']) {
      if (!same(got[key], want[key])) problems.push(`${route}: ${key} differs: ${JSON.stringify(got[key])} vs ${JSON.stringify(want[key])}`)
    }
    if (!same(jsonLd, want.jsonLd)) problems.push(`${route}: JSON-LD differs`)
  }
  for (const route of ROUTES) if (!(route in reference.routes)) problems.push(`${route}: not in the SPA reference`)
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args[0] === '--write-fixture') {
    writeFileSync(FIXTURE, `${JSON.stringify(snapshot(args[1]), null, 2)}\n`)
    process.stdout.write(`check-parity: wrote ${FIXTURE}\n`)
  } else {
    const dist = args[0] || fileURLToPath(new URL('../dist/', import.meta.url))
    const problems = compare(JSON.parse(readFileSync(FIXTURE, 'utf8')), dist)
    if (problems.length) {
      process.stderr.write(`check-parity: ${problems.length} difference(s) from the SPA:\n  ${problems.join('\n  ')}\n`)
      process.exit(1)
    }
    process.stdout.write(`check-parity: ${ROUTES.length} routes and the sitemap match the SPA\n`)
  }
}
