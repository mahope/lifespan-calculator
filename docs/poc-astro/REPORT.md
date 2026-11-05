# Astro PoC report (issues #88, #89; scope also from #95, #97)

Branch `poc/astro-88`, based on `4afef1e` (master when the job started). **Never merge.** Time spent: about 1 h wall clock (14:20 to 15:20 UTC on 2026-11-05) against an 8-12 h box, so nothing was cut for time. Items not done are listed under "Not done".

## Recommendation (decision rule from #88)

**Continue in Astro**, with two caveats: criterion 8 is only verified locally (no staging deploy was allowed), and the offline/PWA migration from the *existing* production service worker is untested (see "UNVERIFIED").

Criteria 4, 5 and 7, the three that decide the fallback to option D/A1, all pass. Criterion 6 passes after a one-class change in `PageHeader.jsx` (see the measurement notes). Nothing needed the +4 h grace.

What the numbers say, same machine, same Chrome, mobile preset, median of 3:

| `/` (calculator) | SPA, master | SPA, footer and cookie-banner markup stripped | Astro PoC |
|---|---|---|---|
| Lighthouse performance | 74 | 95 | 100 |
| LCP / CLS / TBT | 1.60 s / 1.00 / 100 ms | 2.78 s / 0 / 60 ms | 0.78 s / 0 / 80 ms |
| JS (brotli) | 97.1 KB | 97.1 KB | 74.8 KB |
| Raw HTML has title, canonical, og:image, JSON-LD, H1 | no | no | yes |

