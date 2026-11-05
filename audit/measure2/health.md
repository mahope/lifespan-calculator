# Health of lifespan-calculator at 0a4c35c

Environment: agent-worker, Linux, Node v24.22.2, npm 11.19.1 (production runs Node 22: `node:22-alpine`, Node 22.23.4 in the image built for this audit). Fresh clone of `~/dev/lifespan-calculator`, `git checkout 0a4c35c` (`0a4c35c8a50933e548ddfd312b8ec142a99aef97`, "Merge pull request #66 from mahope/docker-node22"). Nothing was installed or built on the PC. `package.json` `engines.node` is `>=20.19.0`.

## 1. Commands, durations, results

| command | exit | duration | result |
|---|---:|---:|---|
| `npm ci` | 0 | 11.2 s | 352 packages in `node_modules` (270 MB). Warnings: `deprecated source-map@0.8.0-beta.0`, `deprecated glob@11.1.0` (both transitive, via `vite-plugin-pwa` > `workbox-build`) |
| `npm audit` (all) | 1 | 1.5 s | **14 vulnerabilities: 3 low, 7 moderate, 4 high**, all dev/build-time (section 2) |
| `npm audit --omit=dev` | 0 | 1.1 s | `found 0 vulnerabilities` |
| `npm outdated` | 1 (outdated found) | 1.6 s | 18 packages behind (section 3) |
| `npm run lint` | 0 | 3.2 s | ESLint 9, no output: 0 errors, 0 warnings. `dist/`, `backup/` ignored |
| `npm test` | 0 | 1.1 s (vitest 385 ms) | 8 files, 69 tests passed. All tests are in `src/utils/`; there are none for components, pages or the `useLifespanCalculator` hook (where the countdown/end-date logic lives) |
| `npm run build` | 0 | 4.1 s (vite 1.03 s) | 1830 modules, no warnings. PWA: `generateSW`, precache 35 entries (977.99 KiB) |
| `npm run format:check` (not in CI) | 1 | 2.9 s | "Code style issues found in 24 files" (Prettier is configured but not enforced) |
| `docker build` of the repo Dockerfile | 0 | 28.8 s | image `node:22-alpine` + `serve` 14.2.6 (latest at build time, unpinned) |

Raw machine-readable outputs: `data/npm-audit.json`, `data/npm-audit.txt`, `data/npm-outdated.json`, `data/secret-scan-docker-dist.txt`; the tails of lint, test and build are quoted below.

```
$ npm run lint
> lifespan-calculator@1.0.0 lint
> eslint .
(no further output)

$ npm test
 Test Files  8 passed (8)
      Tests  69 passed (69)
   Duration  385ms

$ npm run build
vite v8.2.2 building client environment for production...
✓ 1830 modules transformed.
✓ built in 1.03s
PWA v1.3.0  mode generateSW  precache 35 entries (977.99 KiB)
```

CI (`.github/workflows/ci.yml`, Node 22): checkout, `npm ci`, lint, test, build. There is no `npm audit`, no format check, no `dependabot.yml` (the Dependabot PRs look like security updates enabled in repo settings), no end-to-end or crawl check, and no check that the shipped `dist/` contains `sitemap.xml`/`robots.txt`.

## 2. npm audit

```
$ npm audit --omit=dev
found 0 vulnerabilities

$ npm audit            # summary
14 vulnerabilities (3 low, 7 moderate, 4 high)
```

