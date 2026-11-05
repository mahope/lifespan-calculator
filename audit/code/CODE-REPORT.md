# levetidsberegner.dk: code, security, privacy and architecture review

Audit date: 2026-11-05. Repo: `mahope/lifespan-calculator`, branch `master`, commit `0a4c35c`.
Method: I read the source copy (`lc/`), ran read-only `curl` against the live site and the Plausible script, ran `npm view` for the stack candidates, and ran small node checks on the life table.
No builds or installs ran on this PC. All file:line references point into the repo at `0a4c35c`.

Severity: P1 means it breaks a hard product rule (privacy or legal) or a core result. P2 means a real bug, or an SEO, performance or security gap that costs something measurable. P3 means hygiene.
Confidence: high means verified in code and/or live. Medium means the reasoning is solid but I did not reproduce it end to end. Low means plausible but unverified.

---

## Summary table

| ID | Title | Sev | Conf | Effort |
|---|---|---|---|---|
| PRIV-1 | Analytics event stores exact age, gender and country server-side | P1 | high | 0.5 h |
| PRIV-2 | Privacy policy unreachable; on-page privacy claims false | P1 | high | 2 h |
| PRIV-3 | Google Fonts `@import` sends every visitor's IP to Google, before any consent | P1 | high | 1 h |
| PRIV-4 | "Brug min placering" sends precise GPS coordinates to OSM and the result is never used | P2 | high | 0.5 h (delete) |
| PRIV-5 | Share URL carries birthdate and the full health/lifestyle pack to Meta/X/LinkedIn/WhatsApp and to Plausible | P2 | high | 2 h |
| PRIV-6 | Cookie banner is cosmetic: consent is written, never read | P2 | high | 1 h (remove) |
| PRIV-7 | Local history has no delete option | P3 | high | 1 h |
| CALC-1 | Age mode truncates the fractional remaining year (countdown/endDate/remainingDays up to ~1 year short) | P2 | high | 1 h |
| CALC-2 | "Sammenlign" compares conditional expectancy against a stale e0: everyone is "above average" | P2 | high | 1 h |
| CALC-3 | Countdown renders 0 as `--` (`||` instead of `??`) | P3 | high | 0.25 h |
| CALC-4 | Pension birth year off by one before birthday; wrong pension age at cohort boundaries | P3 | high | 0.5 h |
| CALC-5 | No validation of share-link params: crafted link freezes or crashes the tab | P2 | high | 1.5 h |
| CALC-6 | Corrupt localStorage history bricks the results view | P3 | high | 0.5 h |
| CALC-7 | Birthdate parsed as UTC (off by one day west of UTC); tests use local Date objects so never cover it | P3 | medium | 0.5 h |
| SEC-1 | No security headers at all (HSTS, CSP, nosniff, frame-ancestors, Referrer-Policy) | P2 | high | 2 h |
| SEC-2 | Missing `/assets/*.js` returns `200 text/html`; with `skipWaiting` + `clientsClaim` this breaks lazy chunks after deploys | P2 | high | 1.5 h |
| SEC-3 | `sw.js` and hashed assets both `max-age=14400`; nothing immutable, SW can be edge-stale 4 h | P3 | high | 0.5 h |
| SEC-4 | `build.target: 'esnext'` can white-screen older Safari (parse error happens before the ErrorBoundary exists) | P3 | medium | 0.25 h |
| PERF-1 | Whole HomePage (12+ cards) re-renders every second | P2 | high | 1.5 h |
| PERF-2 | LCP is a 4-hop chain: HTML → index.js → lazy HomePage chunk → render; plus CSS → Google CSS → font | P2 | high | 1 h (stage 0) |
| PERF-3 | `og-image.png` (415 KB) and the 82 KB icon are precached by the SW for every visitor | P2 | high | 0.5 h |
| PERF-4 | html-to-image ships in the HomePage chunk though only used after "Del" → "Download" | P3 | high | 0.5 h |
| SEO-1 | Crawlers and social scrapers see one identical shell for every route: no canonical, no og:image, `twitter:card=summary` | P1 | high | stage 0/1 |
| SEO-2 | Soft 404s: every unknown URL returns 200; NotFound page says `index, follow` with canonical `/404` | P2 | high | 1 h |
| SEO-3 | Duplicate head tags: static index.html meta + Helmet meta coexist after hydration | P3 | high | 0.5 h |
| SEO-4 | Static boilerplate "Om dette værktøj" section and second footer rendered on every route | P2 | high | 0.5 h |
| SEO-5 | sitemap.xml / ads.txt / policies not shipped; robots.txt is Cloudflare-managed and has no `Sitemap:` | P2 | high | 0.5 h |
| SEO-6 | FAQPage schema absent although #15 is closed | P3 | high | 2 h |
| SEO-7 | Copy claims "WHO data", "geografisk placering", "for dit land": false | P2 | high | 0.5 h |
| AN-1 | Plausible "hash" script variant ignores pushState: client-side navigations are never counted | P2 | high | 0.25 h |
| DX-1 | No branch protection; lint warnings don't fail CI; hook/components untested | P3 | high | 1 h + tests |
| DX-2 | Committed `dist/` is stale (2026-07-04) and unused by deploy; #10 is unblocked | P3 | high | 0.25 h |
| DX-3 | Legacy deploy files (`.dokploy`, `nixpacks.toml`, `.htaccess`, `index.html.bak`, `backup/`) contradict the real Dockerfile deploy | P3 | high | 0.5 h |

