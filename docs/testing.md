# Testing

Four levels, from fast to slow. All of them run on every pull request.

| Level | Command | Runs in CI | What it protects |
| --- | --- | --- | --- |
| Unit (vitest) | `npm test` | yes, job `build` | Calculation, data and helper code in `src/`; `src/copyGuard.test.js` keeps removed unsourced wording and user-input analytics props out of `src/` (including the `.astro` pages and layout) and `public/*.html` |
| Build checks | `npm run build` (postbuild) | yes, job `build` | Service worker generation, URL/SEO parity with the SPA (`scripts/check-parity.mjs`), JavaScript budget (`scripts/check-js-budget.mjs`) |
| End to end (Playwright) | `npm run build && npm run test:e2e` | yes, job `e2e` | What a visitor sees and what leaves the browser, served by the production Caddyfile |
| Performance budget | `node scripts/lighthouse-budget.mjs` | yes, job `perf` | Mobile LCP and CLS on `/`, no script files on content pages |

## Build checks (postbuild)

- `scripts/build-sw.mjs` writes `dist/sw.js` (see "Service worker" below).
- `scripts/check-parity.mjs` compares every built page with `scripts/fixtures/spa-parity.json`, the head of the SPA
  build of master `ddb8c1c` (title, every SEO meta tag, canonical, Open Graph, Twitter, JSON-LD) and its sitemap.
  The only allowed difference is listed in `ADDED_JSON_LD`: the FAQPage block on `/pensionsalder`, which the SPA only
  added at runtime and the HTML now carries. A unit test also checks the fixture against the copy of production in
  `e2e/fixtures/legacy-prod/`. Changing a title or description on purpose means updating the fixture in the same commit.
- `scripts/check-js-budget.mjs` fails the build when a content page (`CONTENT_PAGES`) loads a script file from the
  site or has an island, or when `/`, `/pensionsalder` or `/embed` exceed their brotli budget (`ISLAND_BUDGET`).
  Inline bootstrap scripts and the analytics script do not count.

## Unit tests

Vitest, files next to the code as `*.test.js`. Pure logic (`src/utils/*`) and a few components.

## End to end tests (`e2e/`)

`@playwright/test` (pinned) drives the built site in Chromium. `playwright.config.js` starts the Caddy image the
Dockerfile uses (`caddy:2.11.7-alpine`) with `dist/` and the production `Caddyfile` mounted read-only, so status
codes, redirects and headers are exactly production's. This needs Docker. The port is random per run (set
`E2E_PORT` to choose one) and the container is removed when the run ends. Run `npm run build` first.

