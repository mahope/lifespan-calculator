// Task 2: Web Vitals + interaction timing on / with Moto G Power-like profile, Fast-4G-like CDP throttle, CPU 4x.
// Scenarios: first-visit (cookie banner shown), declined-consent load, submit male/40 (results state), desktop unthrottled submit.
const os = require('os');
const C = require('./common');

const INIT = () => {
  const m = (window.__m = { lcp: [], cls: 0, clsEntries: [], longtasks: [], loaf: [], events: [], fcp: null, marks: {}, errs: [] });
  const po = (type, cb, extra = {}) => {
    try { new PerformanceObserver((l) => l.getEntries().forEach(cb)).observe({ type, buffered: true, ...extra }); }
    catch (e) { m.errs.push(type + ':' + e); }
  };
  po('paint', (e) => { if (e.name === 'first-contentful-paint') m.fcp = e.startTime; });
  po('largest-contentful-paint', (e) => m.lcp.push({
    t: e.startTime, size: e.size, tag: e.element ? e.element.tagName : null,
    cls: e.element ? String(e.element.className).slice(0, 80) : null,
    id: e.element ? e.element.id : null,
    text: e.element ? (e.element.textContent || '').slice(0, 50) : null, url: e.url,
  }));
  po('layout-shift', (e) => {
    m.clsAll = (m.clsAll || 0) + e.value;
    if (!e.hadRecentInput) m.cls += e.value;
    m.clsEntries.push({ t: e.startTime, v: e.value, ri: e.hadRecentInput, src: (e.sources || []).map((s) => s.node && (s.node.tagName + '.' + String(s.node.className || '').slice(0, 50))).slice(0, 3) });
  });
  po('longtask', (e) => m.longtasks.push({ t: e.startTime, d: e.duration }));
  po('long-animation-frame', (e) => m.loaf.push({
    t: e.startTime, d: e.duration, block: e.blockingDuration,
    scripts: (e.scripts || []).slice(0, 3).map((s) => ({ inv: s.invoker, src: String(s.sourceURL || '').slice(-60), d: s.duration })),
  }));
  po('event', (e) => m.events.push({ name: e.name, t: e.startTime, d: e.duration, ps: e.processingStart, pe: e.processingEnd, iid: e.interactionId }), { durationThreshold: 16 });
  document.addEventListener('click', (ev) => {
    const b = ev.target && ev.target.closest && ev.target.closest('button[type=submit]');
    if (b && !m.marks.submitClick) m.marks.submitClick = performance.now();
  }, true);
  const check = () => {
    if (m.marks.submitClick && !m.marks.resultsDom && document.querySelector('.time-value')) {
      m.marks.resultsDom = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => { m.marks.resultsPaint = performance.now(); }));
    }
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true });
};

const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const rnd = (x, d = 0) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

function sessionCls(entries) {
  // max session window: gap < 1s, window <= 5s
  let best = 0, cur = 0, start = 0, last = 0;
  for (const e of entries) {
    if (cur === 0 || e.t - last > 1000 || e.t - start > 5000) { cur = e.v; start = e.t; } else cur += e.v;
    last = e.t; if (cur > best) best = cur;
  }
  return best;
}

