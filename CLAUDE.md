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

> Note: the pre-React vanilla-JS version (`script.js`, standalone HTML pages) is
> preserved under `backup/` for reference and is not part of the build.

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # serve the production build locally (http://localhost:4173)
```

### Validation
```bash
npm run build      # acts as a smoke test - fails on broken imports/JSX/CSS
```

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
Built with Nixpacks (`nixpacks.toml`): `npm ci` -> `npm run build` -> serve
`dist/` (`.dokploy` pins the Node version). The build output is also committed
under `dist/`.

## File Structure
- `index.html` - Vite entry HTML (also hosts static footer, cookie-consent
  banner, and SEO copy outside the React root)
- `src/` - React application source (see Architecture above)
- `dist/` - built static assets
- `backup/` - legacy vanilla-JS version (not built)
- `*.html` (root) - standalone legal/policy pages
