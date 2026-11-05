/* global fetch, console */
// Head-tag check against the built site (`npm run build` first), not part of the
// vitest gate because Playwright is deliberately not a repo dependency.
//   E2E_PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node scripts/e2e-head.mjs
// Starts `serve dist`, then for every route asserts (1) with JS disabled the
// route's own og:title/og:image are in the raw HTML and (2) after hydration
// exactly one description, og:title, twitter:card, canonical and no leftovers.
import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout } from 'node:timers'
import { pathToFileURL } from 'node:url'
import { ROUTES, SITE_URL } from './gen-sitemap.mjs'
import { ROUTE_META } from '../src/routes.meta.js'

const PORT = 3987
const BASE = `http://127.0.0.1:${PORT}`
const { chromium } = await import(
  process.env.E2E_PLAYWRIGHT ? pathToFileURL(process.env.E2E_PLAYWRIGHT).href : 'playwright'
)

const server = spawn('npx', ['serve', 'dist', '-l', String(PORT)], { stdio: 'ignore' })
const failures = []
const check = (ok, msg) => {
  if (!ok) failures.push(msg)
}

try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(BASE).then((r) => r.ok, () => false)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  const browser = await chromium.launch()
  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const js = await browser.newContext()
  for (const route of ROUTES) {
    const meta = ROUTE_META[route]
    const url = BASE + route
    const raw = await noJs.newPage()
    await raw.goto(url)
    const ogTitle = await raw.locator('meta[property="og:title"]').getAttribute('content')
    const ogImage = await raw.locator('meta[property="og:image"]').getAttribute('content')
    check(ogTitle === (meta.ogTitle || meta.title), `${route} (no JS): og:title is "${ogTitle}"`)
    check(ogImage?.startsWith(`${SITE_URL}/`), `${route} (no JS): og:image is "${ogImage}"`)
    await raw.close()

    const page = await js.newPage()
    await page.goto(url)
    await page.waitForSelector('#root *')
    await page.waitForTimeout(500)
    for (const sel of [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[name="twitter:card"]',
      'link[rel="canonical"]',
    ]) {
      const n = await page.locator(sel).count()
      check(n === 1, `${route} (hydrated): ${n} x ${sel}`)
    }
    check((await page.locator('[data-prerender]').count()) === 0, `${route}: data-prerender tags left`)
    await page.close()
  }
  await browser.close()
} finally {
  server.kill()
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`head tags OK on ${ROUTES.length} routes`)
