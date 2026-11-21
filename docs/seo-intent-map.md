# SEO intent map

One URL, one search intent. The title, description, H1 and the answer-first block under the H1
of each page target the primary query only. Copy and metadata live in `src/routes.meta.js`
(head) and the page components (H1, answer-first). `src/routeCopy.test.jsx` enforces unique
titles (<= 60), descriptions (<= 155) and H1s across all six routes, and that only `/` targets "hvor gammel bliver jeg".

The answer-first figures come from `LIFE_TABLE_DK` through `src/utils/answerFirst.js`
(Danmarks Statistik HISB8, period from `LIFE_TABLE_META.period`). Never type them into JSX.

| URL | Intent | Primary query | Must NOT target |
|---|---|---|---|
| `/` | The calculator | hvor gammel bliver jeg; levetidsberegner; hvor gammel bliver jeg beregner / test | levealder danmark; gennemsnitlig levealder; hvor mange år har jeg tilbage; forventet dødsalder |
| `/levetid-beregner-danmark` | Danish statistics | levealder danmark; gennemsnitlig levealder; middellevetid danmark | hvor gammel bliver jeg (any variant); levetidsberegner; restlevetid |
| `/hvor-lang-tid-har-jeg-tilbage` | Years left | hvor mange år har jeg tilbage; restlevetid | hvor gammel bliver jeg; levealder danmark; dødsalder |
| `/dodsalder-calculator` | Expected age at death | forventet dødsalder; dødsalder beregner | hvor gammel bliver jeg; restlevetid; levealder danmark |
| `/livsstil-og-levetid` | Lifestyle and life expectancy | livsstil og levetid; motion/rygning og levetid | hvor gammel bliver jeg; levealder danmark; dødsalder |
| `/pensionsalder` | State pension age | hvornår kan jeg gå på pension; pensionsalder beregner; folkepensionsalder | hvor gammel bliver jeg; levealder danmark; restlevetid; forventet dødsalder |

Programmatic pages (one template per intent, a real answer from DST data on each page; see README):

| URL pattern | Intent | Primary query | Title |
|---|---|---|---|
| `/restlevetid` | Years left by age and sex | restlevetid; forventet restlevetid tabel | static, in `routes.meta.js` |
| `/restlevetid/<alder>-aarig-<mand\|kvinde>` (ages 20-90) | Years left for one age and sex | restlevetid 70 årig mand; restlevetid mænd | "Restlevetid for en 45-årig mand: 36,4 år (DST 2025)" |
| `/forventet-levealder` | Life expectancy by municipality | forventet levealder kommune | static, in `routes.meta.js` |
| `/forventet-levealder/<kommune>` | Life expectancy in one municipality | forventet levealder `<kommune>` | "Forventet levealder i København: 80,9 år (DST 2021-25)" |

Titles and descriptions of these pages are generated in `src/lib/pseo.js` and validated (unique, within the limits)
by the build (`astro.config.mjs`) and `src/lib/pseo.test.js`. They must not target "hvor gammel bliver jeg" (that is `/`)
or the calculator wording of `/hvor-lang-tid-har-jeg-tilbage`; that page keeps the interactive "years left" intent
and the hub links to it.

Internal links: every landing page links to `/` with descriptive anchor text, and the calculator's
footer links back to each landing page with an anchor matching that page's primary query.

Sources named on the pages match the engine: Danmarks Statistik for the Danish figures, Eurostat and
Verdensbanken only for the country comparison. No claim depends on location or WHO data.

## Baseline for the 4-week follow-up (Search Console, 90 days to 2026-11-03)

- `/hvor-lang-tid-har-jeg-tilbage`: 1,823 impressions, position 8, CTR 0.8 %
- `/levetid-beregner-danmark`: 255 impressions, 3 clicks
- `/livsstil-og-levetid`: 121 impressions, 1 click
- `/dodsalder-calculator`: no figure in the audit; note it when measuring
