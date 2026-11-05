// Part C: input-validation probing. LOCAL ONLY (never point this at the live site).
// Usage: PLAYWRIGHT_MODULE=... node validate.mjs http://levetid.test:3010 --map-host=levetid.test=127.0.0.1 > validation-results.json
// Same network policy as baseline.mjs: analytics script replayed from the pinned copy, /api/event recorded + acknowledged,
// every other third party aborted. Frozen clock 2026-11-05T12:34:56Z, da-DK, Europe/Copenhagen.
// Every probe runs in a fresh context under a 30 s watchdog: a frozen tab (infinite loop) is recorded as HANG and Chrome is restarted.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const argv = process.argv.slice(2);
const BASE = argv.find((a) => /^https?:\/\//.test(a)).replace(/\/+$/, '');
if (!/^https?:\/\/(levetid\.test|127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  console.error('refusing to run validation against a non-local base URL: ' + BASE);
  process.exit(2);
}
const mapArg = argv.find((a) => a.startsWith('--map-host='));
const MAP = mapArg ? mapArg.slice(11).split('=') : null;
const here = path.dirname(fileURLToPath(import.meta.url));
const PLAUSIBLE = readFileSync(path.join(here, 'plausible-script.pinned.js'), 'utf8');
const FROZEN = new Date('2026-11-05T12:34:56Z');
const HOST = new URL(BASE).hostname;

let chromium;
for (const t of [process.env.PLAYWRIGHT_MODULE, 'playwright-core'].filter(Boolean)) {
  try {
    ({ chromium } = await import(t.startsWith('/') ? pathToFileURL(t).href : t));
    break;
  } catch { /* next */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const launch = () => chromium.launch({ headless: true, args: MAP ? ['--host-resolver-rules=MAP ' + MAP[0] + ' ' + MAP[1]] : [] });
let browser = await launch();
async function restartBrowser() {
  try { await Promise.race([browser.close(), sleep(8000)]); } catch { /* ignore */ }
  browser = await launch();
}

async function openSession({ initScript, initArg } = {}) {
  const ctx = await browser.newContext({
    serviceWorkers: 'block', locale: 'da-DK', timezoneId: 'Europe/Copenhagen',
    viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce',
  });
  ctx.setDefaultTimeout(8000);
  const rec = { events: [], blocked: new Set(), console: [], pageErrors: [], dialogs: [] };
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === 'analytics.holstjensen.eu') {
      if (req.method() === 'POST' && u.pathname === '/api/event') {
        let b = null;
        try { b = JSON.parse(req.postData() || 'null'); } catch { /* ignore */ }
        if (b && b.n !== 'engagement') rec.events.push({ n: b.n, p: b.p ?? null });
        return route.fulfill({ status: 202, contentType: 'text/plain', body: 'ok' });
      }
      if (req.method() === 'GET' && u.pathname.startsWith('/js/')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: PLAUSIBLE });
      return route.abort();
    }
    if (u.hostname !== HOST) { rec.blocked.add(u.hostname); return route.abort(); }
    return route.continue();
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__plausible = true; });
  if (initScript) await page.addInitScript(initScript, initArg);
  await page.clock.install({ time: FROZEN });
  await page.clock.setFixedTime(FROZEN);
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Failed to load resource|Service Worker registration/.test(m.text())) rec.console.push(m.type() + ': ' + m.text().slice(0, 220)); });
  page.on('pageerror', (e) => rec.pageErrors.push(String(e && e.message ? e.message : e).slice(0, 220)));
  page.on('dialog', async (d) => { rec.dialogs.push(d.type() + ': ' + d.message().slice(0, 80)); await d.dismiss(); });
  return { ctx, page, rec };
}

