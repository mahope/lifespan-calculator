# Redesign: before and after

Measured 5 Nov 2026 on agent-worker (Chrome 157, headless), base `b165f3c` (master) against this branch.
Screenshots: `foer/` and `efter/` (390, 768, 1440 px; every route, the 404 and the home result view in light and dark).
Scripts: `shoot.mjs`, `lighthouse.mjs`, `axe.mjs`, `numbers.mjs` (all in this folder).

## Calculations and results unchanged

* `git diff origin/master -- src/utils src/hooks src/data e2e` is empty: no calculation code, data or e2e snapshot was touched.
* `npm run test:e2e`: 15 of 15 pass, including the numbers-only snapshots for the three test inputs (male 40, female 65,
  male born 1985-06-15). Those snapshots are the byte-level guard.
* `node numbers.mjs dump` on the old and the new build, then `compare`: 280 numbers from every result section of the three
  inputs, 0 missing after. The check was proven able to fail: changing 40.8 to 41.8 in the new dump gives problems.
* The audit baseline `audit/measure2/baseline/baseline.mjs` (branch `docs/audit-2026-11-05`) could not be used as is. It
  predates master: it clicks a cookie banner that no longer exists, expects share params to stay in the URL and reads
  `.card` internals. `numbers.mjs` replaces it for this purpose.

## Lighthouse (mobile preset)

Accessibility, best practices and SEO are 100 on every route before and after, CLS is 0 everywhere.
Performance scores on this shared machine swing by up to 25 points between identical runs (TBT 58 to 1775 ms on the same
build), so a single pass per route (`lh-foer.json`, `lh-efter.json`) is not a comparison. The A/B below alternates old and
new build on `/`, six runs each:

| `/` | before (6 runs) | after (6 runs) |
| --- | --- | --- |
| Performance score | 81, 83, 92, 94, 96, 97 (median 93) | 68, 91, 93, 94, 94, 96 (median 93.5) |
| LCP (ms) | 2205 to 2541, median 2372 | 2431 to 2587, median 2504 |
| FCP (ms) | 1755 to 2241, median 1996 | 1724 to 2043, median 1803 |
| CLS | 0 | 0 |

Weight: JavaScript 114.5 KB to 109.9 KB (brotli), CSS 9.0 KB to 6.7 KB, plus one 50 KB font (Source Serif 4, preloaded).
LCP is about 0.13 s later because of that font; FCP is earlier. The tail run of 68 had a TBT of 1.8 s, which also occurs on the old build.

## axe-core 4.14.0 (wcag2a, 2aa, 21a, 21aa, 22aa, best-practice)

36 views (7 routes plus the home result view in simple and advanced mode, light and dark, 390 and 1440 px): 0 violations.
One "incomplete" item, `color-contrast` on the SVG text of the survival chart (axe cannot read the background of
SVG text). Checked by hand: muted ink on paper is 7.2:1 (light) and 8.2:1 (dark), ink on the 12 % accent tint is above 12:1.
Measured pairs: ink 16.0:1, muted 7.2:1, accent 8.4:1, white on accent 8.8:1, control border 4.5:1 (light); ink 15.8:1,
muted 8.2:1, accent 9.3:1, control border 4.9:1 (dark).

## Layout

| Screenshot height (px) | 390 before | 390 after | 1440 before | 1440 after |
| --- | --- | --- | --- | --- |
| Home, form | 3727 | 3254 | 2577 | 1852 |
| Home, result view | 9792 | 10428 | 8705 | 7515 |
| Dødsalder | 4609 | 4462 | 2989 | 2418 |
| Pensionsalder | 5000 | 5032 | 3341 | 3152 |

The result view is taller on phones (the chart and a table of its values were added); it is shorter on desktop.

## What changed, against the list of AI tells in `retning.md`

| Before | After |
| --- | --- |
| Blue (violet in dark) gradient banner with glass icon chip on every page | Masthead with wordmark and the six pages as navigation; left-aligned serif title |
| Everything centred | Left-aligned; headings sit in a margin rail on wide screens |
| About 17 identical rounded shadow cards | Open sections divided by one hairline; no boxes, no shadows |
| Icon chips, emoji in titles, tiles and promos | No decorative icons or emoji; only functional icons (theme, share, new calculation) |
| Grids of tiles with emoji, number and caption | Definition lists with tabular figures |
| Blue, green, amber, violet, rose and orange tints | One petrol accent plus neutrals; red only for errors |
| Glass countdown tiles on the gradient | Serif figures in a row, years set larger |
| Gradient pill bars, "0% udfyldt" progress bar | Flat bars with a legend; the form progress bar is gone |
| Survival odds as four bars | Survival curve from the life table with expected age and the 80 and 90 marks, readout on hover, values in a table |
| Comparison as five pill bars | Dot plot on a shared axis |
| Fade and slide on load, scale on hover | No load animation; no hover scaling |
| Inter only | Source Serif 4 for headings and figures, Inter for text and forms |

## Not changed on purpose

* Copy that carries a number, a source or a claim. Some landing-page claims (for example "+7 år" for education) have no
  citation; they were there before and are not part of this task, but the project rule asks for sources.
* Decimals are shown with a dot ("40.8 år") as before; the Danish format would be a comma, but changing it touches every result string.
* The share-image values (`12608` days) keep their old formatting.
