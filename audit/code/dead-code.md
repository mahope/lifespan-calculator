# levetidsberegner.dk: dead-code candidates (commit 0a4c35c)

Each item comes with grep proof, run inside the repo copy. Items are "candidates": delete them in one PR, after `npm run lint && npm test && npm run build` on agent-worker.

## Source code

| # | Candidate | Proof | Action |
|---|---|---|---|
| 1 | `userAchievements` state, `checkAchievements()`, its effect, and the returned `userAchievements` (`src/hooks/useLifespanCalculator.js:29, 175-196, 230-234, 242`) | `grep -rn userAchievements src` finds only the hook (declaration + return). HomePage destructures neither (`HomePage.jsx:40-52`) | Delete. It also removes one state update per factor change |
| 2 | `export const achievements` (`src/utils/lifeExpectancyData.js:19-25`) | `grep -rnw achievements src` finds only comments in the hook and the export itself | Delete |
| 3 | `lifeExpectancyForLocation` state + setter (`useLifespanCalculator.js:22, 45, 50, 56, 238`) | Never read by `calculateLifespan` (`:63-160`); HomePage doesn't destructure it | Delete with item 4 |
| 4 | The whole geolocation feature: `getUserLocation`, `userLocation`, the Nominatim fetch, the "Brug min placering" UI (`HomePage.jsx:377-395`), the `location` analytics prop (`:184`) | Functionally dead: the result never depends on it (see CODE-REPORT PRIV-4) | Delete (privacy win) |
| 5 | `formatCountryName` (`lifeExpectancyData.js:32-35`) | `grep -rn formatCountryName src` finds only its own definition and `lifeExpectancyData.test.js` | Delete it and its test |
| 6 | `lifeExpectancyData` entries other than those Sammenlign uses (Sweden, Norway, Germany, UK, US, France, Netherlands, Finland, Iceland, Switzerland) | Only `Sammenlign.jsx:95-100` reads the table, and it uses `Denmark`, `Japan`, `World` | Trim; also replace `Denmark` with HISB8 values (CALC-2) |
| 7 | `checkAchievements`'s use of `lifestyleFactors.smoking >= 0`, etc. | Part of item 1 | n/a |
| 8 | Unused Tailwind `@utility` blocks in `src/index.css`: `btn-ghost`, `card-title`, `card-description`, `card-footer`, `badge`, `badge-default`, `badge-secondary`, `badge-outline`, `progress-bar`, `separator`, `result-card`, `stat-item` | `grep -rw --include='*.jsx' -l <name> src` matches no file for each | Delete. Tailwind v4 doesn't emit unused `@utility` blocks, so this is source cleanup, not bundle savings |
| 9 | Duplicate lifestyle-sum computation, `HomePage.jsx:202-204` vs hook `:88-89` | The same formula in two places | Fold into a `lifestyleTotal(factors)` helper in `lifespanMath.js` (part of #7) |
| 10 | Countdown in `resultData` + `startCountdown` in the hook | Not dead, but structurally redundant once a `<Countdown endTimestamp>` component exists (PERF-1) | Move |

**Not dead (checked, keep):**
- `PromoBanner`: used in 5 of 6 pages (`grep -rln "<PromoBanner" src/pages` returns 5 files).
- `HvadHvis` (the #3 replacement).
- `projectedExpectancy`, `jointLifeStats`, `biologicalAge`, `survivalProbability`, `folkepensionAge`, `estimateCover`, `topImprovements`, `upcomingMilestones`, `packLifestyle`: each has a component consumer (verified with grep).
- Issue #3's `showScenario` / `getElementById` code is **already gone**: `grep -rn "getElementById" src` finds only `main.jsx:8`.

## Repo files

| # | Candidate | Proof | Action |
|---|---|---|---|
| 11 | `dist/` (tracked) | `git ls-files dist` is not empty. Last commit touching it is 2026-07-04 (`cbb8e4d`). Live bundle `index-Dahj3lkh.js` ≠ committed `index-D6Yr7mM6.js`. `.dockerignore:2` excludes `dist`, and the Dockerfile builds fresh | `git rm -r --cached dist`, add it to `.gitignore` (#10) |
| 12 | `backup/` (15 files: the pre-React static site, old CSS, old CLAUDE/README/WARP) | No reference outside itself; `eslint.config.js:8` ignores it; not copied into the image (only `dist` is) | Delete. Git history keeps it |
| 13 | `index.html.bak` | No reference anywhere | Delete |
| 14 | `.htaccess` | Apache-only; the site runs `serve` in Docker (`Dockerfile:14`) | Delete. Its headers move to `serve.json` (SEC-1) |
| 15 | `.dokploy` (`type: static`, `outputDirectory: "."`) | Contradicts the Dockerfile deploy (commit `3c9854e`). Also listed in `robots.txt:18` | Delete after confirming in the Dokploy UI that the build type is Dockerfile |
| 16 | `nixpacks.toml` | Superseded by the Dockerfile (`3c9854e` "Byg med Dockerfile på Node 22 i stedet for nixpacks"). `CLAUDE.md:81-82` still documents Nixpacks + committed dist | Delete; update CLAUDE.md |
| 17 | `WARP.md` (root) | Same line count as `backup/WARP.md` (92 lines), and both duplicate CLAUDE.md content | Delete or merge into CLAUDE.md |
| 18 | Root `robots.txt`, `sitemap.xml`, `ads.txt`, `privatlivspolitik.html`, `cookiepolitik.html` | Not dead, but **not shipped**: the live `/sitemap.xml` and `/ads.txt` return `text/html` | Move to `public/` (stage 0) |
| 19 | The static `<footer>`, cookie banner and "Om dette værktøj" section in `index.html:35-59` | The cookie consent is never read (`grep -rn consent src` finds nothing); the footer duplicates `Footer.jsx` | Delete (PRIV-6, SEO-4) |

## Dependencies

| Package | Used? | Note |
|---|---|---|
| `html-to-image` | yes, `ShareModal.jsx:2` only | Make it a dynamic import (PERF-4) |
| `lucide-react` | yes (18 files) | Fine. Named imports tree-shake |
| `react-helmet-async` | yes (`main.jsx`, `SEOHead.jsx`) | Replaced by Astro head / React 19 metadata in stage 1 |
| `react-router-dom` | yes (9 files) | Removed if Astro is chosen |
| `@types/react`, `@types/react-dom` | No TS in repo | Harmless (editor IntelliSense); optional removal |

No unused runtime dependency was found.

## Lint gate to keep it clean
`eslint .` passes with warnings (`no-unused-vars` is `warn`, `eslint.config.js:33`). After this cleanup, change CI to `eslint . --max-warnings 0`, so unused locals and imports fail the PR.
Note that ESLint can't see unused *exports* across modules. Optionally add `knip` (run on agent-worker) for that.
