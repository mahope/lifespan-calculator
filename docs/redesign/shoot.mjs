// Screenshots of every route (and the home result view) at 390, 768 and 1440 px.
//   npm run build && node docs/redesign/shoot.mjs <outDir>
// Serves dist/ itself (npx serve, as in production), blocks all third parties, freezes the clock.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { chromium } from '@playwright/test'

const out = process.argv[2]
if (!out) throw new Error('usage: node docs/redesign/shoot.mjs <outDir>')
mkdirSync(out, { recursive: true })

const PORT = 4190
const ROUTES = {
  forside: '/',
  'hvor-lang-tid': '/hvor-lang-tid-har-jeg-tilbage',
  dodsalder: '/dodsalder-calculator',
  danmark: '/levetid-beregner-danmark',
  livsstil: '/livsstil-og-levetid',
  pensionsalder: '/pensionsalder',
  '404': '/findes-ikke',
}
const WIDTHS = [390, 768, 1440]

const server = spawn('npx', ['serve', 'dist', '-l', `tcp://127.0.0.1:${PORT}`, '--no-port-switching'], {
  env: { ...process.env, NO_UPDATE_CHECK: '1' },
  stdio: 'ignore',
})
const stop = () => server.kill()
process.on('exit', stop)
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) break
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200))
}

const browser = await chromium.launch()
const FROZEN = new Date('2026-11-05T12:34:56Z')

async function newPage(width, scheme = 'light') {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    colorScheme: scheme,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  const page = await ctx.newPage()
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' ? route.continue() : route.abort()
  })
  await page.clock.install({ time: FROZEN })
  await page.clock.setFixedTime(FROZEN)
  return page
}

async function settle(page) {
  await page.waitForLoadState('networkidle')
  const afvis = page.getByRole('button', { name: 'Afvis', exact: true })
  if (await afvis.count()) await afvis.click()
  await page.waitForTimeout(300)
}

for (const w of WIDTHS) {
  for (const [name, path] of Object.entries(ROUTES)) {
    const page = await newPage(w)
    await page.goto(`http://127.0.0.1:${PORT}${path}`)
    await settle(page)
    await page.screenshot({ path: `${out}/${name}-${w}.png`, fullPage: true })
    await page.context().close()
  }
  for (const scheme of ['light', 'dark']) {
    const page = await newPage(w, scheme)
    await page.goto(`http://127.0.0.1:${PORT}/`)
    await settle(page)
    if (scheme === 'dark') {
      const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      if (!dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
    }
    await page.getByLabel('Din alder:').fill('40')
    await page.getByRole('radio', { name: 'Mand', exact: true }).click()
    await page.getByRole('button', { name: 'Beregn levetid' }).click()
    await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/resultat-${scheme}-${w}.png`, fullPage: true })
    await page.context().close()
  }
}
await browser.close()
stop()
console.log('shot', out)
