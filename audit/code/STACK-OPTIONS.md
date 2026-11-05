# levetidsberegner.dk: stack options and staged plan

Date: 2026-11-05. Facts this document builds on are in `CODE-REPORT.md`. The key ones are SEO-1 to SEO-5, SEC-1 to SEC-3 and PERF-2.

## Starting point (verified)
- **Rendering.** Vite 8 + React 19 SPA with an empty `#root`. Every URL returns the same HTML with HTTP 200. Per-route title, meta, canonical, og:image and JSON-LD exist only after JS runs (react-helmet-async).
- **Routes.** 5 real routes plus a client-side NotFound. All are `React.lazy` (`src/App.jsx`).
- **Engine.** `src/utils/*` is pure ESM with no React or DOM: `lifespanMath`, `lifeTableDK`, `pension`, `insurance`, `lifestyleFactors`, `shareState`, `history` (localStorage behind an injectable store). It can run at build time in Node unchanged. That is the most valuable asset for programmatic SEO.
- **SSR safety of components.** `window` and `document` appear only in effects and handlers (LifeInWeeksGrid, ThemeToggle, ShareModal when open, ErrorBoundary reload). Two small SSR caveats:
  - `ThemeToggle`'s initial state reads the `dark` class, so hydration can mismatch on the icon. Fix: render the icon after mount, or add `suppressHydrationWarning`.
  - `HomePage.jsx:340` computes `max=` from `new Date()` at render time. A prerendered value is frozen at build time, so compute it client-side.
- **Hosting.** Docker `serve -s dist` on Dokploy behind Cloudflare.
  - Unknown paths and missing assets return 200 HTML.
  - The Dokploy healthcheck on `/api/health` passes *only because of* that SPA fallback.
  - `/robots.txt` is Cloudflare's managed file with no `Sitemap:` line.
- **DST data available for programmatic pages** (api.statbank.dk, checked today):
  - `HISB8`: e_x and l_x by single age 0-99 and sex. 2-year periods from 1981:1982 to 2024:2025, already used.
  - `HISBK`: e0 by **kommune** (100 values incl. "Hele landet") and sex. 5-year periods from 2000:2004 to 2021:2025.
  - `HISBR`: 5 regions. `HISB77`: 11 landsdele.
  - `LIGEHI2`/`LIGEHI4`: remaining life expectancy at 50/30 by family type and education.
  - **There is no age-conditional table per kommune.** Kommune pages can only carry e0 plus trend and rank, not "a 40-year-old in Aarhus".

## Discriminators
1. Real per-route HTML: title, description, canonical, og:image, JSON-LD and main text without JS.
2. Real HTTP status: 404 for unknown URLs, and 404 for missing `/assets/*`.
3. Reuse of `src/utils/*` as-is, at build time and in the browser.
4. Generating N pages from data (`getStaticPaths`-style), each with little or no JS.
5. PWA continuity: installable, offline calculator, no stale-chunk trap.
6. Migration risk and agent hours.
7. Calculation stays 100 % in the browser; no server runtime added.

## Package compatibility (`npm view`, 2026-11-05)

| Package | Latest | Relevant peers | Fit with current stack (react-router-dom 7.18, vite 8) |
|---|---|---|---|
| `@react-router/dev` (framework mode) | 8.5.1 | `react-router ^8.5.1`, `vite ^7 \|\| ^8` | Requires the **React Router 8 major upgrade** plus framework-mode conversion |
| `vite-react-ssg` | 0.9.2 | `react-router-dom ^6.14.1`, `vite ^6.4 \|\| ^7.3 \|\| ^8` | **Not declared for RR7**; unsupported combination |
| `vike` / `vike-react` | 0.4.269 / 0.6.32 | `vite >=7.1`, `react >=19` | Compatible on paper |
| `astro` + `@astrojs/react` | 7.4.5 / 7.1.2 | React 17-19 | Compatible |
| `@vite-pwa/astro` | 2.0.0 | `astro ^5 \|\| ^6 \|\| ^7`, `rolldown ^1` | Compatible |
| `next` | 16.4.5 | React 18/19 | Compatible, but a different framework entirely |