---

## Privacy

### PRIV-1: The analytics event stores exact age, gender and country server-side (P1, high)
**Evidence.** `src/pages/HomePage.jsx:179-188`:
```js
window.plausible('Calculate Lifespan', { props: {
  age: formData.useBirthdate ? 'birthdate' : formData.age,
  gender: formData.gender,
  location: userLocation || 'Unknown',
  usedBirthdate: formData.useBirthdate } });
```
The script is loaded with the `pageview-props` extension (`index.html:29`), and Plausible persists custom props.
The event payload also carries `u: location.href` (live script: `L.u=location.href`). The handler calls `setSearchParams` first (`HomePage.jsx:166`), so the event URL contains `?g=…&a=…` or `&b=<birthdate>` and, in advanced mode, `&lf=<16 lifestyle values>`. Plausible stores only the pathname, so the query string transits to the analytics server without being persisted (medium confidence on the server side).

**Why it matters.** The hard rule is that user input is never stored server-side, and these props are user input stored server-side. Exact age + gender + country, per event, together with Plausible's daily visitor hash, is personal data under GDPR. The privacy texts say the opposite (PRIV-2).

**Fix.** Drop all props: `plausible('Calculate Lifespan')`. If a funnel split is wanted, use non-identifying props only, chosen from: `mode: simple|advanced`, `input: age|birthdate`.
No age band. With 2 genders it re-identifies more than it informs, and it adds nothing product-wise.
Also call it before `setSearchParams`, or strip the query: Plausible accepts `{u: location.origin + location.pathname}` as an option on custom events. That keeps the query out of transit too.

