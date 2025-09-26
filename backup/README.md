# 🕰️ Levetidsberegner (Lifespan Calculator)

En webbaseret applikation der beregner din forventede resterende levetid baseret på din alder, køn og geografiske placering.

## 📋 Funktioner

- **Automatisk lokationsdetektering**: Bruger din browsers geolocation API til at finde din placering
- **Præcise beregninger**: Baseret på WHO og nationale statistikker for forskellige lande
- **Responsive design**: Fungerer på både desktop og mobile enheder
- **Intuitivt interface**: Moderne og brugervenligt design
- **Detaljerede resultater**: Viser resterende år, forventet levetid og estimeret slutdato
- **Kontekstuelle beskeder**: Forskellige beskeder baseret på resultaterne
- **Fallback til verdensgennemsnit**: Hvis lokation ikke kan bestemmes

## 🚀 Sådan bruges applikationen

1. **Indtast din alder**: Angiv din nuværende alder i år
2. **Vælg dit køn**: Vælg mellem mand og kvinde
3. **Find din lokation**: Klik på "Find min lokation automatisk" for at tillade browser adgang til din placering
4. **Beregn resultat**: Klik på "Beregn min resterende levetid" for at se resultatet

## 🛠️ Teknisk implementation

### Frontend
- **HTML5**: Semantisk markup med tilgængelighedsfokus
- **CSS3**: Moderne styling med flexbox, gradients og animationer
- **Vanilla JavaScript**: ES6+ med class-baseret arkitektur
- **Responsive design**: Mobile-first tilgang

### APIs og data
- **Geolocation API**: Browser-baseret positionsbestemmelse
- **OpenStreetMap Nominatim API**: Gratis reverse geocoding
- **Statiske levetidsdata**: Baseret på WHO og nationale statistikker

### Databaser
Applikationen bruger følgende levetidsdata (år 2024):

| Land | Mænd | Kvinder |
|------|------|---------|
| Danmark | 78.9 | 82.7 |
| Sverige | 80.8 | 84.3 |
| Norge | 80.5 | 84.2 |
| Tyskland | 78.6 | 83.4 |
| Storbritannien | 79.4 | 83.1 |
| USA | 76.3 | 81.4 |
| Frankrig | 79.7 | 85.6 |
| Holland | 80.2 | 83.9 |
| Finland | 78.7 | 84.5 |
| Island | 81.3 | 84.1 |
| Schweiz | 81.9 | 85.6 |
| Japan | 81.6 | 87.7 |

*Verdensgennemsnit: 72.6 år (mænd), 77.1 år (kvinder)*

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
3. Tilladbrowser adgang til geolokation når du bliver spurgt

### Webserver
Projektet kan hostes på enhver webserver der kan servere statiske filer:
- GitHub Pages
- Netlify
- Vercel
- Apache/Nginx

### HTTPS krav
**Vigtigt**: Geolocation API kræver HTTPS i produktion. Sørg for at have SSL-certifikat på din webserver.

## 🔒 Privatlivspolitik

- **Ingen data gemmes**: Alle beregninger sker lokalt i browseren
- **Geolokation**: Kun brugt til at bestemme land - koordinater gemmes ikke
- **Ingen cookies**: Applikationen bruger ingen cookies eller tracking
- **Ingen eksterne scripts**: Alt kode er selvstændig og transparent

## ⚠️ Begrænsninger og disclaimers

- **Kun statistiske estimater**: Resultaterne er baseret på gennemsnitsdata
- **Mange faktorer ignoreres**: Livsstil, genetik, sundhedspleje, mv. påvirker levetiden
- **Teknologiske fremskridt**: Fremtidens medicinske gennembrud kan forlænge levetiden
- **Browserkompatibilitet**: Kræver moderne browser med geolocation support

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