- `calculator.e2e.js`: three baseline inputs (male 40, female 65, male born 1985-06-15) with the clock frozen at
  2026-11-05T12:34:56Z. The golden remaining years are explicit assertions (40.8, 21.0 and 39.9 years; age-only input
  counts as mid-year) and a small JSON snapshot in `e2e/__snapshots__/<case>.json` holds numbers only (years, the
  countdown values, the affiliate link rel/target, no banner IDs), never page copy. The same file checks that only the site and the
  analytics host are contacted, that every analytics event is whitelisted in `EVENTS` (`src/utils/analytics.js`:
  the event name is a key, every prop key is listed for that event, Plausible's own `pageview` carries no props),
  that no prop value and no request body contains a typed input value (age, birthdate, gender), that nothing is
  logged with `console.error`, and that a crafted share link (`?g=constructor&a=99999999`) leaves the page responsive.
- `projection.e2e.js`: the projected-figure toggle (#92): period stays the default headline, keyboard operation (Space/Enter),
  reset on "Ny beregning", no toggle from entered age 70, nothing in the URL or storage, and a computed WCAG contrast check (>= 4.5:1) of the toggle text on the gradient in light and dark (axe cannot measure the gradient).
- `share-privacy.e2e.js`: opens a new-style, an advanced and a legacy `b=` share link and records every request to the analytics origin (URL, headers, body). None may contain `g=`, `a=`, `b=`, `m=`, `lf=` or the birthdate, the pageview `u` is the clean path, the result still hydrates, and an unrelated `utm_source` still reaches analytics. The inline script in `src/layouts/Base.astro` that makes this true is also unit tested (`src/utils/shareQuery.test.js`).
- `static-contract.e2e.js`: `/robots.txt`, `/sitemap.xml`, `/privatlivspolitik`, a 404 for `/xyz` and 200 for
  `/api/health`. Every URL of the SPA (`scripts/fixtures/spa-parity.json`) answers 200 at the same address with its
  own canonical and its H1 and body text in the raw HTML; the sitemap lists the same URLs; `/x/`, `/x.html`,
  `/x/index.html` and `/index.html` still land on the page; hashed files are immutable and a missing one is a
  short uncached 404.
- `content-parity.e2e.js`: every page shows the same visible text, links and headings as the SPA did
  (`e2e/fixtures/spa-rendered.json`, captured from the SPA build of master `ddb8c1c` in the same browser setup).
- `sw-migration.e2e.js`: the switch from the SPA's Workbox service worker. `e2e/fixtures/legacy-prod/` is a frozen
  copy of what production served on 2026-11-07 (its `sw.js`, the precached SPA files and HTML). A local server
  (`e2e/support/switch-server.mjs`) serves that copy, then `dist/`, from the same origin. Checked: the old worker
  keeps serving the working SPA until the browser looks for an update; then the new worker deletes the Workbox
  cache and reloads the open tabs into the new site (also tabs the update was not triggered from); unknown paths
  are a real 404 afterwards; the SPA's lazy chunks are a plain 404 so a missed tab reloads on its next route
  change; offline use after the first visit; and a later deploy is shown on the next load (network first) with
  the cache replaced. Runs with service workers allowed on `localhost` (a secure context).
- `embed.e2e.js`: the iframe widget. A page on another origin (`framer.test`, served by a Playwright route) frames
  `/embed`, which must render, while `/` and `/embed-levetidsberegner` must not be framable (`X-Frame-Options:
  SAMEORIGIN`). Also checks the response headers per URL, that the only message posted to the parent is
  `{type, height}`, and that the `Embed Calculate` event carries no props and no input.

The baseline cases come from the 2026-11-05 audit harness (branch `docs/audit-2026-11-05`, `audit/measure2/baseline`).
The pinned Plausible script in `e2e/fixtures/` is a copy from there.

### Updating the golden values and snapshots

The golden years change only when the calculation or the life table changes on purpose. Copy changes must not touch
them. Regenerate with

```sh
npm run build
npm run test:e2e -- --update-snapshots
git diff e2e/__snapshots__
```

The diff must contain only numbers: `yearsRemaining`, the `countdown` values, and (rarely) the affiliate link
attributes. A changed word in the diff means the snapshot has started to depend on copy: fix the capture, do not
commit it. Every changed number must be explained by your change. Also update the explicit `years` values in
`CASES` in `e2e/calculator.e2e.js`, and commit them together with the JSON files.

### Network is always intercepted

The fixture in `e2e/fixtures.js` routes every request. Same-origin requests go to the local server. The analytics
host is answered locally (the Plausible script is replayed from the pinned copy, events are recorded and
acknowledged with 202, never forwarded). Every other host, including partner ads, fonts and geocoding, is aborted
and recorded, and the test fails if one was contacted. Affiliate links are only inspected, never clicked. The suite
therefore never sends anything to analytics or to partners. The tests themselves need no internet once `npm ci` has
run and the browser is installed (`npx playwright install` downloads Chromium, which does use the network).
The Caddy container listens on 127.0.0.1 only.

The site is opened as `http://levetid.test:<port>`, which Chrome maps to 127.0.0.1, because the Plausible script
ignores localhost and 127.x and the privacy check needs it to run.

## Service worker

`scripts/build-sw.mjs` fills `scripts/sw-template.js` with this build's pages (`OFFLINE_PAGES`) and files (hashed
scripts, fonts, favicon) and a cache name derived from their contents. Install caches each file on its own and
cannot fail; activate deletes every other cache and claims open tabs. Pages are network first (3 s, then the cached
copy); there is no navigation fallback. Browsers look for a new `/sw.js` on a navigation only when the last check
is more than 24 hours old, so a visitor with the SPA's worker sees the old (working) SPA until that check, and the
new site from then on. `public/registerSW.js` stays at its old address for HTML the old worker may still serve.

## Performance budget

`scripts/lighthouse-budget.mjs` serves `dist/` with the Caddy image and the production `Caddyfile` (compression
on), runs Lighthouse (`npx lighthouse@13.5.0`, mobile preset, `--throttling-method=devtools`) and fails when the
median of three runs on `/` has an LCP above 1.5 s or a CLS above 0.1, or when a content page loads any script
file from the site (the `/embed` preview iframe on `/embed-levetidsberegner` is a separate document and is not
counted). The analytics host is blocked. It prints the runs and medians as JSON (`BUDGET_OUT` writes them to a
file; CI uploads it as the `lighthouse-budget` artifact).

DevTools throttling applies the slow 4G and 4x CPU profile to the real page load. The default simulated
throttling is not used: against a local server the fonts and the island scripts finish before the first paint,
so the simulation puts them on the LCP path and reports about 2.4 s for `/`, while the same load under applied
throttling paints the LCP text (the subtitle) at about 0.9 s (agent-worker, 2026-11-07). The script is not
offline: `npx` downloads `lighthouse@13.5.0` (exact pin, no install scripts, run with `npm_config_ignore_scripts`)
and its transitive dependencies from the npm registry on each run.

On agent-worker:

```sh
ssh agent-worker
cd ~/dev/lifespan-calculator && source ~/dev/env.sh
npm ci && npm run build
CHROME_PATH=/opt/google/chrome/chrome node scripts/lighthouse-budget.mjs
```

Browsers: Playwright finds its Chromium through `~/dev/pw-chrome.sh` on agent-worker (it is Google Chrome Stable,
with the sandbox on). Do not add `--no-sandbox`.
