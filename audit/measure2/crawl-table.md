# Crawl / indexing truth table, levetidsberegner.dk

Crawled 2026-11-05T13:01:31.645Z (raw HTTP, Node fetch, manual redirect following) and rendered with Playwright 1.64.1 / Chrome (service workers blocked, analytics + Google Fonts + all third parties aborted). Production commit 0a4c35c. Full per-URL data with all columns: `crawl-table.csv`.

## Headline numbers

- URLs requested: 34; answered: 31; no DNS (www): 3
- URLs answering HTTP 200 with an HTML document (after redirects): 25
- Distinct raw HTML bodies among those: 1. The largest group has 25 URLs with byte-identical HTML (sha256 prefix 6c5dfab472e5dcf7, 5371 bytes).
- Raw HTML of every one of them: same <title> "Dansk Levetidsberegner - Beregn din forventede levetid", same meta description, **no canonical, no meta robots, no <h1>, no og:image, empty `<div id="root"></div>`**, 0 JSON-LD blocks.
- Rendered DOM: 25 URLs rendered; 6 distinct (title, canonical) pairs; 10 URLs render the NotFound page (all of them HTTP 200).
- Soft-404 URLs (HTTP 200, NotFound page rendered, `robots: index, follow`, canonical `https://levetidsberegner.dk/404`): /xyz, /sitemap.xml, /ads.txt, /privatlivspolitik, /privatlivspolitik.html, /cookiepolitik, /cookiepolitik.html, /.well-known/security.txt, /llms.txt, /CLAUDE.md
- Redirect behaviour comes from `serve` (clean URLs) and Cloudflare: `/index.html` -> `/index` -> `/` (2 hops), `/privatlivspolitik.html` -> `/privatlivspolitik`, http -> https 301. Trailing-slash and upper-case variants of the 4 landing pages answer 200 with the same HTML (no redirect); the canonical in the rendered DOM is always the lower-case, slash-less URL.
- `www.levetidsberegner.dk`: NXDOMAIN (Google DNS Status=3 for A/AAAA/CNAME).

## What Google sees before rendering

