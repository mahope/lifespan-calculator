#!/usr/bin/env node
// Deterministic regression baseline for levetidsberegner.dk (lifespan-calculator).
//
//   node baseline.mjs <baseUrl> [options] > baseline.json
//
// Options
//   --plausible-script=<file>   pinned copy of the Plausible script (default: ./plausible-script.pinned.js next to this file).
//                               If the file is missing the analytics script is aborted and only window.plausible() calls are recorded.
//   --map-host=<host>=<ip>      Chrome --host-resolver-rules MAP, e.g. levetid.test=127.0.0.1, so a local build can be served under a
//                               non-localhost hostname (the Plausible script ignores localhost/127.x).
//   --only=routes|cases         run only one section
//   --no-asset-cache            do not replay same-origin /assets/* from memory between contexts (more requests to the server)
//   --timeout=<ms>              default action timeout (default 20000)
//
// Determinism: Playwright clock frozen at 2026-11-05T12:00:00Z (Date, timers), locale da-DK, timezone Europe/Copenhagen, fixed viewport,
// light colour scheme, reduced motion, fresh context per page, service workers blocked, localStorage empty at start.
// Network: same-origin requests pass through; analytics.holstjensen.eu is fulfilled locally (script from the pinned copy, POST /api/event
// recorded and answered 202, never forwarded); partner-ads.com and every other third party is aborted and its host recorded.
// Affiliate links are only inspected (href/rel/target), never clicked.
// Needs: node >= 20 and playwright-core (import 'playwright-core', 'playwright', or PLAYWRIGHT_MODULE=/abs/path/to/index.mjs).
// Output: one JSON document on stdout (stable key order, 2-space indent). Diagnostics go to stderr.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const HARNESS_VERSION = 1;
const FROZEN_ISO = '2026-11-05T12:34:56Z'; // not on a minute boundary: the countdown shows '--' for any unit that is 0 (falsy), see README
const FROZEN = new Date(FROZEN_ISO);
const PROD_ORIGIN = 'https://levetidsberegner.dk';
const ANALYTICS_HOST = 'analytics.holstjensen.eu';
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 levetid-baseline/1';

const argv = process.argv.slice(2);
const baseArg = argv.find((a) => /^https?:\/\//.test(a));
if (!baseArg) {
  console.error('usage: node baseline.mjs <baseUrl> [--plausible-script=file] [--map-host=host=ip] [--only=routes|cases] [--no-asset-cache]');
  process.exit(2);
}
const opt = (name, def = null) => {
  const a = argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};
const flag = (name) => argv.includes(`--${name}`);
const BASE = baseArg.replace(/\/+$/, '');
const BASE_ORIGIN = new URL(BASE).origin;
const BASE_HOST = new URL(BASE).hostname;
const ONLY = opt('only');
const TIMEOUT = Number(opt('timeout', '20000'));
const CACHE_ASSETS = !flag('no-asset-cache');
const here = path.dirname(fileURLToPath(import.meta.url));
const pinnedPath = opt('plausible-script', path.join(here, 'plausible-script.pinned.js'));
const PLAUSIBLE_SRC = existsSync(pinnedPath) ? readFileSync(pinnedPath, 'utf8') : null;

async function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_MODULE, 'playwright-core', 'playwright'].filter(Boolean);
  for (const t of tries) {
    try {
      return await import(t.startsWith('/') ? pathToFileURL(t).href : t);
    } catch {
      /* try next */
    }
  }
  throw new Error('playwright-core not found (npm i playwright-core, or set PLAYWRIGHT_MODULE=/abs/path/index.mjs)');
}
const { chromium } = await loadPlaywright();

const launchArgs = [];
const mapHost = opt('map-host');
const MAP_HOST = mapHost ? mapHost.split('=') : null;
if (MAP_HOST) launchArgs.push(`--host-resolver-rules=MAP ${MAP_HOST[0]} ${MAP_HOST[1]}`);
const browser = await chromium.launch({ headless: true, args: launchArgs });
console.error(`[baseline] base=${BASE} chromium=${browser.version()} pinnedPlausible=${PLAUSIBLE_SRC ? 'yes' : 'no (script aborted)'}`);

