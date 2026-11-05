# Copy changes for #90 (sourced wording)

Every user-facing string changed in #90, old to new (the old text is what
`origin/master` said before this change; the new text is in the code). Source
references are in the new text itself. Audit row numbers refer to Appendix B of
`audit/data/DATA-REPORT.md` (branch `docs/audit-2026-11-05`). Texts are Danish
because the UI is.

Lifestyle coefficient deviations against their sources are tracked in
[`lifestyle-recalibration.md`](lifestyle-recalibration.md) (#134), not repeated here.

Not touched here: `DanmarkPage.jsx` figures (audit rows 13-17, issue #95), and
the route titles and descriptions (#135 already says what the tables are: they
come from Danmarks Statistik).

## `src/pages/LivsstilPage.jsx`

| Where | Old | New |
|---|---|---|
| Intro | "Forskning viser, at livsstil udgør op til 60% af de faktorer, der bestemmer din levetid." | "I store amerikanske opfølgningsstudier kunne omkring 60 % af dødsfaldene tilskrives, at man ikke fulgte fem sunde levevaner (Li m.fl., Circulation 2018). Tallet gælder en befolkning, ikke dig." |
| Motion | "Regelmæssig motion kan tilføje 3-7 år til dit liv. Bare 150 minutter ... reducerer risikoen ... betydeligt." | Moore 2012: ca. 3,4 år længere end inaktive ved ca. 150 min/uge, ca. 1,8 år under 75 min/uge, "statistiske sammenhænge" |
| Kost | "En sund kost kan forlænge livet med 2-8 år. Den mediterrane kost er den mest dokumenterede koststil for langt liv." | Fadnes 2022: modelberegning, omkring 3-10 leveår, mest ved ung start, "ikke et forsøg" |
| Søvn | "7-9 timers kvalitetssøvn er essentielt ... øger risikoen for hjertesygdomme, diabetes og tidlig død." | Yin 2017 / Cappuccio 2010: kort og lang søvn forbundet med lidt højere dødelighed, lavest omkring 7 timer, delvist omvendt kausalitet |
| Rygning, intro | "Rygning er den enkeltstående livsstilsfaktor, der forkorter livet mest - op til 10 år. At stoppe ... uanset alder." | "Rygere mister i gennemsnit mindst 10 leveår sammenlignet med aldrig-rygere (Jha m.fl., NEJM 2013)." |
| Rygning, liste | "1 pakke om dagen: -7 år", "2 pakker om dagen: -10 år", "Stop før 30 år: fuld levetidsgenopretning", "Stop før 50 år: halverer overdødelighed" | Pirie 2013 (1-10 cigaretter næsten fordobler dødeligheden), Jha 2013 (stop før 40: ca. 90 % af merdødeligheden undgås), Doll 2004 (stop som 30-årig ca. 10 år, som 50-årig ca. 6) |
| Stress | "Kronisk stress øger risikoen for hjertesygdomme, depression og tidlig død. Stressmanagement kan tilføje 2-3 år til dit liv." | Kivimäki 2012: ca. 23 % højere risiko for hjertesygdom; "ikke solid dokumentation for et bestemt antal leveår ved stresshåndtering" |
| Alkohol, tekst | "Moderat alkoholforbrug kan have neutrale eller svagt positive effekter, mens stort forbrug forkorter livet betydeligt." | Wood 2018: ved 200-350 g/uge (ca. 17-29 genstande) ca. 1-2 år kortere forventet levetid ved 40 år, mod højst 100 g/uge (ca. 8 genstande) |
| Alkohol, liste | "Kvinder: Max 7 genstande per uge" / "Mænd: Max 14 genstande per uge" | "Sundhedsstyrelsen anbefaler højst 10 genstande om ugen og højst 4 på samme dag, for både kvinder og mænd." |
| Kumulativ effekt | "Studier viser, at ... lever 12-14 år længere end dem, der ikke følger nogen af dem." | Li 2018: 50-årige med alle fem vaner har 12,2 (mænd) og 14,0 (kvinder) års længere forventet restlevetid (ca. 123.000 sundhedsprofessionelle, USA) |
| Flise 1 (audit row 12) | "+12-14 / År ekstra ved optimal livsstil" | "+12,2-14,0 / Flere leveår ved 50 år: fem mod ingen sunde levevaner" |
| Flise 2 (audit row 12) | "80% / Reduktion i hjertesygdomme" | "82 % / Lavere dødelighed af hjerte-kar-sygdom ved fem mod ingen sunde levevaner" |
| Flise 3 (audit row 12) | "50% / Reduktion i kræftrisiko" | "65 % / Lavere kræftdødelighed ved fem mod ingen sunde levevaner" |

## `src/components/KropsAlder.jsx`

| Old | New |
|---|---|
| Heading "Din biologiske alder" | "Din statistiske risikoalder" |
| "Din livsstil svarer til en krop, der er ~N år yngre 🎉" / "... ældre" / "Din krop matcher din faktiske alder" | "Med de valg, du har lavet, svarer dit estimat for resterende leveår til det, en gennemsnitsdansker på ca. X år har tilbage (du er Y). Det er en statistisk omregning af leveår, ikke en måling af din krop eller din risiko." |
| "Beregnet ud fra dine livsstilsvalg og danske dødelighedstavler." | "Beregnet ud fra dine livsstilsvalg (vejledende justeringer) og danske dødelighedstavler." |

The number is the age whose table remaining life expectancy equals the adjusted
remaining years (`statisticalRiskAge`, renamed from `biologicalAge`). It is not a
mortality risk and not a body measurement, so the text no longer says so.

## `src/components/Pension.jsx`

| Old | New |
|---|---|
| "Folkepensionsalderen er lovbestemt (Lov nr. 703 af 20. juni 2025; aldre efter borger.dk, november 2026) og kan stige yderligere for årgange fra 1975. ..." | "Folkepensionsalderen er 70 år for dem, der er født fra 1. januar 1971 (Lov nr. 703 af 20. juni 2025, som også satte 69 år for 1967-1970). De øvrige aldre er efter borger.dk, november 2026, ..." |

The law is cited only for what it set (69 and 70 years); `src/utils/pension.js`
returns 70 for births from 1971 and 69 for 1967-1970.

## Disclaimers: `Footer.jsx`, `HomePage.jsx`, new `OmTallene.jsx`

| Old | New |
|---|---|
| Footer "Datakilder og nøjagtighed" (short note) | One "Om tallene" section (`OmTallene.jsx`, `#om-tallene`): method and period, what the lifestyle adjustments are, not medical advice, source list, "Dine data" |
| Footer line "Data fra Danmarks Statistik (dødelighedstavler ...)" and the italic "kun til informative og underholdende formål" line | removed (now in Om tallene) |
| Result page: yellow "Bemærk: ..." card plus orange "Vigtige disclaimere" card ("Individuelle faktorer påvirker ikke beregningen", "Kun til underholdning og reflektion") | One card: "Det her er statistik, ikke en prognose for dig, og ikke medicinsk rådgivning. Læs mere under Om tallene." |
| (new) data note | "Dine indtastninger bliver i din browser og sendes ikke til en server, medmindre du selv deler et link: det indeholder dit køn og din alder i hele år (og livsstilssvar, hvis du har valgt dem)." Consistent with `public/privatlivspolitik.html` (sharing section). |

Period and update date in Om tallene come from `LIFE_TABLE_META` through
`src/utils/dataSource.js`, never typed by hand.

## Structured data

| Old | New |
|---|---|
| `applicationCategory: "HealthApplication"` (`routes.meta.js` `jsonLd`) | `"UtilitiesApplication"` |

`applicationCategory` is free text on schema.org; Google's software-app
structured-data documentation lists `UtilitiesApplication` and `HealthApplication`
among its categories. The tool is a calculator, not a health app (it is not
medical advice), so the neutral category is used.

## Guard

`src/copyGuard.test.js` fails if `WHO`, "geografisk(e) placering", "livsstil
udgør op til 60" or "Max 7/14 genstande" reappear anywhere in `src/`, or if a
`track(` / `plausible(` call carries a prop that names user input. Each pattern
is also checked against a sample string so a pattern that can no longer match is
itself a failing test.
