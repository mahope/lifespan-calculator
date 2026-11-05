# SEO and traffic evidence (2026-11-05)

All numbers were read on 2026-11-05. Sources: Google Search Console via the Mahope MCP (domain property `sc-domain:levetidsberegner.dk`), Plausible (self-hosted), OpenSEO/DataForSEO (project `levetidsberegner.dk`, market DK/da), live HTTP probes with `curl`. Nothing here was estimated; where a number was not available it says so.

## Search Console

| Window | Clicks | Impressions | CTR | Avg position |
|---|---:|---:|---:|---:|
| 2026-10-06 to 2026-11-03 (28 d) | 331 | 4,983 | 6.6 % | 6.7 |
| 2026-08-05 to 2026-11-03 (90 d) | 1,147 | 14,526 | 7.9 % | 7.0 |

Top queries, 90 days (clicks / impressions, position):

| Query | Clicks | Impr. | Pos. |
|---|---:|---:|---:|
| levetidsberegner | 121 | 175 | 1 |
| hvor gammel bliver jeg | 81 | 786 | 6 |
| hvor gammel bliver jeg beregner | 75 | 366 | 3 |
| hvor gammel bliver jeg test | 49 | 545 | 5 |
| aldersberegner hvor gammel bliver jeg | 16 | 130 | 5 |
| beregn levealder | 16 | 30 | 2 |
| hvor gammel kan jeg forvente at blive | 15 | 116 | 7 |
| levetid | 15 | 576 | 5 |

Top pages, 90 days:

| Page | Clicks | Impr. | Pos. |
|---|---:|---:|---:|
| / | 1,122 | 12,710 | 7 |
| /dodsalder-calculator | 15 | 579 | 7 |
| /hvor-lang-tid-har-jeg-tilbage | 14 | 1,823 | 8 |
| /levetid-beregner-danmark | 3 | 255 | 8 |
| /404 | 1 | 5 | 5 |
| /livsstil-og-levetid | 1 | 121 | 8 |
| /cookiepolitik.html | 0 | 6 | 1 |

Reading: 98 % of clicks go to the home page. The four content landing pages together collect 2,778 impressions (19 % of all) but 33 clicks (2.9 % of all clicks). `/hvor-lang-tid-har-jeg-tilbage` has 1,823 impressions at position 8 and a CTR of 0.8 %. A URL `/404` appears in the index, which is what the soft-404 problem looks like from Google's side. Per-query data for the landing pages could not be pulled (the Mahope MCP only returns the top 8 queries per site and OpenSEO's Search Console OAuth is not configured).

## Plausible (levetidsberegner.dk)

| Window | Unique visitors | Visits | Pageviews | Bounce | Visit duration |
|---|---:|---:|---:|---:|---:|
| 30 d | 417 | 440 | 649 | 25 % | 212 s |
| 6 mo | 2,615 | 2,768 | 3,907 | 26 % | 186 s |

Sources (30 d): Google 324, Direct 50, Bing 20, Yahoo 11, DuckDuckGo 8, Qwant 5. Top pages (30 d): `/` 406, `/levetid-beregner-danmark` 14, `/dodsalder-calculator` 12, `/hvor-lang-tid-har-jeg-tilbage` 11, `/cookiepolitik` 5, `/privatlivspolitik` 5. People do click the policy links (10 pageviews in 30 days); those URLs render the not-found page (see crawl probes below).

Not available with the tools used: Findforsikring click and lead numbers for this site, and Plausible custom-event counts. Partner-ads statistics need the Partner-ads API key and the Plausible UI/API key, which were not read.

## Keyword demand (OpenSEO, DataForSEO Labs, Denmark/da)

Monthly search volume, keyword difficulty (KD) and CPC in DKK. Only terms with data are listed; terms not listed returned no volume.

| Keyword | Volume | KD | CPC |
|---|---:|---:|---:|
| hvornår kan jeg gå på pension | 6,600 | 12 | 2.00 |
| testamente | 4,400 | 0 | 6.37 |
| livsforsikring | 1,900 | 0 | 3.46 |
| pensionsalder beregner | 1,000 | 0 | 3.08 |
| levealder danmark | 720 | 1 | 0.80 |
| danmark forventet levealder | 480 | 1 | 0.47 |
| gennemsnitlig levealder danmark | 480 | 0 | 0.70 |
| hvor gammel bliver jeg | 390 | 13 | 0.02 |
| livsforsikring pris | 390 | 0 | 2.81 |
| pensionsalder 2026 | 320 | 19 | 1.70 |
| hvor gammel bliver jeg test | 210 | 2 | 0.01 |
| gennemsnitlig levealder | 170 | 13 | 1.13 |
| middellevetid danmark | 140 | 13 | n/a |
| biologisk alder | 110 | 0 | 4.02 |
| levealder kommuner | 110 | 0 | n/a |
| middellevetid | 110 | 0 | n/a |
| helbredsforsikring | 90 | 8 | 2.71 |
| levealder mænd | 90 | 0 | n/a |
| hvor gammel bliver jeg beregner | 70 | 2 | 0.16 |
| restlevetid | 70 | 0 | 0.01 |
| levealder europa | 50 | 0 | n/a |
| life expectancy calculator (DK market) | 50 | 44 | n/a |
| forventet levetid danmark | 40 | 7 | 0.01 |
| forventet levetid | 30 | 26 | 0.02 |
| levealder kvinder / norge / sverige | 10 each | | |

