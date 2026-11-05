// Lighthouse (mobile preset) over every route of the built app: category scores, LCP, CLS, TBT.
//   npm run build && CHROME_PATH=/opt/google/chrome/chrome node docs/redesign/lighthouse.mjs > out.json
// Serves dist/ with `serve` on its own port (the repo's lighthouse-budget.mjs uses 4173, which other jobs also use).
// `/` is run three times and the median is reported; the other routes once. Same pinned lighthouse as the budget script.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

const LIGHTHOUSE = 'lighthouse@13.5.0'
const PORT = 4192
const BASE = `http://127.0.0.1:${PORT}`
const ROUTES = [
  '/',
  '/hvor-lang-tid-har-jeg-tilbage',
  '/dodsalder-calculator',
  '/levetid-beregner-danmark',
  '/livsstil-og-levetid',
  '/pensionsalder',
]

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

const server = spawn('npx', ['serve', 'dist', '-l', `tcp://127.0.0.1:${PORT}`, '--no-port-switching'], {
  env: { ...process.env, NO_UPDATE_CHECK: '1' },
  stdio: 'ignore',
  detached: true,
})
const tmp = mkdtempSync(path.join(tmpdir(), 'lh-'))
const results = {}
try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) break
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  for (const route of ROUTES) {
    const runs = route === '/' ? 3 : 1
    const rows = []
    for (let i = 0; i < runs; i++) {
      const out = path.join(tmp, `r.json`)
      const r = spawnSync(
        'npx',
        [
          '--yes',
          LIGHTHOUSE,
          `${BASE}${route}`,
          '--output=json',
          `--output-path=${out}`,
          '--only-categories=performance,accessibility,best-practices,seo',
          '--quiet',
          '--chrome-flags=--headless=new',
        ],
        { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false' } },
      )
      if (r.status !== 0) throw new Error(`lighthouse failed for ${route} (exit ${r.status})`)
      const lhr = JSON.parse(readFileSync(out, 'utf8'))
      rows.push({
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        lcpMs: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
        cls: Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(4)),
        tbtMs: Math.round(lhr.audits['total-blocking-time'].numericValue),
        transferKB: Math.round(lhr.audits['total-byte-weight'].numericValue / 1024),
      })
    }
    results[route] = Object.fromEntries(Object.keys(rows[0]).map((k) => [k, median(rows.map((x) => x[k]))]))
    process.stderr.write(`${route} ${JSON.stringify(results[route])}\n`)
  }
  console.log(JSON.stringify(results, null, 2))
} finally {
  try {
    process.kill(-server.pid)
  } catch {
    /* gone */
  }
  rmSync(tmp, { recursive: true, force: true })
}
