# 🕰️ Levetidsberegner (Lifespan Calculator)

En webbaseret applikation der beregner din forventede resterende levetid baseret på din alder og dit køn, med danske levetidstabeller.

## 📋 Funktioner

- **Beregning i browseren**: Dine input forlader aldrig din enhed og sendes ikke til analytics
- **Danske tal**: Baseret på Danmarks Statistik (HISB8, periode 2024:2025)
- **Responsive design**: Fungerer på både desktop og mobile enheder
- **Intuitivt interface**: Moderne og brugervenligt design
- **Detaljerede resultater**: Viser resterende år, forventet levetid og estimeret slutdato
- **Kontekstuelle beskeder**: Forskellige beskeder baseret på resultaterne

## 🚀 Sådan bruges applikationen

1. **Indtast din alder**: Angiv din nuværende alder i år
2. **Vælg dit køn**: Vælg mellem mand og kvinde
3. **Beregn resultat**: Klik på "Beregn min resterende levetid" for at se resultatet

## 🛠️ Teknisk implementation

### Frontend
- **HTML5**: Semantisk markup med tilgængelighedsfokus
- **CSS3**: Moderne styling med flexbox, gradients og animationer
- **Vanilla JavaScript**: ES6+ med class-baseret arkitektur
- **Responsive design**: Mobile-first tilgang

### APIs og data
- **Ingen eksterne API'er til beregningen**: Alt kører i browseren
- **Statiske levetidsdata**: Danmarks Statistik (HISB8) samt landetabeller til sammenligning

### Databaser
Landetabellen i `src/utils/lifeExpectancyData.js` (blokken mellem `BEGIN/END GENERATED COUNTRY TABLE`) genereres af `scripts/update-country-table.mjs` (Node 24, `node scripts/update-country-table.mjs`). Scriptet henter levetid ved fødslen fra Eurostat `demo_mlexpec` (Sverige, Norge, Finland) og Verdensbanken `SP.DYN.LE00.MA.IN` / `.FE.IN` / `.IN` (Japan og verdensgennemsnit), og bruger nyeste tilgængelige år. Resultatet afhænger derfor af de live API'er. Danmark udledes af Danmarks Statistik-tabellen (HISB8) i `lifeTableDK`.

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
├── index.html          # Hovedside med HTML struktur
├── styles.css          # CSS styling og responsive design
├── script.js           # JavaScript funktionalitet og logik
└── README.md          # Denne dokumentation
```

## 🔧 Installation og setup

### Lokalt udvikling
1. Klon eller download projektet
2. Åbn `index.html` i en moderne webbrowser

### Webserver
Projektet kan hostes på enhver webserver der kan servere statiske filer:
- GitHub Pages
- Netlify
- Vercel
- Apache/Nginx

## 🔒 Privatlivspolitik

- **Ingen data gemmes**: Alle beregninger sker lokalt i browseren
- **Ingen lokation**: Appen beder ikke om din placering
- **Ingen cookies**: Applikationen bruger ingen cookies eller tracking
- **Ingen eksterne scripts**: Alt kode er selvstændig og transparent

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
- [ ] Offline funktionalitet med Service Worker
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
