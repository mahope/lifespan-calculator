import { test, expect } from './fixtures.js';

const PORT = process.env.E2E_PORT ?? 4173;
const FRAMER = 'http://framer.test';
const page_html = (src, id) =>
  `<!doctype html><title>host</title><iframe id="${id}" src="${src}" width="500" height="400"></iframe>
   <script>window.__msgs=[];addEventListener('message',e=>__msgs.push(e.data))</script>`;

test.describe('embed widget', () => {
  test('headers: frame-ancestors only on /embed, SAMEORIGIN everywhere else', async ({ playwright }) => {
    const api = await playwright.request.newContext({ baseURL: `http://127.0.0.1:${PORT}` });
    const h = async (url) => (await api.get(url)).headers();
    for (const url of ['/embed', '/embed/']) {
      const headers = await h(url);
      expect(headers['content-security-policy']).toBe('frame-ancestors *');
      expect(headers['x-robots-tag']).toBe('noindex');
      expect(headers['x-frame-options']).toBeUndefined();
    }
    for (const url of ['/', '/embed-levetidsberegner', '/pensionsalder', '/xyz']) {
      const headers = await h(url);
      expect(headers['x-frame-options'], url).toBe('SAMEORIGIN');
      expect(headers['content-security-policy'], url).toBeUndefined();
    }
    await api.dispose();
  });

  test('/embed renders when framed from another origin; / does not', async ({ session }) => {
    const { page } = session;
    await page.route(`${FRAMER}/**`, (route) => {
      const u = new URL(route.request().url());
      const src = u.searchParams.get('src');
      return route.fulfill({ contentType: 'text/html', body: page_html(`http://levetid.test:${PORT}${src}`, 'f') });
    });
    await page.goto(`${FRAMER}/?src=/embed`);
    await expect(page.frameLocator('#f').getByLabel('Alder')).toBeVisible();

    await page.goto(`${FRAMER}/?src=/`);
    await expect(page.frameLocator('#f').getByLabel('Alder')).toHaveCount(0);
    await expect.poll(() => page.frames().some((f) => f.url().startsWith('chrome-error:'))).toBe(true);

    await page.goto(`${FRAMER}/?src=/embed-levetidsberegner`);
    await expect.poll(() => page.frames().some((f) => f.url().startsWith('chrome-error:'))).toBe(true);
  });

  test('posts only {type, height} to the parent and tracks no props', async ({ session }) => {
    const { page, rec } = session;
    await page.route(`${FRAMER}/**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: page_html(`http://levetid.test:${PORT}/embed`, 'f') }),
    );
    await page.goto(`${FRAMER}/`);
    const frame = page.frameLocator('#f');
    await frame.getByLabel('Alder').fill('47');
    await frame.getByLabel('Kvinde').check();
    await frame.getByRole('button', { name: 'Beregn' }).click();
    await expect(frame.getByText('Forventede år tilbage')).toBeVisible();

    const msgs = await page.evaluate(() => window.__msgs);
    expect(msgs.length).toBeGreaterThan(0);
    for (const m of msgs) {
      expect(Object.keys(m).sort()).toEqual(['height', 'type']);
      expect(m.type).toBe('levetidsberegner:height');
      expect(Number.isFinite(m.height)).toBe(true);
    }
    const calc = rec.events.filter((e) => e.n === 'Embed Calculate');
    expect(calc).toHaveLength(1);
    expect(calc[0].p).toBeNull();
    for (const body of rec.eventBodies) expect(body).not.toMatch(/47|female|Kvinde/);
  });
});
