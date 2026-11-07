// The Astro port (#88) must show the same pages as the SPA did. e2e/fixtures/spa-rendered.json is what the SPA
// build of master ddb8c1c rendered in this browser setup (visible text, every link, every heading), captured
// with the same extraction as below. Any change to copy, navigation or headings shows up here as a diff;
// when a later change is deliberate, update the fixture in the same commit.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const SPA = JSON.parse(readFileSync(new URL('./fixtures/spa-rendered.json', import.meta.url), 'utf8'));

test.use({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT}` });

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
});

for (const route of Object.keys(SPA)) {
  test(`${route} renders the same text, links and headings as the SPA`, async ({ page }) => {
    await page.goto(route);
    await page.waitForSelector('h1', { state: 'attached' });
    const got = await page.evaluate(() => ({
      text: document.body.innerText,
      links: [...document.querySelectorAll('a')].map((a) => `${a.getAttribute('href')} ${a.textContent.trim()}`),
      headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => `${h.tagName} ${h.textContent.trim()}`),
    }));
    expect(got.headings).toEqual(SPA[route].headings);
    expect(got.links).toEqual(SPA[route].links);
    expect(got.text.split('\n')).toEqual(SPA[route].text.split('\n'));
  });
}
