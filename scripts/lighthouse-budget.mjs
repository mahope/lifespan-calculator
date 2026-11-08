// Performance budget in a real browser (CI job `perf`, also by hand):
//
//   npm run build && node scripts/lighthouse-budget.mjs
//
// Serves dist/ the way production does (the Caddyfile in the Caddy image, compression on), runs Lighthouse
// with the mobile preset and DevTools throttling (the same slow 4G and 4x CPU profile, applied to the real page
// load), and fails when
//   - `/` has a median LCP over 1.5 s or CLS over 0.1 (3 runs), or
//   - a content page (CONTENT_PAGES in check-js-budget.mjs) loads any script file from this site (the widget
//     preview iframe on /embed-levetidsberegner is its own document and not counted).
// Why not the default simulated throttling: against a local server the fonts and island scripts finish before
// the first paint, so the simulation puts them on the LCP path and reports about 2.4 s for a page that paints
// its LCP text at about 0.9 s under applied throttling (measured 2026-11-07, see docs/testing.md).
// The analytics host is blocked, so nothing leaves the machine and its script is not measured.
// Lighthouse is fetched with npx at an exact pinned version (13.5.0, published 2026-09-18, no install scripts); it is
// not a project dependency, so this needs network access to the npm registry. Install scripts are disabled for it.
// Env: CHROME_PATH (browser; on agent-worker /opt/google/chrome/chrome), BUDGET_OUT (write the JSON summary there).
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { CONTENT_PAGES } from './check-js-budget.mjs'

const LIGHTHOUSE = 'lighthouse@13.5.0'
const CADDY_IMAGE = 'caddy:2.11.7-alpine'
const RUNS = 3
export const BUDGET = { lcpMs: 1500, cls: 0.1, contentPageScriptBytes: 0 }
const PORT = 20000 + Math.floor(Math.random() * 20000)
const BASE = `http://127.0.0.1:${PORT}`
const NAME = `levetid-lh-${PORT}`

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

async function waitForServer(url, ms = 60000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`server did not start on ${url}`)
}

function lighthouse(url, out) {
  const r = spawnSync(
    'npx',
    [
      '--yes',
      LIGHTHOUSE,
      url,
      '--output=json',
      `--output-path=${out}`,
      '--only-categories=performance',
      '--quiet',
      '--throttling-method=devtools',
      '--blocked-url-patterns=*analytics.holstjensen.eu*',
      '--chrome-flags=--headless=new',
    ],
    { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false' } },
  )
  if (r.status !== 0) throw new Error(`lighthouse ${url} failed (exit ${r.status})`)
  const lhr = JSON.parse(readFileSync(out, 'utf8'))
  const scripts = lhr.audits['network-requests'].details.items.filter(
    (x) => x.resourceType === 'Script' && x.url.startsWith(BASE) && x.experimentalFromMainFrame,
  )
  return {
    lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    tbtMs: lhr.audits['total-blocking-time'].numericValue,
    scripts: scripts.map((x) => new URL(x.url).pathname),
    scriptTransferBytes: scripts.reduce((sum, x) => sum + x.transferSize, 0),
  }
}

const docker = spawn(
  'docker',
  ['run', '--rm', '--name', NAME, '-p', `127.0.0.1:${PORT}:3000`, '-v', `${path.resolve('dist')}:/srv:ro`, '-v', `${path.resolve('Caddyfile')}:/etc/caddy/Caddyfile:ro`, CADDY_IMAGE],
  { stdio: 'ignore' },
)
const tmp = mkdtempSync(path.join(tmpdir(), 'lh-budget-'))
let failed = false
try {
  await waitForServer(`${BASE}/api/health`)
  const home = Array.from({ length: RUNS }, (_, i) => lighthouse(`${BASE}/`, path.join(tmp, `home-${i}.json`)))
  const pages = Object.fromEntries(CONTENT_PAGES.filter((r) => r !== '/404').map((r) => [r, lighthouse(`${BASE}${r}`, path.join(tmp, `${r.slice(1)}.json`))]))
  const result = {
    home: { lcpMs: median(home.map((h) => h.lcpMs)), cls: median(home.map((h) => h.cls)), tbtMs: median(home.map((h) => h.tbtMs)), scriptTransferBytes: median(home.map((h) => h.scriptTransferBytes)) },
    homeRuns: home.map(({ lcpMs, cls, tbtMs }) => ({ lcpMs, cls, tbtMs })),
    contentPages: Object.fromEntries(Object.entries(pages).map(([r, p]) => [r, { lcpMs: p.lcpMs, cls: p.cls, scripts: p.scripts, scriptTransferBytes: p.scriptTransferBytes }])),
    budget: BUDGET,
  }
  console.log(JSON.stringify(result, null, 2))
  if (process.env.BUDGET_OUT) writeFileSync(process.env.BUDGET_OUT, `${JSON.stringify(result, null, 2)}\n`)
  if (result.home.lcpMs > BUDGET.lcpMs) {
    console.error(`FAIL /: median LCP ${Math.round(result.home.lcpMs)} ms > ${BUDGET.lcpMs} ms`)
    failed = true
  }
  if (result.home.cls > BUDGET.cls) {
    console.error(`FAIL /: median CLS ${result.home.cls} > ${BUDGET.cls}`)
    failed = true
  }
  for (const [r, p] of Object.entries(pages)) {
    if (p.scriptTransferBytes > BUDGET.contentPageScriptBytes || p.scripts.length) {
      console.error(`FAIL ${r}: loads ${p.scripts.join(', ')} (${p.scriptTransferBytes} B)`)
      failed = true
    }
  }
} catch (e) {
  console.error(e.message)
  failed = true
} finally {
  spawnSync('docker', ['stop', NAME], { stdio: 'ignore' })
  docker.kill()
  rmSync(tmp, { recursive: true, force: true })
}
process.exit(failed ? 1 : 0)
