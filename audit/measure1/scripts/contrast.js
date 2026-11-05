// Full list of color-contrast failing nodes for home (initial) light vs dark at 390, grouped by distinct (selector-ish, fg, bg, ratio).
const AxeBuilder = require('@axe-core/playwright').default;
const C = require('./common');
(async () => {
  const browser = await C.launch();
  const out = {};
  for (const scheme of ['light', 'dark']) {
    const ctx = await C.newContext(browser, { width: 390, height: 900, dark: scheme === 'dark', storage: { theme: scheme, 'consent:v1': 'declined' } });
    const page = await ctx.newPage();
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    const v = res.violations[0];
    const rows = (v ? v.nodes : []).map((n) => {
      const d = n.any[0] && n.any[0].data || {};
      return { target: n.target.join(' ').slice(-90), ratio: d.contrastRatio, fg: d.fgColor, bg: d.bgColor, size: d.fontSize, text: String(n.html).replace(/<[^>]+>/g, '').slice(0, 0) + (n.html.slice(0, 70)) };
    });
    out[scheme] = { count: rows.length, rows };
    await ctx.close();
  }
  C.writeJson(C.OUT + '/contrast-home-390.json', out);
  for (const s of ['light', 'dark']) { console.log('== ' + s, out[s].count); for (const r of out[s].rows) console.log(r.ratio, r.fg, r.bg, r.size, '|', r.target.slice(-70)); }
  await browser.close();
})();