---

## Option A: keep the Vite SPA and add build-time prerendering

**Variants:**
- **A1.** A custom post-build script: `react-dom/server` + `StaticRouter`, rendering the 5 routes into `dist/<route>/index.html`. This is the same thing as option D at its smallest.
- **A2.** `vite-react-ssg`. Not recommended: its declared peer is RR6.
- **A3.** React Router framework mode with `prerender: [...]`. Requires RR 8.
- **A4.** Vike.

| | A1 custom prerender | A3 RR8 framework + prerender | A4 Vike |
|---|---|---|---|
| What changes | `entry-server.jsx` + `scripts/prerender.mjs` (Node, after `vite build --ssr`); `main.jsx` switches to `hydrateRoot` | Upgrade to RR8, `routes.ts`, `root.jsx`, route modules with `meta()` exports; Helmet removed | `pages/*/+Page.jsx`, `+Head`/`+title`, `+prerender`; router replaced by Vike's file routing |
| SEO / LCP gain | Full per-route HTML; LCP becomes the prerendered H1 (no JS wait); FCP no longer "Indlæser..." | Same | Same |
| Programmatic pages | Possible (loop over generated paths), but every page hydrates the whole React app (~80-100 KB br) | Possible via `prerender()` returning paths; also full hydration per page | Good (`+onBeforePrerenderStart` returns URLs); can render HTML-only pages without hydration |
| Engine reuse | Unchanged | Unchanged | Unchanged |
| Helmet / routing | Keep Helmet (`HelmetProvider` context on the server), or move to React 19 native `<title>`/`<meta>` hoisting; verify in the PoC that tags land in `<head>` when rendering a fragment | `meta()` per route; `<Link>` mostly unchanged | Vike routing; `<a href>` navigation |
| Real 404 / sitemap / robots | You write them: prerender `404.html`, generate `sitemap.xml` from the route list, and the server must 404 unknown paths | `ssr:false` SPA fallback + prerendered routes; 404 handling still needs host config | Prerenders a `404` page; sitemap is DIY |
| PWA | vite-plugin-pwa unchanged; set `navigateFallback: null` or a denylist so real 404s and static files are not shadowed | Integration less trodden; needs testing | Works as a Vite plugin; needs testing |
| Risk | Low. Small, contained, reversible | Medium-high. Two migrations at once (RR7→8 and library→framework) | Medium. New framework idioms; smaller ecosystem |
| Agent hours | 6-10 for 5 routes; +8-12 for programmatic pages | 14-22 | 14-24 |

## Option B: Astro 7 with React islands

**What changes:**
- **Pages.** `src/pages/*.astro` replace the 5 React pages. The 4 landing pages become plain Astro or Markdown content (0 KB JS), and the shared `PageHeader`/`Footer` become Astro components.
- **Calculator.** The calculator becomes one island: `<Calculator client:load />`, which is today's HomePage body. It keeps state, the hook and all result cards, minus `SEOHead`, `useSearchParams` and the router.
- **Share state.** Read and write it with `URLSearchParams` + `history.replaceState` (or only inside ShareModal, per PRIV-5).
- **Programmatic pages.** `src/pages/levetid/[koen]/[alder].astro` + `getStaticPaths()` imports `src/utils/lifeTableDK.js` at build time and renders static numbers and SVG charts. They ship no JS, or one tiny "beregn præcist" island.
- **Head.** A typed `<BaseHead>` Astro component replaces react-helmet-async. Title, canonical, og and JSON-LD go into raw HTML.

**SEO / LCP.** Best of the options:
- Content pages are pure HTML/CSS.
- The calculator page still server-renders its form shell (an island SSRs at build) and hydrates.
- The rendered landing pages would ship no React runtime at all, roughly 80 KB br saved per landing page.

**Real 404 / sitemap / robots.**
- `src/pages/404.astro` produces `404.html`. Static hosts and nginx/Caddy serve it with status 404.
- `@astrojs/sitemap` generates `sitemap-index.xml` from all routes, including generated ones.
- `public/robots.txt`.

