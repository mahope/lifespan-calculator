# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Danish lifespan calculator web application. A static Astro site: every URL is a
prerendered HTML file, and only the interactive parts hydrate as React islands.
Styled with Tailwind CSS, served by Caddy in Docker (#88, ported from the Vite SPA).

Tech stack (kept current):
- Astro 7 (static output, `build.format: 'directory'`, CSS inlined) with `@astrojs/react`
- React 19 + React DOM 19 for the islands and for rendering the page components to HTML
- Tailwind CSS 4 (CSS-first config via `@theme` in `src/index.css`, through `@tailwindcss/postcss` in `astro.config.mjs`)
- Caddy 2 (pinned image tag) as the production server, config in `Caddyfile`
- Node.js >= 22.23.4 (Astro 7; see `engines` in `package.json`)

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # Astro dev server (http://localhost:4321)
npm run build      # dist/ + postbuild: sw.js, SPA parity check, JS budget
npm run preview    # astro preview of dist/ (without the Caddyfile's headers and 404 handling)
```

### Validation (the gate; CI runs the same steps)
```bash
npm ci && npm run lint && npm test && npm run build && npm run test:e2e
```
CI runs the first four in job `build`, the e2e suite in job `e2e` and `node scripts/lighthouse-budget.mjs`
in job `perf` (see `docs/testing.md`; update snapshots with `npm run test:e2e -- --update-snapshots`).
`npm run build` also acts as a smoke test - it fails on broken imports/JSX/CSS, on a head or sitemap that differs
from the SPA (`scripts/check-parity.mjs`) and on script files on a content page (`scripts/check-js-budget.mjs`).
The e2e suite and the budget run the Caddy image with `dist/` mounted, so they need Docker.

## Architecture

### Core Structure (`src/`)
- **`pages/*.astro`**: One file per URL (plus `404.astro`). Only `.astro` files may live here (Astro routes
  every file in it; a test enforces this). Each renders a component from `views/` inside `layouts/Base.astro`.
- **`layouts/Base.astro`**: the HTML document: head tags from `lib/head.js` (values from `routes.meta.js`),
  the inline scripts (share-link scrubber before analytics, theme before first paint, theme switch, service
  worker registration), Plausible (not on 404) and the manifest. Props: `route`, `notFound`, `embed`, `extraJsonLd`.
- **`views/`**: Page content as React components (HomePage, HvorLangTidPage, DodsalderPage, LivsstilPage,
  DanmarkPage, PensionsalderPage, EmbedInfoPage, EmbedPage, NotFoundPage). Rendered to HTML at build time;
  links are plain `<a href>` (there is no router).
- **`islands/`**: The only hydrated components (`client:load`), each wrapped in `ErrorBoundary`:
  `HomeCalculator` (the `Calculator` export of `views/HomePage.jsx`; the masthead, other-tools list and footer
  around it are static), `PensionFormIsland` (the `PensionForm` export, passed into `PensionsalderPage` as the
  `form` slot) and `EmbedWidget`. A new interactive part must be an island; content pages must stay script-free.
- **`components/`**: Shared UI (PageHeader with the `SiteNav` masthead, which takes `current` for the active
  link, PageShell for the landing pages, SectionHeader, ThemeToggle (static button, switched by the inline script
  in `Base.astro`), Footer, PromoBanner, Overlevelseskurve (survival curve), ShareCard, ShareModal).
- **`hooks/useLifespanCalculator.js`**: State wrapper; calls the pure
  `computeResult(input, now)` in `utils/lifespanMath.js` (age, remaining time,
  end instant). No location lookup: the app never asks for or sends the user's position.
- **`utils/lifestyleFactors.js`**: `LIFESTYLE_FACTORS` is the single source of the
  advanced-mode questionnaire (key, icon, label, `inSum`, `evidence`, `source` with
  cited figure/PMID/range, options `{ value, years, label }`; `value` is the stored
  answer/share-link id, `years` the effect). Only `inSum` factors change the
  estimate, and every `inSum` factor needs a source and evidence above `none`
  (tested). `components/LifestyleFactor.jsx` renders one factor as an accessible
  radio group with helper text generated from the table. To add or change an
  option, edit the data only.
- **`data/cohortTable.generated.js`**: projected (cohort) e_x per age 0-99 from DST
  FRDK426, written by `node scripts/build-cohort-table.mjs` (needs network; leaves the
  file untouched on any validation failure). `computeResult` takes `projection:
  'period'|'projected'`; the period table stays the default and projected is only
  offered below age 70 (`PROJECTION_MAX_AGE`, checked on the age after #118's +0.5, so
  an entered 69 gets the toggle and 70 does not). Survival probabilities (`Sandsynlighed`)
  and `ParMode` always use the period figures. The toggle state is page state only (reset
  by "Ny beregning", never in the URL or storage). `BASE_YEAR` in the script is explicit;
  a test fails when the table is more than a year older than `LIFE_TABLE_PERIOD`.
- **`utils/lifeExpectancyData.js`**: Static country life-expectancy data with
  Danish translations, plus lookup/formatting helpers.
- **`index.css`**: Tailwind v4 entry - `@import 'tailwindcss'`, `@theme` design
  tokens, `@utility` component classes, and the light/dark CSS variables.

### Key Technical Points
- **Language**: Danish interface.
- **Privacy**: All input stays in the browser; analytics events carry no user input.
- **Design**: editorial statistics look, direction and tokens in `docs/redesign/retning.md`: Source Serif 4 for
  headings and figures (self-hosted), Inter for text, one petrol accent, open ruled sections instead of cards.
  `.card` is kept as a class name because the e2e capture reads it, but it is a ruled section, not a box.
- **Dark mode**: `class` strategy - `.dark` is toggled on `<html>`; Tailwind v4
  `@custom-variant dark` in `index.css` drives the theming.

### Data Flow
1. User inputs age/gender
2. Danish life table (and country data for comparison) -> calculation performed
3. Results displayed with contextual messaging

## Common Tasks

### Adding Countries
Update the data in `src/utils/lifeExpectancyData.js`. Include `male`, `female` values plus a
localized `country` name for display.

### Styling Changes
Design tokens live as CSS variables and `@theme` entries in `src/index.css`.
Reusable component classes are defined with Tailwind v4 `@utility`. Mobile-first;
main color scheme uses HSL custom properties (see `:root` / `.dark`).

## Deployment
- `Dockerfile` is the only build definition: stage 1 (`node:22-alpine`) runs
  `npm ci` + `npm run build`; stage 2 (`caddy:<pinned>-alpine`, the same tag as in
  `playwright.config.js` and `scripts/lighthouse-budget.mjs`, tested) serves `dist/` from `/srv` on
  port 3000 as the non-root user `web`, with `curl` for the healthcheck (`HEALTHCHECK` on `/api/health`,
  file `public/api/health`). `Caddyfile`: `/x` is served from `x/index.html` or `x.html` (no SPA fallback;
  unknown paths get `404.html` with status 404 and noindex, a missing `/_astro/*` or `/assets/*` file a
  short `no-store` text 404); `/x.html`, `/x/index.html`, `/index.html` and the policy pages with a slash
  redirect 301 to the clean URL; `/_astro/*` is immutable, everything else `no-cache` (the `?` default);
  security headers on every response, also errors. Framing: `X-Frame-Options: SAMEORIGIN` everywhere except
  `/embed`, which sends `Content-Security-Policy: frame-ancestors *` and `X-Robots-Tag: noindex` (tested end
  to end in `e2e/embed.e2e.js` against the real Caddyfile).
- Head and SEO: each page's title, description, canonical, Open Graph/Twitter tags and JSON-LD are written
  into its HTML by `layouts/Base.astro` from `src/routes.meta.js` (single source); `astro.config.mjs` fails
  the build on duplicate or too long titles (60) / descriptions (160). `/pensionsalder` adds the FAQPage
  JSON-LD (`utils/pensionFaq.js`) via `extraJsonLd`. `scripts/check-parity.mjs` (postbuild) compares every page
  head and the sitemap with `scripts/fixtures/spa-parity.json` (the SPA build of master `ddb8c1c`); a deliberate
  SEO change means updating that fixture in the same commit, and the same for `e2e/fixtures/spa-rendered.json`
  (visible text, links, headings) checked by `e2e/content-parity.e2e.js`.
- The route list lives in `scripts/gen-sitemap.mjs` (`ROUTES`); `prebuild` regenerates `public/sitemap.xml`
  from it. Adding a route means adding `src/pages/<route>.astro`, `ROUTES` and `ROUTE_META` (tests enforce
  this), plus the parity fixtures. `/embed` (iframe widget, `EmbedPage`) is a normal route with
  `noindex: true`, listed in `ROUTES` but also in `NOINDEX_ROUTES`, so it is not in the sitemap. It does not
  register the service worker. `/embed-levetidsberegner` (info page with copy-paste code and terms) is
  indexable and script-free (copy button wired by an inline script). The widget uses `computeEmbedResult`
  (`utils/embedResult.js`), which calls `computeResult`, so its numbers equal the calculator's. It posts only
  `{type, height}` to the parent and tracks `Embed Calculate` without props.
- Service worker: `scripts/build-sw.mjs` (postbuild) writes `dist/sw.js` from `scripts/sw-template.js` (no
  Workbox). Same URL and scope as the SPA's Workbox worker, which it replaces: install cannot fail, activate
  deletes every other cache and, when it finds the old `workbox-*` cache, reloads the open tabs once. Pages are
  network first with the build's own copy as offline fallback; no navigation fallback. Keep `/sw.js` at that
  URL and `public/registerSW.js` (the old HTML loads it). Tested in `e2e/sw-migration.e2e.js` against
  `e2e/fixtures/legacy-prod/`, a frozen copy of production before the port (do not edit it).
- Hosted as a Dokploy app (`web`) on a worker server, build type `dockerfile`.
  **autoDeploy is off**: merging to `master` does not deploy; a deploy is
  triggered by hand.
- `master` is the default branch. CI (`.github/workflows/ci.yml`) runs
  `npm ci`, lint, tests and build, the e2e suite and the performance budget on pushes to `master` and on PRs.
- Production sits behind Cloudflare (proxied DNS). It overrides `Cache-Control` for static extensions
  (`/sw.js` came back as `max-age=14400`); browsers ignore that for the worker script, but purge `/sw.js` after a deploy.
- `dist/` is a build artifact and is **not committed** (it is in `.gitignore`
  and `.dockerignore`); never add it back.
- `.github/dependabot.yml` opens weekly npm PRs with a 3-day cooldown.

## Project Rules
- The calculation runs 100% in the browser. User input (age, sex, birthdate,
  lifestyle answers, location) must never be sent to or stored on a server,
  and must never appear in analytics event props.
- New npm packages must be at least 3 days old (`npm view <pkg> time`) and
  pinned to an exact version. Avoid adding packages unless needed.
- No medical claims without a cited source. Danish UI copy, correct æøå (UTF-8).
- Before finishing: run the gate above.

## File Structure
- `astro.config.mjs` - Astro config (static output, React integration, Tailwind via PostCSS, meta validation)
- `src/` - pages, layout, islands and the React source (see Architecture above)
- `public/` - static assets copied as-is into the build, including the standalone
  policy pages `privatlivspolitik.html` and `cookiepolitik.html` (served at the clean
  URLs `/privatlivspolitik` and `/cookiepolitik`; link to them with plain `<a href>`),
  `manifest.webmanifest`, `registerSW.js` (kept for the old SPA HTML), `robots.txt`, `sitemap.xml`, `api/health`
- `Dockerfile` - production image (build + Caddy), `Caddyfile` - the server config
