// Post-build JavaScript budget (deterministic, runs in every build): the content pages load no script file
// from this site and no island, and the pages with an island stay under their brotli budget.
// Inline bootstrap scripts (share-link scrubber, theme, service worker registration) and the third-party
// analytics script are not counted. The browser-side check (Lighthouse, LCP) is scripts/lighthouse-budget.mjs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'

// Pages that are text only. /pensionsalder (form) and /embed (widget) are apps, like /.
export const CONTENT_PAGES = [
  '/hvor-lang-tid-har-jeg-tilbage',
  '/dodsalder-calculator',
  '/livsstil-og-levetid',
  '/levetid-beregner-danmark',
  '/embed-levetidsberegner',
  '/404',
]
// Brotli bytes of same-origin JavaScript per page with an island (the SPA sent about 97 KB on /).
export const ISLAND_BUDGET = { '/': 90 * 1024, '/pensionsalder': 75 * 1024, '/embed': 75 * 1024 }

const fileOf = (route) => (route === '/' ? 'index.html' : route === '/404' ? '404.html' : `${route.slice(1)}/index.html`)

// Same-origin script files a page loads: <script src>, modulepreload, and the island component/renderer URLs
// with everything they import statically (followed through the built files).
export function scriptFiles(dist, html) {
  const direct = [
    ...[...html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="(\/[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\b(?:component|renderer)-url="(\/[^"]+)"/g)].map((m) => m[1]),
  ]
  const seen = new Set()
  const visit = (url) => {
    if (seen.has(url)) return
    seen.add(url)
    const src = readFileSync(join(dist, url), 'utf8')
    // Static imports only; dynamic import() chunks (the share image library) load on demand.
    for (const m of src.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.js)["']/g)) {
      visit(new URL(m[1], `http://x${url}`).pathname)
    }
  }
  direct.filter((u) => u.endsWith('.js')).forEach(visit)
  return [...seen]
}

export function checkBudget(dist) {
  const problems = []
  const report = {}
  for (const route of [...CONTENT_PAGES, ...Object.keys(ISLAND_BUDGET)]) {
    const html = readFileSync(join(dist, fileOf(route)), 'utf8')
    const files = scriptFiles(dist, html)
    const bytes = files.reduce((sum, f) => sum + brotliCompressSync(readFileSync(join(dist, f))).length, 0)
    report[route] = { files: files.length, brotliBytes: bytes }
    if (CONTENT_PAGES.includes(route)) {
      if (files.length) problems.push(`${route}: content page loads ${files.join(', ')}`)
      if (/<astro-island\b/.test(html)) problems.push(`${route}: content page has an island`)
    } else if (bytes > ISLAND_BUDGET[route]) {
      problems.push(`${route}: ${bytes} B of JavaScript (brotli) > ${ISLAND_BUDGET[route]} B`)
    }
  }
  return { problems, report }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2] || fileURLToPath(new URL('../dist/', import.meta.url))
  const { problems, report } = checkBudget(dist)
  const summary = Object.entries(report)
    .map(([r, v]) => `${r} ${(v.brotliBytes / 1024).toFixed(1)} KB`)
    .join(', ')
  if (problems.length) {
    process.stderr.write(`check-js-budget: ${problems.join('\n  ')}\n`)
    process.exit(1)
  }
  process.stdout.write(`check-js-budget: ok (${summary})\n`)
}