const assetCache = new Map();
let requestsToServer = 0;

/** Opens a fresh, frozen-clock context+page with network policy applied. */
async function openSession() {
  const ctx = await browser.newContext({
    serviceWorkers: 'block',
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    userAgent: UA,
    acceptDownloads: false,
    permissions: [],
  });
  ctx.setDefaultTimeout(TIMEOUT);
  const rec = { events: [], plausibleQueue: [], blockedHosts: new Set(), sameOrigin: new Set(), console: [], pageErrors: [] };

  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === ANALYTICS_HOST) {
      // Never forwarded: script is replayed from a pinned local copy, events are recorded and acknowledged locally.
      if (req.method() === 'POST' && u.pathname === '/api/event') {
        let body = null;
        try {
          body = JSON.parse(req.postData() || 'null');
        } catch {
          body = { unparsable: true };
        }
        if (body && body.n !== 'engagement') {
          rec.events.push({ n: body.n, u: body.u, d: body.d, p: body.p ?? null });
        }
        return route.fulfill({ status: 202, contentType: 'text/plain', body: 'ok' });
      }
      if (req.method() === 'GET' && u.pathname.startsWith('/js/') && PLAUSIBLE_SRC) {
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: PLAUSIBLE_SRC });
      }
      rec.blockedHosts.add(u.hostname);
      return route.abort();
    }
    if (u.hostname !== BASE_HOST) {
      rec.blockedHosts.add(u.hostname); // partner-ads.com, fonts.googleapis.com, anything else: aborted, host recorded
      return route.abort();
    }
    // Same-origin request inventory with build hashes masked, so a deploy that adds/removes a chunk shows up in the diff.
    rec.sameOrigin.add(`${req.method()} ${u.pathname.replace(/-[A-Za-z0-9_-]{8}(\.(?:js|css))$/, '-[hash]$1')}${u.search}`);
    if (CACHE_ASSETS && req.method() === 'GET' && req.resourceType() !== 'document') {
      const key = u.pathname + u.search;
      if (assetCache.has(key)) return route.fulfill(assetCache.get(key));
      requestsToServer++;
      // route.fetch() resolves DNS in Node, not Chrome, so undo --map-host for it.
      const resp = await route.fetch(MAP_HOST ? { url: req.url().replace(MAP_HOST[0], MAP_HOST[1]) } : {});
      const entry = { status: resp.status(), headers: resp.headers(), body: await resp.body() };
      if (resp.status() === 200) assetCache.set(key, entry);
      return route.fulfill(entry);
    }
    requestsToServer++;
    return route.continue();
  });

  const page = await ctx.newPage();
  // Allow the Plausible script to run under automation (it ignores navigator.webdriver unless window.__plausible is set).
  // All of its traffic is intercepted above.
  await page.addInitScript(() => {
    window.__plausible = true;
  });
  await page.clock.install({ time: FROZEN });
  await page.clock.setFixedTime(FROZEN);
  page.on('console', (m) => {
    // "Service Worker registration blocked by Playwright" is an artefact of serviceWorkers:'block' (and only on HTTPS origins): ignore it.
    if ((m.type() === 'error' || m.type() === 'warning') && !/Service Worker registration blocked/.test(m.text())) rec.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => rec.pageErrors.push(String(e && e.message ? e.message : e)));
  return { ctx, page, rec };
}

async function finishRec(page, rec) {
  // Calls queued on the window.plausible stub (only populated if the real script never replaced it).
  const q = await page
    .evaluate(() => (window.plausible && window.plausible.q ? window.plausible.q.map((a) => [...a].map((x) => JSON.parse(JSON.stringify(x ?? null)))) : []))
    .catch(() => []);
  return {
    plausibleEvents: rec.events,
    plausibleStubQueue: q,
    blockedThirdPartyHosts: [...rec.blockedHosts].sort(),
    sameOriginRequests: [...rec.sameOrigin].sort(),
    consoleMessages: [...rec.console].sort(),
    pageErrors: [...rec.pageErrors].sort(),
  };
}