| package | severity | direct? | advisory (short) | path |
|---|---|---|---|---|
| vite 8.2.0 - 8.2.2 | high | yes | launch-editor command-injection / Windows escaping (dev server only) | devDependency |
| brace-expansion (3 versions) | high | no | quadratic-time expansion; stack exhaustion on nested groups | eslint-plugin-react > minimatch@3 > brace-expansion@1.1.18; workbox-build > ... > filelist > minimatch@5 > brace-expansion@2.1.4 |
| source-map-js 1.0.0 - 1.2.1 | high | no | event-loop DoS via indexed source-map offsets | postcss, @tailwindcss/node |
| zod < 4.6.6 | high | no | memory exhaustion validating oversized collections | eslint-plugin-react-hooks > zod@4.4.3 |
| @vitest/mocker / vitest | moderate | yes (vitest) | path traversal / arbitrary file read via redirect mock; unauthenticated mock registration | vitest@4.1.9 |
| fast-uri 3.0.0 - 3.1.8 | moderate | no | host/scheme normalisation issues | vite-plugin-pwa > workbox-build > ajv > fast-uri@3.1.7 |
| glob 9 - 14.0.1, minimatch 7 - 11.0.0 | moderate | no | AbortSignal bypass; globparts DoS | workbox-build |
| vite-plugin-pwa >=1.2.0, workbox-build >=6 | moderate | yes (pwa) | via glob/@rollup/plugin-node-resolve | `npm audit fix --force` proposes **vite-plugin-pwa@1.1.0**, i.e. a downgrade (breaking) |
| deepmerge, @rollup/plugin-node-resolve | low | no | prototype poisoning | workbox-build |
| serialize-javascript < 7.1.3 | low | no | XSS via unescaped `</script` in serialized function body | workbox-build > @rollup/plugin-terser |

None of these packages ends up in the production bundle (`npm audit --omit=dev` is clean; they are build tools or the service-worker generator). Real-world impact is therefore low, but the repo advertises a green dependency state ("Luk 8 high-advisories", f95b8b4, 2026-09-03) and new advisories have appeared since then.

Open Dependabot PRs (`gh pr list -R mahope/lifespan-calculator --state open`, fetched from the PC):

| PR | title | opened | files | CI |
|---|---|---|---|---|
| #65 | bump fast-uri 3.1.7 -> 3.1.9 | 2026-10-30 | package-lock.json (+3/-3) | build SUCCESS |
| #64 | bump @vitest/mocker and vitest | 2026-10-26 | package-lock.json, package.json | build SUCCESS |
| #63 | bump vite 8.2.2 -> 8.3.5 | 2026-10-21 | package-lock.json (+107/-87), package.json | build SUCCESS |
| #62 | bump brace-expansion 1.1.18 -> 1.1.21 | 2026-10-09 | package-lock.json (+9/-9) | build SUCCESS |
| #59 | bump source-map-js 1.2.1 -> 1.2.2 | 2026-10-09 | package-lock.json (+3/-1) | build SUCCESS |

All five are green and untouched for 6 to 27 days. Together they remove the vite (high), brace-expansion@1.x (high), source-map-js (high), fast-uri and vitest advisories. The remaining highs (zod via `eslint-plugin-react-hooks`, brace-expansion@2.x via `workbox-build`) have no open PR; `npm audit fix` (non-forced) is reported as able to fix everything except the `vite-plugin-pwa`/`workbox-build` chain. Repo has 33 open issues (GitHub API `open_issues_count`, which includes the 5 PRs).

## 3. npm outdated

```
@eslint/js 9.39.4 -> latest 10.0.1      eslint 9.39.4 -> 10.14.0       vitest 4.1.9 -> 5.1.0
vite-plugin-pwa 1.3.0 -> 2.0.0          lucide-react 1.23.0 -> 1.69.0  react / react-dom 19.2.7 -> 19.3.1
vite 8.2.2 -> 8.3.6                      react-router-dom 7.18.3 -> 7.18.5
tailwindcss, @tailwindcss/postcss 4.3.2 -> 4.3.4    postcss 8.5.26 -> 8.5.32    prettier 3.9.4 -> 3.9.10
@vitejs/plugin-react 6.0.3 -> 6.2.1     @types/react 19.2.17 -> 19.3.0  globals 17.7.0 -> 17.14.0
```

Nothing is a major behind except `eslint`/`@eslint/js` 10, `vitest` 5 and `vite-plugin-pwa` 2.