So the framework itself is worth roughly 2 s of LCP on `/` (2.78 s to 0.78 s) and removes all JS from content pages (77 KB brotli to 0 on `/hvor-lang-tid-har-jeg-tilbage`). The CLS 1.0 on master is the known static footer and cookie-banner markup, not React; that markup also *hides* the real LCP (master's 1.6 s is the static footer text, the real SPA LCP is 2.8 s). Full tables below.

Compared with option D/A1 (prerender script, stay an SPA): D/A1 would fix the raw HTML but every page would still hydrate the whole React app (about 77-97 KB brotli) and LCP would stay JS-bound. Astro gives zero-JS content pages and generated pages for free. The cost is a one-time port of the two remaining routes and the shared chrome (estimate below).

## Acceptance criteria of #88

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `curl` shows title, description, self-canonical, absolute og:image, `twitter:card=summary_large_image`, JSON-LD, H1 and body text for every PoC URL | **PASS** | `measurements/rawhtml-astro.md` (8 URLs, curl against the Caddy image). Table below. |
| 2 | Unknown URL: 404 + `noindex`; missing `/_astro/x.js`: 404, not HTML | **PASS** | `curl -s -o /dev/null -w '%{http_code} %{content_type}' /findes-ikke` gives `404 text/html`, body has `<meta name="robots" content="noindex, follow">`, header `X-Robots-Tag: noindex`. `/_astro/x.js` gives `404 text/plain` body `Not found`, `Cache-Control: no-store`. |
| 3 | `/sitemap-index.xml` is `application/xml` and lists all PoC URLs; `robots.txt` has `Sitemap:` | **PASS** | `/sitemap-index.xml` gives `200 application/xml; charset=utf-8`; `sitemap-0.xml` lists 33 URLs (5 hand-written routes plus 28 age pages); `robots.txt` ends with `Sitemap: https://levetidsberegner.dk/sitemap-index.xml`. `/404` is not listed. |
| 4 | Existing tests pass with `src/utils/*` byte-identical; golden test | **PASS** (one caveat) | `git diff 4afef1e -- src/utils src/hooks` is 0 lines. The 69 `src/utils` tests pass (`npx vitest run src/utils`: `Tests 69 passed (69)`). Golden test `src/golden/golden.test.js`: 6 inputs, fixture generated from master `4afef1e` with the same harness, passes on the PoC. **Caveat:** there is no `computeResult` on master; the engine entry point is `calculateLifespan` inside the hook `useLifespanCalculator`, so the harness runs the real hook in a server render with a fixed clock (`2026-11-05T12:00:00Z`, TZ Europe/Copenhagen). Master also had 6 tests in `scripts/gen-sitemap.test.js` (route list vs `App.jsx` and `serve.json`); they test files the port removes, so they were deleted and replaced by `src/lib/site.test.js`. Master total was 75, not 69. |
| 5 | Playwright: both modes and sexes give golden values; only site and analytics hosts contacted; nothing sent before submit except the pageview | **PASS** (analytics stubbed) | `~/dev/audit-levetid/poc88/pw/func.mjs`, 33/33 checks pass. Simple mode male 40 (41.2 y), female 65 (21.4), female 30 (54.5), male 85 (5.8) and advanced male 50 (smoking Let, exercise Moderat, diet Sund, sleep 7-8 timer: 35.8, impact +4) match `golden.json`. Birthdate deep link `?g=male&b=1985-06-15` renders. Hosts contacted: `127.0.0.1:3331` (9 requests) and `analytics.holstjensen.eu` (1, the script). Zero requests while typing and choosing sex. The only analytics event is `Calculate Lifespan` with **no props**. **Limit:** the analytics script was stubbed (the real host was never contacted from the test), so the pageview POST that the real Plausible script would send was not observed. |
| 6 | Lighthouse mobile, 3 runs, median: `/` LCP <= 2.0 s, TBT <= 150 ms, CLS <= 0.05; static pages <= 10 KB JS and LCP <= 1.5 s | **PASS** | `/`: LCP 0.78 s, TBT 80 ms, CLS 0. Static pages (`/hvor-lang-tid-har-jeg-tilbage`, `/levetid/*`, `/levetid-beregner-danmark`, `/levealder-kommuner`): 0 KB external JS, LCP 0.76-1.38 s. `/pensionsalder` has a form island and ships 55 KB brotli (React); it is an app page, not a static page. **Note:** with the header `animate-fadeIn` that master also has, `/` measured LCP 2.05 s (a 45 ms miss). The LCP element is the hero subtitle inside the fading container. One class removed from `src/components/PageHeader.jsx`; the same change on the SPA does not help it (LCP 2.77 s), so it is not what the comparison rests on. |
| 7 | PWA installable, `/` works offline after the first visit, a deploy while a tab is open never shows the ErrorBoundary | **PASS** | Installable: CDP `Page.getInstallabilityErrors` on a persistent profile gives `[]` (a normal incognito context only reports `in-incognito`). Offline: after the first visit and warm-up, `context.setOffline(true)`, reload `/`, fill the form and calculate: works (`func.mjs`). Deploy swap (`pw/swap.mjs`): build A loaded and SW active, served files swapped to build B (old `Calculator.*.js` now 404), then in the same tab: calculate (works, no reload), navigate to `/hvor-lang-tid-har-jeg-tilbage` (works), navigate back to `/` (loads B's chunk and heading "(build B)"), calculate (works), reload. "Noget gik galt" never appeared, no console or page errors, no HTTP >= 400. |
| 8 | Docker image (Caddy) passes the Dokploy healthcheck on a staging domain | **PASS locally, staging UNVERIFIED** | `docker build -f Dockerfile.astro` succeeds; `docker exec ... curl -fsS http://127.0.0.1:3000/api/health` prints `ok`; image `HEALTHCHECK` is the same curl. No staging domain was touched (not allowed). |

Criterion 1 detail (curl, no JS), from `measurements/rawhtml-astro.md`:

| URL | title | description | canonical (self) | abs og:image | summary_large_image | JSON-LD blocks | H1 | words in raw HTML |
|---|---|---|---|---|---|---|---|---|
| `/` | yes, unique | yes | yes | yes | yes | 1 (WebApplication) | yes | 338 |
| `/hvor-lang-tid-har-jeg-tilbage` | yes | yes | yes | yes | yes | 1 (BreadcrumbList) | yes | 418 |
| `/pensionsalder` | yes | yes | yes | yes | yes | 1 (BreadcrumbList) | yes | 422 |
| `/levetid-beregner-danmark` | yes | yes | yes | yes | yes | 2 (Dataset, BreadcrumbList) | yes | 1,058 |
| `/levealder-kommuner` | yes | yes | yes | yes | yes | 1 | yes | 1,729 |
| `/levetid/mand/40`, `/levetid/kvinde/65` | yes | yes | yes | yes | yes | 1 | yes | 520 |
| SPA master `/` and every route | same title for all | yes | **none** | **none** | **no** | **0** | **none** | 181 (static footer text) |

## Measurements

Setup: SPA = `git archive 4afef1e`, `npm ci`, `npm run build`, served with `npx serve@14.2.6 dist` (master's `serve.json`). Third column = same SPA with the static footer, cookie banner and "Om dette værktøj" section removed from `index.html`. Astro = the Caddy image (`caddy:2-alpine`, gzip/zstd). Same machine, Google Chrome 157 stable, Lighthouse 13.6.0 (installed in a scratch dir outside the repo), mobile preset, 3 runs per URL, median. Requests to `analytics.holstjensen.eu` and Google Fonts were blocked in **all** runs (so nothing left the machine); the SPA's Google Fonts CSS therefore never loaded, which flatters the SPA a little. "JS brotli" is the brotli size of the same-origin script files, computed offline (neither server sends brotli). Raw data: `measurements/*.json`.

### `/`

| metric | SPA master | SPA, shell markup stripped | Astro PoC |
|---|---|---|---|
| Performance | 74 | 95 | 100 |
| Accessibility | 96 | 96 | 96 |
| Best practices | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |
| LCP | 1.60 s | 2.78 s | 0.78 s |
| CLS | 1.00 | 0.00 | 0.00 |
| TBT | 100 ms | 60 ms | 80 ms |
| FCP | 1.60 s | 1.57 s | 0.78 s |
| JS brotli | 97.1 KB | 97.1 KB | 74.8 KB |
| Transfer | 144.2 KB | 142.9 KB | 124.2 KB |
| Requests | 16 | 16 | 11 |

### `/hvor-lang-tid-har-jeg-tilbage`

| metric | SPA master | SPA, shell markup stripped | Astro PoC |
|---|---|---|---|
| Performance | 75 | 96 | 100 |
| Accessibility | 95 | 95 | 95 |
| Best practices / SEO | 100 / 100 | 100 / 100 | 100 / 100 |
| LCP | 1.56 s | 2.54 s | 1.38 s |
| CLS | 1.00 | 0.00 | 0.00 |
| TBT | 34 ms | 79 ms | 27 ms |
| FCP | 1.56 s | 1.55 s | 0.76 s |
| JS brotli | 77.0 KB | 76.9 KB | 0 KB |
| Transfer | 121.8 KB | 120.6 KB | 28.4 KB |
| Requests | 18 | 18 | 6 |

### Astro-only pages

| URL | Perf | A11y | BP | SEO | LCP | CLS | TBT | JS br | Transfer | Req |
|---|---|---|---|---|---|---|---|---|---|---|
| `/pensionsalder` | 100 | 96 | 100 | 100 | 0.76 s | 0 | 25 ms | 55.0 KB | 99.2 KB | 11 |
| `/levetid-beregner-danmark` | 100 | 96 | 100 | 100 | 0.78 s | 0 | 14 ms | 0 | 31.5 KB | 6 |
| `/levealder-kommuner` | 100 | 96 | 100 | 100 | 0.82 s | 0 | 7 ms | 0 | 30.4 KB | 6 |
| `/levetid/mand/40` | 100 | 96 | 100 | 100 | 0.76 s | 0 | 0 ms | 0 | 28.4 KB | 6 |
| `/levetid/kvinde/65` | 100 | 96 | 100 | 100 | 0.76 s | 0 | 0 ms | 0 | 28.3 KB | 6 |

### What is framework and what is the shell problem

- **Shell problem (not the framework):** CLS 1.00 and the odd-looking LCP 1.6 s on master. Stripping the markup moves CLS to 0, performance to 95 and LCP to 2.78 s. A separate pull request removes that markup from the SPA, so the fair SPA baseline is column 2.
- **Framework:** against column 2, Astro gains 2.0 s of LCP on `/` (2.78 to 0.78), 1.2 s on the static page (2.54 to 1.38), 22 KB of brotli JS on `/` (React stays, the router, helmet and the page chunks go), and 77 KB of JS on content pages. Transfer on a content page falls from 121 KB to 28 KB.
- **Not framework, shared:** the `animate-fadeIn` on the page header costs about 1.3 s of LCP on `/` in either build (Astro with the fade: 2.05 s). It is fixed here with one class and could be fixed the same way in the SPA, but the SPA's LCP stays 2.77 s because it waits for JS to render at all.
- Accessibility is 96 on `/` for both; the remaining findings are `color-contrast` on `text-muted-foreground` (shared token, on the calculator's own cards) and were not touched.

## Build, size, pages

- `npm run build`: **6.9 s** wall clock, 34 pages built (5 hand-written routes, 28 generated age pages, `404`), then the post-build guard. `dist/` is 1.7 MB; `dist/_astro` is 372 KB (of which `client` 184 KB, `Calculator` 97 KB, CSS 67 KB, raw, before compression).
- 28 age pages build in about 0.1 s each; the 28-page stretch set is therefore not a build-time risk at all. 200+ pages would still be seconds.
- Gate on the branch: `npm ci` (ok), `npm run lint` (clean), `npm test` ends `Test Files 15 passed (15) / Tests 113 passed (113)`, `npm run build` ends `check-guard: 28 pages, 0 failing, 0 problems`.

## What was built (file list)

- Astro setup: `astro.config.mjs`, `tsconfig.json`, `vitest.config.js`, `eslint.config.js` (node globals for `.mjs` scripts only), `package.json`/lock (deps swapped), `.gitignore`/`.dockerignore`.
- Pages: `src/pages/{index,hvor-lang-tid-har-jeg-tilbage,pensionsalder,levetid-beregner-danmark,levealder-kommuner,404}.astro`, `src/pages/levetid/[koen]/[alder].astro`.
- Shared: `src/layouts/Base.astro`, `src/components/astro/{BaseHead,Footer,ThemeToggle,SurvivalCurve,TrendChart,KommuneTable}.astro`. `BaseHead` is typed (`interface Props`) and writes title, description, robots, self-canonical, og:*, twitter, JSON-LD, theme script, PWA registration and the Plausible tags (unchanged from master).
- Islands: `src/islands/Calculator.jsx` (HomePage minus SEOHead/router/PageHeader/Footer, plus `URLSearchParams` + `history.replaceState`), `src/islands/PensionForm.jsx`.
- Logic (pure, unit-tested): `src/lib/{agePages,guard,denmark,pensionCalc,site}.js`.
- Data: `scripts/fetch-dst.mjs` (Node `fetch` against `api.statbank.dk/v1/data`: HISB8, HISBR, HISBK) writes `src/data/{history,national,regions,kommuner}.generated.json`, every figure `{ value, period, source, retrieved }`.
- Guard: `scripts/check-guard.mjs` (+ test), runs after `astro build`.
- Serving: `Caddyfile`, `Dockerfile.astro`, `public/robots.txt`, `public/api/health`.
- Changed from master: `src/index.css` (Google Fonts import removed, system font stack), `src/components/PageHeader.jsx` (one class). Removed: `index.html`, `vite.config.js`, `postcss.config.js`, `src/main.jsx`, `src/App.jsx`, `public/serve.json`, `public/sitemap.xml`, `public/404.html`, `scripts/gen-sitemap.*`, and the five old pages plus `SEOHead`, `Footer`, `ThemeToggle`, which need the router or helmet. `privatlivspolitik.html` and `cookiepolitik.html` moved into `public/`.
- Evidence: `docs/poc-astro/evidence/` (32 JPEGs, 390 and 1440 px, light and dark: `astro-{home,static,generated,kommuner,pension,danmark}-*` and `spa-{home,static}-*` for the before view), `docs/poc-astro/measurements/`.

## Engine reuse

`src/utils/*` and `src/hooks/useLifespanCalculator.js` are byte-identical to `4afef1e`. Three behaviours I changed in the **island** (not the hook), because they break the hard product rules: the "Brug min placering" button (it sent coordinates to Nominatim) is replaced by one sentence saying the placement is not used; the `Calculate Lifespan` Plausible event no longer carries age, sex or location (no props at all); no cookie banner. Master has since landed the same intent in #103.

## #89: the age/sex template and the guard

- 28 pages (ages 20 to 85 in steps of 5, both sexes), including the four required ones. Each shows e_x and expected age at death, median age at death from l_x, P(reach 70/80/90/100), weeks and days, an inline-SVG survival curve, the same age in 1981-82, 2000-01 and 2024-25 (fetched from HISB8 into `history.generated.json`), the opposite sex, the folkepension age for the cohort with working years left (`pension.js`), links to age -5/+5, the other sex, the calculator (`/?g=&a=`) and `/pensionsalder`. Sentences are data-dependent (for example the milestone closest to 50 % is the one written out, and "mere/færre" follows the sign of the sex gap), so the pages are not a template with swapped numbers. Page-specific figures per page: 14-19 against the neighbours.
- Tables only reach age 99. `survivalProbability` in `src/utils` clamps at 99, so using it for "reach 100" would silently give P(99). The page model therefore estimates l_100 by extending the last yearly survival rate and says so on the page. This is a modelling choice to confirm.
- Guard (`src/lib/guard.js`): a page fails with fewer than 8 numbers that none of its neighbours (age -5, +5, other sex) show, or 5-word-shingle Jaccard > 0.6 to any neighbour. It runs twice: on the data model at render time (failing pages get `noindex` and drop out of the sitemap) and on the finished HTML (`scripts/check-guard.mjs`; the build exits 1 if a failing page is indexable or in the sitemap, or if the two disagree).
- Result: **28 of 28 pass** (unique numbers 14-19, max similarity 0.22-0.36 on rendered HTML). It does bite: my first draft failed 3 pages (`/levetid/kvinde/25`, `/30`, `/80`, with 5-7 unique numbers) until I added the survival-quantile and 10/20/30-year tables.
- Proof it fails on a duplicate: `src/lib/guard.test.js` ("FAILS a deliberately duplicated page" and "FAILS a template page where only one number is swapped") and `scripts/check-guard.test.js` (a duplicated page that is still indexable and in the sitemap makes `checkHtmlPages` report problems, which is what exits the build).

## #95/#97 pieces

- `/pensionsalder`: form island (birth date required, 1930-01-01 to today; sex optional, only for the retirement-years figure), table of statutory ages derived from `pension.js` (no hand-typed ages), no storage, no network, URL untouched (`func.mjs` checks all three). Boundary tests for all ten dates in #97 are in `src/lib/pensionCalc.test.js`.
- `/levetid-beregner-danmark`: national e0 and e65 (HISB8), 1981-2025 inline SVG trend with a `<details>` text table, five regions (HISBR), all kommuner (HISBK 2021:2025, ranked, 5 areas listed as "ikke opgivet"), `Dataset` JSON-LD, "data opdateret". Numbers come from the generated files; `src/lib/denmark.test.js` checks stamps, that the latest period equals the committed life table, and that the view-model values are in the files. No hand-typed number appears in the templates (the 94 in the kommune title is `komm.count`).
- `/levealder-kommuner`: JS-free, three ranking tables (by all, men, women), explanation of what the figure is and is not.
- Skipped on purpose: Eurostat Nordic comparison, education and income gap, healthy life years (#95 sections 4-6), the FAQPage JSON-LD, and the sortable table (three static tables instead).

## Incompatibilities and surprises

- **Astro 7.4.4, not 7.4.5.** 7.4.5 was 3 days old (published 2026-11-02), so 7.4.4 (2026-10-28) is pinned. Astro 7 needs Node >= 22.23.4; `engines` was raised accordingly (CI's Node 22 and `node:22-alpine` are fine as long as they resolve to a recent 22.x).
- **`@vite-pwa/astro` 2.0.0** (2026-10-31) is a rewrite on `@unplugin-pwa/*` and `@vite-pwa/workbox-build` 8: it uses a *named* export (`AstroPWAIntegration`, not the default export that STACK-OPTIONS assumed), the `workbox` option is deprecated in favour of `generateSW`, and with the default settings neither the `<link rel="manifest">` nor a service-worker registration script ended up in the HTML. I register it myself in `BaseHead`.
- **Precache vs NetworkFirst:** a precached `index.html` is served cache-first and shadows the NetworkFirst route, so `/` would be stale after a deploy until the new SW activates. HTML is therefore not precached (only `_astro/*.{js,css}`, manifest and icons are). To still work offline after the first visit, the page re-fetches itself once the SW controls it (header `x-sw-warm`), which the NetworkFirst rule matches and stores. Without that warm-up the first visit would not be cached until the second.
- **Hydration:** no mismatch warnings (`func.mjs` fails on any console error or warning on six pages). `ThemeToggle.jsx` was replaced by a 300-byte vanilla script, so its dark-class-at-render problem is gone. `max={new Date()...}` on the birthdate input is not rendered at build time because that input only exists after the user switches mode, so nothing is frozen into the HTML.
- **Tailwind 4** works unchanged through `@tailwindcss/vite` 4.3.2 (same version as the lockfile's tailwindcss); `@source` auto-detection picked up `.astro` files.
- **React 19 islands:** `lucide-react` icons render statically in `.astro` files with no JS; only `Calculator` and `PensionForm` hydrate.
- **Build format:** `build.format: 'file'` plus Caddy `try_files {path} {path}.html` gives clean URLs and a real `404.html`; a leftover `public/404.html` made Astro skip its own 404 page.
- **Caddy:** `handle_errors` keeps the 404 status when it rewrites to `/404.html`; the hashed-asset handler had to be kept out of the error path or a missing `/_astro/x.js` carried `immutable` (fixed with `header >Cache-Control no-store`).
- **Master moved while the job ran:** `origin/master` is now `08e767c` (#101 self-hosted Inter, #102 delete-history, #103 no user input in analytics and location feature removed). The PoC is based on `4afef1e`, so a real port would start from the new master; #101 and #103 overlap with what is done here.
- **`pension.js` observations** (reused unchanged, not fixed): it works in whole years per birth year, so 1954 returns 66 flat although its own comment says "phased 65-66½", the 1954 H2 and 1955 H1 half-year cohorts cannot show different ages, and the "date reached" is the birthday, not a statutory first-of-month date. `folkepensionAge(<=1953)` returns 65 for everyone. The page says that half-years are not modelled.
- Stage-0 audit issues still open on this base and unchanged here: Plausible script keeps `hash` and `pageview-props` as in master (task said keep exactly), contrast tokens, and the footer text of master (which claimed IP lookup and WHO data) was rewritten to what the PoC actually does.

## UNVERIFIED / not done

- **Real Plausible traffic** from the page (stubbed in Playwright).
- **Staging/Dokploy**: image built and healthchecked locally only. Dokploy's own healthcheck command and the Traefik labels were not exercised.
- **Migration from the existing production service worker.** Same `sw.js` URL and scope, so the browser will replace it, and `cleanupOutdatedCaches` is on, but the old SW's `index.html` precache and `navigateFallback` were not tested against the new one. Do this on staging with a browser that has the old SW installed.
- **Stale HTML plus removed chunk:** the case where NetworkFirst falls back to a cached HTML (offline or network slower than 3 s) that names a chunk the server no longer has was not tested. The island would then not hydrate; the SSR form would still be visible.
- Not ported: `/dodsalder-calculator` and `/livsstil-og-levetid` (their old pages were deleted with the router; they exist on master). Not built: kommune pages (#89 stage 2), Eurostat/education/healthy-life-years sections, link checker in CI, `docs` and `CLAUDE.md` updates, Dependabot/CI changes.

## Packages added (3-day and install-script check)

| Package | Version (published) | Why | Install scripts |
|---|---|---|---|
| `astro` | 7.4.4 (2026-10-28) | the framework | none |
| `@astrojs/react` | 7.1.2 (2026-10-28) | React island renderer | none |
| `@astrojs/sitemap` | 3.7.4 (2026-08-31) | sitemap-index.xml | none |
| `@vite-pwa/astro` | 2.0.0 (2026-10-31) | PWA | none |
| `@tailwindcss/vite` | 4.3.2 (2026-06-29) | Tailwind 4 in Vite (replaces `@tailwindcss/postcss`) | none |

Removed: `react-router-dom`, `react-helmet-async`, `vite`, `vite-plugin-pwa`, `@vitejs/plugin-react`, `@tailwindcss/postcss`, `postcss`. All versions pinned exactly. The only package in the lockfile with an install script is the optional `fsevents` (macOS). `npm audit` shows 3 advisories in `brace-expansion` via `eslint-plugin-react` (dev, same on master).

## Effort per sub-goal (wall clock, rough)

| Sub-goal | Time |
|---|---|
| Read audit docs, baseline build of master, dependency checks | 10 min |
| Golden harness, island port (router/helmet/geolocation/analytics), layout, head, static pages, PWA | 20 min |
| Data script, age pages, guard and tests | 15 min |
| Pension and Denmark/kommune pages | 10 min |
| Caddy image, Playwright (functional, offline, deploy swap, installability), screenshots, Lighthouse, report | 25 min |

## Estimate to a production-grade port of all routes

About **12-18 agent hours** beyond this PoC: port `/dodsalder-calculator` and `/livsstil-og-levetid` and the shared sections (3-4 h), rebase onto current master and fold in #101-#103 (1-2 h), a11y token pass and the missing 4 points of accessibility (1-2 h), migration test of the old service worker on staging plus Dokploy healthcheck and cut-over (2-3 h), CI (Playwright smoke, guard, link checker, Node 22.23+) (2-3 h), the #95 sections that were skipped (4-6 h, mostly data and copy), kommune pages for #89 stage 2 (3-5 h, separate and optional).

## What I would do differently

- Start the PWA from `injectManifest` (own tiny SW) if offline HTML ever has to be fully deterministic; `generateSW` hides the route order that caused the precache-vs-NetworkFirst trap.
- Put the DST fetch behind a dated `--check` mode so a data refresh PR shows a diff of numbers.
- Decide on one source for "today" (`REFERENCE_YEAR` is the build year, so cohort labels move on 1 January without a content change).
- Keep the Plausible tag exactly as master only until stage 0 lands; `hash` and `pageview-props` should go.
