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
npm ci && npm run lint && npm test && npm run build
```
`npm run build` also acts as a smoke test - it fails on broken imports/JSX/CSS.

## Architecture

### Core Structure (`src/`)
- **`main.jsx`**: App entry - mounts React into `#root`, wraps app in
  `HelmetProvider` + `BrowserRouter`.
- **`App.jsx`**: Route definitions. Pages are lazy-loaded via `React.lazy` +
  `Suspense`.
- **`pages/`**: One component per route (HomePage, HvorLangTidPage,
  DodsalderPage, LivsstilPage, DanmarkPage, NotFoundPage).
- **`components/`**: Shared UI (SEOHead, ThemeToggle, Footer, PromoBanner,
  ShareCard, ShareModal).
- **`hooks/useLifespanCalculator.js`**: Core calculation logic (age, remaining
  time, geolocation-driven country lookup).
- **`utils/lifeExpectancyData.js`**: Static country life-expectancy data with
  Danish translations, plus lookup/formatting helpers.
- **`index.css`**: Tailwind v4 entry - `@import 'tailwindcss'`, `@theme` design
  tokens, `@utility` component classes, and the light/dark CSS variables.

### Key Technical Points
- **Language**: Danish interface with English API calls.
- **Geolocation flow**: Browser API -> OpenStreetMap Nominatim -> country
  mapping -> calculation, with graceful fallback to world averages.
- **Dark mode**: `class` strategy - `.dark` is toggled on `<html>`; Tailwind v4
  `@custom-variant dark` in `index.css` drives the theming.
- **HTTPS requirement**: Geolocation API requires HTTPS in production (use
  localhost for development).

### Data Flow
1. User inputs age/gender -> enables location detection
2. Geolocation API gets coordinates -> Nominatim API resolves to country
3. Country mapped to life expectancy data -> calculation performed
4. Results displayed with contextual messaging

## Common Tasks

### Adding Countries
Update the data in `src/utils/lifeExpectancyData.js`. Country names must match
the Nominatim API response format. Include `male`, `female` values plus a
localized `country` name for display.

### Styling Changes
Design tokens live as CSS variables and `@theme` entries in `src/index.css`.
Reusable component classes are defined with Tailwind v4 `@utility`. Mobile-first;
main color scheme uses HSL custom properties (see `:root` / `.dark`).

## Deployment
- `Dockerfile` is the only build definition: stage 1 (`node:22-alpine`) runs
  `npm ci` + `npm run build`; stage 2 copies `dist/` and serves it with
  `serve dist -l 3000` as the non-root `node` user. There is no `-s`, so
  unknown paths return a real 404. `public/serve.json` rewrites the known
  routes to `/index.html` and sets headers; `public/404.html` and
  `public/api/health` (Swarm healthcheck) are copied into `dist/`. The route
  list lives in `scripts/gen-sitemap.mjs` (`ROUTES`); `prebuild` regenerates
  `public/sitemap.xml` from it. Adding a route means updating `ROUTES`,
  `App.jsx` and `public/serve.json` (a test enforces this).
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
- `index.html` - Vite entry HTML (also hosts static footer, cookie-consent
  banner, and SEO copy outside the React root)
- `src/` - React application source (see Architecture above)
- `public/` - static assets copied as-is into the build
- `Dockerfile` - production image (build + `serve`)
- `*.html` (root) - standalone legal/policy pages
