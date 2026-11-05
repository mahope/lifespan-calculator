// Follow-up diagnostics: (A) result-state horizontal overflow offenders at 320/390, (B) layout-shift sources on first load
// (google-chrome vs playwright chromium), (C) cookie-banner overlap with instant scroll.
const C = require('./common');

const LS_INIT = () => {
  window.__ls = [];
  const rect = (r) => r && { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ls.push({
      t: Math.round(e.startTime), v: Math.round(e.value * 1e4) / 1e4, recentInput: e.hadRecentInput,
      src: (e.sources || []).map((s) => ({ node: s.node ? s.node.nodeName + (s.node.id ? '#' + s.node.id : '') + '.' + String(s.node.className || '').slice(0, 40) + ' "' + (s.node.textContent || '').trim().slice(0, 25) + '"' : null, prev: rect(s.previousRect), cur: rect(s.currentRect) })),
    }))).observe({ type: 'layout-shift', buffered: true });
    window.__marks = [];
    new MutationObserver(() => {
      const root = document.getElementById('root');
      const foot = document.querySelector('body > footer');
      const key = (root ? root.children.length : -1) + '/' + (foot ? Math.round(foot.getBoundingClientRect().top) : -1);
      if (!window.__marks.length || window.__marks[window.__marks.length - 1].k !== key) window.__marks.push({ t: Math.round(performance.now()), k: key, rootChildren: root ? root.children.length : -1, rootText: root ? (root.innerText || '').slice(0, 20) : '', footTop: foot ? Math.round(foot.getBoundingClientRect().top) : -1 });
    }).observe(document, { childList: true, subtree: true });
  } catch (e) {}
};

(async () => {
  const res = {};
  // (A) overflow in result state
  const browser = await C.launch();
  res.overflow_result_state = {};
  for (const w of [320, 390]) {
    const ctx = await C.newContext(browser, { width: w, height: 800, storage: { 'consent:v1': 'declined', theme: 'light' } });
    const page = await ctx.newPage();
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    await C.fillHome(page, { submit: true });
    await page.waitForSelector('.time-value', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1500);
    res.overflow_result_state[w] = await page.evaluate(() => {
      const vw = window.innerWidth;
      const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).slice(0, 4).join('.');
      const list = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 0.5) {
          const cs = getComputedStyle(el);
          list.push({ el: sel(el), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), right: Math.round(r.right), width: Math.round(r.width), pos: cs.position, display: cs.display, ox: cs.overflowX, parent: sel(el.parentElement), childCount: el.children.length });
        }
      }
      // keep the outermost offenders only (no ancestor in list)
      const set = new Set(list.map((x) => x.el + x.right));
      return { vw, docScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, count: list.length, sample: list.sort((a, b) => b.right - a.right).slice(0, 14) };
    });
    await ctx.close();
  }
  await browser.close();

  // (B) layout shifts: playwright chromium vs system google-chrome, unthrottled + mobile profile
  res.layout_shift = {};
  for (const [label, launchOpts] of [['playwright-chromium', {}], ['google-chrome-157', { executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--headless=new'] }]]) {
    const b = await C.launch(launchOpts);
    for (const mobile of [true, false]) {
      const ctx = await C.newContext(b, { mobile, width: 1440, height: 900, storage: {} });
      const page = await ctx.newPage();
      await page.addInitScript(LS_INIT);
      await page.goto(C.BASE + '/', { waitUntil: 'load' });
      await page.waitForTimeout(4000);
      const r = await page.evaluate(() => ({ ls: window.__ls, marks: window.__marks.slice(0, 12), total: window.__ls.filter((x) => !x.recentInput).reduce((s, x) => s + x.v, 0) }));
      res.layout_shift[`${label}-${mobile ? 'mobile' : 'desktop'}`] = r;
      await ctx.close();
    }
    await b.close();
  }

  // (C) banner overlap, with instant scroll
  const b2 = await C.launch();
  res.banner = {};
  for (const w of [390, 1440]) {
    const ctx = await C.newContext(b2, { width: w, height: 800, storage: {} });
    const page = await ctx.newPage();
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    res.banner[w] = await page.evaluate(() => {
      const root = document.documentElement; const prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
      const cta = [...document.querySelectorAll('button')].find((x) => /Beregn levetid/.test(x.textContent));
      const out = {};
      const bn = document.getElementById('cookie-consent-banner').getBoundingClientRect();
      out.banner = { top: Math.round(bn.top), height: Math.round(bn.height), vh: window.innerHeight, pctViewport: Math.round((bn.height / window.innerHeight) * 100) };
      // scroll so the CTA bottom sits at the viewport bottom edge (a natural place to stop scrolling)
      const r0 = cta.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r0.bottom - window.innerHeight + 8);
      const r = cta.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, window.innerHeight - 2));
      out.ctaAfterScroll = { top: Math.round(r.top), bottom: Math.round(r.bottom), topElementId: top ? (top.id || top.tagName) : null, coveredByBanner: !!top && !!top.closest('#cookie-consent-banner') };
      const ageR = document.getElementById('age').getBoundingClientRect();
      window.scrollTo(0, 0);
      const a = document.getElementById('age').getBoundingClientRect();
      out.ageInputAtLoad = { top: Math.round(a.top), bottom: Math.round(a.bottom), overlapsBanner: a.bottom > bn.top && a.top < bn.bottom };
      // total page height covered at very bottom
      window.scrollTo(0, document.documentElement.scrollHeight);
      const lastEl = document.querySelector('body > section[data-seo-explainer]'); const lr = lastEl.getBoundingClientRect();
      out.pageBottom = { sectionBottom: Math.round(lr.bottom), bannerTop: Math.round(bn.top), lastLinesCovered: lr.bottom > bn.top };
      root.style.scrollBehavior = prev;
      return out;
    });
    await ctx.close();
  }
  await b2.close();
  C.writeJson(C.OUT + '/extra.json', res);
  console.log(JSON.stringify(res.overflow_result_state, null, 1).slice(0, 3500));
  for (const [k, v] of Object.entries(res.layout_shift)) console.log(k, 'total', v.total, JSON.stringify(v.ls).slice(0, 700), JSON.stringify(v.marks).slice(0, 500));
  console.log(JSON.stringify(res.banner, null, 1));
})();
