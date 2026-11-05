// Find which element in the RESULT state causes document horizontal scroll at 390px (bisect by hiding elements).
const C = require('./common');
(async () => {
  const browser = await C.launch();
  const out = {};
  for (const w of [320, 390]) {
    const ctx = await C.newContext(browser, { width: w, height: 800, storage: { 'consent:v1': 'declined', theme: 'light' } });
    const page = await ctx.newPage();
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    await C.fillHome(page, { submit: true });
    await page.waitForSelector('.time-value', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1500);
    out[w] = await page.evaluate(() => {
      const vw = window.innerWidth;
      const sw = () => document.documentElement.scrollWidth;
      const base = sw();
      const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).slice(0, 4).join('.');
      const culprits = [];
      // elements whose own scrollable overflow exceeds their box
      for (const el of document.querySelectorAll('body *')) {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && getComputedStyle(el).overflowX === 'visible') {
          const r = el.getBoundingClientRect();
          if (r.left + el.scrollWidth > vw + 1) culprits.push({ el: sel(el), clientW: el.clientWidth, scrollW: el.scrollWidth, left: Math.round(r.left), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) });
        }
      }
      // bisect: hide each direct section under the results container and see if scrollWidth drops
      const hits = [];
      const secs = [...document.querySelectorAll('main *, #root *')].filter((e) => e.children.length > 0 && e.getBoundingClientRect().height > 40);
      for (const el of secs.slice(0, 400)) {
        const prev = el.style.display; el.style.display = 'none';
        const now = sw(); el.style.display = prev;
        if (now < base) hits.push({ el: sel(el), after: now, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), depth: (function d(n){let c=0;while(n.parentElement){c++;n=n.parentElement;}return c;})(el) });
      }
      hits.sort((a, b) => b.depth - a.depth);
      return { vw, base, culprits: culprits.slice(0, 8), smallestHidingFixes: hits.slice(0, 8) };
    });
    await ctx.close();
  }
  C.writeJson(C.OUT + '/extra2-overflow.json', out);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