## 4. Production build output (Docker build of 0a4c35c = what runs live)

The Docker build was used for sizes because it is byte-identical to production (`index.html` and `index-C-Av8HlY.css` diff/cmp empty against the live files). A plain `npm run build` in a clone gives a different CSS (`index-BcHoZNZw.css`, 72,770 B instead of 71,358 B) because `dist/` is committed to git and Tailwind scans it (section 6).

Chunks (raw / gzip -9 / brotli q11, KiB; maps excluded, full table in `dist-sizes.md`):

| chunk | raw | gzip | brotli |
|---|---:|---:|---:|
| assets/index-Dahj3lkh.js (react, react-dom, helmet, app shell) | 198.11 | 62.22 | 53.98 |
| assets/HomePage-HZThNJx7.js (calculator + all result widgets) | 97.96 | 26.18 | 22.61 |
| assets/router-CBLz_W24.js | 45.75 | 16.20 | 14.56 |
| assets/LivsstilPage / DanmarkPage / DodsalderPage / HvorLangTidPage / NotFoundPage | 12.73 / 11.85 / 9.01 / 7.07 / 5.00 | 3.25 / 2.74 / 2.41 / 2.10 / 1.58 | 2.99 / 2.51 / 2.23 / 1.95 / 1.47 |
| assets/ThemeToggle (shared lucide icon base) | 10.95 | 3.99 | 3.60 |
| assets/PromoBanner | 2.67 | 1.23 | 1.11 |
| 12 icon chunks (calculator, clock, check, ...) | 0.16 - 0.80 each | 0.17 - 0.41 | |
| assets/rolldown-runtime | 0.58 | 0.36 | 0.32 |
| assets/index-C-Av8HlY.css | 69.69 | 10.38 | 8.75 |
| sw.js + workbox-9c191d2f.js | 2.78 + 14.85 | 1.22 + 5.10 | |
| og-image.png / pwa-512x512.png / pwa-192x192.png | 405.19 / 80.26 / 9.33 | (already compressed) | |