### PRIV-2: The privacy policy is unreachable and the on-page privacy claims are false (P1, high)
**Evidence.**
- `privatlivspolitik.html` and `cookiepolitik.html` sit in the repo root, not `public/`, so Vite doesn't ship them. Live, `/privatlivspolitik.html` gives `301 → /privatlivspolitik` (serve cleanUrls) and then `200` with the SPA shell, which renders the React NotFound page. Verified with curl.
- The links to them are in the static footer in `index.html:39-40`, outside React.
- `src/components/Footer.jsx:39-41` says: "vi bruger kun din IP-adresse til at bestemme dit land … Der anvendes ingen cookies eller tredjepartsscripts".
  - There is no IP lookup any more (#16 removed it).
  - Third-party requests on load: Plausible (self-hosted but separate origin), Google Fonts (PRIV-3) and, on click, Nominatim (PRIV-4).
- `privatlivspolitik.html` says "Ingen personhenførbare data behandles", which PRIV-1 contradicts. It also announces AdSense with a consent banner. `ads.txt` (root) exists but isn't shipped either.

**Fix.** Move both policies to `public/`, or better, make them real routes so they get the layout and prerendering. Rewrite the texts to match reality after PRIV-1/3/4 are fixed. Remove the false Footer paragraph. Decide on AdSense explicitly: if yes, it needs a real CMP; if no, drop `ads.txt` and the sentence.

### PRIV-3: The Google Fonts `@import` sends every visitor's IP to Google before any consent (P1, high)
**Evidence.** `src/index.css:1`: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap') layer(base);`. The import is kept in the live CSS bundle.
**Why.** Remote Google Fonts transmit the IP to Google on every page view (LG München, 20.01.2022, 3 O 17493/20). Danish DPAs follow the same reasoning. It is also a render-blocking chain (PERF-2).
**Fix.** Self-host Inter as one variable `woff2` (latin subset, ~35-50 KB) via `@font-face` in `index.css`, or the `@fontsource-variable/inter` package. Add `<link rel="preload" as="font" crossorigin>` for it. Effort 1 h.

### PRIV-4: Location feature sends precise coordinates to OSM and has no effect (P2, high)
**Evidence.**
- `src/hooks/useLifespanCalculator.js:32-60` sends `lat/lon` to `nominatim.openstreetmap.org` and sets `lifeExpectancyForLocation`.
- `calculateLifespan` (`:63-160`) never reads `lifeExpectancyForLocation`, and HomePage doesn't destructure it (`HomePage.jsx:40-52`).
- The only consumers of the location are the displayed country string (`HomePage.jsx:378-381`) and the Plausible `location` prop (`:184`).
- The calculation always uses the Danish table (`lifeTableDK.js`).

**Why.** A third-party transfer of precise location with zero user value. Nominatim's usage policy also requires an identifying User-Agent/Referer and forbids heavy client use.
**Fix.** Delete `getUserLocation`, `userLocation`, `lifeExpectancyForLocation`, the "Brug min placering" UI (`HomePage.jsx:377-395`) and the copy that promises location-based results (SEO-7). If country comparison is wanted later, use a `<select>`.

### PRIV-5: The share URL carries the birthdate and health data (P2, high)
**Evidence.** `src/utils/shareState.js:24-33` builds `{g, a|b, m, lf}`. `HomePage.jsx:166` writes it into the address bar on every submit, not just on share. `ShareModal.jsx:12` shares `window.location.href` verbatim to Facebook, LinkedIn, X and WhatsApp (`:84-111`) and to the clipboard.
`lf` encodes smoking, alcohol, BMI, mental health, chronic health, income and education (`LIFESTYLE_KEYS`, hook `:12-15`). That is health data (GDPR art. 9) once it is tied to a person posting it.
**Why.** Users don't expect "share my result" to publish their birthdate and smoking/alcohol/mental-health answers to Meta's scraper and to everyone in the chat. It also sits in browser history and transits to Plausible (PRIV-1).
**Fix.**
- Default share link: `/?g=male&a=41` (whole years only), or even just `/` plus the result text.
- Never put `b` in the URL; convert it to whole-year age.
- Make `lf` an explicit opt-in ("Del også mine livsstilsvalg").
- Don't call `setSearchParams` on submit. Build the URL only inside ShareModal.

The reload-restores-result convenience can come from `sessionStorage`.

### PRIV-6: The cookie banner is cosmetic (P2, high)
**Evidence.** `index.html:44-53` writes `localStorage['consent:v1']`. `grep -rn consent src` finds no reader. Plausible loads unconditionally at `index.html:29`.
**Why.** Declining changes nothing, which is misleading. Since Plausible is cookieless and nothing else sets cookies, the honest fix is no banner at all. The banner also covers the bottom of the page on mobile and is static HTML outside React.
**Fix.** Remove the banner and its script. Keep the theme `localStorage` (strictly necessary/functional). If AdSense ever comes, add a real CMP then.

### PRIV-7: Local history can't be deleted (P3, high)
`src/utils/history.js` stores `{ts, age, gender, expected}` × 20 under `lifespan:history`. `grep -rn "removeItem" src` finds nothing, and `Historik.jsx` has no delete button. On a shared device this is visible to the next user. Add a "Slet historik" button and mention it in the policy.

---

## Calculation correctness

### CALC-1: Age mode drops the fractional remaining year (P2, high), the remaining half of #2
**Evidence.** `useLifespanCalculator.js:103`: `exactEndDate = new Date(now.getFullYear() + remainingYears, now.getMonth(), now.getDate());`. The `Date` constructor truncates a fractional year (`MakeDay` applies ToIntegerOrInfinity).
Node check: for a 70-year-old man the headline says **15.0 years**, while the countdown, `remainingDays` (ShareCard, copy text) and `endDate` give **14.00 years**. For a 40-year-old: 41.2 vs 41.0.
The end instant is also pinned to local midnight.
**Status of #2.** Its original bug (re-parsing the da-DK string) is fixed: `endTimestamp` is used (`:118`, `:201-219`). Rescope #2 to this bug plus PERF-1.
**Fix.** `exactEndDate = new Date(now.getTime() + remainingYears * 365.25 * 864e5)`. Use the same formula in birthdate mode (`:97-101`) so both paths agree. Unit-test `calculateLifespan` by extracting it to a pure `computeResult(input, now)` in `lifespanMath.js`.

### CALC-2: "Sammenlign" makes everyone "above average" (P2, high)
**Evidence.** `src/components/Sammenlign.jsx:95` compares `adjustedLifeExpectancy` (age + e_x from HISB8 2024:25) against `lifeExpectancyData.Denmark` = 78.9/82.7 (`lifeExpectancyData.js:3`). HISB8 itself has e0 = 80.25/83.90 (`lifeTableDK.js:11-12`).
Computed with zero lifestyle input:

| age | man: you vs "avg" | woman |
|---|---|---|
| 0 | +1.3 | +1.2 |
| 40 | +2.3 | +2.0 |
| 70 | +6.1 | +4.6 |
| 80 | +9.5 | +7.3 |

A perfectly average Dane is told "Du ligger ca. 2,3 år over det danske gennemsnit 🎉". This mixes two problems: a stale data source, and comparing a conditional expectancy with e0.
**Fix.**
- Compare the user against `age + e_x(baseline, no lifestyle)` for their age and sex ("en gennemsnitlig dansk mand på 40").
- Show e0 from `LIFE_TABLE_DK` only as context.
- Remove the duplicate DK numbers from `lifeExpectancyData.js`. `DanmarkPage.jsx:62-90` hard-codes the same stale 82.7/78.9, which the data agent should check too.

### CALC-3: Countdown shows `--` for zero (P3, high)
`HomePage.jsx:1113-1131`: `{resultData?.countdown?.seconds || '--'}` and the same for days, hours and minutes. Every time seconds hits 0 the tile flickers to `--`, and the same happens for hours/days = 0. `years || remainingYears` shows e.g. "0.4" in the years tile when < 1 year remains. Fix: use `??`.

### CALC-4: Pension birth year is off by one before the birthday (P3, high)
`Pension.jsx:162`: `birthYear = new Date().getFullYear() - Math.floor(age)`. Someone aged 63 in Nov 2026 with a birthday in December was born 1962, but this computes 1963, giving pension age 68 instead of 67.
It hits the 1954/55, 1962/63, 1966/67 and 1970/71 boundaries. In birthdate mode the real birth year is known; pass `preciseAgeData.birthDate.getFullYear()` through `resultData.birthYear`. In age mode, show "67-68 år" when ambiguous.

### CALC-5: Share-link params are not validated (P2, high)
**Evidence.** `HomePage.jsx:107-124` puts `a`, `b` and `g` from the URL into state unvalidated. `calculateLifespan` accepts any number.
- `?g=male&a=99999999` makes `LifeInWeeksGrid.jsx:47-48` compute `totalYears = ceil(1e8)`, and the draw loop (`:80`) iterates about 5×10⁹ times, freezing the tab. A crafted link is a DoS against anyone who opens it.
- `?g=constructor&a=30` (or `toString`, `__proto__`) passes the `g` string through. `Sammenlign.jsx:95` then calls `getLifeExpectancyForCountry('Denmark','constructor')`, which returns `Object` (an inherited prototype property, `lifeExpectancyData.js:17-19`). `.toFixed` throws, and the whole app shows the ErrorBoundary and fires the Plausible `Error` event.
- `?b=garbage-x` gives an Invalid Date, NaN everywhere, and `saveEntry` writes `age: null` into history.
- `?b=2099-01-01` gives a negative age.

**Fix.** Add `parseShareParams(searchParams)` in `shareState.js`. It whitelists `g ∈ {male,female}`, clamps `a` to an integer 0-110, requires `b` to match `^\d{4}-\d{2}-\d{2}$`, be a valid date and lie in [1900-01-01, today], and clamps every `lf` value to the known option set. Return `null` on anything invalid. Unit-test it. Also guard `getLifeExpectancyForCountry` with `Object.hasOwn`.

### CALC-6: Corrupt history bricks the results view (P3, high)
`history.js:21-29` returns any array. `Historik.jsx:19-21` dereferences `last.expected` and `saveEntry` (`history.js:36-42`) dereferences `last.age`. A stored `[null,null]` (manual edit, a future schema change, CALC-5 NaN rows) throws during render on every visit, so the ErrorBoundary replaces the whole app until storage is cleared. Fix: in `loadHistory`, `.filter(e => e && Number.isFinite(e.ts) && Number.isFinite(+e.expected))`.

### CALC-7: Birthdate parsed as UTC (P3, medium)
`lifespanMath.js:10` does `new Date('1990-06-10')`, which parses as UTC midnight, while `getFullYear/Month/Date` are local. Correct in DK (UTC+1/+2), off by one day for users west of UTC. `HomePage.jsx:340` `max=` uses the UTC date, so between 00:00 and 01:00/02:00 DK time "today" isn't selectable. Tests (`lifespanMath.test.js:42-80`) pass `new Date(y,m,d)` objects, so the string path is untested. Fix: parse `YYYY-MM-DD` manually into `new Date(y, m-1, d)`.

### Other notes (no action / covered elsewhere)
- `remainingLifeExpectancy` clamps age ≥ 99 to e_99 (1.84/2.18). A 110-year-old gets 111.8; acceptable with CALC-5 clamping.
- The "Hvad hvis" path (`HvadHvis.jsx` → `projectedExpectancy`) uses the same bounded model as the hook, so the numbers are consistent.
- Duplicate lifestyle-sum logic in `HomePage.jsx:202-204` (display) and hook `:88-89` (calculation): same formula, two places. Folds into #7.

---

## Security

### SEC-1: No security headers (P2, high)
Live `curl -sI https://levetidsberegner.dk/` returns none of HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` or `frame-ancestors`/`X-Frame-Options`. `.htaccess` has some, but it's Apache and unused (DX-3).
**CSP feasibility.** There are three inline scripts in `index.html`: the theme (`:10-19`), the Plausible queue stub (`:30`) and the cookie banner (`:53`, to be removed per PRIV-6).
Move the theme script and the Plausible stub to a tiny `/boot.js`, or use hashes. Then this works:
`default-src 'self'; script-src 'self' https://analytics.holstjensen.eu; connect-src 'self' https://analytics.holstjensen.eu; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
`style-src 'unsafe-inline'` is needed for React `style={}` attributes and html-to-image. Ship it Report-Only first.
**Where.** In `dist/serve.json` (serve v14 reads `headers` from it; copy it via `public/serve.json`), or as a Cloudflare Transform Rule. Effort 2 h incl. verification.
**Other security checks, all clean:** no `dangerouslySetInnerHTML`, `innerHTML` or `eval` in `src/`. Every `target="_blank"` has `rel="noopener noreferrer"` (Coaching:33, Footer:100, Forsikringsbehov:91 also has `sponsored`, PromoBanner:55). `window.open` share URLs use `encodeURIComponent`. JSON-LD is rendered via Helmet children (text-escaped).

### SEC-2: Missing assets answer 200 HTML, so lazy chunks break after deploys (P2, high)
**Evidence.** Live `curl -sI https://levetidsberegner.dk/assets/nonexistent-abc.js` returns `200 text/html` (`serve -s` falls back to index.html for everything).
The SW calls `self.skipWaiting(); clientsClaim()` (built `sw.js`). It doesn't reload the page (`registerSW.js` only registers). On activation the new precache drops the old hashed chunks.
A tab opened before a deploy then navigates to a lazily loaded route (`App.jsx:6-11`), requests the old chunk hash, receives HTML, and fails with a module MIME error. The ErrorBoundary shows "Noget gik galt".
**Fix.**
1. In `serve.json`, stop rewriting `/assets/**` (only rewrite extensionless paths), so missing assets give a real 404.
2. Add a `lazyWithReload` wrapper: on chunk-load error, `sessionStorage`-guarded `location.reload()` once.
3. Optionally switch to `registerType: 'prompt'`, or keep autoUpdate and reload on `controllerchange`.

### SEC-3: Cache headers (P3, high)
Live `/assets/index-*.js`, `/sw.js` and `/registerSW.js` all return `Cache-Control: max-age=14400` (Cloudflare default), and CF answers `REVALIDATED`.
- Hashed assets should be `public, max-age=31536000, immutable`.
- `sw.js`, `registerSW.js`, `manifest.webmanifest` and HTML should be `no-cache`. Otherwise Cloudflare can serve a stale SW for up to 4 h after a deploy.

Configure in `serve.json` and make Cloudflare respect origin headers. Brotli is already on via CF (index.js 203 KB raw → 64 KB br).

### SEC-4: `build.target: 'esnext'` (P3, medium)
`vite.config.js:41`. The Vite default (baseline widely available) is safer. With esnext, newer syntax can reach Safari 15/16 and fail at parse time, before React or the ErrorBoundary exists, so the user sees a blank page. Remove the line. `sourcemap: true` (`:38`) publishes `.map` files; harmless for a public repo, but set it to `'hidden'` if desired.

---

## Performance

Live sizes (raw / brotli): `index.js` 203 KB / 64 KB, `router.js` 47 KB / 17 KB, `HomePage.js` 100 KB / 27 KB, `index.css` 71 KB / 11 KB, `og-image.png` 415 KB. Landing-page chunks are 7-13 KB.

### PERF-1: HomePage re-renders every second (P2, high)
`startCountdown` (`useLifespanCalculator.js:207-218`) replaces `resultData` every second. `resultData` is passed to about 14 children (`HomePage.jsx:1137-1287`), and `grep -rn "memo(" src` finds nothing.
The whole 1,341-line tree re-renders at 1 Hz; HvadHvis, Sandsynlighed, ParMode and others recompute each tick. It burns battery on mobile and makes INP worse.
**Fix.** Remove `countdown` from `resultData`. Add a `<Countdown endTimestamp>` component that owns its own interval and state (this also closes #2's "interval churn" point). `resultData` then changes only on a new calculation.

### PERF-2: LCP chain (P2, high)
The static HTML has an empty `#root` (`index.html:33`). LCP waits for HTML → `index.js` (64 KB br) + router → executing `App` → `lazy(HomePage)` discovered → `HomePage.js` (27 KB br) → render. In parallel, `index.css` → `@import` of the Google CSS → the font file (font-display swap, but CLS when Inter arrives).
The Suspense fallback "Indlæser..." (`App.jsx:14-21`) flashes as the first contentful paint on every cold load.
**Stage-0 fixes:**
- Import HomePage eagerly (it is the main landing route), or add a modulepreload for it.
- Self-host the font (PRIV-3).
- Prerender (STACK-OPTIONS) removes the chain entirely for the first paint.

### PERF-3: The SW precaches 500 KB of images nobody needs (P2, high)
`vite.config.js:13` lists `og-image.png` in `includeAssets`, and `globPatterns` `**/*.{…,png,…}` (`:32`) precaches it together with `pwa-512x512.png` (82 KB).
Every first visit downloads 415 KB for an image only social scrapers read. Exclude `og-image.png` via `globIgnores`, and re-export it as an optimized ~80-120 KB JPG/PNG.

### PERF-4: html-to-image in the HomePage chunk (P3, high)
`ShareModal.jsx:2` imports `toPng` statically; ShareModal is imported statically by HomePage (`:20`). Use `const { toPng } = await import('html-to-image')` inside `downloadImage` (`:119`), or lazy-load ShareModal. That saves roughly 10 KB br on the critical path.
Also: lucide icons are split into many tiny shared chunks (162-819 B each: `check`, `clock`, `wallet`…), which adds requests for no gain. Group them with `manualChunks: id => id.includes('lucide-react') ? 'icons' : …`.

---

## SEO-critical architecture

### SEO-1: Every route serves the same shell to crawlers (P1, high)
Live `curl https://levetidsberegner.dk/` (and any route) returns the static `index.html`. Title, description, `og:title`, `twitter:card=summary` and no `og:image` are identical for all 5 routes, and there is no canonical, no JSON-LD and no body text except the boilerplate section (SEO-4).
- **Google** renders JS (second wave), so it eventually sees the Helmet tags, but slowly, and it judges the rendered page against the boilerplate.
- **Bing, Facebook, LinkedIn, X, WhatsApp, Slack, Discord and most AI search fetchers** (OAI-SearchBot, PerplexityBot, ChatGPT-User) don't execute JS. They see no og:image, the wrong title on landing pages, and the same text on every URL.

So **#14 is implemented in code (`SEOHead.jsx:10-19,128-137`) but doesn't work for the audience it targets.** Keep #14 open or re-title it "og:image not visible without JS".
Fix: prerender per route (STACK-OPTIONS stage 0/1).

### SEO-2: Soft 404s (P2, high)
Live `/findes-ikke` returns `200`. `NotFoundPage.jsx:21-25` passes `canonicalUrl="/404"`, and `SEOHead.jsx:117` hard-codes `robots index, follow` for every page, including the 404.
Fix:
1. Add a `noindex` prop to SEOHead and use it on NotFound.
2. Prerender a real `404.html`, and have serve answer unknown paths with status 404 (`serve.json` rewrites for known routes only, or static hosting's 404 convention).

**Trap:** the Dokploy healthcheck curls `/api/health`, which passes today only because of the SPA fallback. Ship `public/health.txt` or `healthz.json` and change the healthcheck **in the same PR**, or the container goes unhealthy.

### SEO-3: Duplicate head tags (P3, high)
react-helmet-async replaces `<title>` but appends its own `description`, `og:*` and `twitter:*` next to the static ones in `index.html:21-26`. After hydration the page has two `description`s, two `og:title`s and `twitter:card` both `summary` and `summary_large_image`.
Fix: remove the static meta from `index.html` once prerendering injects per-route tags. Any prerender step must *replace*, not append.

### SEO-4: Boilerplate section and second footer on every route (P2, high)
`index.html:35-59` sits outside `#root`, so it renders below the React app on every route. That gives a second footer (after React's `Footer.jsx`) plus three generic paragraphs ("Dette gratis online værktøj er lavet for at gøre hverdagen lidt lettere…").
Problems:
- The text isn't about life expectancy.
- It is identical across all URLs, which is a duplicate/thin-content signal.
- It is the *only* text non-JS crawlers see.
- It says "vi gemmer ikke dine indtastninger", which is false today (PRIV-1).

Fix: delete it. Put real, route-specific content in the prerendered HTML instead.

### SEO-5: Static files not shipped; robots.txt (P2, high)
`robots.txt`, `sitemap.xml`, `ads.txt` and both policy pages are in the repo root, not `public/`.
- Live `/sitemap.xml` and `/ads.txt` return `200 text/html` (the SPA shell).
- Live `/robots.txt` is **Cloudflare's managed robots.txt**: content signals `search=yes, ai-train=no`, and it blocks GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended and others. It has **no `Sitemap:` line**. Search-time AI fetchers (OAI-SearchBot, PerplexityBot, ChatGPT-User) are not blocked.
- The repo `sitemap.xml` has `lastmod 2025-06-28` (stale).

Fix: move the files to `public/`. Generate the sitemap at build time from the route list with real lastmod. Decide whether the CF managed robots stays: if it does, add the sitemap to Search Console/Bing Webmaster manually, because CF's file wins. If it goes, ship our own with `Sitemap:`.

### SEO-6: FAQ schema missing though #15 is closed (P3, high)
`grep -rn FAQPage src` finds nothing; only `WebApplication` + `BreadcrumbList` exist (`SEOHead.jsx:22-60`). Google shows FAQ rich results only for authoritative gov/health sites since 2023, so the value is mostly for AI answer extraction. Low priority, but reopen or note it on #15.

### SEO-7: False claims in copy and meta (P2, high)
- `HomePage.jsx:210`: "baseret på alder, køn og geografisk placering".
- `:213`: "Baseret på WHO data og nationale statistikker".
- `DodsalderPage.jsx:64`: "officielle statistikker fra WHO … for dit land".

The engine uses only DST HISB8 for Denmark. Fix the copy (YMYL topic: accuracy matters for E-E-A-T).

### AN-1: Analytics misses client-side navigations (P2, high)
The live script `script.file-downloads.hash.…` only listens for `hashchange` (verified in the fetched source); it has no pushState hook. With `BrowserRouter`, every in-app navigation (landing page → "Beregn" → `/`) produces no pageview, so the funnel data undercounts. Fix: drop `hash` from the script name (`index.html:29`).

---

## Testing and DX

### DX-1: CI and test gaps (P3, high)
- `.github/workflows/ci.yml` runs lint → test → build on push to master and on PRs. It works (green runs), so **#13 can be closed**.
- But `master` has **no branch protection** (`gh api …/protection` gives 404), so CI is advisory.
- `eslint .` exits 0 on warnings, and `no-unused-vars` and `exhaustive-deps` are warn-level, which is how the dead exports survive. Use `eslint . --max-warnings 0` once the dead code is cleaned.
- **Untested:**
  - `useLifespanCalculator.calculateLifespan` (where CALC-1 lives)
  - URL hydration (CALC-5)
  - every component, including the Sammenlign logic (CALC-2) and the Pension birth-year logic (CALC-4)
- The 69 tests cover only `src/utils/*`. Recommended:
  - Extract `computeResult(input, now)` into `lifespanMath.js` and test both age and birthdate modes.
  - Add `parseShareParams` tests.
  - Add one Playwright smoke run on agent-worker: load `/`, fill in age + sex, assert the result and that no request goes to any host except the site and analytics (a privacy regression guard).
  - Add one Lighthouse CI budget run on `/` (LCP < 2.5 s mobile, JS < 120 KB br).
- **Dependabot:** security updates are active (PRs #59-#65), but 5 PRs (#59, #62-#65) are open and unmerged. There's no `dependabot.yml` or Renovate config for version updates.

### DX-2: Committed `dist/` (P3, high)
`git log -- dist` shows the last update on 2026-07-04 (`cbb8e4d`). The live bundle hashes (`index-Dahj3lkh.js`) differ from the committed ones (`index-D6Yr7mM6.js`). `.dockerignore` excludes `dist`, and the Dockerfile builds fresh.
Nothing depends on it, so **#10 is unblocked**: add `dist/` to `.gitignore`, `git rm -r --cached dist`, and update `CLAUDE.md:81-82`, which still describes Nixpacks + committed dist.

### DX-3: Legacy deploy files contradict reality (P3, high)
- `.dokploy` says static type, output `.`.
- `nixpacks.toml` is superseded by the Dockerfile (commit `3c9854e`).
- `.htaccess` is Apache and unused by serve.
- `index.html.bak` and `backup/` (15 files, the pre-React site) are unused.

They mislead agents (CLAUDE.md still points to Nixpacks). Remove them after confirming in Dokploy that the build type is Dockerfile. See `dead-code.md`.

---

## Status of open issues (evidence)
| # | Status in code | Evidence |
|---|---|---|
| #2 countdown | **Half fixed.** String re-parse gone (`endTimestamp`); fractional-year truncation and 1 Hz churn remain | CALC-1, PERF-1 |
| #3 dead what-if | **Done, close.** No `showScenario`/`getElementById` in `src/`; HvadHvis is React state | `grep -rn "getElementById" src` gives only `main.jsx:8` |
| #4 FOUC | **Done, close.** Inline pre-paint script | `index.html:10-19`, `ThemeToggle.jsx:7-11` |
| #6 lifestyle model | Partly: bounded (`lifespanMath.js:44-52`), still unsourced for 8 factors | data agent |
| #7 factor metadata | Open, valid. 60 hand-written `factor-btn` blocks in HomePage | `grep -c factor-btn HomePage.jsx` = 60 |
| #8 PageLayout | Partial: shared `PageHeader`, but Footer/ThemeToggle/PromoBanner are wired per page | `src/pages/*.jsx` |
| #9 error boundary | **Done, close** | `App.jsx:3,26-36`, `ErrorBoundary.jsx` |
| #10 dist | Open, **unblocked** | DX-2 |
| #13 CI | **Done, close** (add branch protection separately) | `.github/workflows/ci.yml`, green runs |
| #14 og:image | Code done, **ineffective without prerender** | SEO-1 |
| #15 (closed) | FAQPage **not** implemented | SEO-6 |
| #21 a11y | Partial: radiogroups, focus and aria-live done; the 60 lifestyle `factor-btn` lack `aria-pressed`/radio semantics; ShareModal has no focus trap/Escape | `HomePage.jsx:420-440`, `ShareModal.jsx:146-160` |
| #23 / #29 / #31 / #32 | Not started or partial (feature work) | n/a |
