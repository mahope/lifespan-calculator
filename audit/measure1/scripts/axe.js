// Task 3: axe-core via @axe-core/playwright. Pages x widths (390, 1440) x light/dark.
const fs = require('fs');
const AxeBuilder = require('@axe-core/playwright').default;
const C = require('./common');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const TARGETS = [
  { key: 'home-initial', path: '/', state: 'initial' },
  { key: 'home-result', path: '/', state: 'result' },
  { key: 'hvor-lang-tid', path: '/hvor-lang-tid-har-jeg-tilbage' },
  { key: 'dodsalder', path: '/dodsalder-calculator' },
  { key: 'livsstil', path: '/livsstil-og-levetid' },
  { key: 'danmark', path: '/levetid-beregner-danmark' },
  { key: '404', path: '/xyz' },
];

function shrink(v) {
  return {
    id: v.id, impact: v.impact, nodes: v.nodes.length, helpUrl: v.helpUrl, help: v.help,
    tags: v.tags.filter((t) => /^wcag|best-practice/.test(t)),
    example: v.nodes[0] ? {
      target: v.nodes[0].target.join(' '),
      html: String(v.nodes[0].html).slice(0, 160),
      summary: String(v.nodes[0].failureSummary || '').replace(/\s+/g, ' ').slice(0, 260),
    } : null,
    more_targets: v.nodes.slice(1, 4).map((n) => n.target.join(' ')),
  };
}

async function runOne(browser, t, width, scheme, banner) {
  const dark = scheme === 'dark';
  const storage = { theme: scheme };
  if (!banner) storage['consent:v1'] = 'declined';
  const ctx = await C.newContext(browser, { width, height: 900, dark, storage });
  const page = await ctx.newPage();
  await page.goto(C.BASE + t.path, { waitUntil: 'load', timeout: 60000 });
  await C.waitReady(page, 'h1', 30000);
  if (t.state === 'result') {
    await C.fillHome(page, { submit: true });
    await page.waitForSelector('.time-value', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1500);
  }
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  const bannerVisible = await page.evaluate(() => { const b = document.getElementById('cookie-consent-banner'); return !!b && getComputedStyle(b).display !== 'none'; });
  const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const out = {
    page: t.key, path: t.path, width, scheme, banner: !!banner, url: page.url(), htmlDark: isDark, bannerVisible,
    axeVersion: res.testEngine.version,
    violations: res.violations.map(shrink),
    violation_count: res.violations.length,
    violation_nodes: res.violations.reduce((s, v) => s + v.nodes.length, 0),
    incomplete: res.incomplete.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, example: v.nodes[0] ? v.nodes[0].target.join(' ') : null })),
    passes: res.passes.length,
  };
  await ctx.close();
  return out;
}

(async () => {
  const browser = await C.launch();
  const dir = C.ensureDir(C.OUT + '/axe');
  const summary = [];
  const jobs = [];
  for (const t of TARGETS) for (const w of [390, 1440]) for (const s of ['light', 'dark']) jobs.push([t, w, s, false]);
  for (const w of [390, 1440]) for (const s of ['light', 'dark']) jobs.push([TARGETS[0], w, s, true]);
  for (const [t, w, s, banner] of jobs) {
    const name = `${t.key}-${w}-${s}${banner ? '-banner' : ''}`;
    try {
      const r = await runOne(browser, t, w, s, banner);
      C.writeJson(`${dir}/${name}.json`, r);
      summary.push({ name, violations: r.violation_count, nodes: r.violation_nodes, ids: r.violations.map((v) => `${v.id}(${v.impact},${v.nodes})`).join(' '), htmlDark: r.htmlDark, bannerVisible: r.bannerVisible });
      console.log(name, r.violation_count, r.violation_nodes, r.violations.map((v) => v.id).join(','));
    } catch (e) {
      summary.push({ name, error: String(e).slice(0, 300) });
      console.log(name, 'ERROR', String(e).slice(0, 200));
    }
  }
  C.writeJson(dir + '/summary.json', summary);
  fs.writeFileSync(dir + '/summary.csv', 'name,violations,nodes,htmlDark,bannerVisible,ids\n' + summary.map((s) => s.error ? `${s.name},ERROR,,,,"${s.error.replace(/"/g, "'")}"` : `${s.name},${s.violations},${s.nodes},${s.htmlDark},${s.bannerVisible},"${s.ids}"`).join('\n') + '\n');
  await browser.close();
})();
