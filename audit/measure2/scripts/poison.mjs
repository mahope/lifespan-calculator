// Follow-up probe (local only): does a bad deep link leave junk in localStorage that later shows up in the Historik card?
// Usage: PLAYWRIGHT_MODULE=... node poison.mjs http://levetid.test:3010 --map-host=levetid.test=127.0.0.1
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const argv = process.argv.slice(2);
const BASE = argv.find((a) => /^https?:\/\//.test(a)).replace(/\/+$/, '');
if (!/^https?:\/\/(levetid\.test|127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) throw new Error('local only');
const MAP = (argv.find((a) => a.startsWith('--map-host=')) || '').slice(11).split('=');
const here = path.dirname(fileURLToPath(import.meta.url));
const PLAUSIBLE = readFileSync(path.join(here, 'plausible-script.pinned.js'), 'utf8');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, args: MAP[0] ? ['--host-resolver-rules=MAP ' + MAP[0] + ' ' + MAP[1]] : [] });
const FROZEN = new Date('2026-11-05T12:34:56Z');
const HOST = new URL(BASE).hostname;

async function session() {
  const ctx = await browser.newContext({ serviceWorkers: 'block', locale: 'da-DK', timezoneId: 'Europe/Copenhagen', viewport: { width: 1280, height: 900 } });
  ctx.setDefaultTimeout(8000);
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'analytics.holstjensen.eu') {
      if (route.request().method() === 'POST') return route.fulfill({ status: 202, body: 'ok' });
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: PLAUSIBLE });
    }
    if (u.hostname !== HOST) return route.abort();
    return route.continue();
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__plausible = true; });
  await page.clock.install({ time: FROZEN });
  await page.clock.setFixedTime(FROZEN);
  return { ctx, page };
}
const calc = async (page, age) => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByLabel('Din alder:').fill(String(age));
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await page.waitForTimeout(600);
};
const card = (page) => page.evaluate(() => {
  const c = [...document.querySelectorAll('main .card')].find((e) => /Din historik/.test(e.innerText));
  return c ? c.innerText.replace(/\s+/g, ' ').trim() : null;
});
const out = [];
for (const [label, bad] of [['a=abc', '/?g=male&a=abc'], ['a=-5', '/?g=male&a=-5'], ['b=not-a-date', '/?g=male&b=not-a-date']]) {
  const { ctx, page } = await session();
  await page.goto(BASE + bad, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const stored1 = await page.evaluate(() => localStorage.getItem('lifespan:history'));
  await calc(page, 40);
  out.push({ label, storedAfterBadLink: stored1, historikAfterNormalCalc: await card(page), storedAfterNormalCalc: await page.evaluate(() => localStorage.getItem('lifespan:history')) });
  await ctx.close();
}
// persistence of the crash: after [null] is seeded, does a second visit also crash?
{
  const { ctx, page } = await session();
  await page.addInitScript(() => { if (!sessionStorage.getItem('s')) { localStorage.setItem('lifespan:history', '[null]'); sessionStorage.setItem('s', '1'); } });
  const crashes = [];
  for (let i = 1; i <= 2; i++) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.getByLabel('Din alder:').fill('40');
    await page.getByRole('radio', { name: 'Mand', exact: true }).click();
    await page.getByRole('button', { name: 'Beregn levetid' }).click();
    await page.waitForTimeout(700);
    crashes.push({ attempt: i, errorBoundary: await page.evaluate(() => /Noget gik galt/.test(document.body.innerText)), stored: (await page.evaluate(() => localStorage.getItem('lifespan:history'))).slice(0, 100) });
  }
  // and: does "Genindlæs siden" recover?
  await page.reload({ waitUntil: 'networkidle' });
  const formBack = await page.evaluate(() => !!document.getElementById('age'));
  out.push({ label: 'crash persistence with seed [null]', crashes, afterReloadFormShown: formBack });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
