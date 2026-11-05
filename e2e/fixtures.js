// Shared fixture: a page with a frozen clock and a strict network policy.
//
// - Same-origin requests pass through to the preview server.
// - The analytics host is fulfilled locally: the Plausible script is replayed from a pinned
//   copy and POST /api/event is recorded and answered 202, never forwarded.
// - Every other host (partner ads, fonts, geocoding, ...) is aborted and its hostname recorded.
// Nothing in this suite ever reaches the internet.
import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

export const FROZEN_ISO = '2026-11-05T12:34:56Z'; // off a minute boundary: the countdown shows '--' for units equal to 0
export const ANALYTICS_HOST = 'analytics.holstjensen.eu';
const PLAUSIBLE_SRC = readFileSync(new URL('./fixtures/plausible-script.pinned.js', import.meta.url), 'utf8');

export const test = base.extend({
  session: async ({ page, baseURL }, provide) => {
    const siteHost = new URL(baseURL).hostname;
    const rec = { hosts: new Set(), events: [], eventBodies: [], console: [], pageErrors: [] };

    await page.route('**/*', async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      rec.hosts.add(u.hostname);
      if (u.hostname === ANALYTICS_HOST) {
        if (req.method() === 'POST' && u.pathname === '/api/event') {
          const raw = req.postData() || '';
          rec.eventBodies.push(raw);
          try {
            const body = JSON.parse(raw);
            if (body.n !== 'engagement') rec.events.push({ n: body.n, u: body.u, d: body.d, p: body.p ?? null });
          } catch {
            rec.events.push({ unparsable: true });
          }
          return route.fulfill({ status: 202, contentType: 'text/plain', body: 'ok' });
        }
        if (req.method() === 'GET' && u.pathname.startsWith('/js/')) {
          return route.fulfill({ status: 200, contentType: 'application/javascript', body: PLAUSIBLE_SRC });
        }
        return route.abort();
      }
      if (u.hostname !== siteHost) return route.abort();
      return route.continue();
    });

    // The Plausible script ignores automated browsers unless window.__plausible is set; its traffic is intercepted above.
    await page.addInitScript(() => {
      window.__plausible = true;
    });
    await page.clock.install({ time: new Date(FROZEN_ISO) });
    await page.clock.setFixedTime(new Date(FROZEN_ISO));

    page.on('console', (m) => {
      if (m.type() === 'error') rec.console.push(m.text());
    });
    page.on('pageerror', (e) => rec.pageErrors.push(String(e && e.message ? e.message : e)));

    await provide({ page, rec, siteHost });
  },
});

export { expect };

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Fills the form the way a user does and submits it. */
export async function submitCalculator(page, input) {
  await page.goto('/', { waitUntil: 'networkidle' });
  if (input.birthdate) {
    await page.getByRole('radio', { name: /Fødselsdato/ }).click();
    await page.getByLabel('Din fødselsdato:').fill(input.birthdate);
  } else {
    await page.getByLabel('Din alder:').fill(String(input.age));
  }
  await page.getByRole('radio', { name: input.gender === 'male' ? 'Mand' : 'Kvinde', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await page.locator('.time-unit').nth(4).waitFor();
  await page.waitForTimeout(500);
}

/** Deterministic capture of the visible result view (text only, no layout). */
export function captureResult(page) {
  return page.evaluate(() => {
    const n = (s) => s.replace(/\s+/g, ' ').trim();
    const sr = document.querySelector('main p.sr-only');
    return {
      documentTitle: document.title,
      srAnnouncement: sr ? n(sr.textContent) : null,
      countdown: [...document.querySelectorAll('.countdown-timer .time-unit')].map((u) => ({
        label: n(u.querySelector('.time-label')?.innerText || ''),
        value: n(u.querySelector('.time-value')?.innerText || ''),
      })),
      sections: [...document.querySelectorAll('main .countdown-timer, main .card')].map((el) => {
        const h = el.querySelector('h1,h2,h3,h4');
        return { heading: h ? n(h.innerText) : null, text: n(el.innerText) };
      }),
      partnerAdsLinks: [...document.querySelectorAll('a[href*="partner-ads.com"]')].map((a) => ({
        href: a.getAttribute('href'),
        rel: a.getAttribute('rel'),
        target: a.getAttribute('target'),
      })),
    };
  });
}

export { norm };
