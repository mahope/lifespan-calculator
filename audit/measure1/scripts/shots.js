// Task 4: responsive screenshots + horizontal overflow + small tap targets.
// Raw (large) JPEGs go to out/screenshots-raw (not shipped); compress.sh makes the shipped <=150 KB versions.
const fs = require('fs');
const C = require('./common');

const WIDTHS = [320, 390, 768, 1440];
const PAGES = [
  { key: 'home', path: '/', state: 'initial' },
  { key: 'home-result', path: '/', state: 'result' },
  { key: 'hvor-lang-tid', path: '/hvor-lang-tid-har-jeg-tilbage' },
  { key: 'dodsalder', path: '/dodsalder-calculator' },
  { key: 'livsstil', path: '/livsstil-og-levetid' },
  { key: 'danmark', path: '/levetid-beregner-danmark' },
  { key: '404', path: '/xyz' },
  { key: 'privatlivspolitik', path: '/privatlivspolitik' },
  { key: 'privatlivspolitik-html', path: '/privatlivspolitik.html' },
  { key: 'cookiepolitik-html', path: '/cookiepolitik.html' },
];

// Runs inside the page. Returns overflow info and undersized tap targets.
const MEASURE = () => {
  const vw = window.innerWidth;
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const c = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
    if (c.length) s += '.' + c.join('.');
    const label = el.getAttribute('aria-label') || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    return s + (label ? ` "${label}"` : '');
  };
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.width <= 1 && r.height <= 1) return false; // sr-only
    return true;
  };
  const doc = document.documentElement;
  const overflow = {
    innerWidth: vw, docScrollWidth: doc.scrollWidth, bodyScrollWidth: document.body.scrollWidth,
    horizontalScroll: doc.scrollWidth > vw || document.body.scrollWidth > vw,
    offenders: [],
  };
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 0.5 || r.left < -0.5) {
      // skip children of an overflow-hidden/auto scroll container that clips them
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') { const pr = p.getBoundingClientRect(); if (pr.right <= vw + 0.5 && pr.left >= -0.5) { clipped = true; break; } }
      }
      if (!clipped) overflow.offenders.push({ el: sel(el), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
    }
  }
  overflow.offenders = overflow.offenders.slice(0, 12);

  const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=radio], [role=checkbox], [role=tab], [role=link], [tabindex]:not([tabindex="-1"])')].filter(vis);
  const rects = interactive.map((el) => ({ el, r: el.getBoundingClientRect() }));
  const small = [];
  for (const { el, r } of rects) {
    if (r.width >= 24 && r.height >= 24) continue;
    // inline link inside a sentence is exempt under WCAG 2.5.8
    const cs = getComputedStyle(el);
    const inlineInText = el.tagName === 'A' && cs.display === 'inline' && el.parentElement && (el.parentElement.textContent || '').trim().length > (el.textContent || '').trim().length + 10;
    // spacing exception: a 24px circle centred on the target must not intersect another target
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let clash = 0;
    for (const o of rects) {
      if (o.el === el || el.contains(o.el) || o.el.contains(el)) continue;
      const nx = Math.max(o.r.left, Math.min(cx, o.r.right)), ny = Math.max(o.r.top, Math.min(cy, o.r.bottom));
      if ((nx - cx) ** 2 + (ny - cy) ** 2 < 144) clash++;
    }
    small.push({ el: sel(el), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, inlineInText, spacingClash: clash, wcag258Fail: !inlineInText && clash > 0 });
  }
  return { overflow, interactive: interactive.length, small, pageHeight: Math.max(doc.scrollHeight, document.body.scrollHeight) };
};

async function shot(page, file, opts = {}) {
  await page.screenshot({ path: file, type: 'jpeg', quality: 80, fullPage: opts.fullPage !== false, animations: 'disabled', caret: 'hide' });
}

