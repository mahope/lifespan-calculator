| case | URL after submit | remaining years | expected age at death | countdown (frozen clock) | lived % / days / heartbeats | survival to 80/90/95/100 | comparison (you vs DK avg) | pension (age / work years left / retirement years) | other |
|---|---|---|---|---|---|---|---|---|---|
| 1-male-40 | `/?g=male&a=40` | 41.2 | 81.2 | 40 y 364 d 10 h 25 m 4 s | 49.2 / 14.610 / 1.472.688.000 | 62% / 23% / 7% / 1% | 81.2 vs 78.9 (Du ligger ca. 2.3 år over det danske gennemsnit) | 70 / 30 / 11 (cohort 1986) |  |
| 2-female-65 | `/?g=female&a=65` | 21.4 | 86.4 | 20 y 364 d 10 h 25 m 4 s | 75.2 / 23.741 / 2.393.092.800 | 77% / 38% / 15% / 4% | 86.4 vs 82.7 (Du ligger ca. 3.7 år over det danske gennemsnit) | 67 / 2 / 19 (cohort 1961) |  |
| 3-male-birthdate-1985-06-15 | `/?g=male&b=1985-06-15` | 39.9 | 81.3 | 39 y 323 d 11 h 25 m 4 s | 50.9 / 15.118 / 1.523.894.400 | 62% / 23% / 7% / 1% | 81.3 vs 78.9 (Du ligger ca. 2.4 år over det danske gennemsnit) | 70 / 29 / 11 (cohort 1985) | precise age "41 år, 4 mdr, 21 dage", born 15.6.1985 |
| 4-bonus-male-50-advanced | `/?g=male&a=50&m=advanced&lf=-5,4,3,0,2,0,0,0,0,0,0,0,0,0,0,0` | 35.8 | 85.8 | 34 y 364 d 10 h 25 m 4 s | 58.3 / 18.262 / 1.840.809.600 | 62% / 23% / 7% / 1% | 85.8 vs 78.9 (Du ligger ca. 6.9 år over det danske gennemsnit) | 70 / 20 / 16 (cohort 1976) | biological age 46 (Din livsstil svarer til en krop, der er ~4 år yngre 🎉) |

Analytics events the page tried to send (name + props), per case:

- 1-male-40: pageview ; Calculate Lifespan {"age":"40","gender":"male","location":"Unknown","usedBirthdate":false} ; pageview
- 2-female-65: pageview ; Calculate Lifespan {"age":"65","gender":"female","location":"Unknown","usedBirthdate":false} ; pageview
- 3-male-birthdate-1985-06-15: pageview ; Calculate Lifespan {"age":"birthdate","gender":"male","location":"Unknown","usedBirthdate":true} ; pageview
- 4-bonus-male-50-advanced: pageview ; Calculate Lifespan {"age":"50","gender":"male","location":"Unknown","usedBirthdate":false} ; pageview

Affiliate link (identical in all cases): {"href":"https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=60068&uid=levetidsberegner","rel":"sponsored noopener noreferrer","target":"_blank","text":"Sammenlign livsforsikringer →"}

Insurance widget with income 500000 / 10 years: 5.000.000 kr; link text: "Sammenlign livsforsikringer fra ~5.000.000 kr →"

Routes (rendered DOM):

| route | status | title | canonical | meta descriptions | og:title | h1 |
|---|---:|---|---|---:|---:|---|
| / | 200 | Levetidsberegner - Beregn din resterende levetid baseret på statistik | https://levetidsberegner.dk | 2 | 2 | Levetidsberegner |
| /hvor-lang-tid-har-jeg-tilbage | 200 | Hvor lang tid har jeg tilbage at leve? - Dansk Levetidsberegner | https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage | 2 | 2 | Hvor lang tid har jeg tilbage? |
| /dodsalder-calculator | 200 | Dødsalder Calculator - Beregn din forventede dødsalder | https://levetidsberegner.dk/dodsalder-calculator | 2 | 2 | Dødsalder Calculator |
| /livsstil-og-levetid | 200 | Livsstil og Levetid - Hvordan påvirker din livsstil din levetid? | https://levetidsberegner.dk/livsstil-og-levetid | 2 | 2 | Livsstil og Levetid |
| /levetid-beregner-danmark | 200 | Dansk Levetidsberegner - Specialiseret til danske forhold | https://levetidsberegner.dk/levetid-beregner-danmark | 2 | 2 | Dansk Levetidsberegner |
| /xyz | 200 | Side ikke fundet - Dansk Levetidsberegner | https://levetidsberegner.dk/404 | 2 | 2 | Side ikke fundet |
