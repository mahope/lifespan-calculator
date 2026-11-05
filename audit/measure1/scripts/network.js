// Task 6: first-load network/console/storage/geolocation/service-worker behaviour of "/" in a fresh context.
const C = require('./common');

const GEO_INIT = () => {
  window.__geo = [];
  try {
    const g = navigator.geolocation;
    for (const fn of ['getCurrentPosition', 'watchPosition']) {
      const orig = g[fn].bind(g);
      g[fn] = (...a) => { window.__geo.push({ fn, t: performance.now() }); return orig(...a); };
    }
  } catch (e) {}
};

function attach(page, store, ctx) {
  const t0 = Date.now();
  page.on('request', (r) => { store.reqs.set(r, { t: Date.now() - t0, url: r.url(), method: r.method(), type: r.resourceType(), headers_ref: r.headers()['referer'] || null }); });
  page.on('response', async (resp) => {
    const rec = store.reqs.get(resp.request()); if (!rec) return;
    const h = resp.headers();
    rec.status = resp.status(); rec.ctype = h['content-type']; rec.cenc = h['content-encoding']; rec.cache = h['cache-control'];
    rec.fromSW = resp.fromServiceWorker();
    try { const s = await resp.request().sizes(); rec.bodyBytes = s.responseBodySize; rec.headerBytes = s.responseHeadersSize; } catch (e) {}
  });
  page.on('requestfailed', (r) => { const rec = store.reqs.get(r); if (rec) rec.failed = r.failure() && r.failure().errorText; });
  page.on('console', (m) => store.console.push({ type: m.type(), text: m.text().slice(0, 300), loc: m.location().url ? m.location().url.replace(C.BASE, '') + ':' + m.location().lineNumber : '' }));
  page.on('pageerror', (e) => store.console.push({ type: 'pageerror', text: String(e).slice(0, 300) }));
}

const hostOf = (u) => { try { return new URL(u).host; } catch { return 'n/a'; } };
const summarize = (store, blocked) => {
  const reqs = [...store.reqs.values()].map((r) => ({ ...r, host: hostOf(r.url), path: r.url.startsWith(C.BASE) ? r.url.slice(C.BASE.length) : r.url }));
  const first = reqs.filter((r) => r.host === 'levetidsberegner.dk');
  return {
    total_requests: reqs.length,
    total_body_bytes: reqs.reduce((s, r) => s + (r.bodyBytes || 0), 0),
    js_body_bytes: reqs.filter((r) => r.type === 'script').reduce((s, r) => s + (r.bodyBytes || 0), 0),
    css_body_bytes: reqs.filter((r) => r.type === 'stylesheet').reduce((s, r) => s + (r.bodyBytes || 0), 0),
    hosts: Object.fromEntries([...new Set(reqs.map((r) => r.host))].map((h) => [h, reqs.filter((r) => r.host === h).length])),
    third_party_hosts_attempted: [...new Set([...reqs.map((r) => r.host), ...blocked.map(hostOf)])].filter((h) => h !== 'levetidsberegner.dk'),
    blocked_by_us: blocked,
    requests: reqs.map(({ t, method, path, host, type, status, ctype, cenc, cache, bodyBytes, headerBytes, fromSW, failed }) => ({ t, method, host, path: path.slice(0, 160), type, status, ctype, cenc, cache, bodyBytes, headerBytes, fromSW, failed })),
    console: store.console,
  };
};