(async () => {
  const browser = await C.launch();
  const raw = C.ensureDir(C.OUT + '/screenshots-raw');
  const report = [];
  const log = (...a) => console.log(...a);

  async function visit(page, p) {
    const resp = await page.goto(C.BASE + p.path, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('h1', { state: 'visible', timeout: 15000 }).catch(() => {});
    await page.waitForFunction(() => !document.body.innerText.includes('Indlæser...'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    if (p.state === 'result') {
      await C.fillHome(page, { submit: true });
      await page.waitForSelector('.time-value', { state: 'visible', timeout: 30000 });
      await page.waitForTimeout(1500);
    }
    return resp;
  }

  for (const w of WIDTHS) {
    for (const p of PAGES) {
      const ctx = await C.newContext(browser, { width: w, height: w >= 1000 ? 900 : 800, storage: { theme: 'light', 'consent:v1': 'declined' } });
      const page = await ctx.newPage();
      const name = `${p.key}-${w}-light`;
      try {
        const resp = await visit(page, p);
        await shot(page, `${raw}/${name}.jpg`);
        const m = await page.evaluate(MEASURE);
        const final = new URL(page.url());
        report.push({ name, page: p.key, path: p.path, width: w, status: resp ? resp.status() : null, finalPath: final.pathname + final.search, title: await page.title(), h1: await page.locator('h1').first().textContent().catch(() => null), ...m });
        log(name, 'h=', m.pageHeight, 'hscroll=', m.overflow.horizontalScroll, 'small=', m.small.length);
      } catch (e) {
        report.push({ name, error: String(e).slice(0, 300) });
        log(name, 'ERROR', String(e).slice(0, 200));
      }
      await ctx.close();
    }
  }

  // Dark mode at 390 (home initial + result) and 1440 (home initial)
  for (const [w, p] of [[390, PAGES[0]], [390, PAGES[1]], [1440, PAGES[0]]]) {
    const ctx = await C.newContext(browser, { width: w, height: 800, dark: true, storage: { theme: 'dark', 'consent:v1': 'declined' } });
    const page = await ctx.newPage();
    const name = `${p.key}-${w}-dark`;
    try { await visit(page, p); await shot(page, `${raw}/${name}.jpg`); log(name, 'ok'); } catch (e) { log(name, 'ERROR', String(e).slice(0, 200)); }
    await ctx.close();
  }

  // First visit WITH cookie banner, 390 + 1440: viewport shot (what the user sees) + full page.
  for (const w of [390, 1440]) {
    for (const dark of [false, true]) {
      const ctx = await C.newContext(browser, { width: w, height: 800, dark, storage: { theme: dark ? 'dark' : 'light' } });
      const page = await ctx.newPage();
      await page.goto(C.BASE + '/', { waitUntil: 'load', timeout: 60000 });
      await C.waitReady(page, 'h1', 30000);
      const sfx = dark ? 'dark' : 'light';
      await shot(page, `${raw}/home-banner-${w}-${sfx}-viewport.jpg`, { fullPage: false });
      if (!dark) await shot(page, `${raw}/home-banner-${w}-${sfx}-full.jpg`);
      // does the banner cover the CTA / form?
      const cover = await page.evaluate(() => {
        const b = document.getElementById('cookie-consent-banner');
        if (!b || getComputedStyle(b).display === 'none') return { bannerVisible: false };
        const br = b.getBoundingClientRect();
        const cta = [...document.querySelectorAll('button')].find((x) => /Beregn levetid/.test(x.textContent));
        const age = document.getElementById('age');
        const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), covered: r.bottom > br.top && r.top < br.bottom }; };
        return { bannerVisible: true, banner: { top: Math.round(br.top), height: Math.round(br.height) }, viewportH: window.innerHeight, cta: info(cta), age: info(age), pageHeight: document.documentElement.scrollHeight, bannerPosition: getComputedStyle(b).position, bannerZ: getComputedStyle(b).zIndex };
      });
      // Does a click on the CTA area get intercepted? scroll CTA to the bottom edge and try elementFromPoint.
      const intercept = await page.evaluate(() => {
        const cta = [...document.querySelectorAll('button')].find((x) => /Beregn levetid/.test(x.textContent));
        if (!cta) return null;
        cta.scrollIntoView({ block: 'end' });
        const r = cta.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { ctaBottom: Math.round(r.bottom), ctaTop: Math.round(r.top), vh: window.innerHeight, topElementIsCta: top === cta || cta.contains(top), topElement: top ? top.tagName + '#' + top.id : null };
      });
      report.push({ name: `home-banner-${w}-${sfx}`, cover, intercept });
      log('banner', w, sfx, JSON.stringify(cover), JSON.stringify(intercept));
      await ctx.close();
    }
  }
  C.writeJson(C.OUT + '/screenshots-report.json', report);
  await browser.close();
})();
