// Shared helpers for the levetidsberegner.dk audit (measure1).
// Read-only against the live site. Analytics + affiliate traffic is always blocked.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'https://levetidsberegner.dk';
const OUT = process.env.OUT || path.join(__dirname, 'out');

// Hosts we never want to hit from sessions we control (stats / affiliate billing).
const BLOCK_RE = /(analytics\.holstjensen\.eu|partner-ads\.com)/i;

const PAGES = [
  { slug: 'home', path: '/', ready: 'h1' },
  { slug: 'hvor-lang-tid', path: '/hvor-lang-tid-har-jeg-tilbage', ready: 'h1' },
  { slug: 'dodsalder', path: '/dodsalder-calculator', ready: 'h1' },
  { slug: 'livsstil', path: '/livsstil-og-levetid', ready: 'h1' },
  { slug: 'danmark', path: '/levetid-beregner-danmark', ready: 'h1' },
  { slug: '404', path: '/xyz', ready: 'h1' },
];

// Moto G Power-like profile (Playwright has no built-in device for it).
const MOBILE = {
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36',
  viewport: { width: 412, height: 892 },
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true,
};

// CDP throttle profile (documented in REPORT.md): DevTools "Fast 4G"-like + 4x CPU slowdown.
const NET_4G = {
  offline: false,
  latency: 60, // ms minimum RTT added by CDP
  downloadThroughput: (9 * 1024 * 1024) / 8, // 9 Mbit/s
  uploadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbit/s
};
const CPU_RATE = 4;

async function launch(opts = {}) {
  return chromium.launch({ headless: true, args: ['--no-sandbox'], ...opts });
}

// New context. serviceWorkers are blocked by default so route-blocking is reliable; pass sw:true to allow.
async function newContext(browser, { width = 1440, height = 900, dark = false, mobile = false, storage = {}, sw = false } = {}) {
  const base = mobile ? { ...MOBILE } : { viewport: { width, height }, deviceScaleFactor: 1 };
  if (!mobile && width < 700) { base.isMobile = false; }
  const ctx = await browser.newContext({
    ...base,
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    colorScheme: dark ? 'dark' : 'light',
    serviceWorkers: sw ? 'allow' : 'block',
  });
  const blocked = [];
  await ctx.route(BLOCK_RE, (route) => {
    blocked.push(route.request().url());
    return route.abort();
  });
  // Pre-set localStorage before any page script runs.
  const entries = Object.entries(storage);
  if (entries.length) {
    await ctx.addInitScript((kv) => {
      try {
        for (const [k, v] of kv) localStorage.setItem(k, v);
      } catch (e) {}
    }, entries);
  }
  ctx.__blocked = blocked;
  return ctx;
}

async function applyThrottle(ctx, page) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET_4G);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  return cdp;
}

async function waitReady(page, selector = 'h1', timeout = 20000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  // Let lazy chunks / Suspense settle; spinner text "Indlæser..." must be gone.
  await page.waitForFunction(() => !document.body.innerText.includes('Indlæser...'), null, { timeout });
  await page.waitForTimeout(500);
}

// Fill the home form: age 40, male, optionally submit. Returns nothing.
async function fillHome(page, { age = '40', gender = 'Mand', submit = false } = {}) {
  await page.fill('#age', age);
  await page.getByRole('radio', { name: gender, exact: true }).click();
  if (submit) await page.getByRole('button', { name: 'Beregn levetid' }).click();
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

module.exports = {
  BASE, OUT, BLOCK_RE, PAGES, MOBILE, NET_4G, CPU_RATE,
  launch, newContext, applyThrottle, waitReady, fillHome, ensureDir, writeJson,
};
