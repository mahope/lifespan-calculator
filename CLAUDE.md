# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Danish lifespan calculator web application. A React single-page app built with
Vite, styled with Tailwind CSS, and deployed as static assets.

Tech stack (kept current):
- React 19 + React DOM 19
- React Router 7 (client-side routing)
- react-helmet-async 3 (per-page `<title>`/meta for SEO)
- Vite 8 (Rolldown/Oxc-based build, `oxc` minifier)
- Tailwind CSS 4 (CSS-first config via `@theme` in `src/index.css`, `@tailwindcss/postcss`)
- Node.js >= 20.19 (see `engines` in `package.json`)

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # serve the production build locally (http://localhost:4173)
```

### Validation (the gate; CI runs the same steps)
```bash
npm ci && npm run lint && npm test && npm run build && npm run test:e2e
```
CI runs the first four in job `build` and the e2e suite in job `e2e` (see `docs/testing.md`;
update snapshots with `npm run test:e2e -- --update-snapshots`). `npm run build` also acts as a smoke test - it fails on broken imports/JSX/CSS.

## Architecture

### Core Structure (`src/`)
- **`main.jsx`**: App entry - mounts React into `#root`, wraps app in
  `HelmetProvider` + `BrowserRouter`.
- **`App.jsx`**: Route definitions. Pages are lazy-loaded via `React.lazy` +
  `Suspense`.
- **`pages/`**: One component per route (HomePage, HvorLangTidPage,
  DodsalderPage, LivsstilPage, DanmarkPage, PensionsalderPage, EmbedInfoPage,
  EmbedPage, NotFoundPage).
- **`components/`**: Shared UI (SEOHead, ThemeToggle, Footer, PromoBanner,
  ShareCard, ShareModal).
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
  `npm ci` + `npm run build`; stage 2 copies `dist/` and serves it with
  `serve dist -l 3000` as the non-root `node` user. There is no `-s`, so
  unknown paths return a real 404. The known routes are real files:
  `postbuild` runs `scripts/prerender-head.mjs`, which writes `dist/<route>/index.html`
  with each route's own title, description, canonical, Open Graph/Twitter tags and
  JSON-LD in the raw HTML (values from `src/routes.meta.js`, the single source for
  `SEOHead` and the script; the build fails on duplicate or too long titles
  (60) / descriptions (160)). `public/serve.json` must **not** have rewrites for
  them: `serve` applies rewrites before the filesystem and would hide those files.
  `SEOHead` removes the baked-in `data-prerender` tags at runtime so nothing is
  duplicated. `public/serve.json` sets headers; `public/404.html` and
  `public/api/health` (Swarm healthcheck) are copied into `dist/`. The route
  list lives in `scripts/gen-sitemap.mjs` (`ROUTES`); `prebuild` regenerates
  `public/sitemap.xml` from it. Adding a route means updating `ROUTES`,
  `App.jsx` and `ROUTE_META` in `src/routes.meta.js` (tests enforce this).
  `/embed` (iframe widget, `EmbedPage`) is a normal route with `noindex: true`, listed in
  `ROUTES` but also in `NOINDEX_ROUTES`, so it is not in the sitemap. `/embed-levetidsberegner`
  (info page with copy-paste code and terms) is indexable. Framing: `X-Frame-Options:
  SAMEORIGIN` is set on every file except `dist/embed/index.html`, which sends
  `Content-Security-Policy: frame-ancestors *` and `X-Robots-Tag: noindex` (`serve`
  matches header sources against the file it sends; the glob `/{*,!(embed)/**}` in
  `public/serve.json` does the exclusion, tested end to end in `e2e/embed.e2e.js`). The widget
  uses `computeEmbedResult` (`utils/embedResult.js`), which calls `computeResult`, so its
  numbers equal the calculator's. It posts only `{type, height}` to the parent and tracks
  `Embed Calculate` without props.
- Hosted as a Dokploy app (`web`) on a worker server, build type `dockerfile`.
  **autoDeploy is off**: merging to `master` does not deploy; a deploy is
  triggered by hand.
- `master` is the default branch. CI (`.github/workflows/ci.yml`) runs
  `npm ci`, lint, tests and build on pushes to `master` and on PRs.
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
- `index.html` - Vite entry HTML (meta tags, theme bootstrap and analytics script; no page copy outside the React root)
- `src/` - React application source (see Architecture above)
- `public/` - static assets copied as-is into the build, including the standalone
  policy pages `privatlivspolitik.html` and `cookiepolitik.html` (served at the clean
  URLs `/privatlivspolitik` and `/cookiepolitik`; link to them with plain `<a href>`,
  never the router `Link`)
- `Dockerfile` - production image (build + `serve`)
