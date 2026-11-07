import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures.js';

// The SPA's sitemap and routes (master ddb8c1c), see scripts/check-parity.mjs.
const SPA = JSON.parse(readFileSync(new URL('../scripts/fixtures/spa-parity.json', import.meta.url), 'utf8'));

// Needs the production serving layer (Caddy with the Caddyfile). If /sitemap.xml fell back to a page, the
// tests below fail: that is exactly the regression this file exists to catch.
// Node-side requests do not use the browser's host mapping, so talk to the server directly.
test.use({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT}` });

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

  test('every URL of the SPA answers 200 at the same address, with its own canonical and body text in the HTML', async ({ request }) => {
    for (const route of Object.keys(SPA.routes)) {
      const res = await request.get(route, { maxRedirects: 0 });
      expect(res.status(), route).toBe(200);
      expect(res.headers()['content-type'], route).toMatch(/text\/html/);
      const html = await res.text();
      expect(html, route).toContain(`<link rel="canonical" href="${SPA.routes[route].canonical[0]}"`);
      // Without JavaScript: the page's own H1 and its text are in the raw HTML (the SPA sent an empty #root).
      expect(html, route).toMatch(/<h1[\s>]/);
      const words = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);
      expect(words.length, route).toBeGreaterThan(route === '/embed' ? 10 : 300);
    }
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual(SPA.sitemap);
  });

  test('old address forms still land on the page: trailing slash, .html and index.html', async ({ request }) => {
    const get = (url) => request.get(url, { maxRedirects: 0 });
    expect((await get('/pensionsalder/')).status()).toBe(200);
    for (const [from, to] of [
      ['/index.html', '/'],
      ['/pensionsalder/index.html', '/pensionsalder'],
      ['/privatlivspolitik.html', '/privatlivspolitik'],
      ['/cookiepolitik/', '/cookiepolitik'],
    ]) {
      const res = await get(from);
      expect(res.status(), from).toBe(301);
      expect(res.headers().location, from).toBe(to);
    }
  });

  test('hashed build files are immutable; a missing one is a short 404 that is never cached', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const asset = html.match(/\/_astro\/[^"]+\.js/)[0];
    const ok = await request.get(asset);
    expect(ok.status()).toBe(200);
    expect(ok.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
    const missing = await request.get('/_astro/findes-ikke.js');
    expect(missing.status()).toBe(404);
    expect(missing.headers()['cache-control']).toBe('no-store');
    expect(missing.headers()['content-type']).toMatch(/text\/plain/);
    // Pages and the service worker are revalidated on every load.
    for (const url of ['/', '/sw.js', '/manifest.webmanifest']) {
      expect((await request.get(url)).headers()['cache-control'], url).toBe('no-cache');
    }
  });

  test('/api/health answers 200', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });
});