async function oneRun({ browser, scenario, throttle, mobile, storage, submit }) {
  const ctx = await C.newContext(browser, { mobile, width: 1440, height: 900, storage });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  if (throttle) await C.applyThrottle(ctx, page);
  const consoleErr = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleErr.push(m.type() + ': ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => consoleErr.push('pageerror: ' + String(e).slice(0, 200)));
  const load0 = os.loadavg()[0];
  const t0 = Date.now();
  await page.goto(C.BASE + '/', { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;
  await C.waitReady(page, 'h1', 30000);
  await page.waitForTimeout(3000);
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource');
    return {
      ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd,
      resources: res.length,
      transfer: res.reduce((s, r) => s + (r.transferSize || 0), 0) + (n.transferSize || 0),
    };
  });
  const pre = await page.evaluate(() => JSON.parse(JSON.stringify(window.__m)));
  const out = {
    scenario, loadavg_start: rnd(load0, 2), loadavg_end: rnd(os.loadavg()[0], 2), goto_load_ms: loadMs,
    fcp: rnd(pre.fcp), lcp: rnd(pre.lcp.length ? pre.lcp[pre.lcp.length - 1].t : null),
    lcp_el: pre.lcp.length ? pre.lcp[pre.lcp.length - 1] : null,
    cls_total: rnd(pre.cls, 4), cls_all_ignoring_recentInput_flag: rnd(pre.clsAll || 0, 4), cls_session: rnd(sessionCls(pre.clsEntries), 4), cls_entries: pre.clsEntries.slice(0, 6),
    longtasks_pre: pre.longtasks.length, tbt_like_ms: rnd(pre.longtasks.reduce((s, l) => s + Math.max(0, l.d - 50), 0)),
    longtasks_pre_top: pre.longtasks.sort((a, b) => b.d - a.d).slice(0, 3),
    nav, console: consoleErr.slice(0, 8), blocked: ctx.__blocked.length,
  };
  if (submit) {
    await C.fillHome(page, { age: '40', gender: 'Mand', submit: false });
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => ({ n: window.__m.longtasks.length, ev: window.__m.events.length }));
    const wall0 = Date.now();
    await page.getByRole('button', { name: 'Beregn levetid' }).click();
    await page.waitForFunction(() => window.__m.marks.resultsPaint, null, { timeout: 60000 });
    const wallMs = Date.now() - wall0;
    await page.waitForTimeout(10000); // watch the ticking countdown / idle re-render cost
    const post = await page.evaluate(() => JSON.parse(JSON.stringify(window.__m)));
    const sc = post.marks.submitClick;
    const lt = post.longtasks.filter((l) => l.t >= sc - 5);
    const ev = post.events.filter((e) => e.t >= sc - 5);
    const inter = ev.filter((e) => e.iid > 0);
    const afterPaint = lt.filter((l) => l.t > post.marks.resultsPaint + 500);
    const domCount = await page.evaluate(() => document.getElementsByTagName('*').length);
    const imgs = await page.evaluate(() => document.images.length);
    out.submit = {
      click_to_results_dom_ms: rnd(post.marks.resultsDom - sc),
      click_to_results_paint_ms: rnd(post.marks.resultsPaint - sc),
      playwright_wall_ms: wallMs,
      longtasks_after_click: lt.length,
      longtasks_after_click_total_ms: rnd(lt.reduce((s, l) => s + l.d, 0)),
      blocking_ms_after_click: rnd(lt.reduce((s, l) => s + Math.max(0, l.d - 50), 0)),
      longest_task_ms: rnd(Math.max(0, ...lt.map((l) => l.d))),
      longtasks_in_idle_window_after_results: afterPaint.length,
      idle_longest_ms: rnd(Math.max(0, ...afterPaint.map((l) => l.d))),
      inp_like_ms: rnd(Math.max(0, ...inter.map((e) => e.d))),
      interaction_events: inter.map((e) => ({ name: e.name, d: e.d, ps_minus_start: rnd(e.ps - e.t), proc: rnd(e.pe - e.ps) })).slice(0, 8),
      loaf_after_click: post.loaf.filter((l) => l.t >= sc - 5).sort((a, b) => b.d - a.d).slice(0, 3),
      cls_after_click: rnd(post.clsEntries.filter((e) => e.t >= sc - 5).reduce((s, e) => s + e.v, 0), 4),
      cls_total_after_results: rnd(post.cls, 4),
      cls_entries_after_click: post.clsEntries.filter((e) => e.t >= sc - 5).slice(0, 6),
      dom_elements_after_results: domCount, images: imgs,
      url_after: new URL(page.url()).search,
    };
  }
  await ctx.close();
  return out;
}

(async () => {
  const browser = await C.launch();
  const N = 3;
  const results = { profile: { mobile: C.MOBILE, net: C.NET_4G, cpu: C.CPU_RATE, n: N, node: process.version, cores: os.cpus().length }, runs: [] };
  const scenarios = [
    { scenario: 'mobile-4g-firstvisit-banner', throttle: true, mobile: true, storage: {}, submit: false },
    { scenario: 'mobile-4g-declined-submit', throttle: true, mobile: true, storage: { 'consent:v1': 'declined' }, submit: true },
    { scenario: 'desktop-unthrottled-declined-submit', throttle: false, mobile: false, storage: { 'consent:v1': 'declined' }, submit: true },
  ];
  for (const s of scenarios) {
    for (let i = 0; i < N; i++) {
      try {
        const r = await oneRun({ browser, ...s });
        results.runs.push(r);
        console.log(s.scenario, i + 1, 'fcp', r.fcp, 'lcp', r.lcp, 'cls', r.cls_total, 'cls_all', r.cls_all_ignoring_recentInput_flag, r.submit ? 'click->paint ' + r.submit.click_to_results_paint_ms : '');
      } catch (e) {
        results.runs.push({ scenario: s.scenario, error: String(e).slice(0, 400) });
        console.log(s.scenario, i + 1, 'ERROR', String(e).slice(0, 200));
      }
    }
  }
  // medians
  results.medians = {};
  for (const s of scenarios) {
    const rs = results.runs.filter((r) => r.scenario === s.scenario && !r.error);
    const m = { n: rs.length, fcp: median(rs.map((r) => r.fcp)), lcp: median(rs.map((r) => r.lcp)), cls: median(rs.map((r) => r.cls_total)), cls_all: median(rs.map((r) => r.cls_all_ignoring_recentInput_flag)), tbt_like_ms: median(rs.map((r) => r.tbt_like_ms)), load_ms: median(rs.map((r) => r.nav.load)) };
    if (s.submit) {
      m.click_to_results_paint_ms = median(rs.map((r) => r.submit.click_to_results_paint_ms));
      m.blocking_ms_after_click = median(rs.map((r) => r.submit.blocking_ms_after_click));
      m.longest_task_ms = median(rs.map((r) => r.submit.longest_task_ms));
      m.inp_like_ms = median(rs.map((r) => r.submit.inp_like_ms));
      m.cls_after_click = median(rs.map((r) => r.submit.cls_after_click));
    }
    results.medians[s.scenario] = m;
  }
  C.writeJson(C.OUT + '/vitals.json', results);
  console.log(JSON.stringify(results.medians, null, 1));
  await browser.close();
})();