- Total JS in `assets/`: 23 chunks, 406.22 KiB raw, **125.44 KiB gzip**, 110.27 KiB brotli (131.89 KiB gzip including `sw.js` and the workbox runtime).
- JS+CSS actually requested by `/` (11 files, from the baseline's request inventory): 426.8 KiB raw, **121.5 KiB gzip** (JS 111.1 + CSS 10.4), 105.8 KiB brotli. Nothing else on the page is render-critical except the Google Fonts stylesheet pulled in by an `@import` at the top of `index.css`.
- The service worker precaches 35 entries / 977.99 KiB, including `og-image.png` (405 KiB, only used by social crawlers) and all five lazy page chunks, on first visit. This runs in the background after install but costs every first-time visitor roughly a megabyte.
- `build.sourcemap: true` in `vite.config.js`: **24 `.map` files (1,896.74 KiB) are shipped inside the image and served publicly**. Verified live: `HEAD /assets/index-Dahj3lkh.js.map` -> `200 application/json, content-length 880988`; `HEAD /sw.js.map` -> `200, 6242`. The repo is public so this exposes nothing new, but it is 1.9 MB of extra files and deliberate-looking.

## 5. Shipped dist listing (Docker image `/app/dist`)

```
assets/  favicon.svg  index.html  manifest.webmanifest  og-image.png  pwa-192x192.png
pwa-512x512.png  registerSW.js  sw.js  sw.js.map  workbox-9c191d2f.js  workbox-9c191d2f.js.map
57 files in total, 24 of them .map

dist/sitemap.xml: ABSENT      dist/robots.txt: ABSENT      dist/ads.txt: ABSENT
dist/privatlivspolitik.html: ABSENT      dist/cookiepolitik.html: ABSENT
```

These five files exist in the repo root (tracked), not in `public/`. Vite copies only `public/` (favicon.svg, og-image.png, pwa-192x192.png, pwa-512x512.png), so they never reach `dist/`, and the Dockerfile copies only `/app/dist`. The user-visible consequences are in `crawl-table.md`.

## 6. Leak scan of the shipped files

Patterns: `api[_-]?key|apikey|secret|passwd|password|bearer|authorization|x-api-key|client[_-]?secret|private[_-]?key|BEGIN (RSA|EC|OPENSSH|PRIVATE)|AIza...|sk-...|ghp_...|xox[baprs]-|pub-<10+ digits>|AKIA...|Bearer `, case-insensitive, over all JS/CSS/HTML/webmanifest and over the source maps (which embed `sourcesContent`).

- Matches: `password` x2 in `assets/index-*.js` and x2 in its map, both React DOM's `<input type=password>` special-casing (context checked). Nothing else.
- `pub-1902871361369866` (an AdSense publisher id) occurs only in the repo-root `ads.txt`, which is not shipped. Partner-ads `partnerid=42553&bannerid=60068` is public by design (it is in the link).
- External endpoints compiled into the bundle: `analytics.holstjensen.eu` (script tag in index.html), `fonts.googleapis.com` (CSS `@import`), `partner-ads.com` (affiliate link), `nominatim.openstreetmap.org` (only after the user clicks "Brug min placering"), share targets (twitter, facebook, linkedin, wa.me), a handful of citation links.
- No `.env`, no tokens in `Dockerfile`, `nixpacks.toml`, `.dokploy`, `.github/workflows/ci.yml`.

## 7. Dependency usage

`package.json` runtime deps and where they are used (grep of `from '<dep>'` in `src/`):

| dependency | used in |
|---|---|
| react | 30 files |
| react-dom | `src/main.jsx` |
| react-router-dom | 9 files |
| react-helmet-async | `main.jsx`, `SEOHead.jsx` |
| lucide-react | 18 files |
| html-to-image | `ShareModal.jsx` (`toPng`, "download image") |

All six runtime dependencies are imported. All devDependencies are referenced by config or scripts except **`@types/react` and `@types/react-dom`**: the project contains no TypeScript (no `tsconfig`, only `.js/.jsx`), so these two are dead weight (they also appear in every Dependabot cycle). `engines.node >=20.19.0` is consistent with Vite 8 and CI/Docker (Node 22). No `packageManager`, no `.nvmrc`.

## 8. Repo hygiene that affects the build or the shipped product

- **`dist/` is tracked in git** (57 tracked files, last touched by `cbb8e4d` on 2026-07-04) and stale. `.dockerignore` keeps it out of the image, but any local `npm run build` that leaves it in the tree changes what Tailwind v4's source scanner sees: the CSS produced by a plain build (72,770 B) differs from production (71,358 B). The `.gitignore` does not list `dist/`.
- **`backup/` (15 files: the old vanilla-JS site, 220 KB), `index.html.bak`, `WARP.md`, `.htaccess`, `.dokploy`, `nixpacks.toml`** are tracked but unused by the Docker/serve deployment. `backup/` is not excluded by `.dockerignore`, so Tailwind scans its HTML/JS: building without `backup/` and `index.html.bak` gives a 66.54 kB CSS instead of 71.35 kB (gzip 10.07 vs 10.76 kB), i.e. 4.8 kB raw / 0.7 kB gzip of CSS rules that no longer match anything. (Experiment: `git archive HEAD` into a temp dir, remove the two paths, `vite build`.)
- Dockerfile: `FROM node:22-alpine` is a floating tag, `npm install -g serve` is unpinned (14.2.6 today) so every rebuild can change the server; `apk add --no-cache curl` is installed but there is no `HEALTHCHECK` using it; no `NODE_ENV`/cache mount; runs as `node` (good). `serve` is invoked with defaults, which gives clean-URL redirects (`/x.html` -> `/x`) and the SPA fallback; response headers are the subject of the sibling stream.
- `eslint.config.js` and `.prettierrc` exist, Prettier is not part of CI (24 files unformatted).