**PWA.** `@vite-pwa/astro` 2.0 (peer astro ^7). Precache only the calculator assets plus the offline page, and use NetworkFirst runtime caching for HTML. **No SPA `navigateFallback`**: every URL is a real file.

**Risk.** Medium:
- The page shells are rewritten, but the engine and the result-card components move over untouched.
- Inter-page navigation becomes full page loads, which is fine and fast for static HTML.
- Tailwind 4 works via `@tailwindcss/vite`.

**Agent hours.** 18-28 for parity on the 5 routes plus PWA. Generated pages add 10-16 more (stage 2).

## Option C: Next.js 16 static export
**What changes:**
- App Router with `output: 'export'`.
- `generateMetadata`/`metadata` replaces Helmet; `generateStaticParams` for programmatic pages.
- The calculator gets `'use client'`.
- PWA via Serwist or a hand-written SW.

**What it costs:**
- Every page ships the Next client runtime (~90-110 KB br) even when static.
- Static export has no real 404 *status* by itself; it emits `404.html` and depends on the host.
- RSC semantics add concepts this app doesn't need.

**Engine reuse.** Unchanged.
**Risk.** Medium-high.
**Agent hours.** 24-40.
**Verdict.** It solves the same problems as B at a higher JS cost and with a bigger migration. No reason to choose it here.

## Option D: small custom static generator
**What it is.** A Node script run after `vite build`:
1. Build an SSR bundle of `App` (`vite build --ssr src/entry-server.jsx`).
2. For each path in a route table (5 routes plus the generated list), `renderToString` the app inside `StaticRouter` + `HelmetProvider`.
3. Inject the HTML and head tags into the `index.html` template, replacing the static ones rather than appending.
4. Write `sitemap.xml`, `404.html` and `robots.txt`.

Generated pages can be plain template strings (no React) for zero JS.

