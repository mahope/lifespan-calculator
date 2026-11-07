# Astro port (#88): what was checked

Port of the Vite/React SPA (master `ddb8c1c`) to a static Astro 7 site with React islands, served by Caddy.
The PoC (`poc/astro-88`, PR #137) was the reference for the approach; the port itself starts from master.
Measured on agent-worker on 2026-11-07.

## Parity with the SPA

| What | How | Result |
| --- | --- | --- |
| URLs and sitemap | `scripts/check-parity.mjs` (every build) and `e2e/static-contract.e2e.js` | the same 8 routes, the same 7 sitemap URLs, every one 200 at the same address |
| SEO head per page | `scripts/check-parity.mjs` against `scripts/fixtures/spa-parity.json` | title, all meta, canonical, Open Graph, Twitter and JSON-LD identical. One addition: the FAQPage JSON-LD on `/pensionsalder`, which the SPA only added at runtime, is now in the HTML |
| Visible content | `e2e/content-parity.e2e.js` against `e2e/fixtures/spa-rendered.json` | text, links and headings identical on all 8 routes |
| Look | full-page screenshots, SPA vs Astro, 8 routes x 390/1280 px x light/dark, compared pixel by pixel | 0 differing pixels in all 32 pairs |
| Calculator numbers | the existing `e2e/calculator.e2e.js` golden values and snapshots, `src/utils` unchanged | unchanged |
| HTTP behaviour | `http-spa-serve.txt` (master with `serve`) vs `http-astro-caddy.txt` (this build in the Caddy image) | same status for every route, policy page, health, robots, sitemap, embed headers. Deliberate differences: `/x/index.html` and `/index.html` redirect to the clean URL (serve sent them to `/x/index`), `/privatlivspolitik/` redirects instead of a duplicate 200, 404 pages add `X-Robots-Tag: noindex`, a missing JS file is a short `no-store` text 404 instead of the HTML page |

## Performance

`lighthouse-budget.json` (`node scripts/lighthouse-budget.mjs`, Lighthouse 13.5.0, mobile, DevTools
throttling, Caddy image with compression):

| Page | LCP (median of 3 on `/`) | CLS | Same-origin script files |
| --- | --- | --- | --- |
| `/` | 0.95 s (0.94, 0.95, 1.07) | 0.00 | the calculator island, 86.5 KB brotli (SPA: about 97 KB) |
| content pages | 0.96 to 1.01 s | 0.00 | none (0 KB) |

For comparison, the redesign measurements of the SPA (`docs/redesign/lh-efter.json`, simulated throttling)
had LCP 2.8 to 3.2 s. Inlining the CSS was needed: with a separate stylesheet the render-blocking CSS shared
the slow link with the two preloaded fonts and `/` painted at 1.62 s.

## Service worker switch

`e2e/sw-migration.e2e.js` against `e2e/fixtures/legacy-prod/` (production's own files): the old worker keeps
serving the working SPA until the browser checks for an update (on navigation at most once per 24 hours), then
the new worker deletes the Workbox cache and reloads every open tab into the new site. Offline use and the next
deploy (network first) are covered too.