Not found / zero volume: "forventet levetid 60 årig", "levealder odense/aarhus/københavn", "hvor gammel bliver en mand/kvinde/man", "hvor længe lever jeg" as a measurable volume. Reading: the direct life-expectancy market in Danish is small (the whole cluster above is roughly 3,000 searches a month). The adjacent pension-age cluster is 8,000+ searches a month with low difficulty, and the site already has pension logic. Programmatic age x sex or per-kommune pages have almost no measured query demand.

Credit use: roughly 300-400 OpenSEO credits by the tool's published prices (4 research seeds, 8 SERPs at depth 20, 46 keyword metrics); the exact balance was not read.

## SERP reading (organic results, top of page one)

Every one of the 8 SERPs checked (desktop, Denmark, depth 20, one anonymous sample each) shows an AI Overview block. See `serp-top10-2026-11-05.json`.

- "hvor gammel bliver jeg": tv2.dk, dst.dk (method PDF), globalis.dk x2, mathda.com, ugeavisen.dk, da.wikipedia.org, calkoo.com, then levetidsberegner.dk at organic position 9. The site also holds organic positions 14 and 15 for the same query (a second URL and `/dodsalder-calculator`): three of its own URLs compete for one query.
- "hvor gammel bliver jeg beregner": experimentarium.dk, atp.dk, **levetidsberegner.dk (3)**, pensionforalle.dk, videnskab.dk, akademikerpension.dk, dst.dk, beregnlet.dk, hvor-gammel-er-jeg.dk.
- "forventet levealder danmark": statbank.dk, fagligsenior.dk, wikibooks, dst.dk, lex.dk, ritzau (kommune press releases), klassesamfund.dk.
- "middellevetid danmark": globalis.dk, lavendla.dk, dst.dk x3, ism.dk, ritzau (map of where Danes live longest and shortest).
- "levetidsberegner": non-Danish calculators (geostat.ge, Google Play apps, omnicalculator, europeinnumbers). levetidsberegner.dk is not in the top 20 of this anonymous sample, while Search Console reports average position 1 (121 clicks of 175 impressions, i.e. mostly brand/direct searches). The two sources disagree; Search Console is first-party data, the SERP snapshot is a single sample.

Competitor teardown (fetched 2026-11-05):

- ATP (pension fund) "Se hvor gammel du kan forvente at blive": inputs are birth year and sex only; uses ATP's own cohort model built on Danish data plus 17 comparable countries; states it is a rough indication (fingerpeg); no lifestyle factors; funnels to ATP content. Quoted national figures for 67-year-olds 2024-2025: women 86.9, men 84.4.
- UK ONS life expectancy calculator: inputs age and sex (0 to 100); average **cohort** life expectancy and the chance of reaching 100 using projected mortality improvements; explicit statement that results do not reflect lifestyle or health; embed code with copy button; Open Government Licence.

## Live HTTP probes (curl, 2026-11-05)

```
/robots.txt                       200 text/plain   8047 B  (Cloudflare managed block, then the SPA index.html appended)
/sitemap.xml                      200 text/html    5371 B  (the SPA shell, not XML)
/ads.txt                          200 text/html    5371 B
/privatlivspolitik.html           301 -> /privatlivspolitik   (200 text/html 5371 B: the SPA shell)
/hvor-lang-tid-har-jeg-tilbage    200 text/html    5371 B
/nonexistent-xyz                  200 text/html    5371 B  (soft 404)
```

Cause: `sitemap.xml`, `robots.txt`, `ads.txt`, `privatlivspolitik.html` and `cookiepolitik.html` are in the repository root, not in `public/`, so Vite never copies them into `dist/`. The container runs `serve -s dist`, which answers every unknown path with `index.html` and status 200. The static `index.html` has no canonical link and the same title and description for every route; per-route values are set by react-helmet after JavaScript runs.

## `serve` experiment (agent-worker, serve 14.2.6)

| Path | `serve -s dist` (today) | `serve dist` + `serve.json` rewrites for the 4 known routes + `404.html` |
|---|---|---|
| / | 200 | 200 |
| /hvor-lang-tid-har-jeg-tilbage | 200 | 200 |
| /xyz | **200** | **404** |
| /privatlivspolitik (file `privatlivspolitik.html` present) | 200 file | 200 file |
| /robots.txt, /sitemap.xml (files present) | 200 | 200 |
| /api/health | **200 (HTML)** | 200 only if `public/api/health` exists, otherwise 404 |
| /assets/missing.js | **200 (HTML)** | 404 |

Important coupling: the Dokploy Swarm healthcheck of the production app runs `curl -fsS http://127.0.0.1:3000/api/health`. Today it passes only because of the SPA fallback. Once unknown paths return 404 the health check fails and Swarm's `FailureAction: rollback` would roll the new version back, so the serving-layer change must ship a real `/api/health` file.

## Deploy path (read-only, Dokploy MCP)

Dokploy app `web` in project "lifetimecalculactor" (appName `lifetimecalculactor-web-y3pgej-w1-qwdbkp`) on server `dokploy-worker1`; source GitHub `mahope/lifespan-calculator`, branch `master`, build type `dockerfile`, **autoDeploy off**, domain `levetidsberegner.dk` (Cloudflare proxied). Last deployment: commit `0a4c35c` (merge of #66) on 2026-11-04 20:37 UTC, status done, so live equals master. Previous deployment: `f95b8b4` (rollback target before the Dockerfile switch). The committed `dist/` folder is not what is served (live asset hash `index-Dahj3lkh.js` differs from the committed `index-D6Yr7mM6.js`), so #10 is safe to do.
