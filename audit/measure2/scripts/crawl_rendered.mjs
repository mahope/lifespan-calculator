// Part A (rendered): Playwright render of every HTML URL found by crawl_raw.mjs.
// Usage: PLAYWRIGHT_MODULE=/abs/path/playwright-core/index.mjs node crawl_rendered.mjs <crawl-raw.json> <out.json>
// Third parties (analytics, partner-ads, everything else) are aborted; service workers blocked; fresh context per URL.
// Same-origin /assets/* responses are fetched once and replayed from memory to keep live request volume low.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

async function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_MODULE, 'playwright-core', 'playwright'].filter(Boolean);
  for (const t of tries) {
    try {
      return await import(t.startsWith('/') ? pathToFileURL(t).href : t);
    } catch { /* try next */ }
  }
  throw new Error('playwright-core not found; set PLAYWRIGHT_MODULE');
}
const { chromium } = await loadPlaywright();

const [rawPath, outPath] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(rawPath, 'utf8')).results;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 levetid-audit/1.0';

const targets = raw.filter((r) => !r.error && /text\/html/i.test(r.contentType || '')).map((r) => r.requested);
const browser = await chromium.launch({ headless: true });
const assetCache = new Map();
const results = [];
let liveDocRequests = 0;
let liveAssetRequests = 0;

for (const url of targets) {
  const origin = new URL(url).origin;
  const ctx = await browser.newContext({
    serviceWorkers: 'block',
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    viewport: { width: 1280, height: 900 },
    userAgent: UA,
    colorScheme: 'light',
  });
  const blocked = new Set();
  const consoleMsgs = [];
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname !== new URL(url).hostname) {
      blocked.add(u.host);
      return route.abort();
    }
    if (req.resourceType() === 'document') {
      liveDocRequests++;
      return route.continue();
    }
    const key = u.pathname + u.search;
    if (assetCache.has(key)) return route.fulfill(assetCache.get(key));
    liveAssetRequests++;
    const resp = await route.fetch();
    const body = await resp.body();
    const entry = { status: resp.status(), headers: resp.headers(), body };
    if (resp.status() === 200) assetCache.set(key, entry);
    return route.fulfill(entry);
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text().slice(0, 160)}`);
  });
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${String(e.message).slice(0, 160)}`));
  const rec = { requested: url };
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);
    rec.docStatus = resp ? resp.status() : null;
    rec.rendered = await page.evaluate(() => {
      const q = (s) => [...document.querySelectorAll(s)];
      const txt = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
      const banner = document.getElementById('cookie-consent-banner');
      const expl = document.querySelector('[data-seo-explainer]');
      return {
        url: location.href,
        title: document.title,
        canonical: q('link[rel="canonical"]').map((e) => e.href),
        robots: q('meta[name="robots"]').map((e) => e.content),
        description: q('meta[name="description"]').map((e) => e.content),
        ogImage: q('meta[property="og:image"]').map((e) => e.content),
        ogTitle: q('meta[property="og:title"]').map((e) => e.content),
        h1: q('h1').map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
        h2: q('h2').slice(0, 6).map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
        ldTypes: q('script[type="application/ld+json"]').map((e) => {
          try { return JSON.parse(e.textContent)['@type']; } catch { return 'INVALID'; }
        }),
        footerCount: q('footer').length,
        rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : null,
        staticExplainerVisible: !!(expl && expl.offsetParent !== null),
        cookieBannerDisplay: banner ? getComputedStyle(banner).display : null,
        notFoundShown: /Side ikke fundet/.test(txt),
        privacyPolicyTextShown: /Vi tager dit privatliv alvorligt/.test(txt),
        cookiePolicyTextShown: /Vi anvender som udgangspunkt kun nødvendige cookies/.test(txt),
        calculatorFormShown: !!document.getElementById('age'),
        bodyText200: txt.slice(0, 200),
        metaDescriptionCount: q('meta[name="description"]').length,
      };
    });
  } catch (e) {
    rec.error = String(e.message).split('\n')[0];
  }
  rec.blockedThirdPartyHosts = [...blocked].sort();
  rec.console = consoleMsgs;
  results.push(rec);
  await ctx.close();
}
await browser.close();
writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), ua: UA, liveDocRequests, liveAssetRequests, results }, null, 2));
console.log(`rendered ${results.length} URLs; doc requests ${liveDocRequests}, asset requests ${liveAssetRequests}`);