/** Run one probe in a fresh session under a watchdog. */
async function runRow(row, fn, sessionOpts, ms = 30000) {
  const t0 = Date.now();
  let timer;
  let sess;
  const work = (async () => {
    sess = await openSession(sessionOpts);
    await fn(sess.page, sess.rec);
  })().then(() => 'ok', (e) => { row.error = String(e.message).split('\n')[0]; return 'err'; });
  const res = await Promise.race([work, new Promise((r) => { timer = setTimeout(() => r('hang'), ms); })]);
  clearTimeout(timer);
  row.ms = Date.now() - t0;
  if (res === 'hang') {
    row.outcome = 'HANG (tab unresponsive for ' + ms / 1000 + ' s)';
    await restartBrowser();
  } else if (sess) {
    try { await Promise.race([sess.ctx.close(), sleep(5000)]); } catch { /* ignore */ }
  }
  console.error('[validate] ' + (row.label ?? row.input) + ' ' + (row.mode ?? '') + ' -> ' + (row.outcome ?? row.error ?? '?') + ' (' + row.ms + ' ms)');
}

/** What is on screen right now, reduced to facts. */
async function snapshot(page, rec) {
  const s = await page.evaluate(() => {
    const n = (x) => x.replace(/\s+/g, ' ').trim();
    const text = n(document.body.innerText);
    const rootText = n(document.getElementById('root')?.innerText || '');
    const cardText = (re) => {
      const c = [...document.querySelectorAll('main .card')].find((el) => re.test(el.innerText));
      return c ? n(c.innerText) : null;
    };
    const m = (re, t) => { const r = t ? t.match(re) : null; return r ? r.slice(1) : null; };
    const sr = document.querySelector('main p.sr-only');
    const sam = cardText(/Sammenlign med gennemsnittet/);
    const lived = cardText(/Dit livsforløb/);
    const pen = cardText(/Pension & arbejdsår/);
    const sand = cardText(/Chance for at nå/);
    const hist = cardText(/Din historik/);
    const snippets = (re) => [...text.matchAll(re)].slice(0, 6).map((x) => text.slice(Math.max(0, x.index - 28), x.index + x[0].length + 20));
    const age = document.getElementById('age');
    const bd = document.getElementById('birthdate');
    return {
      url: location.pathname + location.search,
      title: document.title,
      resultShown: [...document.querySelectorAll('h2')].some((h) => /Din resterende tid/.test(h.innerText)),
      formShown: !!(age || bd),
      errorBoundary: /Noget gik galt/.test(text),
      blankRoot: rootText.length === 0,
      notFound: /Side ikke fundet/.test(text),
      remainingYears: m(/Du har statistisk (\S+) år tilbage/, sr?.textContent)?.[0] ?? null,
      expectedAge: m(/Din forventede alder \((\S+) år\)/, sam)?.[0] ?? null,
      compare: sam ? [...sam.matchAll(/(Dig|Danmark \(gennemsnit\)) (\S+) år/g)].map((x) => x[1] + '=' + x[2]) : null,
      verdict: m(/(Du ligger [^🎉]*gennemsnit|Du ligger lige omkring det danske gennemsnit)/, sam)?.[0] ?? null,
      lifeProgress: m(/(\S+)% Levet (\S+) Dage levet (\S+) Hjerteslag/, lived),
      preciseAge: m(/Din præcise alder (.+?) Født: (.+?)( Dit|$| Chance| Hvad)/, lived)?.slice(0, 2) ?? null,
      countdown: [...document.querySelectorAll('.countdown-timer .time-unit')].map((u) => n(u.innerText)),
      survival: sand ? [...sand.matchAll(/(\d+) år (\d+)%/g)].map((x) => x[1] + ':' + x[2] + '%') : null,
      pension: m(/(\S+) Folkepensionsalder (\S+) (Arbejdsår tilbage|Pensioneret) (\S+) Forventede pensionsår/, pen),
      historyCard: hist,
      ageInput: age ? { value: age.value, valid: age.validity.valid } : null,
      birthInput: bd ? { value: bd.value, valid: bd.validity.valid } : null,
      badTokens: snippets(/NaN|Infinity|∞|undefined|\bnull\b|Invalid Date|\[object/g),
      negatives: snippets(/(?<=^|\s)[-−]\d[\d.,]*/g),
      injected: {
        handlerAttrs: document.querySelectorAll('[onerror],[onload],[onclick],[onfocus]').length,
        imgSrcX: document.querySelectorAll('img[src="x"]').length,
        extraScripts: document.querySelectorAll('body script, #root script').length,
        xssFlag: window.__xss === 1,
      },
    };
  });
  s.events = rec.events.filter((e) => e.n !== 'pageview').map((e) => (e.n + ' ' + JSON.stringify(e.p)).slice(0, 200));
  s.pageErrors = rec.pageErrors;
  s.consoleErrors = rec.console;
  s.dialogs = rec.dialogs;
  s.storageHistory = await page.evaluate(() => { try { return localStorage.getItem('lifespan:history'); } catch (e) { return 'ERR ' + e.name; } });
  return s;
}

function classify(s, extra = {}) {
  if (s.errorBoundary) return 'CRASH (ErrorBoundary)';
  if (s.blankRoot) return 'CRASH (blank root)';
  if (s.notFound) return 'NOT-FOUND page';
  if (extra.blockedNatively) return 'BLOCKED by native validation';
  if (!s.resultShown) return s.formShown ? 'IGNORED (form shown, no result)' : 'NO RESULT';
  if (s.badTokens.length) return 'BAD OUTPUT (' + s.badTokens.map((x) => (x.match(/NaN|Infinity|∞|undefined|null|Invalid Date|\[object/) || ['?'])[0]).filter((v, i, a) => a.indexOf(v) === i).join(',') + ')';
  if (s.negatives.length) return 'BAD OUTPUT (negative number)';
  return 'result shown';
}

const out = { at: new Date().toISOString(), frozenClock: FROZEN.toISOString(), form: { age: [], birthdate: [] }, deepLinks: [], history: [], misc: [] };
const VALIDITY = (el) => ({ valid: el.validity.valid, flags: ['rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput', 'valueMissing'].filter((k) => el.validity[k]) });

// ---------------------------------------------------------------- form: age
for (const v of ['', '0', '-5', '1', '99', '100', '150', '1e3', '12.5', 'abc', ' 40 ']) {
  for (const mode of ['native', 'bypass']) {
    const row = { input: v, mode };
    await runRow(row, async (page, rec) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Afvis', exact: true }).click();
      await page.getByRole('radio', { name: 'Mand', exact: true }).click();
      const age = page.locator('#age');
      await age.click();
      try { await age.pressSequentially(v, { delay: 3 }); } catch (e) { row.typedError = String(e.message).split('\n')[0]; }
      row.fieldValueAfterTyping = await age.inputValue();
      row.validity = await age.evaluate(VALIDITY);
      row.submitDisabled = await page.getByRole('button', { name: 'Beregn levetid' }).isDisabled();
      if (mode === 'native') { if (!row.submitDisabled) await page.getByRole('button', { name: 'Beregn levetid' }).click(); }
      else await page.locator('form').evaluate((f) => f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      await page.waitForTimeout(500);
      const s = await snapshot(page, rec);
      row.snapshot = s;
      row.outcome = classify(s, { blockedNatively: mode === 'native' && !s.resultShown && (row.submitDisabled || !row.validity.valid) });
    });
    out.form.age.push(row);
  }
}

// ---------------------------------------------------------------- form: birthdate
const BD_VALUES = [
  { label: 'future 2999-01-01', value: '2999-01-01' },
  { label: 'before min 1850-01-01', value: '1850-01-01' },
  { label: 'today 2026-11-05 (frozen)', value: '2026-11-05' },
  { label: 'tomorrow 2026-11-06', value: '2026-11-06' },
  { label: 'invalid string "abc" (fill)', value: 'abc' },
  { label: 'partial typing "15" (day segment only)', typed: '15' },
  { label: 'impossible date 2026-02-30', value: '2026-02-30' },
];
for (const bv of BD_VALUES) {
  for (const mode of ['native', 'bypass']) {
    const row = { input: bv.label, mode };
    await runRow(row, async (page, rec) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Afvis', exact: true }).click();
      await page.getByRole('radio', { name: /Fødselsdato/ }).click();
      await page.getByRole('radio', { name: 'Mand', exact: true }).click();
      const bd = page.locator('#birthdate');
      try {
        if (bv.typed) { await bd.click(); await bd.pressSequentially(bv.typed); } else await bd.fill(bv.value);
      } catch (e) { row.typedError = String(e.message).split('\n')[0]; }
      row.fieldValueAfterInput = await bd.inputValue();
      row.validity = await bd.evaluate(VALIDITY);
      row.submitDisabled = await page.getByRole('button', { name: 'Beregn levetid' }).isDisabled();
      if (mode === 'native') { if (!row.submitDisabled) await page.getByRole('button', { name: 'Beregn levetid' }).click(); }
      else await page.locator('form').evaluate((f) => f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      await page.waitForTimeout(500);
      const s = await snapshot(page, rec);
      row.snapshot = s;
      row.outcome = classify(s, { blockedNatively: mode === 'native' && !s.resultShown && (row.submitDisabled || !row.validity.valid) });
    });
    out.form.birthdate.push(row);
  }
}

// ---------------------------------------------------------------- deep links
const enc = encodeURIComponent;
const Z16 = Array(16).fill(0).join(',');
const XSS_IMG = '<img src=x onerror=window.__xss=1>';
const XSS_SCR = '<script>window.__xss=1</script>';
const XSS_SVG = '"><svg onload=window.__xss=1>';
const DEEP = [
  ['control male 40', 'g=male&a=40'],
  // age
  ['a=abc', 'g=male&a=abc'], ['a=-5', 'g=male&a=-5'], ['a=1e9', 'g=male&a=1e9'], ['a=1e3', 'g=male&a=1e3'], ['a=0', 'g=male&a=0'],
  ['a=1', 'g=male&a=1'], ['a=99', 'g=male&a=99'], ['a=100', 'g=male&a=100'], ['a=150', 'g=male&a=150'], ['a=12.5', 'g=male&a=12.5'],
  ["a=' 40 '", 'g=male&a=' + enc(' 40 ')], ['a=40abc', 'g=male&a=40abc'], ['a=0x28', 'g=male&a=0x28'], ['a=Infinity', 'g=male&a=Infinity'],
  ['a=NaN', 'g=male&a=NaN'], ['a= (empty)', 'g=male&a='],
  // large numeric ages (client-side cost; each under the 30 s watchdog)
  ['a=1000', 'g=male&a=1000'], ['a=10000', 'g=male&a=10000'], ['a=100000', 'g=male&a=100000'], ['a=1000000', 'g=male&a=1000000'],
  ['a=100000000', 'g=male&a=100000000'], ['a=999999999999999999999 (1e21)', 'g=male&a=999999999999999999999'],
  // gender
  ['g=other', 'g=other&a=40'], ['g=MALE', 'g=MALE&a=40'], ['g= (empty)', 'g=&a=40'], ['g=female control', 'g=female&a=40'],
  // birthdate
  ['b=2999-01-01', 'g=male&b=2999-01-01'], ['b=1850-01-01', 'g=male&b=1850-01-01'], ['b=today 2026-11-05', 'g=male&b=2026-11-05'],
  ['b=tomorrow 2026-11-06', 'g=male&b=2026-11-06'], ['b=notadate', 'g=male&b=notadate'], ['b=not-a-date', 'g=male&b=not-a-date'],
  ['b=1985-6-15', 'g=male&b=1985-6-15'], ['b=2026-02-30', 'g=male&b=2026-02-30'], ['b and a both', 'g=male&b=1985-06-15&a=40'],
  ['b=0000-01-01', 'g=male&b=0000-01-01'], ['b=ISO datetime', 'g=male&b=1985-06-15T00:00:00Z'], ['b=275760-09-13 (max Date)', 'g=male&b=275760-09-13'],
  // mode / lifestyle
  ['m=advanced&lf=garbage', 'g=male&a=40&m=advanced&lf=garbage'], ['lf wrong length 1,2,3', 'g=male&a=40&m=advanced&lf=1,2,3'],
  ['lf 16 zeros (control)', 'g=male&a=40&m=advanced&lf=' + enc(Z16)], ['lf 999 x16', 'g=male&a=40&m=advanced&lf=' + enc(Array(16).fill(999).join(','))],
  ['lf -999 x16', 'g=male&a=40&m=advanced&lf=' + enc(Array(16).fill(-999).join(','))], ['lf non-numeric x16', 'g=male&a=40&m=advanced&lf=' + enc(Array(16).fill('x').join(','))],
  ['lf decimals x16', 'g=male&a=40&m=advanced&lf=' + enc(Array(16).fill('1.9').join(','))], ['m=weird', 'g=male&a=40&m=weird&lf=' + enc(Z16)],
  ['m=advanced no lf', 'g=male&a=40&m=advanced'], ['lf ignored in simple mode', 'g=male&a=40&lf=' + enc(Array(16).fill(5).join(','))],
  // XSS / reflection
  ['XSS g=img', 'g=' + enc(XSS_IMG) + '&a=40'], ['XSS a=script', 'g=male&a=' + enc(XSS_SCR)], ['XSS b=svg', 'g=male&b=' + enc(XSS_SVG)],
  ['XSS m+lf', 'g=male&a=40&m=' + enc('<b>x</b>') + '&lf=' + enc(XSS_SCR)],
  ['XSS all params', 'g=' + enc(XSS_IMG) + '&a=' + enc(XSS_SCR) + '&b=' + enc(XSS_SVG) + '&m=' + enc(XSS_IMG) + '&lf=' + enc(XSS_SCR) + '&utm=' + enc(XSS_SCR)],
  ['XSS unknown param only', 'g=male&a=40&q=' + enc(XSS_SCR)],
];
for (const [label, qs] of DEEP) {
  const row = { label, query: qs };
  await runRow(row, async (page, rec) => {
    await page.goto(BASE + '/?' + qs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const s = await snapshot(page, rec);
    row.snapshot = s;
    row.outcome = classify(s);
    row.rawPayloadInHtml = await page.evaluate(() => /<script>window\.__xss|<img src=x onerror|<svg onload/.test(document.documentElement.innerHTML));
    if (s.resultShown) {
      try {
        await page.getByRole('button', { name: /Del resultater/ }).click({ timeout: 4000 });
        await page.waitForTimeout(300);
        row.shareModalText = await page.evaluate(() => {
          const d = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
          return d ? d.innerText.replace(/\s+/g, ' ').trim().slice(0, 400) : null;
        });
      } catch (e) { row.shareModalError = String(e.message).split('\n')[0]; }
    }
  });
  out.deepLinks.push(row);
}

// ---------------------------------------------------------------- localStorage history corruption
const HIST_SEEDS = [
  ['control: 2 valid entries', JSON.stringify([{ ts: 1793800000000, age: 40, gender: 'male', expected: '81.2' }, { ts: 1793810000000, age: 41, gender: 'male', expected: '81.9' }])],
  ['invalid JSON "{not json"', '{not json'],
  ['truncated JSON', '[{"ts":1793800000000,"age":40,"gender":"male","exp'],
  ['JSON string "x"', '"x"'], ['JSON number 123', '123'], ['JSON object {"a":1}', '{"a":1}'], ['JSON null', 'null'], ['empty array []', '[]'],
  ['[null,null]', '[null,null]'], ['[1,2]', '[1,2]'], ['[null]', '[null]'], ['[{"ts":1}]', '[{"ts":1}]'],
  ['[{ts:"x",age:"y",expected:"z"}] x2', JSON.stringify([{ ts: 'x', age: 'y', expected: 'z' }, { ts: 'x', age: 'y', expected: 'z' }])],
  ['expected not numeric x2', JSON.stringify([{ ts: 1, expected: 'abc' }, { ts: 2, expected: 'def' }])],
  ['ts = 1e20 (Invalid Date) x2', JSON.stringify([{ ts: 1e20, age: 40, expected: '80.0' }, { ts: 1e20 + 1, age: 40, expected: '81.0' }])],
  ['HTML in fields x2', JSON.stringify([{ ts: 1, age: 40, expected: '<img src=x onerror=window.__xss=1>' }, { ts: 2, age: 40, expected: '<script>window.__xss=1</script>' }])],
  ['1000 valid entries', JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ ts: 1793800000000 + i, age: 40, gender: 'male', expected: (80 + (i % 5) / 10).toFixed(1) })))],
  ['duplicate ts keys x3', JSON.stringify([{ ts: 5, age: 40, expected: '80.0' }, { ts: 5, age: 40, expected: '81.0' }, { ts: 5, age: 40, expected: '82.0' }])],
];
const calcMale40 = async (page, rec, row) => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Afvis', exact: true }).click().catch(() => {});
  await page.getByLabel('Din alder:').fill('40');
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.waitForTimeout(700);
  const s = await snapshot(page, rec);
  row.snapshot = {
    resultShown: s.resultShown, errorBoundary: s.errorBoundary, blankRoot: s.blankRoot, historyCard: s.historyCard, badTokens: s.badTokens, injected: s.injected,
    pageErrors: s.pageErrors, consoleErrors: s.consoleErrors, events: s.events,
    storageAfter: (s.storageHistory || '').slice(0, 160) + ((s.storageHistory || '').length > 160 ? '... (' + s.storageHistory.length + ' chars)' : ''),
  };
  row.outcome = classify(s);
  return s;
};
for (const [label, seed] of HIST_SEEDS) {
  const row = { label, seedLength: seed.length };
  await runRow(row, (page, rec) => calcMale40(page, rec, row), {
    initScript: (s) => { if (!window.__seeded) { try { localStorage.setItem('lifespan:history', s); } catch { /* ignore */ } window.__seeded = true; } },
    initArg: seed,
  });
  out.history.push(row);
}
for (const [label, script] of [
  ['localStorage getter throws (privacy mode)', () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); }],
  ['localStorage.setItem throws (quota)', () => { Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; }],
]) {
  const row = { label };
  await runRow(row, async (page, rec) => {
    await calcMale40(page, rec, row).catch((e) => { row.error = String(e.message).split('\n')[0]; });
    try {
      await page.getByRole('button', { name: /mørk tilstand/ }).click({ timeout: 2500 });
      row.themeToggleAfter = { pageErrors: [...rec.pageErrors], boundary: await page.evaluate(() => /Noget gik galt/.test(document.body.innerText)) };
    } catch (e) { row.themeToggleError = String(e.message).split('\n')[0]; }
  }, { initScript: script });
  out.history.push(row);
}