(async () => {
  const browser = await C.launch();
  const result = {};

  // ---- Pass 1: fresh context, SW blocked (so all requests visible + routable), no consent click ----
  {
    const ctx = await C.newContext(browser, { width: 1440, height: 900, storage: {} });
    // storage:{} => nothing pre-set (fresh first visit)
    const nominatim = [];
    await ctx.route(/nominatim\.openstreetmap\.org/, (route) => { const r = route.request(); nominatim.push({ url: r.url(), referer: r.headers()['referer'] || null, ua: (r.headers()['user-agent'] || '').slice(0, 60) }); return route.abort(); });
    const page = await ctx.newPage();
    await page.addInitScript(GEO_INIT);
    const store = { reqs: new Map(), console: [] };
    attach(page, store, ctx);
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    await page.waitForTimeout(4000);
    const state = await page.evaluate(async () => ({
      cookie: document.cookie,
      localStorageKeys: Object.keys(localStorage),
      localStorage: Object.fromEntries(Object.keys(localStorage).map((k) => [k, String(localStorage.getItem(k)).slice(0, 80)])),
      sessionStorageKeys: Object.keys(sessionStorage),
      idb: (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : 'n/a'),
      geoCalls: window.__geo,
      geoPermission: navigator.permissions ? (await navigator.permissions.query({ name: 'geolocation' })).state : 'n/a',
      swSupported: 'serviceWorker' in navigator,
      swControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      bannerVisible: (() => { const b = document.getElementById('cookie-consent-banner'); return !!b && getComputedStyle(b).display !== 'none'; })(),
      plausibleScriptTag: (document.querySelector('script[src*="analytics.holstjensen.eu"]') || {}).src || null,
      plausibleDefined: typeof window.plausible,
      docTitle: document.title, lang: document.documentElement.lang,
    }));
    const cookies = (await ctx.cookies()).map((c) => ({ name: c.name, domain: c.domain, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite, expires: c.expires }));
    result.pass1_firstload = { ...summarize(store, ctx.__blocked), state, cookies_before_consent: cookies };

    // Metadata of what the page declared in head (preload hints, scripts)
    result.pass1_head = await page.evaluate(() => ({
      scripts: [...document.querySelectorAll('script[src]')].map((s) => ({ src: s.getAttribute('src'), defer: s.defer, async: s.async, type: s.type })),
      links: [...document.querySelectorAll('link[rel]')].map((l) => ({ rel: l.rel, href: l.getAttribute('href') })),
      imgs_without_dims: [...document.images].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
      imgs: document.images.length,
    }));

    // User action 1: "Brug min placering" with permission granted + fake coords, Nominatim aborted (we only log the attempt).
    await ctx.grantPermissions(['geolocation']);
    await ctx.setGeolocation({ latitude: 55.676, longitude: 12.568 }); // central Copenhagen, no personal data
    const beforeGeo = store.reqs.size;
    await page.getByRole('button', { name: /Brug min placering/ }).click();
    await page.waitForTimeout(2500);
    result.user_action_geolocation = {
      geoCalls: await page.evaluate(() => window.__geo),
      nominatim_attempts: nominatim.map((n) => ({ url: n.url.replace(/(lat|lon)=[-0-9.]+/g, '$1=<coord>'), referer: n.referer, ua: n.ua })),
      new_requests_after_click: store.reqs.size - beforeGeo,
      note: 'Nominatim request aborted by the harness; only the attempt (host, params shape, Referer) is recorded. Coordinates are a fixed public Copenhagen point.',
    };

    // User action 2: submit male/40 -> which requests/hosts appear?
    const before = new Set(store.reqs.keys());
    await C.fillHome(page, { submit: true });
    await page.waitForSelector('.time-value', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(3000);
    const afterReqs = [...store.reqs.entries()].filter(([k]) => !before.has(k)).map(([, v]) => ({ host: hostOf(v.url), path: v.url.slice(0, 140), type: v.type, status: v.status, bodyBytes: v.bodyBytes }));
    result.user_action_submit = {
      new_requests: afterReqs, blocked_total_after: ctx.__blocked.slice(),
      localStorageKeys_after: await page.evaluate(() => Object.keys(localStorage)),
      url_after: new URL(page.url()).search,
      outbound_links: await page.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map((a) => ({ href: a.href.slice(0, 120), rel: a.rel, target: a.target })).filter((a) => !a.href.includes('levetidsberegner.dk'))),
      external_images: await page.evaluate(() => [...document.images].map((i) => i.src).filter((s) => s && !s.includes('levetidsberegner.dk')).map((s) => s.slice(0, 120))),
    };
    await ctx.close();
  }

  // ---- Pass 1b: consent declined; is analytics still attempted? ----
  {
    const ctx = await C.newContext(browser, { width: 1440, height: 900, storage: { 'consent:v1': 'declined' } });
    const page = await ctx.newPage();
    const store = { reqs: new Map(), console: [] };
    attach(page, store, ctx);
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    await page.waitForTimeout(2000);
    result.pass1b_declined = { analytics_attempted_after_decline: ctx.__blocked.slice(), bannerVisible: await page.evaluate(() => { const b = document.getElementById('cookie-consent-banner'); return !!b && getComputedStyle(b).display !== 'none'; }) };
    await ctx.close();
  }

  // ---- Pass 2: Service worker allowed: registration + caches ----
  {
    const ctx = await C.newContext(browser, { width: 1440, height: 900, storage: { 'consent:v1': 'declined' }, sw: true });
    const page = await ctx.newPage();
    const store = { reqs: new Map(), console: [] };
    attach(page, store, ctx);
    await page.goto(C.BASE + '/', { waitUntil: 'load' });
    await C.waitReady(page, 'h1', 30000);
    await page.waitForTimeout(8000); // precache install
    const sw = await page.evaluate(async () => {
      const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
      const names = await caches.keys();
      const caches_out = [];
      for (const n of names) {
        const c = await caches.open(n);
        const keys = await c.keys();
        let total = 0; const sample = [];
        for (const k of keys) { try { const r = await c.match(k); const b = await r.clone().blob(); total += b.size; if (sample.length < 60) sample.push({ url: k.url.replace(location.origin, ''), size: b.size, type: r.headers.get('content-type') }); } catch (e) {} }
        caches_out.push({ name: n, entries: keys.length, total_bytes_uncompressed: total, sample });
      }
      return {
        registrations: regs.map((r) => ({ scope: r.scope, active: r.active && r.active.state, script: r.active && r.active.scriptURL, installing: !!r.installing, waiting: !!r.waiting })),
        caches: caches_out, controller: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      };
    });
    const swSrc = await (await ctx.request.get(C.BASE + '/sw.js')).text();
    const manifestUrls = [...swSrc.matchAll(/\{url:"([^"]+)",revision:(null|"[^"]*")\}/g)].map((m) => m[1]);
    result.pass2_service_worker = {
      ...sw, sw_js_bytes: swSrc.length, precache_urls_in_sw_js: manifestUrls, precache_count: manifestUrls.length,
      has_navigateFallback: /NavigationRoute/.test(swSrc), denylist_html: /\\\.html\$/.test(swSrc) || /\.html/.test(swSrc.slice(swSrc.indexOf('denylist') || 0, (swSrc.indexOf('denylist') || 0) + 80)),
      skipWaiting_or_claim: { skipWaiting: /skipWaiting/.test(swSrc), clientsClaim: /clientsClaim|clients\.claim/.test(swSrc) },
      runtimeCaching: /registerRoute\([^)]*(?!Navigation)/.test(swSrc) ? 'see sw.js' : 'none',
    };
    // precache payload size: sum of encoded sizes by fetching each (GET, static files only)
    let total = 0; const per = [];
    for (const u of manifestUrls) { const r = await ctx.request.get(C.BASE + '/' + u.replace(/^\//, ''), { headers: { 'Accept-Encoding': 'gzip, br' } }); const b = await r.body(); per.push({ u, status: r.status(), raw: b.length, enc: r.headers()['content-encoding'] || null }); total += b.length; }
    result.pass2_service_worker.precache_payload = { fetched_bytes_total: total, per_file: per };
    result.pass2_service_worker.console = store.console;
    await ctx.close();
  }

  C.writeJson(C.OUT + '/network.json', result);
  const f = result.pass1_firstload;
  console.log('requests', f.total_requests, 'bytes', f.total_body_bytes, 'js', f.js_body_bytes, 'hosts', JSON.stringify(f.hosts));
  console.log('blocked', JSON.stringify(f.blocked_by_us));
  console.log('state', JSON.stringify(f.state));
  console.log('cookies', JSON.stringify(f.cookies_before_consent));
  console.log('console', JSON.stringify(f.console));
  console.log('geo', JSON.stringify(result.user_action_geolocation));
  console.log('declined', JSON.stringify(result.pass1b_declined));
  console.log('sw', JSON.stringify({ regs: result.pass2_service_worker.registrations, caches: result.pass2_service_worker.caches.map((c) => [c.name, c.entries, c.total_bytes_uncompressed]), n: result.pass2_service_worker.precache_count, payload: result.pass2_service_worker.precache_payload.fetched_bytes_total }));
  await browser.close();
})();
