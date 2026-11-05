// Share links must never reach the analytics server (issue #139). The inline script in index.html moves the
// share parameters out of the address before the analytics script runs; this suite records every request to the
// analytics origin (URL, headers, body) and fails if any of them carries a share parameter or input value.
import { test, expect, ANALYTICS_HOST } from './fixtures.js';


const LINKS = [
  { id: 'new', path: '/?g=male&a=40' },
  { id: 'advanced', path: '/?g=female&a=40&m=advanced&lf=0,0,0,0,0,0,0,0,0' },
  { id: 'legacy-birthdate', path: '/?g=male&b=1985-06-15' },
];

// Records the full analytics traffic (the shared fixture keeps only parsed bodies).
async function recordAnalytics(page) {
  const seen = [];
  page.on('request', (req) => {
    if (new URL(req.url()).hostname === ANALYTICS_HOST) {
      seen.push({ url: req.url(), headers: JSON.stringify(req.headers()), body: req.postData() || '' });
    }
  });
  return seen;
}

for (const { id, path } of LINKS) {
  test(`share link "${id}" never reaches analytics and still hydrates`, async ({ session }) => {
    const { page, rec } = session;
    const seen = await recordAnalytics(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
    await page.waitForTimeout(500);

    expect(seen.length, 'analytics script did not run').toBeGreaterThan(0);
    const pageviews = rec.events.filter((e) => e.n === 'pageview');
    expect(pageviews.length).toBeGreaterThan(0);
    for (const e of pageviews) expect(e.u).toBe(`http://${new URL(page.url()).host}/`);
    for (const r of seen) {
      const all = `${decodeURIComponent(r.url)}\n${r.headers}\n${decodeURIComponent(r.body)}`;
      for (const needle of ['g=', 'a=', 'b=', 'm=', 'lf=', '1985', '06-15']) {
        expect(all, `analytics request carries "${needle}": ${r.url}`).not.toContain(needle);
      }
    }
    // The address is clean and the result is shown.
    expect(new URL(page.url()).search).toBe('');
    expect(await page.evaluate(() => '__shareQuery' in window)).toBe(false);
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
  const { page } = session;
  const seen = await recordAnalytics(page);
  await page.goto('/?g=constructor&a=99999999', { waitUntil: 'networkidle' });
  await expect(page.getByLabel('Din alder:')).toBeVisible();
  for (const r of seen) expect(decodeURIComponent(r.url)).not.toContain('constructor');
});

test('unrelated parameters still reach analytics for attribution', async ({ session }) => {
  const { page } = session;
  const seen = await recordAnalytics(page);
  await page.goto('/?utm_source=test&g=male&a=40', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await page.waitForTimeout(300);
  const all = seen.map((r) => decodeURIComponent(r.url + r.body)).join('\n');
  expect(all).toContain('utm_source=test');
  expect(all).not.toMatch(/[?&]g=/);
  expect(all).not.toMatch(/[?&]a=40/);
});