/** Per-route metadata, rendered DOM. */
async function readRoute(route) {
  const { ctx, page, rec } = await openSession();
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const meta = await page.evaluate(() => {
      const q = (s) => [...document.querySelectorAll(s)];
      const n = (s) => s.replace(/\s+/g, ' ').trim();
      const pick = (sel, attr) => q(sel).map((e) => e.getAttribute(attr));
      return {
        title: document.title,
        htmlLang: document.documentElement.lang,
        canonical: pick('link[rel="canonical"]', 'href'),
        metaRobots: pick('meta[name="robots"]', 'content'),
        metaDescription: pick('meta[name="description"]', 'content'),
        ogTitle: pick('meta[property="og:title"]', 'content'),
        ogDescription: pick('meta[property="og:description"]', 'content'),
        ogImage: pick('meta[property="og:image"]', 'content'),
        ogUrl: pick('meta[property="og:url"]', 'content'),
        twitterCard: pick('meta[name="twitter:card"]', 'content'),
        h1: q('h1').map((e) => n(e.innerText)),
        headings: q('h1,h2,h3,h4').map((e) => `${e.tagName.toLowerCase()}: ${n(e.innerText)}`),
        jsonLdTypes: q('script[type="application/ld+json"]').map((e) => {
          try {
            return JSON.parse(e.textContent)['@type'];
          } catch {
            return 'INVALID_JSON';
          }
        }),
        footers: q('footer').length,
        cookieBanner: (() => {
          const b = document.getElementById('cookie-consent-banner');
          return b ? { display: getComputedStyle(b).display, buttons: [...b.querySelectorAll('button')].map((x) => n(x.innerText)) } : null;
        })(),
        staticExplainer: (() => {
          const e = document.querySelector('[data-seo-explainer]');
          return e ? n(e.innerText).slice(0, 120) : null;
        })(),
        notFoundShown: /Side ikke fundet/.test(document.body.innerText),
        localLinks: q('a[href^="/"]').map((a) => a.getAttribute('href')),
        partnerAdsLinks: q('a[href*="partner-ads.com"]').map((a) => ({ href: a.getAttribute('href'), rel: a.getAttribute('rel'), target: a.getAttribute('target') })),
      };
    });
    return { requested: route, httpStatus: resp ? resp.status() : null, finalPath: new URL(page.url()).pathname + new URL(page.url()).search, ...meta, ...(await finishRec(page, rec)) };
  } finally {
    await ctx.close();
  }
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** One full calculator flow through the real UI. */
async function runCase(spec) {
  const { ctx, page, rec } = await openSession();
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const out = { id: spec.id, input: spec.input };

    // Cookie banner exactly as a first-time visitor sees it, then dismiss it the way a user would.
    out.cookieBannerAtStart = await page.evaluate(() => {
      const b = document.getElementById('cookie-consent-banner');
      return b ? getComputedStyle(b).display : null;
    });
    await page.getByRole('button', { name: 'Afvis', exact: true }).click();

    const inp = spec.input;
    if (inp.advanced) {
      await page.getByRole('radio', { name: /Avanceret/ }).click();
      for (const label of inp.advanced.buttons) {
        await page.getByRole('button', { name: label, exact: true }).click();
      }
    }
    if (inp.birthdate) {
      await page.getByRole('radio', { name: /Fødselsdato/ }).click();
      await page.getByLabel('Din fødselsdato:').fill(inp.birthdate);
    } else {
      await page.getByLabel('Din alder:').fill(String(inp.age));
    }
    await page.getByRole('radio', { name: inp.gender === 'male' ? 'Mand' : 'Kvinde', exact: true }).click();
    out.formProgressText = norm(await page.locator('.form-progress').innerText());
    await page.getByRole('button', { name: 'Beregn levetid' }).click();
    await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
    await page.locator('.time-unit').nth(4).waitFor();
    await page.waitForTimeout(500);
    out.urlAfterSubmit = new URL(page.url()).pathname + new URL(page.url()).search;

    // --- deterministic capture of the result view ---
    const capture = () =>
      page.evaluate(() => {
        const n = (s) => s.replace(/\s+/g, ' ').trim();
        const sections = [...document.querySelectorAll('main .countdown-timer, main .card')].map((el) => {
          const h = el.querySelector('h1,h2,h3,h4');
          return { heading: h ? n(h.innerText) : null, text: n(el.innerText) };
        });
        const sr = document.querySelector('main p.sr-only');
        return {
          srAnnouncement: sr ? n(sr.textContent) : null,
          countdown: [...document.querySelectorAll('.countdown-timer .time-unit')].map((u) => ({
            label: n(u.querySelector('.time-label')?.innerText || ''),
            value: n(u.querySelector('.time-value')?.innerText || ''),
          })),
          headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((e) => `${e.tagName.toLowerCase()}: ${n(e.innerText)}`),
          sections,
          partnerAdsLinks: [...document.querySelectorAll('a[href*="partner-ads.com"]')].map((a) => ({
            href: a.getAttribute('href'),
            rel: a.getAttribute('rel'),
            target: a.getAttribute('target'),
            text: n(a.innerText),
          })),
          externalLinks: [...document.querySelectorAll('a[href^="http"]')]
            .filter((a) => new URL(a.href).hostname !== location.hostname)
            .map((a) => ({ href: a.getAttribute('href'), rel: a.getAttribute('rel'), target: a.getAttribute('target') })),
          localStorage: Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])),
          documentTitle: document.title,
        };
      });
    const cap = await capture();

    const sec = (h) => cap.sections.find((s) => s.heading && s.heading.startsWith(h));
    const num = (s) => (s == null ? null : s);
    const m = (re, t) => {
      const r = t ? t.match(re) : null;
      return r ? r.slice(1) : null;
    };
    const lived = sec('Dit livsforløb');
    const sand = sec('Chance for at nå');
    const sam = sec('Sammenlign med gennemsnittet');
    const pen = sec('Pension & arbejdsår');
    const hh = sec('Hvad hvis?');
    const bio = cap.sections.find((s) => /Din biologiske alder/.test(s.text));
    const fam = sec('Jer to sammen');
    out.headline = {
      remainingYears: num(m(/Du har statistisk ([\d.,]+) år tilbage/, cap.srAnnouncement)?.[0]),
      expectedAgeAtDeath: num(m(/Din forventede alder \(([\d.,]+) år\)/, sam?.text)?.[0]),
      expectedAgeInWhatIf: num(m(/Din forventede alder ([\d.,]+)/, hh?.text)?.[0]),
      countdown: Object.fromEntries(cap.countdown.map((c) => [c.label, c.value])),
      lifeProgress: lived ? m(/([\d.,]+)% Levet ([\d.,]+) Dage levet ([\d.,]+) Hjerteslag/, lived.text) : null,
      preciseAge: lived ? m(/Din præcise alder (.+?) Født: (\S+)/, lived.text) : null,
      survivalProbabilities: sand ? [...sand.text.matchAll(/(\d+) år (\d+)%/g)].map((x) => ({ age: Number(x[1]), pct: Number(x[2]) })) : [],
      comparison: sam
        ? {
            rows: [...sam.text.matchAll(/(Dig|Danmark \(gennemsnit\)|Japan \(højest i verden\)|Verdensgennemsnit) ([\d.,]+) år/g)].map((x) => ({ label: x[1], years: x[2] })),
            verdict: m(/(Du ligger [^🎉]*?(?:gennemsnit|omkring det danske gennemsnit))/, sam.text)?.[0] ?? null,
          }
        : null,
      pension: pen
        ? { birthYearLine: m(/årgang \((\d{4})\)/, pen.text)?.[0] ?? null, tiles: m(/(\d+) Folkepensionsalder (\d+) (Arbejdsår tilbage|Pensioneret) (\d+) Forventede pensionsår/, pen.text) }
        : null,
      biologicalAge: bio ? m(/(\d+) år · du er (\d+) (.+?) Beregnet/, bio.text) : null,
      couple: fam ? 'section present (see interactions.couple)' : null,
    };
    out.headings = cap.headings;
    out.sections = cap.sections;
    out.partnerAdsLinks = cap.partnerAdsLinks;
    out.externalLinks = cap.externalLinks;
    out.documentTitle = cap.documentTitle;

    // --- interactions on result widgets (still the real UI) ---
    out.interactions = {};
    const ins0 = cap.sections.find((s) => /Hvor meget livsforsikring/.test(s.text));
    await page.locator('#ins-income').fill('500000');
    await page.waitForTimeout(150);
    const ins1 = await page.evaluate(() => {
      const card = [...document.querySelectorAll('main .card')].find((c) => /Hvor meget livsforsikring/.test(c.innerText));
      const a = card.querySelector('a[href*="partner-ads.com"]');
      return { text: card.innerText.replace(/\s+/g, ' ').trim(), link: { href: a.getAttribute('href'), rel: a.getAttribute('rel'), target: a.getAttribute('target'), text: a.innerText.replace(/\s+/g, ' ').trim() } };
    });
    out.interactions.insurance = { inputs: { income: 500000, yearsDefault: '10' }, before: ins0 ? ins0.text : null, after: ins1.text, link: ins1.link };

    await page.locator('#partnerAge').fill('38');
    await page.waitForTimeout(150);
    out.interactions.couple = {
      inputs: { partnerAge: 38, partnerGenderDefault: 'female' },
      text: await page.evaluate(() => [...document.querySelectorAll('main .card')].find((c) => /Jer to sammen/.test(c.innerText)).innerText.replace(/\s+/g, ' ').trim()),
    };

    // Reload the deep link the app just wrote to the URL and check it reproduces the same result (round trip).
    const deep = BASE + out.urlAfterSubmit;
    await page.goto(deep, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
    await page.waitForTimeout(400);
    const cap2 = await capture();
    const strip = (c) => JSON.stringify({ sr: c.srAnnouncement, cd: c.countdown, sec: c.sections.filter((s) => !/livsforsikring|Jer to sammen|Din historik/.test(s.text)) });
    out.deepLinkRoundTrip = { url: out.urlAfterSubmit, sameResultAsFormSubmit: strip(cap) === strip(cap2), srAnnouncement: cap2.srAnnouncement };

    Object.assign(out, await finishRec(page, rec));
    return out;
  } finally {
    await ctx.close();
  }
}

