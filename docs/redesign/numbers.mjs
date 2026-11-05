// Regression check for "the calculations and their results must not change".
//   node docs/redesign/numbers.mjs dump <distDir> > out.json     (serves distDir, runs the three test inputs through the UI)
//   node docs/redesign/numbers.mjs compare before.json after.json
// dump: with a frozen clock, submits male 40, female 65 and male born 1985-06-15 and records the text of every result section
// (the countdown block and each `.card` in <main>) keyed by heading.
// compare: for each section heading present before, every number in the old text must still occur at least as often in the
// new text (extra numbers, such as chart axis labels, are allowed). Renamed sections are checked against the whole page.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { chromium } from '@playwright/test'

const [mode, a, b] = process.argv.slice(2)

const INPUTS = [
  { id: '1-male-40', gender: 'male', age: 40 },
  { id: '2-female-65', gender: 'female', age: 65 },
  { id: '3-male-birthdate-1985-06-15', gender: 'male', birthdate: '1985-06-15' },
]
const nums = (t) => t.match(/\d[\d.,]*/g)?.map((x) => x.replace(/[.,]+$/, '')) ?? []

if (mode === 'dump') {
  const PORT = 4197
  const server = spawn('npx', ['serve', a, '-l', `tcp://127.0.0.1:${PORT}`, '--no-port-switching'], { env: { ...process.env, NO_UPDATE_CHECK: '1' }, stdio: 'ignore', detached: true })
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
  const out = {}
  try {
    for (const inp of INPUTS) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'da-DK', timezoneId: 'Europe/Copenhagen', reducedMotion: 'reduce', serviceWorkers: 'block' })
      const page = await ctx.newPage()
      await page.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()))
      await page.clock.install({ time: FROZEN })
      await page.clock.setFixedTime(FROZEN)
      await page.goto(`http://127.0.0.1:${PORT}/`)
      await page.waitForLoadState('networkidle')
      if (inp.birthdate) {
        await page.getByRole('radio', { name: /Fødselsdato/ }).click()
        await page.getByLabel('Din fødselsdato:').fill(inp.birthdate)
      } else {
        await page.getByLabel('Din alder:').fill(String(inp.age))
      }
      await page.getByRole('radio', { name: inp.gender === 'male' ? 'Mand' : 'Kvinde', exact: true }).click()
      await page.getByRole('button', { name: 'Beregn levetid' }).click()
      await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor()
      await page.locator('.time-unit').nth(4).waitFor()
      await page.waitForTimeout(500)
      out[inp.id] = await page.evaluate(() => {
        const n = (s) => s.replace(/\s+/g, ' ').trim()
        const sections = [...document.querySelectorAll('main .countdown-timer, main .card')].map((el) => {
          const h = el.querySelector('h1,h2,h3,h4')
          // The ticking countdown is compared through the e2e snapshots; here it is part of its section text.
          return { heading: h ? n(h.innerText) : null, text: n(el.innerText) }
        })
        const sr = document.querySelector('main p.sr-only')
        return { sr: sr ? n(sr.textContent) : null, sections }
      })
      await ctx.close()
    }
  } finally {
    await browser.close()
    try {
      process.kill(-server.pid)
    } catch {
      /* gone */
    }
  }
  console.log(JSON.stringify(out, null, 2))
} else if (mode === 'compare') {
  const before = JSON.parse(readFileSync(a, 'utf8'))
  const after = JSON.parse(readFileSync(b, 'utf8'))
  let problems = 0
  let checked = 0
  for (const id of Object.keys(before)) {
    if (before[id].sr !== after[id].sr) {
      problems++
      console.log(`${id}: screen-reader sentence changed: "${before[id].sr}" -> "${after[id].sr}"`)
    }
    for (const sec of before[id].sections) {
      // Sections in the old DOM with no heading (cards that start with plain text) are matched by position of their numbers
      // against the whole new page instead.
      const target = sec.heading ? after[id].sections.find((s) => s.heading === sec.heading) : null
      // A section that was renamed or merged is matched against the numbers of the whole new page instead.
      const pool = target ? nums(target.text) : after[id].sections.flatMap((s) => nums(s.text))
      if (sec.heading && !target) console.log(`${id}: section "${sec.heading}" has no same-named section after; checked against the whole page`)
      const have = new Map()
      for (const x of pool) have.set(x, (have.get(x) ?? 0) + 1)
      for (const x of nums(sec.text)) {
        checked++
        if (!have.get(x)) {
          problems++
          console.log(`${id} / ${sec.heading ?? '(no heading)'}: number ${x} is missing after`)
        } else have.set(x, have.get(x) - 1)
      }
    }
  }
  console.log(`${checked} numbers checked across ${Object.keys(before).length} inputs, ${problems} problem(s)`)
  process.exit(problems ? 1 : 0)
} else {
  throw new Error('usage: numbers.mjs dump <distDir> | compare a.json b.json')
}