Every route returns the same 5,371-byte shell: a generic title ("Dansk Levetidsberegner - Beregn din forventede levetid"), the generic description, `og:title="Dansk Levetidsberegner"`, an empty root div, and (outside the root) a hard-coded footer, a cookie banner and an "Om dette værktøj" boilerplate section (the only indexable body text: "Dette gratis online værktøj er lavet for at gøre hverdagen lidt lettere..." with no mention of life expectancy). Page-specific title, description, canonical, h1 and JSON-LD exist only after JavaScript runs (react-helmet-async). Crawlers that do not execute JS (GPTBot, ClaudeBot, PerplexityBot and most LLM fetchers; also Bing's non-render fetches) therefore see the same page for all 25 URLs of the largest group (5 routes plus slash/case/query variants, plus every nonexistent path). Google renders JS, but its first-wave HTML signal is identical for all of them and there is no canonical in the raw HTML to consolidate duplicates before the render pass.

## robots.txt anatomy (live)

- Status 200, `text/plain`, 8047 bytes, 195 lines. The origin has **no robots.txt** in `dist/` (the repo's root-level robots.txt is not copied by Vite); `serve -s` answers `/robots.txt` with the SPA index.html (200, text/html, verified on a local container). Cloudflare "managed robots.txt" prepends its block to that body, so the live file is: Cloudflare managed content (lines 1-129) **followed by the entire index.html (66 lines of HTML)**. Parsers ignore the HTML lines, but the file is malformed and has **no** `Sitemap:` line.
- Effective rules: `User-agent: *`, `Content-Signal: search=yes,ai-train=no,use=reference` (raw line: `Content-Signal: search=yes,ai-train=no,use=reference`), `Allow: /`. No `ai-input` signal is expressed (neither granted nor restricted).
- 32 named user-agents get `Disallow: /`: Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, Diffbot, Google-Extended, GPTBot, omgili, anthropic-ai, Claude-Web, cohere-ai, MistralAI-Training, meta-externalagent, GoogleOther, Baiduspider, PetalBot, AwarioSmartBot, AwarioRssBot, Google-CloudVertexBot, QualifiedBot, Cotoyogi, ICC-Crawler, atlassian-bot, FishBot, BorderxBot, NavuBot, SemrushBot-SWA, WARDBot, magpie-crawler, KimiBot, CitibotSiteCrawler.

| crawler | rule in live robots.txt |
|---|---|
| Googlebot | not listed (falls under `User-agent: *`, `Allow: /`) |
| Bingbot | not listed (falls under `User-agent: *`, `Allow: /`) |
| GPTBot | Disallow: / |
| OAI-SearchBot | not listed (falls under `User-agent: *`, `Allow: /`) |
| ChatGPT-User | not listed (falls under `User-agent: *`, `Allow: /`) |
| ClaudeBot | Disallow: / |
| Claude-SearchBot | not listed (falls under `User-agent: *`, `Allow: /`) |
| Claude-User | not listed (falls under `User-agent: *`, `Allow: /`) |
| anthropic-ai | Disallow: / |
| Claude-Web | Disallow: / |
| PerplexityBot | not listed (falls under `User-agent: *`, `Allow: /`) |
| Perplexity-User | not listed (falls under `User-agent: *`, `Allow: /`) |
| Google-Extended | Disallow: / |
| GoogleOther | Disallow: / |
| Applebot | not listed (falls under `User-agent: *`, `Allow: /`) |
| Applebot-Extended | Disallow: / |
| CCBot | Disallow: / |
| Bytespider | Disallow: / |
| Amazonbot | Disallow: / |
| meta-externalagent | Disallow: / |
| DuckAssistBot | not listed (falls under `User-agent: *`, `Allow: /`) |
| MistralAI-User | not listed (falls under `User-agent: *`, `Allow: /`) |
| cohere-ai | Disallow: / |
| Baiduspider | Disallow: / |
| PetalBot | Disallow: / |

Reading: training crawlers (GPTBot, ClaudeBot, anthropic-ai, Claude-Web, Google-Extended, GoogleOther, CCBot, Bytespider, Applebot-Extended, meta-externalagent) are blocked; search/answer fetchers such as OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User, Googlebot and Bingbot are not named and so are allowed. Whether any specific AI product honours this is outside what could be measured. Since the raw HTML carries no real content (see above), allowed non-rendering AI fetchers would still only see the boilerplate.

## Repo vs shipped dist (root-level static files)

Dockerfile: `COPY --from=build /app/dist ./dist`, `CMD ["serve","-s","dist","-l","3000"]`. Vite copies only `public/` (favicon.svg, og-image.png, pwa-192x192.png, pwa-512x512.png) into dist. A `docker build` of 0a4c35c and the local `npm run build` both produce a dist without `sitemap.xml`, `robots.txt`, `ads.txt`, `privatlivspolitik.html` and `cookiepolitik.html` (see `health.md`, section "dist listing"). Consequences measured on live: `/sitemap.xml` and `/ads.txt` return the SPA HTML (200, text/html), the policy pages render the NotFound component.

Evidence that live = commit 0a4c35c: the `index.html` and CSS produced by the Docker build of 0a4c35c are byte-identical to the live ones (`diff` empty, `cmp` empty), and the Playwright baseline of the local container equals the live baseline byte for byte.

## Policy pages: what a user sees

- `/privatlivspolitik` -> final `/privatlivspolitik`: title "Side ikke fundet - Dansk Levetidsberegner", h1 "Side ikke fundet", NotFound shown: true, policy text shown: false
- `/privatlivspolitik.html` -> final `/privatlivspolitik`: title "Side ikke fundet - Dansk Levetidsberegner", h1 "Side ikke fundet", NotFound shown: true, policy text shown: false
- `/cookiepolitik` -> final `/cookiepolitik`: title "Side ikke fundet - Dansk Levetidsberegner", h1 "Side ikke fundet", NotFound shown: true, policy text shown: false
- `/cookiepolitik.html` -> final `/cookiepolitik`: title "Side ikke fundet - Dansk Levetidsberegner", h1 "Side ikke fundet", NotFound shown: true, policy text shown: false
- The footer links of the static index.html footer (outside React) point to `/privatlivspolitik.html` and `/cookiepolitik.html`; these are the only legal links on the page and both lead to a 200 "Side ikke fundet" page.

## Table (compact; all columns in the CSV)

| URL | status | hops | final (raw) | type | bytes | raw title | raw canonical | raw robots | raw h1 | raw og:image | rendered final | rendered title | rendered canonical | rendered robots | rendered h1 | rendered og:image | rendered notes |
|---|---:|---:|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | 0 | / | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | / | Levetidsberegner - Beregn din resterende levetid baseret på statistik | / | index, follow | Levetidsberegner | /og-image.png | calculator form, metaDescriptions=2, footers=2 |
| `/index.html` | 200 | 2 | / | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | / | Levetidsberegner - Beregn din resterende levetid baseret på statistik | / | index, follow | Levetidsberegner | /og-image.png | calculator form, metaDescriptions=2, footers=2 |
| `/hvor-lang-tid-har-jeg-tilbage` | 200 | 0 | /hvor-lang-tid-har-jeg-tilbage | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /hvor-lang-tid-har-jeg-tilbage | Hvor lang tid har jeg tilbage at leve? - Dansk Levetidsberegner | /hvor-lang-tid-har-jeg-tilbage | index, follow | Hvor lang tid har jeg tilbage? | /og-image.png | metaDescriptions=2, footers=2 |
| `/hvor-lang-tid-har-jeg-tilbage/` | 200 | 0 | /hvor-lang-tid-har-jeg-tilbage/ | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /hvor-lang-tid-har-jeg-tilbage/ | Hvor lang tid har jeg tilbage at leve? - Dansk Levetidsberegner | /hvor-lang-tid-har-jeg-tilbage | index, follow | Hvor lang tid har jeg tilbage? | /og-image.png | metaDescriptions=2, footers=2 |
| `/dodsalder-calculator` | 200 | 0 | /dodsalder-calculator | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /dodsalder-calculator | Dødsalder Calculator - Beregn din forventede dødsalder | /dodsalder-calculator | index, follow | Dødsalder Calculator | /og-image.png | metaDescriptions=2, footers=2 |
| `/dodsalder-calculator/` | 200 | 0 | /dodsalder-calculator/ | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /dodsalder-calculator/ | Dødsalder Calculator - Beregn din forventede dødsalder | /dodsalder-calculator | index, follow | Dødsalder Calculator | /og-image.png | metaDescriptions=2, footers=2 |
| `/Dodsalder-Calculator` | 200 | 0 | /Dodsalder-Calculator | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /Dodsalder-Calculator | Dødsalder Calculator - Beregn din forventede dødsalder | /dodsalder-calculator | index, follow | Dødsalder Calculator | /og-image.png | metaDescriptions=2, footers=2 |
| `/livsstil-og-levetid` | 200 | 0 | /livsstil-og-levetid | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /livsstil-og-levetid | Livsstil og Levetid - Hvordan påvirker din livsstil din levetid? | /livsstil-og-levetid | index, follow | Livsstil og Levetid | /og-image.png | metaDescriptions=2, footers=2 |
| `/livsstil-og-levetid/` | 200 | 0 | /livsstil-og-levetid/ | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /livsstil-og-levetid/ | Livsstil og Levetid - Hvordan påvirker din livsstil din levetid? | /livsstil-og-levetid | index, follow | Livsstil og Levetid | /og-image.png | metaDescriptions=2, footers=2 |
| `/levetid-beregner-danmark` | 200 | 0 | /levetid-beregner-danmark | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /levetid-beregner-danmark | Dansk Levetidsberegner - Specialiseret til danske forhold | /levetid-beregner-danmark | index, follow | Dansk Levetidsberegner | /og-image.png | metaDescriptions=2, footers=2 |
| `/levetid-beregner-danmark/` | 200 | 0 | /levetid-beregner-danmark/ | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /levetid-beregner-danmark/ | Dansk Levetidsberegner - Specialiseret til danske forhold | /levetid-beregner-danmark | index, follow | Dansk Levetidsberegner | /og-image.png | metaDescriptions=2, footers=2 |
| `/?a=40&g=male` | 200 | 0 | /?a=40&g=male | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /?a=40&g=male | Levetidsberegner - Beregn din resterende levetid baseret på statistik | / | index, follow | Levetidsberegner | /og-image.png | metaDescriptions=2, footers=2 |
| `/?utm_source=x` | 200 | 0 | /?utm_source=x | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /?utm_source=x | Levetidsberegner - Beregn din resterende levetid baseret på statistik | / | index, follow | Levetidsberegner | /og-image.png | calculator form, metaDescriptions=2, footers=2 |
| `/xyz` | 200 | 0 | /xyz | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /xyz | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/sitemap.xml` | 200 | 0 | /sitemap.xml | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /sitemap.xml | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/robots.txt` | 200 | 0 | /robots.txt | text/plain | 8047 |  |  |  |  |  |  |  |  |  |  |  |  |
| `/ads.txt` | 200 | 0 | /ads.txt | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /ads.txt | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/manifest.webmanifest` | 200 | 0 | /manifest.webmanifest | application/manifest+json | 491 |  |  |  |  |  |  |  |  |  |  |  |  |
| `/sw.js` | 200 | 0 | /sw.js | application/javascript | 2849 |  |  |  |  |  |  |  |  |  |  |  |  |
| `/privatlivspolitik` | 200 | 0 | /privatlivspolitik | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /privatlivspolitik | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/privatlivspolitik.html` | 200 | 1 | /privatlivspolitik | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /privatlivspolitik | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/cookiepolitik` | 200 | 0 | /cookiepolitik | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /cookiepolitik | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/cookiepolitik.html` | 200 | 1 | /cookiepolitik | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /cookiepolitik | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `http://levetidsberegner.dk/` | 200 | 1 | / | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | / | Levetidsberegner - Beregn din resterende levetid baseret på statistik | / | index, follow | Levetidsberegner | /og-image.png | calculator form, metaDescriptions=2, footers=2 |
| `http://levetidsberegner.dk/dodsalder-calculator` | 200 | 1 | /dodsalder-calculator | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /dodsalder-calculator | Dødsalder Calculator - Beregn din forventede dødsalder | /dodsalder-calculator | index, follow | Dødsalder Calculator | /og-image.png | metaDescriptions=2, footers=2 |
| `https://www.levetidsberegner.dk/` | ERR fetch failed \| cause: ENOTFOUND |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `http://www.levetidsberegner.dk/` | ERR fetch failed \| cause: ENOTFOUND |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `https://www.levetidsberegner.dk/dodsalder-calculator` | ERR fetch failed \| cause: ENOTFOUND |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/.well-known/security.txt` | 200 | 0 | /.well-known/security.txt | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /.well-known/security.txt | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/llms.txt` | 200 | 0 | /llms.txt | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /llms.txt | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/CLAUDE.md` | 200 | 0 | /CLAUDE.md | text/html | 5371 | Dansk Levetidsberegner - Beregn din forventede levetid | (none) | (none) | (none) | (none) | /CLAUDE.md | Side ikke fundet - Dansk Levetidsberegner | /404 | index, follow | Side ikke fundet | /og-image.png | NotFound page, metaDescriptions=2, footers=2 |
| `/registerSW.js` | 200 | 0 | /registerSW.js | application/javascript | 134 |  |  |  |  |  |  |  |  |  |  |  |  |
| `/favicon.svg` | 200 | 0 | /favicon.svg | image/svg+xml | 555 |  |  |  |  |  |  |  |  |  |  |  |  |
| `/og-image.png` | 200 | 0 | /og-image.png | image/png | 414915 |  |  |  |  |  |  |  |  |  |  |  |  |

## First 200 characters of body text (raw HTML, scripts/styles stripped)

- 25 URL(s) (`/`, `/index.html`, `/hvor-lang-tid-har-jeg-tilbage`, `/hvor-lang-tid-har-jeg-tilbage/`, `/dodsalder-calculator`, `/dodsalder-calculator/`, ...):
  > © 2026 Mahope.dk – Gratis online værktøjer Privatlivspolitik Cookiepolitik Vi bruger kun nødvendige cookies til at huske dine indstillinger. Valgfrie cookies bruges kun med samtykke. Accepter Afvis Om
- 1 URL(s) (`/robots.txt`):
  > # As a condition of accessing this website, you agree to abide by the following # content signals: # (a) If a Content-Signal = yes, you may collect content for the corresponding # use. # (b) If a Cont
- 1 URL(s) (`/manifest.webmanifest`):
  > {"name":"Levetidsberegner","short_name":"Levetid","description":"Beregn din resterende levetid — med live nedtælling, dit liv i uger og fun facts.","start_url":"/","display":"standalone","background_c
- 1 URL(s) (`/sw.js`):
  > if(!self.define){let s,e={};const l=(l,r)=>(l=new URL(l+".js",r).href,e[l]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(
- 1 URL(s) (`/registerSW.js`):
  > if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/sw.js', { scope: '/' })})}
- 1 URL(s) (`/favicon.svg`):
  > <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"> <defs> <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#3b82f6"/> <stop offset="1" 

## First 200 characters of body text (rendered DOM)

- 4 URL(s) (`/`, `/index.html`, `/?utm_source=x`, `http://levetidsberegner.dk/`):
  > Levetidsberegner Beregn hvor mange år du statistisk set har tilbage — baseret på danske dødelighedstavler. Beregn din levetid Udfyld felterne — det tager ti sekunder. Beregningsmåde Simpel Hurtig bere
- 2 URL(s) (`/hvor-lang-tid-har-jeg-tilbage`, `/hvor-lang-tid-har-jeg-tilbage/`):
  > Hvor lang tid har jeg tilbage? Få et statistisk estimat af din resterende levetid baseret på videnskabelige data Hvad betyder "resterende levetid"? Din resterende levetid er et statistisk estimat base
- 4 URL(s) (`/dodsalder-calculator`, `/dodsalder-calculator/`, `/Dodsalder-Calculator`, `http://levetidsberegner.dk/dodsalder-calculator`):
  > Dødsalder Calculator Beregn din statistiske dødsalder baseret på demografiske data og livsstilsfaktorer Hvad er en dødsalder calculator? En dødsalder calculator er et statistisk værktøj, der estimerer
- 2 URL(s) (`/livsstil-og-levetid`, `/livsstil-og-levetid/`):
  > Livsstil og Levetid Oplev hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv Livsstilsfaktorer med størst påvirkning Forskning viser, at livssti
- 2 URL(s) (`/levetid-beregner-danmark`, `/levetid-beregner-danmark/`):
  > Dansk Levetidsberegner Specialiseret levetidsberegner med præcise data fra Danmarks Statistik og danske sundhedsmyndigheder Levetid i Danmark Danmark har en af verdens højeste levetider, og danske dat
- 1 URL(s) (`/?a=40&g=male`):
  > Levetidsberegner Beregn hvor mange år du statistisk set har tilbage — baseret på danske dødelighedstavler. Din resterende tid Du har statistisk 41.2 år tilbage at leve. 40 ÅR 364 DAGE 9 TIMER 49 MIN 3
- 10 URL(s) (`/xyz`, `/sitemap.xml`, `/ads.txt`, `/privatlivspolitik`, `/privatlivspolitik.html`, `/cookiepolitik`, ...):
  > Side ikke fundet Den side du leder efter eksisterer ikke eller er blevet flyttet Hmm, denne side findes ikke Du er måske kommet hertil via et forældet link eller har tastet en forkert adresse. Lad os 