**Gains.** The same raw-HTML gains as A1. Generated pages can be JS-free if they are templated rather than React-rendered.
**Risk.** Low to start, but you own a mini-framework: hydration of generated pages, head merging, link checking, sitemap. Every new feature (images, Markdown content, i18n for #32) is DIY.
**Agent hours.** 8-14 core, +8-12 for programmatic pages.

---

## Recommendation

1. Do **stage 0 now in the current stack**, about one agent-day. It fixes about 70 % of the SEO, security and privacy damage with no framework change.
2. Then run a **time-boxed Astro PoC (option B)**. Astro fits the target shape: one interactive calculator plus hundreds of mostly static, data-driven pages.
3. The reasons Astro wins:
   - zero JS on content and programmatic pages
   - first-class `getStaticPaths`, sitemap and 404
   - `src/utils/*` reused untouched
   - the React result cards keep working inside one island
   - PWA via `@vite-pwa/astro`
4. **Fallback.** If the PoC misses its acceptance criteria, use option D/A1 with the custom prerender script. It is the lowest-risk way to get per-route HTML while staying an SPA.
5. **Skip:**
   - React Router framework mode: it needs the RR8 upgrade, so two migrations at once.
   - vite-react-ssg: its declared peer is RR6.
   - Next: heavier runtime for the same result.
6. **Hosting.** The output is static either way. Keep Dokploy, but switch the image from `serve` to Caddy or nginx with real 404s, headers and immutable caching. Cloudflare Pages is the alternative (see the open question).

---

## Staged plan

### Stage 0: quick wins, no stack change (~6-9 agent hours, split into independent PRs)
1. **Static files.** Move `robots.txt`, `sitemap.xml`, `ads.txt`, `privatlivspolitik.html` and `cookiepolitik.html` to `public/`.
   - Update the sitemap with all routes and today's lastmod.
   - Decide on Cloudflare's managed robots.txt; if it stays, submit the sitemap in GSC and Bing.
   - **Trap:** serve's cleanUrls 301-redirects `*.html` to `/privatlivspolitik`, and the SW denylist `/\.html$/` no longer matches that. Link to the clean path and add `/^\/(privatlivspolitik|cookiepolitik)/`, `/\.(xml|txt)$/` and `/^\/assets\//` to `navigateFallbackDenylist`.
2. **`public/serve.json`** (or swap to Caddy/nginx):
   - security headers (SEC-1; CSP as Report-Only first)
   - `immutable` caching on `/assets/**`, `no-cache` on `sw.js`, `registerSW.js`, `manifest.webmanifest` and HTML (SEC-3)
   - **no SPA rewrite for `/assets/**`** (SEC-2)
   - a `health.json` file, **and change the Dokploy healthcheck from `/api/health` to it in the same PR**, or the container goes unhealthy
3. **Per-route prerender of shell + meta only.** A tiny post-build script writes `dist/<route>/index.html` for the 5 routes.
   - It replaces `<title>`, description, canonical, og:* and twitter:* (including `summary_large_image` and og:image) and JSON-LD from one route table, `src/routes.meta.js`. SEOHead reads the same table, so there is a single source of truth.
   - It removes the static meta, the boilerplate "Om dette værktøj" section and the second footer from `index.html` (SEO-3, SEO-4).
   - serve finds the directories before the fallback.
   - This alone fixes social previews (#14) and non-JS crawlers' titles. ~2-3 h.
4. **Privacy fixes:**
   - remove Plausible props (PRIV-1)
   - self-host Inter (PRIV-3)
   - delete the geolocation feature (PRIV-4)
   - remove the cookie banner (PRIV-6)
   - fix the Footer text and policies (PRIV-2)
   - drop `hash` from the Plausible script (AN-1)
5. **Bug fixes:** CALC-1, CALC-3, CALC-5 and PERF-3. Import HomePage eagerly (PERF-2).
6. **Repo hygiene:** `git rm --cached dist` (#10) and remove the legacy deploy files (DX-3).

### Stage 1: Astro PoC (time-box 8-12 agent hours on agent-worker, branch `poc/astro`)
**Scope.** `/` (calculator island), `/hvor-lang-tid-har-jeg-tilbage` (static), `/404`, plus 2 generated pages (`/levetid/mand/40`, `/levetid/kvinde/65`), and the PWA.

**Acceptance criteria (all must hold):**
1. `curl -s <url>` (no JS) for each PoC URL contains:
   - a unique `<title>`, `meta description` and `<link rel=canonical>` (self)
   - `og:image` (absolute), `twitter:card=summary_large_image`, JSON-LD
   - the page's main H1 and body text
2. `curl -o /dev/null -w %{http_code} /findes-ikke` returns `404`, and the body has `noindex`. A missing `/_astro/x.js` returns `404`, not HTML.
3. `/sitemap-index.xml` returns `application/xml` and lists all PoC URLs; `/robots.txt` has a `Sitemap:` line.
4. All 69 existing vitest tests pass with `src/utils/*` **byte-identical**. A new golden test asserts that `computeResult` gives identical output for 6 fixed inputs before and after.
5. A Playwright run on agent-worker covers both modes and both sexes:
   - fill in age + sex
   - the result matches the golden values
   - **the only network hosts contacted are the site and the analytics origin**
   - nothing is sent before submit except the pageview
6. Lighthouse mobile (agent-worker, 3 runs, median):
   - `/`: LCP ≤ 2.0 s, TBT ≤ 150 ms, CLS ≤ 0.05
   - static pages: ≤ 10 KB JS (br) and LCP ≤ 1.5 s
7. PWA: Chrome shows it as installable, `/` works offline after the first visit, and a deploy while a tab is open never yields the ErrorBoundary. Test it: open the tab, deploy, navigate.
8. The Docker image (Caddy/nginx static) passes the Dokploy healthcheck on a staging domain.

**Decision rule.** All 8 pass: proceed to stage 2 in Astro. Criteria 4, 5 or 7 fail and can't be fixed within +4 h: fall back to option D/A1.

### Stage 2: programmatic SEO pages (10-16 agent hours after the PoC)
**Page inventory (estimate):**

| Set | Pattern | Count | Data |
|---|---|---|---|
| Age × sex | `/levetid/{mand,kvinde}/{0..99}` | 200 | HISB8 e_x, l_x (current period) + HISB8 history 1981-2025 for the same age |
| Kommune | `/levetid/kommune/{slug}` | 98 | HISBK e0 by sex, 2000:2004 → 2021:2025 |
| Region / landsdel | `/levetid/region/{slug}` | 5 (+11 optional) | HISBR / HISB77 |
| Hubs | `/levetid/mand`, `/levetid/kvinde`, `/levetid/kommuner` | 3 | index tables |
| **Total** | | **≈ 306-317** | |

**Keyword variants.** Map variants like "hvor gammel bliver jeg", "hvor gammel bliver en mand på 40" and "forventet levealder 65 årig kvinde" onto these same pages through titles, H1, FAQ copy and anchor texts. **Do not create a page per phrasing**; that is the textbook duplicate pattern.

**Thin-content / duplicate-content guard.** Each generated page must carry unique, computed value. It is enforced at build time, and a failing page is omitted from the sitemap and gets `noindex`.

Age × sex pages must show **all** of:
- e_x and expected age at death
- median age at death, computed from l_x as the age where l = ½ l_age
- P(reach 70/80/90/100) from l_x
- weeks and days left
- a statically rendered survival curve SVG
- the same age in 1981, 2000 and today: how e_x has changed
- the opposite sex at the same age
- folkepension age for the matching cohort, with working years left (`pension.js`)
- an internal-link block to age −1/+1, −10/+10, the other sex and the calculator prefilled via `?a=&g=`

Kommune pages must show:
- e0 for men and women
- rank among the 98 kommuner and the difference vs the national figure
- the 2000-2025 trend with change in years
- 3 nearest neighbours by value and by geography
- region context

They must state clearly that the figure is life expectancy at birth, not a personal estimate.

**Build checks:**
- each page has ≥ 8 numbers not present on its neighbours
- text similarity (5-word shingles, Jaccard) to the adjacent page < 0.6, otherwise fail the build
- every page links to ≥ 4 siblings and 1 hub
- self-canonical

**Rollout.** Ship ages 20-85 in 5-year steps first (≈ 28 pages) plus the kommune hub. Watch GSC indexing and impressions for 3-4 weeks before releasing the full set. Ages 95-99 have thin data: fold them into one "95+" page.

**Copy.** Template text with data-dependent sentences ("En 40-årig mand i dag kan forvente … – 2,1 år mere end en 40-årig i 2000"). Pages with no varying sentences fail the guard. The YMYL disclaimer and the DST citation (with period) go on every page.

### Open question: hosting
- **Keep Docker on Dokploy, static web server image.** Caddy or `nginx:alpine` serving `dist/`. Real 404, headers, immutable caching, Brotli via Cloudflare. It keeps Grafana/Traefik per-app metrics, Kuma and the current deploy flow; the change takes about 1 h. **Recommended default**: consistent with the rest of Mads' fleet and monitoring.
- **Cloudflare Pages.** Free, edge-served, `_headers`/`_redirects`, `404.html` convention, a preview deploy per PR, and one less container on Hetzner. It loses the Grafana app metrics and adds a deploy platform. The repo is on GitHub, which Pages supports directly. Worth it only if build previews per PR matter.

Mads should decide this before stage 1 step 8. It doesn't block stages 0-1.

### What happens to the PWA in each option
- **A1/D:** vite-plugin-pwa as now. Restrict `navigateFallback` (allowlist the SPA routes only) so real 404s and static files still work. Add a reload-on-chunk-error guard.
- **B (Astro):** `@vite-pwa/astro`. No SPA fallback, precache only the calculator, NetworkFirst for HTML. On the first deploy, a one-time SW migration replaces the old SW: same scope, `skipWaiting`, and old precaches cleaned automatically.
- **C:** a hand-rolled Serwist setup.
