// axe-core over every route and the home result view, light and dark, at 390 and 1440 px.
//   npm run build && AXE_CORE=/abs/path/to/axe-core/axe.min.js node docs/redesign/axe.mjs > axe.json
// axe-core is not a dependency of the repo; install it outside the repo (`npm i axe-core@4.14.0 --ignore-scripts`).
import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from '@playwright/test'

const AXE = process.env.AXE_CORE
if (!AXE) throw new Error('set AXE_CORE to the path of axe.min.js')
const PORT = 4193
const ROUTES = ['/', '/hvor-lang-tid-har-jeg-tilbage', '/dodsalder-calculator', '/levetid-beregner-danmark', '/livsstil-og-levetid', '/pensionsalder', '/findes-ikke']

const server = spawn('npx', ['serve', 'dist', '-l', `tcp://127.0.0.1:${PORT}`, '--no-port-switching'], { env: { ...process.env, NO_UPDATE_CHECK: '1' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) break
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200))
}

const browser = await chromium.launch()
const report = []
try {
  for (const scheme of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      const views = [...ROUTES.map((r) => ({ name: r, route: r })), { name: '/ (resultat)', route: '/', result: true }, { name: '/ (resultat, avanceret)', route: '/', result: true, advanced: true }]
      for (const v of views) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, locale: 'da-DK', reducedMotion: 'reduce', serviceWorkers: 'block' })
        const page = await ctx.newPage()
        await page.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()))
        await page.goto(`http://127.0.0.1:${PORT}${v.route}`)
        await page.waitForLoadState('networkidle')
        if (v.result) {
          if (v.advanced) await page.getByRole('radio', { name: /Avanceret/ }).click()
          await page.getByLabel('Din alder:').fill('40')
          await page.getByRole('radio', { name: 'Mand', exact: true }).click()
          await page.getByRole('button', { name: 'Beregn levetid' }).click()
          await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor()
          await page.waitForTimeout(400)
        }
        await page.addScriptTag({ path: AXE })
        const res = await page.evaluate(() =>
          // eslint-disable-next-line no-undef
          axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
        )
        report.push({
          view: v.name,
          scheme,
          width,
          violations: res.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length, sample: x.nodes.slice(0, 2).map((n) => n.target.join(' ')), help: x.help })),
          incomplete: res.incomplete.map((x) => ({ id: x.id, nodes: x.nodes.length })),
          passes: res.passes.length,
        })
        await ctx.close()
      }
    }
  }
} finally {
  await browser.close()
  try {
    process.kill(-server.pid)
  } catch {
    /* gone */
  }
}
const bad = report.filter((r) => r.violations.length)
console.log(JSON.stringify({ views: report.length, viewsWithViolations: bad.length, report: bad.length ? bad : undefined, incomplete: [...new Set(report.flatMap((r) => r.incomplete.map((i) => i.id)))] }, null, 2))