// ---------------------------------------------------------------- misc widgets (insurance, partner)
{
  const row = { label: 'widgets' };
  await runRow(row, async (page, rec) => {
    await page.goto(BASE + '/?g=male&a=40', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
    for (const [inc, yrs] of [['500000', '10'], ['-1', '10'], ['1e308', '40'], ['1e308', '10'], ['0', '10'], ['500000', '-3'], ['500000', '1e2'], ['99999999999999999999', '40']]) {
      await page.locator('#ins-income').fill(inc);
      await page.locator('#ins-years').fill(yrs);
      await page.waitForTimeout(120);
      const t = await page.evaluate(() => {
        const c = [...document.querySelectorAll('main .card')].find((e) => /Hvor meget livsforsikring/.test(e.innerText));
        return { cover: (c.innerText.match(/Vejledende dækningsbehov\s*~?([^\n]*)/) || [null, null])[1], link: c.querySelector('a[href*="partner-ads"]').innerText.replace(/\s+/g, ' ').trim() };
      });
      out.misc.push({ widget: 'insurance', income: inc, years: yrs, ...t });
    }
    for (const pa of ['38', '99', '100', '-1', '12.5', '1e1', '0']) {
      await page.locator('#partnerAge').fill(pa);
      await page.waitForTimeout(120);
      const t = await page.evaluate(() => {
        const c = [...document.querySelectorAll('main .card')].find((e) => /Jer to sammen/.test(e.innerText));
        return c.innerText.replace(/\s+/g, ' ').trim().replace('Jer to sammen Indtast din partners alder og køn og se, hvor mange år I statistisk har sammen. Partnerens alder Mand Kvinde', '').slice(0, 160);
      });
      out.misc.push({ widget: 'partner', partnerAge: pa, text: t });
    }
    out.misc.push({ widget: 'errors after widget probing', pageErrors: rec.pageErrors, console: rec.console });
  });
  if (row.error || row.outcome) out.misc.push({ widget: 'widgets run problem', error: row.error, outcome: row.outcome });
}

await browser.close();
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