const ROUTES = ['/', '/hvor-lang-tid-har-jeg-tilbage', '/dodsalder-calculator', '/livsstil-og-levetid', '/levetid-beregner-danmark', '/xyz'];
const CASES = [
  { id: '1-male-40', input: { gender: 'male', age: 40 } },
  { id: '2-female-65', input: { gender: 'female', age: 65 } },
  { id: '3-male-birthdate-1985-06-15', input: { gender: 'male', birthdate: '1985-06-15' } },
  {
    id: '4-bonus-male-50-advanced',
    input: { gender: 'male', age: 50, advanced: { buttons: ['Let (1-10/dag)', 'Moderat (4-6 t/uge)', 'Sund', '7-8 timer'] } },
  },
];

const result = {
  harness: {
    version: HARNESS_VERSION,
    frozenClock: FROZEN_ISO,
    locale: 'da-DK',
    timezone: 'Europe/Copenhagen',
    viewport: '1280x900',
    plausible: PLAUSIBLE_SRC ? 'pinned script replayed locally, POST /api/event recorded + acknowledged, never forwarded' : 'script aborted; only window.plausible stub queue recorded',
    note: 'Origin of the tested base URL is rewritten to https://levetidsberegner.dk so local and live runs are directly diffable.',
  },
};
if (ONLY !== 'cases') {
  result.routes = {};
  for (const r of ROUTES) {
    console.error(`[baseline] route ${r}`);
    result.routes[r] = await readRoute(r);
  }
}
if (ONLY !== 'routes') {
  result.cases = {};
  for (const c of CASES) {
    console.error(`[baseline] case ${c.id}`);
    result.cases[c.id] = await runCase(c);
  }
}
await browser.close();
console.error(`[baseline] requests that reached the server (excl. replayed assets): ${requestsToServer}`);

const out = JSON.stringify(result, (k, v) => (typeof v === 'string' ? v.split(BASE_ORIGIN).join(PROD_ORIGIN) : v), 2);
process.stdout.write(out + '\n');
