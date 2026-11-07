// The switch from the SPA to the Astro build for visitors who already have the SPA's service worker (#88).
// e2e/fixtures/legacy-prod/ is a copy of what production served on 2026-11-07 (the Workbox sw.js with its
// precached index.html fallback, the SPA HTML and assets). A local server first serves that copy, then dist/
// (the new build) from the same origin, the way a deploy swaps the files under an open browser.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { startSwitchServer } from './support/switch-server.mjs';

const LEGACY = fileURLToPath(new URL('./fixtures/legacy-prod/', import.meta.url));
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

// Service workers need a secure context; localhost is one, the levetid.test alias is not.
test.use({ serviceWorkers: 'allow', baseURL: undefined });
test.describe.configure({ mode: 'serial' });

let server;
let origin;
test.beforeEach(async ({ context }) => {
  server = await startSwitchServer(LEGACY);
  origin = `http://localhost:${server.port}`;
  // Nothing leaves the machine: the analytics script and anything else off-origin is aborted.
  await context.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
});
test.afterEach(async () => {
  await server.close();
});

const cacheNames = (page) => page.evaluate(() => caches.keys());
const controllerUrl = (page) => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
const isAstroPage = (page) => page.evaluate(() => !document.querySelector('script[src^="/assets/"]') && !!document.querySelector('h1'));
const isLegacyPage = (page) => page.evaluate(() => !!document.querySelector('script[src^="/assets/index-"]'));

// Wait until the legacy Workbox worker controls the page and has its precache filled.
async function installLegacy(page) {
  await page.goto(`${origin}/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => controllerUrl(page), { timeout: 15_000 }).toBe(`${origin}/sw.js`);
  await expect.poll(async () => (await cacheNames(page)).some((k) => k.startsWith('workbox-precache')), { timeout: 15_000 }).toBe(true);
  expect(await isLegacyPage(page)).toBe(true);
}

// After the deploy. Browsers look for a new /sw.js on a navigation only when the last check is more than
// 24 hours old (and `register()` with the same URL does not check at all), so the update is triggered here the
// way the browser does it then. The new worker installs, activates, deletes the Workbox cache and reloads the
// tabs the old worker had served.
async function triggerUpdate(page) {
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
}
const onlyNewCache = async (page) => {
  const keys = await cacheNames(page).catch(() => []);
  return keys.length > 0 && keys.every((k) => k.startsWith('levetid-'));
};

async function calculate(page, age = '40', sex = 'Mand') {
  await page.locator('#age').fill(age);
  await page.getByRole('radio', { name: sex }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await expect(page.getByRole('heading', { name: 'Din resterende tid' })).toBeVisible();
}

test('a visitor with the SPA worker is moved to the new site as soon as the new worker activates', async ({ page }) => {
  await installLegacy(page);

  server.setRoot(DIST);
  // Until the browser checks for an update, the old worker keeps serving the complete, working SPA.
  await page.reload();
  expect(await isLegacyPage(page)).toBe(true);

  await triggerUpdate(page);
  // No user action: the worker reloads the tab, and the page now comes from the network (the Astro build).
  await expect.poll(() => isAstroPage(page).catch(() => false), { timeout: 15_000 }).toBe(true);
  await expect.poll(() => onlyNewCache(page), { timeout: 15_000 }).toBe(true);
  expect(await controllerUrl(page)).toBe(`${origin}/sw.js`);
  await expect(page.locator('astro-island')).toHaveCount(1);
  await calculate(page);

  // Every route is the new HTML; an unknown path is the real 404, not the SPA fallback.
  for (const path of ['/hvor-lang-tid-har-jeg-tilbage', '/pensionsalder', '/levetid-beregner-danmark']) {
    await page.goto(`${origin}${path}`);
    expect(await isAstroPage(page)).toBe(true);
  }
  const missing = await page.goto(`${origin}/findes-ikke`);
  expect(missing.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Side ikke fundet');
  await expect(page.getByText('Noget gik galt')).toHaveCount(0);
});

test('every SPA tab left open across the deploy is moved, also when another tab triggers the update', async ({ context, page }) => {
  await installLegacy(page);
  await page.goto(`${origin}/pensionsalder`);
  expect(await isLegacyPage(page)).toBe(true);
  const other = await context.newPage();
  await other.goto(`${origin}/`);
  expect(await isLegacyPage(other)).toBe(true);

  server.setRoot(DIST);
  await triggerUpdate(other);
  for (const tab of [page, other]) {
    await expect.poll(() => isAstroPage(tab).catch(() => false), { timeout: 15_000 }).toBe(true);
    await expect(tab.getByText('Noget gik galt')).toHaveCount(0);
  }
  await expect(page).toHaveURL(`${origin}/pensionsalder`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hvornår kan jeg gå på pension?');
});

test('after the deploy the SPA chunks are a plain 404, so a tab that missed the reload falls back to a fresh load', async ({ page }) => {
  // The worker's reload covers the tabs it controls. A tab it misses still runs the SPA; its next route change
  // asks for a lazy chunk, gets this 404 and the SPA's stale-chunk guard (lazyWithReload) reloads the page.
  await installLegacy(page);
  server.setRoot(DIST);
  const res = await page.request.get(`${origin}/assets/PensionsalderPage-3VuejeNU.js`);
  expect(res.status()).toBe(404);
  expect(res.headers()['content-type']).not.toMatch(/html|javascript/);
});

test('the new worker keeps the site usable offline and picks up the next deploy at once', async ({ context, page }) => {
  server.setRoot(DIST);
  await page.goto(`${origin}/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => controllerUrl(page), { timeout: 15_000 }).toBe(`${origin}/sw.js`);
  await expect.poll(async () => (await cacheNames(page)).length, { timeout: 15_000 }).toBe(1);

  // Offline after the first visit: the pages and the calculator come from the worker's cache.
  await context.setOffline(true);
  await page.reload();
  await calculate(page, '65', 'Kvinde');
  await page.goto(`${origin}/pensionsalder`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hvornår kan jeg gå på pension?');
  await page.locator('#pension-birthdate').fill('1970-03-15');
  await expect(page.getByText('Folkepensionsalder', { exact: true })).toBeVisible();
  await context.setOffline(false);

  // Next deploy: a changed page and a changed worker. The page is network first, so the very next load shows
  // the new HTML, and the new worker replaces the old cache.
  const next = mkdtempSync(join(tmpdir(), 'levetid-next-'));
  cpSync(DIST, next, { recursive: true });
  const home = join(next, 'index.html');
  writeFileSync(home, readFileSync(home, 'utf8').replace('Andre værktøjer</h2>', 'Andre værktøjer (ny version)</h2>'));
  // build-sw.mjs derives the cache name from the files; the copy gets a new one by hand.
  writeFileSync(join(next, 'sw.js'), readFileSync(join(next, 'sw.js'), 'utf8').replace(/levetid-[0-9a-f]+/, 'levetid-nextdeploy'));
  const before = await cacheNames(page);
  server.setRoot(next);
  await page.goto(`${origin}/`);
  await expect(page.getByRole('heading', { name: 'Andre værktøjer (ny version)' })).toBeVisible();
  await expect.poll(async () => {
    await page.reload();
    return JSON.stringify(await cacheNames(page));
  }, { timeout: 15_000 }).toBe(JSON.stringify(['levetid-nextdeploy']));
  expect(before).not.toContain('levetid-nextdeploy');
});
