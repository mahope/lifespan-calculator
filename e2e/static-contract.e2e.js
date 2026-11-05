import { test, expect } from './fixtures.js';

// Needs the production serving layer (serve + public/serve.json). If /sitemap.xml falls back to the SPA, the
// tests below fail: that is exactly the regression this file exists to catch.
// Node-side requests do not use the browser's host mapping, so talk to the server directly.
test.use({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? 4173}` });

test.describe('static contract', () => {
  test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/User-agent: \*/);
    expect(body).toMatch(/Sitemap: https:\/\/levetidsberegner\.dk\/sitemap\.xml/);
  });

  test('sitemap.xml is a urlset with the home page', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>https://levetidsberegner.dk/</loc>');
  });

  test('privacy policy is a real page, not the SPA', async ({ request }) => {
    const res = await request.get('/privatlivspolitik');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/text\/html/);
    expect(await res.text()).toMatch(/privatliv/i);
  });

  test('unknown paths are a real 404 that serves the 404 page', async ({ request, session }) => {
    const { page, rec, siteHost } = session;
    const res = await request.get('/xyz');
    expect(res.status()).toBe(404);
    const response = await page.goto('/xyz');
    expect(response.status()).toBe(404);
    await expect(page.locator('body')).toContainText('Siden findes ikke');
    expect([...rec.hosts].filter((h) => h !== siteHost)).toEqual([]);
  });

  test('/api/health answers 200', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });
});
