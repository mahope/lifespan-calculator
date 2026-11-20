// Share documents must stay free of third-party scripts (issue #139).
import { test, expect, ANALYTICS_HOST, ADSENSE_HOST, ADSENSE_SRC } from './fixtures.js';

const LINKS = [
  { id: 'new', path: '/?g=male&a=40' },
  { id: 'advanced', path: '/?g=female&a=40&m=advanced&lf=0,0,0,0,0,0,0,0,0' },
  { id: 'legacy-birthdate', path: '/?g=male&b=1985-06-15' },
];

for (const { id, path } of LINKS) {
  test(`share link "${id}" hydrates without loading third-party scripts`, async ({ session }) => {
    const { page, rec, siteHost } = session;
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Din resterende tid' })).toBeVisible();

    expect(new URL(page.url()).search).toBe('');
    expect(await page.evaluate(() => '__shareQuery' in window)).toBe(false);
    expect([...rec.hosts]).toEqual([siteHost]);
  });
}

test('hydration gives the same remaining years as before', async ({ session }) => {
  const { page } = session;
  await page.goto('/?g=male&a=40', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await expect(page.getByText(/Du har statistisk/)).toContainText(/40,8 år/);
});

test('legacy birthdate link hydrates to the birthdate result', async ({ session }) => {
  const { page } = session;
  await page.goto('/?g=male&b=1985-06-15', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await expect(page.getByText(/Du har statistisk/)).toContainText(/39,9 år/);
});

test('a bad link degrades to the empty form and is also stripped', async ({ session }) => {
  const { page, rec, siteHost } = session;
  await page.goto('/?g=constructor&a=99999999', { waitUntil: 'networkidle' });
  await expect(page.getByLabel('Din alder:')).toBeVisible();
  expect([...rec.hosts]).toEqual([siteHost]);
});

test('ordinary visits still load AdSense and attribute unrelated parameters', async ({ session }) => {
  const { page, rec } = session;
  const [adRequest] = await Promise.all([
    page.waitForRequest(ADSENSE_SRC),
    page.goto('/?utm_source=test', { waitUntil: 'networkidle' }),
  ]);
  expect(rec.hosts.has(ANALYTICS_HOST)).toBe(true);
  expect(rec.hosts.has(ADSENSE_HOST)).toBe(true);
  expect(rec.events.find((e) => e.n === 'pageview')?.u).toBe(page.url());
  expect(await page.evaluate(() => window.__adsensePageUrl)).toBe(page.url());
  const loader = page.locator(`head script[src="${ADSENSE_SRC}"]`);
  await expect(loader).toHaveJSProperty('async', true);
  await expect(loader).toHaveAttribute('crossorigin', 'anonymous');
  expect((await adRequest.allHeaders()).referer).toBe(`${new URL(page.url()).origin}/`);
});
