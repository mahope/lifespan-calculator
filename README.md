# 🕰️ Levetidsberegner (Lifespan Calculator)

En webbaseret applikation der beregner din forventede resterende levetid baseret på din alder og dit køn, med danske levetidstabeller.

## 📋 Funktioner

- **Beregning i browseren**: Dine input forlader aldrig din enhed og sendes ikke til analytics
- **Danske tal**: Baseret på Danmarks Statistik (HISB8, dødelighedstavlen for den nyeste periode)
- **Responsive design**: Fungerer på både desktop og mobile enheder
- **Intuitivt interface**: Moderne og brugervenligt design
- **Detaljerede resultater**: Viser resterende år, forventet levetid og estimeret slutdato
- **Kontekstuelle beskeder**: Forskellige beskeder baseret på resultaterne

## 🚀 Sådan bruges applikationen

1. **Indtast din alder**: Angiv din nuværende alder i år
2. **Vælg dit køn**: Vælg mellem mand og kvinde
3. **Beregn resultat**: Klik på "Beregn min resterende levetid" for at se resultatet

## 🛠️ Teknisk implementation

Statisk site bygget med [Astro](https://astro.build) 7. Hver side er en færdig HTML-fil med titel, meta-tags,
strukturerede data og brødtekst. Kun de interaktive dele hydreres som React 19-øer:

| Side | JavaScript |
|------|------------|
| `/` | beregneren (`src/islands/HomeCalculator.jsx`) |
| `/pensionsalder` | formularen (`src/islands/PensionFormIsland.jsx`) |
| `/embed` | widgetten (`src/islands/EmbedWidget.jsx`) |
| `/hvor-lang-tid-har-jeg-tilbage`, `/dodsalder-calculator`, `/livsstil-og-levetid`, `/levetid-beregner-danmark`, `/embed-levetidsberegner`, 404 | ingen scriptfiler, kun små inline-scripts (tema, service worker) |

- **Sider**: `src/pages/*.astro` (én fil pr. URL) rendrer React-komponenterne i `src/views/` og `src/components/` til HTML ved build.
- **Layout og `<head>`**: `src/layouts/Base.astro`. Værdierne kommer fra `src/routes.meta.js` via `src/lib/head.js`.
- **Styling**: Tailwind CSS 4 gennem PostCSS (`src/index.css`), inlinet i hver side.
- **Beregningen**: `src/utils/*` og `src/hooks/*` (ren JavaScript, kører kun i browseren).
- **Service worker**: `scripts/build-sw.mjs` skriver `dist/sw.js` ud fra `scripts/sw-template.js` (ingen Workbox).
  Sider hentes fra netværket først, filerne fra samme build ligger i cachen til offline brug. Den afløser
  SPA'ens Workbox-worker på samme adresse: den sletter den gamle cache og genindlæser de faner, den gamle
  worker serverede. Testet i `e2e/sw-migration.e2e.js` mod en kopi af det, produktion serverede før porten.

### APIs og data
- **Ingen eksterne API'er til beregningen**: Alt kører i browseren
- **Statiske levetidsdata**: Danmarks Statistik (HISB8) samt landetabeller til sammenligning

### Databaser
Landetabellen i `src/utils/lifeExpectancyData.js` (blokken mellem `BEGIN/END GENERATED COUNTRY TABLE`) genereres af `scripts/refresh-data.mjs` (`node scripts/refresh-data.mjs countries`; se `docs/data-refresh.md`). Scriptet henter levetid ved fødslen fra Eurostat `demo_mlexpec` (Sverige, Norge, Finland) og Verdensbanken `SP.DYN.LE00.MA.IN` / `.FE.IN` / `.IN` (Japan og verdensgennemsnit), og bruger nyeste tilgængelige år. Resultatet afhænger derfor af de live API'er. Danmark udledes af Danmarks Statistik-tabellen (HISB8) i `lifeTableDK`.

| Land | Mænd | Kvinder | Samlet | Kilde |
|------|------|---------|--------|-------|
| Sverige | 82.3 | 85.3 | 83.8 | Eurostat 2024 |
| Norge | 81.6 | 84.8 | 83.2 | Eurostat 2024 |
| Finland | 79.6 | 84.8 | 82.2 | Eurostat 2024 |
| Japan | 81.1 | 87.1 | 84.0 | Verdensbanken 2024 |
| Verdensgennemsnit | 71.1 | 76.0 | 73.5 | Verdensbanken 2024 |

Ukendte lande bruger verdensgennemsnittet.

## 📁 Projektstruktur

```
lifespan-calculator/
├── astro.config.mjs        # Astro: statisk output, React-øer, Tailwind via PostCSS
├── Caddyfile               # Produktionsserveren (headers, rene URL'er, 404)
├── Dockerfile              # Build (Node 22) + Caddy
├── src/
│   ├── pages/              # Én .astro-fil pr. URL (+ 404.astro)
│   ├── layouts/Base.astro  # <html>, <head> og inline-scripts
│   ├── islands/            # De React-komponenter, der hydreres
│   ├── views/              # Sidernes indhold som React-komponenter
│   ├── components/         # Delte komponenter
│   ├── lib/head.js         # SEO-tags pr. side
│   ├── routes.meta.js      # Titler, beskrivelser, breadcrumbs
│   └── utils/, hooks/, data/
├── public/                 # Kopieres uændret (politiksider, ikoner, fonte, robots.txt, sitemap.xml, api/health)
├── scripts/                # Sitemap, service worker, paritets- og JS-budget-tjek, Lighthouse, datascripts
└── e2e/                    # Playwright mod Caddy-imaget
```

## 🔧 Installation og setup

Kræver Node.js 22.23.4 eller nyere (Astro 7) og Docker til e2e-testene og performance-budgettet.

```sh
npm ci
npm run dev        # Astro dev-server, http://localhost:4321
npm run build      # dist/ + service worker + paritetstjek mod SPA'en + JS-budget
npm run preview    # astro preview af dist/ (uden Caddyfile'ens headers)
npm test           # vitest
npm run test:e2e   # Playwright mod dist/ i Caddy-imaget (kræver Docker)
node scripts/lighthouse-budget.mjs   # mobil-LCP og 0 KB JS på indholdssider (kræver Docker og Chrome)
```

Se `docs/testing.md` for detaljer.

## 🚢 Drift: Docker og Caddy

`Dockerfile` bygger sitet med `node:22-alpine` (`npm ci` og `npm run build`) og serverer `dist/` med
`caddy:2.11.7-alpine` på port 3000 som en bruger uden root-rettigheder. Konfigurationen er `Caddyfile`:

- **Rene URL'er**: `/x` serveres fra `x/index.html` (Astro) eller `x.html` (politiksiderne) uden redirect.
  `/x/` giver også siden. `/x.html`, `/x/index.html` og `/index.html` redirecter med 301 til den rene adresse.
- **404**: ukendte stier får `404.html` med status 404 og `X-Robots-Tag: noindex`. En manglende fil under
  `/_astro/` eller `/assets/` får en kort tekst-404 med `Cache-Control: no-store`, aldrig HTML.
- **Cache**: `/_astro/*` (hashede filer) er `immutable` i et år. Alt andet, også `sw.js`, er `no-cache`.
- **Headers**: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` og
  `X-Frame-Options: SAMEORIGIN` på alle svar. `/embed` må indlejres overalt
  (`Content-Security-Policy: frame-ancestors *`) og har `X-Robots-Tag: noindex`.
- **Komprimering**: zstd og gzip.

**Health-endpoint til Kuma og Dokploy**: `GET /api/health` svarer `200` med `ok` (`text/plain`). Filen er
`public/api/health`. Imaget har en `HEALTHCHECK` med `curl -fsS http://127.0.0.1:3000/api/health`, og `curl`
er installeret, så Dokploys/Swarms healthcheck-kommando virker uændret. Kuma kan overvåge
`https://levetidsberegner.dk/api/health` (status 200, nøgleord `ok`).

Byg og kør lokalt:

```sh
docker build -t levetid .
docker run --rm -p 127.0.0.1:8080:3000 levetid
curl -fsS http://127.0.0.1:8080/api/health
```

Hostes som Dokploy-app `web` (build type `dockerfile`, port 3000). Auto-deploy er slået fra; deploy udløses manuelt.

## 🧩 Indlejring

Siden `/embed-levetidsberegner` har en kopiérbar iframe-kode til en lille udgave af
beregneren (`/embed`, med `?theme=dark` og `?bg=transparent`). Widgetten regner i den besøgendes
browser, sender kun sin højde (`postMessage`, ingen input) til værtssiden og viser et link til
levetidsberegner.dk. Kildeperioden hentes fra `LIFE_TABLE_META.period`.

## 🔒 Privatlivspolitik

- **Ingen data gemmes**: Alle beregninger sker lokalt i browseren
- **Ingen lokation**: Appen beder ikke om din placering
- **Ingen cookies**: Applikationen sætter ingen cookies
- **Kun ét eksternt script**: anonym besøgsstatistik (Plausible, uden cookies og uden dine indtastninger)

## ⚠️ Begrænsninger og disclaimers

- **Kun statistiske estimater**: Resultaterne er baseret på gennemsnitsdata
- **Mange faktorer ignoreres**: Livsstil, genetik, sundhedspleje, mv. påvirker levetiden
- **Teknologiske fremskridt**: Fremtidens medicinske gennembrud kan forlænge levetiden
- **Browserkompatibilitet**: Kræver moderne browser

## 🎯 Fremtidige forbedringer

- [ ] Integration med mere omfattende levetidsdata-API
- [ ] Tilføjelse af livsstilsfaktorer (rygning, motion, kost)
- [ ] Historisk sammenligning og trends
- [ ] Flere visualiseringer (grafer, progressbars)
- [ ] Sprog-support (engelsk, tysk, mm.)
- [ ] Deling af resultater på sociale medier

## 🤝 Bidrag

Bidrag er velkomne! Åbn gerne issues eller pull requests for:
- Fejlrettelser
- Nye funktioner
- Forbedringer af UI/UX
- Dokumentationsopdateringer
- Oversættelser

## 📄 Licens

Dette projekt er open source og kan bruges frit til uddannelse og ikke-kommercielle formål.

## 👨‍💻 Udvikler

Udviklet med ❤️ som et proof-of-concept projekt.

---

**Bemærk**: Dette er kun et statistisk værktøj til underholdning og generel information. Søg professionel medicinsk rådgivning for sundhedsrelaterede spørgsmål.
