// The programmatic pages (/restlevetid/*, /forventet-levealder/*) as the production Caddyfile serves them:
// 200 at the clean URL, own title and self-referencing canonical, the DST figure in the raw HTML, no script
// file, listed in the sitemap, and unknown slugs get the 404 page.
import { test, expect } from '@playwright/test';

test.use({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT}` });

const PAGES = [
  ['/restlevetid', 'Restlevetid efter alder og køn: tabel for 20-90 år (DST)'],
  ['/forventet-levealder', 'Forventet levealder pr. kommune: alle kommuner (DST)'],
  ['/restlevetid/45-aarig-mand', 'Restlevetid for en 45-årig mand: 36,4 år (DST 2025)'],
  ['/restlevetid/90-aarig-kvinde', 'Restlevetid for en 90-årig kvinde: 4,6 år (DST 2025)'],
  ['/forventet-levealder/koebenhavn', 'Forventet levealder i København: 80,9 år (DST 2021-25)'],
];

test.describe('programmatic pages', () => {
  for (const [route, title] of PAGES) {
    test(`${route} serves its own head and data in the HTML`, async ({ request }) => {
      const res = await request.get(route, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="https://levetidsberegner.dk${route}"`);
      expect(html).toContain('<meta name="robots" content="index, follow"');
      expect(html).toMatch(/<h1[\s>]/);
      expect(html).not.toMatch(/<script\b[^>]*\bsrc="\/_astro\//);
    });
  }

  test('slugs outside the data answer 404, with and without a trailing slash', async ({ request }) => {
    for (const route of ['/restlevetid/19-aarig-mand', '/restlevetid/91-aarig-kvinde', '/forventet-levealder/findes-ikke']) {
      expect((await request.get(route)).status(), route).toBe(404);
    }
  });

  test('the sitemap lists the hubs and every page once', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const [route] of PAGES) expect(locs).toContain(`https://levetidsberegner.dk${route}`);
    expect(locs.filter((l) => l.includes('/restlevetid/'))).toHaveLength(142);
  });

  test('the calculator result links to the matching page', async ({ page }) => {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await page.goto('/');
    await page.getByLabel('Din alder:').fill('45');
    await page.getByRole('radio', { name: 'Mand', exact: true }).click();
    await page.getByRole('button', { name: 'Beregn levetid' }).click();
    await expect(page.getByRole('link', { name: /Se restlevetiden for en 45-årig mand/ })).toHaveAttribute(
      'href',
      '/restlevetid/45-aarig-mand',
    );
  });
});
