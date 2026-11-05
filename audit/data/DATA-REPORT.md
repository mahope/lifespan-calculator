# levetidsberegner.dk - data quality and medical/actuarial audit

Audit date: 2026-11-05. Repo snapshot: `mahope/lifespan-calculator` shallow copy, HEAD `0a4c35c` (Merge PR #66). All web figures were retrieved on 2026-11-05; times are UTC unless stated. Nothing in the repo was modified; the test suite was not run (no `npm install` on this PC), but the real util modules were executed under Node 24 from copies (`raw/code_copy`, import paths fixed only).

Severity: **P1** = wrong or misleading for most visitors or a trust/legal exposure; **P2** = materially wrong in visible scenarios; **P3** = minor/polish. Effort: **S** < 0.5 day, **M** 0.5-3 days, **L** > 3 days. Anything I could not retrieve or verify is marked *uncertain* or *not retrieved*.

## 0. Result in brief

**HISB8 verification (task 1):**
1. `lifeTableDK.js` matches DST StatBank HISB8 period 2024:2025 exactly: 400/400 values (100 ages x 2 sexes x e_x and l_x), max absolute deviation 0.0, no index/offset error (best shift 0 for all four arrays).
2. The check can discriminate: the same arrays match only 2/400 against 2023:2024 and 3/400 against 2022:2023. HISB8 holds 44 two-year periods (1981:1982 to 2024:2025); 2024:2025 is the latest, table updated 2026-02-12 08:00; DST's own page for that release says next release is **12 February 2027** (`raw/dst_release_52702_extract.txt`).
3. The table data is current and correct; the problems are elsewhere (country file, comparison logic, lifestyle model, copy, a few code paths).

**Top 10 findings** (details in section 1):
1. F01 P1 - "Sammenlign" compares the user's conditional expected age at death (age + e_x) with country life expectancy *at birth* from a stale file; a 40-year-old man with zero lifestyle input is told he is "2.3 years above the Danish average".
2. F02 P1 - Country file and DanmarkPage show Denmark as 78.9/82.7 ("2024"); DST 2024:2025 is 80.3/83.9. Eight of 13 rows differ by >= 0.5 year from current sources; no year or source is stated anywhere.
3. F03 P1 - The additive "years per factor" lifestyle model is age-independent, has an inconsistent reference category and double-counts overlapping effects (an 85-year-old man ticking "heavy smoker" gets 0 years left).
4. F04 P2 - Several factor magnitudes exceed or contradict the cited papers (exercise +6 vs published maximum +4.5; alcohol -3/-6 vs -0.5 to -5; sleep "9+ h" = 0 and "7-8 h" = +2; environment sign opposite to DST data); 10 of 16 factors have no citation at all.
5. F07 P1 - Provenance and method claims in the UI are false: "WHO data", "adjusted for geographic location", "automatic IP location", "Individuelle faktorer påvirker ikke beregningen" (they do in advanced mode), "Opdateret 2024".
6. F09 P2 - Period table presented as "years you have left": DST's own projection implies +4 to +7 years more for people aged 20-40 (cohort 40-year-old man 46.8 vs 41.2 shown).
7. F10/F11 P2 - Two calculation bugs: "chance to reach 100" is actually the chance to reach 99 (female 60: shows 4%, true 2.8%); age-only mode drops the fractional year of the end date (male 40: countdown 40 y 364 d instead of 41 y 84 d).
8. F13 P2 - Pension: statutory ages are right for 1955-2000 cohorts (checked against borger.dk and Lov nr. 703/2025), but the birth year is derived as `year - floor(age)`, which is one year too high for everyone whose birthday has not yet occurred this calendar year (15% of each cohort on 5 Nov, 100% on 1 Jan), so people born 1962, 1966 or 1970 can be shown a pension age one year too high; 1954/55 half-year cohorts are rounded; efterløn is not modelled.
9. F16-F18 P2 - DanmarkPage claims contradicted by primary data: "Hovedstaden highest, +2-3 years" (Midtjylland 82.6 > Hovedstaden 82.5), "higher smoking rate than many Western countries" (DK 12.9% vs EU 19.3%), alcohol limit "7/14 genstande" (Sundhedsstyrelsen now 10 per week, 4 per day, both sexes).
10. F06 P2 - "Din biologiske alder" is a life-expectancy-equivalent age, not a biological age, and the same lifestyle score gives +-6 years at age 40 but +10/-14 at age 85. Reword and replace with a hazard-based "risk age".

**New-feature data that is ready:** kommune-level life expectancy (94 of 99 areas, DST HISBK), education gradient (HISB LIGEHI4), healthy life years (Eurostat hlth_hlye + WHO HALE) - see F24, F25.

## 1. Findings register

### F01 - Sammenlign compares unlike quantities (P1, effort S-M)
- **Evidence:** `Sammenlign.jsx` bar "Dig" = `adjustedLifeExpectancy` = age + e_x(age) (conditional on being alive today). Reference bars come from `lifeExpectancyData.js` = life expectancy *at birth*. Real code output with no lifestyle input (`raw/regression_values_output.json`, `diagnostics.sammenlignApplesToOranges`): male 0 y: 80.3 vs file 78.9 (+1.3); male 40: 81.2 (+2.3); male 65: 83.7 (+4.8); male 80: 88.5 (+9.5); female 65: 86.4 (+3.7); female 80: 90.0 (+7.3). Verdict text: "Du ligger ca. 2.3 år over det danske gennemsnit 🎉".
- **Consequence:** Every user is told they beat the Danish average, more so the older they are (survivor effect plus the stale 78.9). Shared/screenshotted result is wrong, and the "Japan (højest i verden)" bar makes it worse.
- **Action:** (a) Remove the "Dig" bar from the country comparison; show at-birth values for countries only, labelled "Middellevetid ved fødslen". (b) Add a separate same-age line: "Gennemsnitsdansker på din alder: age + e_x; dig: ..." so the difference equals the lifestyle adjustment only. (c) Optionally compare other countries at the user's age (needs an age-specific table, e.g. Eurostat life tables; not retrieved here).

### F02 - Stale, unsourced country data; Denmark contradicts own calculator (P1, effort S)
- **Evidence:** `lifeExpectancyData.js` has no source/year. README says "(år 2024)". Denmark 78.9/82.7 matches no DST period since 2011:2012 (closest 2015:2016 = 78.8/82.8; `raw/HISB7_data.csv`). DST HISB7 2024:2025 = 80.3/83.9 (total 82.1); HISB8 uses 80.25/83.90 inside the same app. DanmarkPage (labelled "Aktuelle danske tal (2024)") shows 82.7 / 78.9 / 80.8. Comparison of all 12 countries + World to Eurostat demo_mlexpec 2024 (updated 2026-09-25), World Bank WDI 2024 (lastupdated 2026-10-08) and WHO GHO 2023 is in section 2.4: nine of 13 rows (DK, SE, NO, FR, NL, FI, CH, JP, World) differ by 0.5 year or more from Eurostat/World Bank in at least one sex; DE, UK, US and IS are within tolerance.
- **Consequence:** Headline number on the main SEO page is 1.4 years too low for men and 1.2 for women, and inconsistent with the app's own result for a newborn (80.25).
- **Action:** Replace the file with generated data carrying `{value, year, source}` per country; derive Denmark from DST (HISB7/HISB8), never from a second source. Show source and year in the UI. See Appendix D for the annual script.

### F03 - Additive flat-year lifestyle model is structurally unsound (P1, effort L; overlaps open issue #23)
- **Evidence (code):** `boundLifestyleAdjustment` sums 16 integer "years" and caps at [-15, +12]. Four structural problems, all demonstrated with the real code/data:
  1. *Age-independent.* A heavy smoker (-10, bounded to -9 after the soft cap) at ages 30/50/70/80/85/90 has remaining life 41.9/22.8/6.0/**0/0/0** (`diagnostics.heavySmokerFlatMinus9`). Real hazard-based loss shrinks with age: HR 3.0 costs -10.3/-9.2/-6.3/-3.1 years at 30/50/70/85 (men; `raw/hr_to_years_output.json`).
  2. *Inconsistent reference.* Base e_x is the population mix (DK daily smokers 12.9%, Eurostat EHIS 2019), yet "0" means *never-smoker/no alcohol/no disease* for some factors and *worst* (no exercise) for others. A never-smoker should be roughly +2 to +3 years above the Danish average at age 40, a heavy smoker about -7 to -8 (my estimate from HR conversion; *uncertain*, needs Danish prevalence data).
  3. *Double counting.* Factors are estimated in separate studies, each adjusted for different confounders, and are mediated by one another (exercise/diet -> BMI; education -> income -> smoking; sleep <-> stress <-> mental health). Spread of the five core behaviours alone (smoking, exercise, diet, alcohol, BMI): worst -22 -> bounded -12, best +13 -> bounded +10, i.e. 22 years; Li et al. (Circulation 2018) report 12.2 (men) / 14.0 (women) years at age 50 between 0 and 5 low-risk factors.
  4. *Missing categories.* No "former smoker" (about a quarter of adults), no age of quitting although Jha 2013 and Doll 2004 show the gain depends heavily on it.
- **Consequence:** Output for the target audience (middle-aged/older) is wrong in a systematic direction (too pessimistic when stacking negatives, too optimistic for exercise/diet), and elderly users get "0 years left".
- **Action:** One model change instead of patching numbers: store per-factor hazard ratios (with reference categories) and apply `HR_total = prod(HR_i) * overlap_factor` to q_x from the current age (the code already has l_x; `hr_to_years.py` reproduces e_x to within 0.01). Normalise to the Danish prevalence so 0 = average Dane. Use a combined-effect check against Li 2018 (5 vs 0 factors: HR 0.26). Reduce to the 6-8 factors with evidence (Appendix A). Keep the hard cap only as a safety net.

### F04 - Per-factor magnitudes contradict the cited evidence (P2, effort M)
See Appendix A for all 16 factors. Highlights:
- **Exercise** "Intensiv (7+ t/uge)" = +6: Moore 2012 (PMID 23139642) maximum is +4.5 y (95% CI 4.3-4.7) at 22.5+ MET-h/wk; 7.5-14.9 MET-h (about 150 min/wk) = +3.4 (3.2-3.6). Arem 2015 shows a plateau at 3-5x the minimum (HR 0.61).
- **Alcohol** "Moderat 8-14/uge" = -3, "Kraftig 15+" = -6, "Let 1-7" = -1: Wood 2018 (PMID 29676281) finds lowest risk at or below ~100 g/week; life expectancy at 40 is lower by ~6 months for >100-200 g/week, 1-2 years for >200-350, 4-5 years for >350. At 12 g per genstande, 8-14 genstande (96-168 g) is within or just above the lowest-risk band, not -3.
- **Sleep** "7-8 timer" = +2 and "9+ timer" = 0: Yin 2017 (PMID 28889101) finds a U-shape with minimum at about 7 h and RR 1.13 per hour above 7; Cappuccio 2010 (PMID 20469800) short RR 1.12, long RR 1.30. The model rewards the median sleeper and ignores long sleep.
- **Environment** "Landdistrikter" = +1: DST LABY21 2024:2025 shows rural municipalities have the *lowest* life expectancy (total 81.0, men 79.1) vs commuter 82.3 and capital 82.6.
- **Stress** (-4 to +2), **work**, **screentime**, **commute**, **health** have no verifiable effect size (Kivimäki 2012 job strain: HR 1.23 for incident CHD, population attributable risk 3.4%).
- **Action:** Replace values as in Appendix A or drop the factor; show an uncertainty range, not a point estimate.

### F05 - Citations next to numbers they do not support; 10 of 16 factors uncited (P2, effort S)
- **Evidence:** `lifestyleFactors.js` cites 6 papers (Doll 2004, Moore 2012, Fadnes 2022, Wood 2018, PSC 2009, Holt-Lunstad 2010). All six resolve to the right paper (PMID/PMCID/DOI checked via Europe PMC; site URLs return 200/203; `raw/site_citation_url_check.txt`). But `Coaching.jsx` prints "+6 år ... Kilde: Moore 2012" and "+5 år ... Kilde: Fadnes 2022" beside values the papers do not give (Moore max 4.5; Fadnes optimal diet +10.7/+13.0 from age 20, +8.0/+8.8 from age 60, feasible +6.2/+7.3, all model-based). Sleep, stress, mental, commute, work, environment, screentime (and health, education, income in the form) have no citation.
- **Consequence:** Citation lends false authority to the number.
- **Action:** Show the source's own number and range (e.g. "Moore 2012: +3.4 år (3.2-3.6) ved ca. 150 min/uge"), or remove the citation. Fix with F03/F04.

### F06 - "Din biologiske alder" is not a defensible biological-age claim (P2, effort S-M)
- **Evidence:** `KropsAlder.jsx` finds the age whose baseline e_x equals the adjusted remaining years. It is a life-expectancy-equivalent age built on the unsourced lifestyle sum, not a measurement of the body. Because e_x falls more slowly per year of age at high ages, the same lifestyle effect gives very different "ages": +-6 years -> delta 6/6 at age 25 and 40, 7 at 55, 8/-9 at 70, **10/-14 at 85** (`diagnostics.biologicalAgeDelta`). Copy: "Din livsstil svarer til en krop, der er ~X år yngre 🎉".
- **Defensible alternative:** Gompertz mortality doubles every 6.3-7.8 years in DST 2024:2025 (`raw/gompertz_slope_output.json`, slope 0.09-0.11/yr). A "risk age" = chronological age + ln(HR_total)/0.10 is age-independent (HR 2.8 smoker -> about +10 years; HR 0.5 -> about -7). Label it "statistisk risikoalder", not "biologisk alder/krop".
- **Action:** Rename; compute from the hazard model (F03); wording in Appendix B row 20; drop the emoji for the negative case.

### F07 - False statements about data sources, method and location (P1, effort S)
- **Evidence:** 
  - Footer l.13-14, 21-22, 30-31, 49-50, 89: "data fra WHO og nationale statistikker fra over 12 lande ... baseret på din alder, køn og geografiske placering", "bruger automatisk IP-lokation til at bestemme dit land", "Statistikkerne opdateres årligt", "verdensgennemsnittet baseret på WHO", "Opdateret 2024".
  - `HvorLangTidPage` l.50 "justeret for din alder, køn og geografiske placering"; `DodsalderPage` l.64 "statistikker fra WHO"; `HomePage` l.213 "Baseret på WHO data".
  - Reality: `calculateLifespan` ignores `lifeExpectancyForLocation`; every result uses the Danish DST table. "Brug min placering" calls Nominatim with coordinates and only prints the country name. No WHO data is used in the calculator. IP geolocation was removed.
  - `HomePage` l.1317 disclaimer "Individuelle faktorer påvirker ikke beregningen" contradicts the whole advanced mode.
- **Consequence:** Provenance claims are wrong on every page; the location button gives a false impression of country-specific results and sends the user's coordinates to a third party for no benefit.
- **Action:** Rewrite per Appendix B; remove or re-purpose "Brug min placering" (or implement a real country selector fed by the generated data, F02).

### F08 - Privacy claims contradict implementation (P2, effort S; may overlap another audit stream)
- **Evidence:** Footer l.39-41 "Ingen personlige data gemmes eller deles ... Der anvendes ingen cookies eller tredjepartsscripts" and `index.html` l.56 "vi gemmer ikke dine indtastninger". But `index.html` loads the Plausible script (analytics.holstjensen.eu), `HomePage` l.180-187 sends `age` (as typed) and `gender`, `location`, `usedBirthdate` as Plausible event props, `history.js` stores results in localStorage, results are shareable via URL params, and a cookie-consent banner exists.
- **Consequence:** Disclaimer promises more than the code does. (Not a medical claim, listed because the requested improved disclaimer must be accurate.)
- **Action:** Either drop the Plausible props or adjust the text (Appendix C has both variants). Confirm with the privacy/security stream.

### F09 - Period life table presented as the user's future; cohort effect is 4-7 years at ages 20-40 (P2 wording, P3 as feature; effort S wording / M feature)
- **Evidence:** DST projection 2026 mortality assumptions (FRDK426, updated 2026-06-12). Cohort remaining life expectancy computed along the diagonal q(age+k, 2026+k), mortality held at 2069 level beyond 2069 (so conservative), `raw/cohort_projection_output.json`:

| sex/age | site (HISB8 2024:25) | DST proj. period 2026 | DST proj. period 2040 | cohort (computed) | cohort - site |
|---|---|---|---|---|---|
| M 20 | 60.72 | 61.6 | 64.2 | 67.78 | +7.06 |
| M 40 | 41.23 | 42.0 | 44.4 | 46.84 | +5.61 |
| M 60 | 22.85 | 23.5 | 25.7 | 25.88 | +3.03 |
| M 80 | 8.45 | 8.9 | 9.7 | 9.14 | +0.69 |
| F 20 | 64.38 | 65.2 | 67.2 | 70.14 | +5.76 |
| F 40 | 44.67 | 45.4 | 47.3 | 49.43 | +4.76 |
| F 60 | 25.74 | 26.4 | 28.1 | 28.41 | +2.67 |
| F 80 | 9.99 | 10.4 | 11.2 | 10.87 | +0.88 |

  Two separate parts: (a) DST's 2026 projection base is already 0.4-0.9 years above HISB8 for the same age (e.g. M 40: 42.0 vs 41.23; the DST documentation page I could retrieve does not explain why, *uncertain*), and (b) the improvement effect along the cohort diagonal (M 40: +4.8 vs the projection's own 2026 period value). The formula check passes: e_x recomputed from the q_x column equals DST's published e_x for 2026 within 0.05 for all ten tested age/sex pairs.
- **Consequence:** "Du har 41,2 år tilbage" is the right answer to "hvis dødeligheden aldrig mere falder"; under DST's own projection a 40-year-old man should expect ~46.8. Users read it as a forecast.
- **Action:** (1) Wording now: state the assumption ("hvis dødeligheden forbliver som i 2024-2025"). (2) Feature: a toggle "Periode (nuværende dødelighed)" vs "Fremskrevet (DST befolkningsfremskrivning 2026)"; default period with the projected figure as a second line for ages < 60: "Hvis dødeligheden fortsætter med at falde som DST forventer: ca. X år". Precompute 2 x 100 cohort e_x at build time from FRDK426. Explain: the period figure is the standard (DST's "middellevetid"), the projected figure is a model assumption and more uncertain.

### F10 - "Chance for at nå 100 år" is the chance of reaching 99 (P2, effort S)
- **Evidence:** `survivalProbability` clamps any age >= 99 to l_99 (`raw/regression_values_output.json`, `p99_vs_p100_*`): male 40 P(99) = P(100) = 1.415%; female 60: both 4.28%; a 99.5-year-old gets P(100) = 100%. DST HISB8 q_99 (2024:2025) = 41,188 (M) and 34,091 (F) per 100,000, so P(survive 99->100) = 0.588 (M) / 0.659 (F), l_100 = 819 (M) / 2,699 (F). True P(100 | female 60) = 2,699/95,581 = 2.8%, not 4%; male 40: 0.83%, not 1.4%.
- **Action:** Fetch TAVLE=2 (q_x) for age 99 and extend the arrays to l_100 (or store 101 entries, ages 0-100); `Sandsynlighed` also shows P(95)/P(90) which are unaffected. Test: P(100)<P(99).

### F11 - Age-only mode: fractional remaining year is dropped from the end date (P2, effort S)
- **Evidence:** `calculateLifespan` age-only branch: `new Date(now.getFullYear() + remainingYears, ...)`; the Date constructor truncates the year, so 41.23 -> 41. Real run, male 40 on 2026-11-05: `remainingYears` 41.2 but end date 5.11.2067, `remainingDays` 14,974 (should be ~15,059), countdown **40 y 364 d 12 h**. The birthdate branch is correct (male b. 1985-06-15: 39.9 y -> 25.9.2066, 14,568 days).
- **Action:** Add `Math.floor(fraction*365.25)` days as in the birthdate branch. Add a regression test with the fixed values in section 2.8.

### F12 - Age-only input is treated as an exact age (P3, effort S)
- **Evidence:** "Din alder: 40" means 40.0-40.99 years; code uses exactly 40.0. e_x falls ~0.96/yr at 40, so the result is on average ~0.5 year too high in age-only mode. Also the input accepts up to 120 while the table ends at 99: `e_x` is clamped to e_99 (1.84 M / 2.18 F), giving "expected age at death 122.2" for a 120-year-old woman.
- **Action:** Use age + 0.5 in age-only mode (or label); cap input at 110 and use DST FRDK426 ages 100-109 or a stated tail rule for 99+.

### F13 - Pension: statute correct for the main cohorts; birth-year derivation, half-year cohorts and efterløn are not (P2, effort S-M)
- **Evidence:** Statutory ages as of 2026-11-05 (borger.dk, `Før du går på folkepension`): <=1953-12-31: 65; 1954-01-01 to 06-30: 65½; 1954-07-01 to 12-31: 66; 1955-01-01 to 06-30: 66½; 1955-07-01 to 1962-12-31: 67; 1963-1966: 68; 1967-01-01 to 1970-12-31: 69; 1971-01-01 or later: 70. The 2025 reform is Lov nr. 703 af 20. juni 2025 (Lovtidende A 21 June 2025, in force 31 Dec 2025): `§ 1 a, stk. 1, nr. 7` = 69 for births 1 Jan 1967-31 Dec 1970, new `nr. 8` = 70 for births after 31 Dec 1970; `§ 72 e` review year changed from 2025 to 2030 (`raw/retsinformation_L703_2025_extract.txt`).
  - `pension.js` matches for 1963+ and for 1955H2-1962; differs in 1954 (66 vs 65½/66) and 1955H1 (67 vs 66½), cohorts already retired.
  - `Pension.jsx` derives `birthYear = currentYear - floor(age)`, which is a year too high for everyone whose birthday has not happened yet this calendar year (about half of all users on average over the year). In age-only mode the true year is genuinely ambiguous by one year. On 2026-11-05: born 1970-12-20 -> derived 1971 -> shown 70 instead of 69; 1962-12-24 -> 68 instead of 67; 1966-12-31 -> 69 instead of 68 (`diagnostics.pensionBirthYearBoundary`). In birthdate mode the true year is known and discarded.
  - Efterløn (borger.dk): 1956H2-1958: 63 (4 years possible); 1959H1: 63½; 1959H2-1962: 64; 1963-1966: 65; 1967-1970: 66; "after 1970 may be higher" - not modelled, not mentioned.
  - Copy "kan stige yderligere for årgange fra 1975" is consistent with `§ 72 e` moving to 2030 (Ældresagen page says a regulation bill for those born 1975+ is due in 2030, *not confirmed in the statute text I read*).
- **Action:** Pass the real birth year when known; in age-only mode show a range when the two possible birth years straddle a boundary; add the two half-year rows; add efterløn row or state it is not covered; reference Lov nr. 703/2025 in the footnote.

### F14 - Insurance estimator is a naive income x years product (P2, effort S)
- **Evidence:** `insurance.js`: `round(householdIncome * years / 100000) * 100000`; defaults 10 years, max 40, no discounting. Test: 500,000 x 10 = 5,000,000. Labelled "Vejledende", "kun et overslag", "ikke rådgivning", "Annonce" (adequate). Problems: uses *household* income (the survivor's own income continues), no deduction of existing cover (employer/pension death cover), no discounting, and the CTA "Sammenlign livsforsikringer fra ~5.000.000 kr" reads like a price. I could not retrieve any official Danish multiple (Forsikring & Pension / Finanstilsynet searches returned none); one consumer site (Skagen) only states a possible cover range of 0-800% of annual salary, which is a range, not a norm.
- **Action:** Ask for the *deceased's share* of income and existing cover, add a discount rate or call it "uden diskontering"; CTA text "Overslag på dækningsbehov: ~X kr" before the button; label as illustrative in the number box.

### F15 - Data period is hard-coded in strings and will go stale silently (P3, effort S)
- **Evidence:** `dataSource: 'Danmarks Statistik (2024-2025)'` in the hook, "(Danmarks Statistik, 2024-2025)" in `Sandsynlighed.jsx` and `HomePage.jsx`, "tabel HISB8, period 2024:2025" in comments, README "(år 2024)". None is tied to the data file.
- **Consequence:** When the table is refreshed (next DST release 2027-02-12) the arrays can change while the copy still claims 2024-2025.
- **Action:** Export `period` and `retrieved` from the generated data module and interpolate them into all copy (Appendix D).

### F16 - DanmarkPage regional/socio-economic numbers are unsourced and partly wrong (P2, effort S)
- **Evidence (DST, 2024:2025, HISBR/LABY21):** total life expectancy Midtjylland 82.6, Hovedstaden 82.5, Syddanmark 81.9, Sjælland 81.5, Nordjylland 81.1 (DK 82.1). "Hovedstadsområdet: Højeste levetid i Danmark +2-3 år" is wrong: Hovedstaden is second and +0.4 above DK; the top-bottom region spread is 1.5 years. Municipal groups: capital 82.6, commuter 82.3, metropolitan 82.2, provincial 82.1, rural 81.0. Kommune level (HISBK 2021:2025): 78.6 (Lolland) to 84.1 (Gentofte, Lyngby-Taarbæk), a 5.5-year spread; men 76.0 vs 82.8 (Allerød), women 81.4 vs 85.8.
- **Education "+7 år":** consistent with DST LIGEHI4 2021:2025 *at age 30*: men primary 46.5 vs master's 54.6 remaining years (+8.1), women 50.7 vs 57.2 (+6.5). Must be described as an association at age 30, not an effect.
- **Income "+5 år":** Danish register study Kreiner, Nielsen, Serena, PNAS 2018 (PMID 30373814): P20 vs P80 gap 4.6 y (men) / 4.1 y (women) *before* adjusting for income mobility, "only half as big" after. The page presents the unadjusted figure as a plain gap.
- **Action:** Replace with the DST numbers above, cite DST table ids, add "forskelle i middellevetid, ikke effekt af bopæl". Also "Danmark har en af verdens højeste levetider" is unsourced: DK 2024 is below SE (82.3/85.3), NO (81.6/84.8) and CH in Eurostat.

### F17 - Smoking-prevalence claim is contradicted (P2, effort S)
Eurostat EHIS 2019 (`hlth_ehis_sk1e`, daily smokers, all age groups combined, updated 2024-01-03, `raw/eurostat_smoking_2019.json`): DK 12.9%, EU27 19.3%, DE 22.9, FR 18.5, NL 15.4, FI 10.7, NO 10.3, SE 7.4. "Danmark har stadig en højere rygefrekvens end mange andre vestlige lande" is false against the EU average; DK is higher only than SE/NO/FI. The "alkohol: højt forbrug" and "stillesiddende" bullets are unsourced (*not checked*).

### F18 - Alcohol guideline outdated; alcohol copy overstates benefit (P2, effort S)
`LivsstilPage` l.181-182 "Kvinder: Max 7 / Mænd: Max 14 genstande per uge". Sundhed.dk (Lægehåndbogen, fetched 2026-11-05): Sundhedsstyrelsen recommends adults 18+ drink at most **10 genstande per week and at most 4 on one day**, with no sex difference. (A Kræftens Bekæmpelse note surfaced in search says the 7/14 limits applied 2010-2022; not opened, *uncertain*). "Moderat alkoholforbrug kan have neutrale eller svagt positive effekter" is not supported by Wood 2018 for all-cause mortality (minimum at or below 100 g/week).

### F19 - LivsstilPage headline numbers: mixed support (P2, effort S)
Status of each number in Appendix B. Verified: "12-14 år" (Li 2018: 12.2 M / 14.0 F at age 50, US, 5 vs 0 low-risk factors), "80%" (CVD mortality HR 0.18 = 82% lower) and "~60%" (population attributable risk 60.7%, but that is a *share of deaths in a US cohort-based population*, not "faktorer der bestemmer din levetid"). Not supported: "50% reduktion i kræftrisiko" (the same paper: cancer *mortality* HR 0.35 = 65% lower), "3-7 år" motion, "2-8 år" kost (no source, partly consistent with Fadnes ranges), "stressmanagement 2-3 år", "1 pakke -7 år / 2 pakker -10 år" (no source verified; Doll 2004 and Jha 2013 give ~10 years for continuing smokers).

### F20 - "Japan (højest i verden)" label (P3, effort S)
World Bank WDI 2024 (retrieved 2026-11-05): men - Monaco 84.6, San Marino 84.3, Switzerland 82.7, Hong Kong 82.7, Sweden 82.6 ... Japan 81.09; women - Monaco 88.6, Hong Kong 88.2, San Marino 87.2, Japan 87.13. Japan is not highest for either sex. Use "Japan (blandt de højeste)" or pick the comparison set from data.

### F21 - ParMode "forventede år sammen" is ~0.5 year low (P3, effort S)
The code sums P(both alive at t) for t = 1..n (curtate expectation) while single-life e_x is the complete expectation. For 40M+40F: code 36.26 vs trapezoid 36.76; 70M+70F: 11.29 vs 11.79 (`raw/joint_check_output.json`). Add 0.5 or use the trapezoid rule. Independence assumption is stated in the UI (good).

### F22 - Test suite locks in stale values (P3, effort S)
`lifeTableDK.test.js` checks only a few DST values (good); `lifeExpectancyData.test.js` only checks structure and `female >= male`; `pension.test.js` has no half-year or boundary-date tests; nothing tests `calculateLifespan` (hook, `new Date()` inside). Add: fixed-clock tests with `now` injected (see 2.8), the hisb8 verification script in CI, and a staleness check (F26).

### F23 - Fun-fact constants are unsourced (P3, effort S)
70 bpm, 16,000 words/day, 17 blinks/min, 2.5 cups of coffee/day ("Danish average"), 7,000 steps. Acceptable as entertainment if labelled "cirka"; do not present as measurements. *Not checked against sources.*

### F24 - Enhancement: kommune and group pages from DST data (effort M-L)
See section 2.3. 94 kommuner with data (Christiansø, Ærø, Fanø, Samsø, Læsø suppressed), five-year period, men/women/total; plus 5 regions, 5 municipal groups, education at 30, family type at 50. Suitable for programmatic pages ("Levetid i Aarhus Kommune") if each page states that it is area-level life expectancy at birth and not a personal effect.

### F25 - Enhancement: healthy life years (effort M; unblocks issue #31)
Data is available (section 2.5). The two sources disagree by 6-10 years and in the sex direction; show one with its definition and never mix.

### F26 - Enhancement/hygiene: annual refresh and staleness guard (effort S-M)
Prototype scripts in `raw/` (verify_hisb8.py, intl_fetch.py, hly_fetch.py, cohort_projection.py). Procedure in Appendix D.

## 2. Evidence by task

### 2.1 DST HISB8 (task 1)
- Source: `https://api.statbank.dk/v1/tableinfo/HISB8` and POST `/v1/data` (variables ALDER 0-99, KØN M/K, TAVLE 1/3, Tid 2019:2020...2024:2025), retrieved 2026-11-05T12:59Z. `raw/hisb8_data.csv`, `raw/verify_hisb8.py`, `raw/verify_hisb8_output.json`.
- Result: 400/400 exact for 2024:2025 (remaining/male 100/100, remaining/female 100/100, survivors/male 100/100, survivors/female 100/100), max |dev| 0.0, best offset 0.
- Periods: 44 (1981:1982 ... 2024:2025). DST footnote: mortality is "the frequency of mortality over a year, from one birthday to the next". Other life-table tables: HISB9 (5-year periods 1901:1905-2021:2025), HISB7 (newborn, 1840:1849-2024:2025). DST release page `https://www.dst.dk/nyt/52702` (12 Feb 2026): "Middellevetiden har for første gang rundet de 80 år for begge køn med 80,3 år for mænd og 83,9 år for kvinder"; "Næste udgivelse: 12. februar 2027". The next period (2025:2026) is therefore expected on 2027-02-12 (inference: HISB8 was updated 2026-02-12 08:00, same day as that release).
- Interpolation: `remainingLifeExpectancy` is linear between integer ages; `age <= 0` -> e_0; `age >= 99` -> e_99 (1.84 M, 2.18 F), so ages 100+ get a constant tail (acceptable approximation, but "age + e_x" becomes meaningless above 110, F12). `survivalProbability` clamps l_x to l_99 (F10).
- Use of e_x: correct. HISB8 e_x is the expected remaining years at exact age x, so `age + e_x` is the expected age at death *conditional on being alive at x*. Not correct only in age-only mode where integer age is taken as exact (F12). Note `dataSource: 'Danmarks Statistik (2024-2025)'` is a hard-coded string that will not update with the data.

### 2.2 Period vs cohort (task 2)
Table in F09. Source: `https://api.statbank.dk/v1/tableinfo/FRDK426` ("Assumptions of mortality for the population projection 2026", 2026-2069, sex x age 0-109 x {q_x per 100,000, e_x}), updated 2026-06-12. Computation `raw/cohort_projection.py` -> `raw/cohort_projection_output.json`. Caveats: projection assumptions, not observations; cohort values beyond 2069 hold the 2069 mortality; trapezoid rule matches DST's e_x convention (check within 0.05). Recommendation and wording in F09.

### 2.3 Regional and socio-economic data (task 3)
| Table | Content | Latest period | Granularity |
|---|---|---|---|
| HISBR | Life expectancy at birth, 5 regions + DK, total/M/F | 2024:2025 | region |
| HISB77 | same, 11 landsdele ("provinces") + DK | 2024:2025 | landsdel |
| LABY21 | same, 5 municipal groups + DK | 2024:2025 | kommunegruppe |
| HISBK | same, 99 areas (98 kommuner + Christiansø) + DK, 5-year windows | 2021:2025 | kommune (94 with data) |
| LIGEHI4 | Remaining life expectancy at 30 by highest education, M/F | 2021:2025 | national, 7 levels |
| LIGEHI2 | Remaining life expectancy at 50 by family type, M/F | 2021:2025 | national |
| HISB7/HISB8/HISB9 | national tables | 2024:2025 | national |

Sample values (all retrieved 2026-11-05; raw in `raw/`): 
- Regions 2024:2025 total (M/F): Hovedstaden 82.5 (80.7/84.2), Sjælland 81.5 (79.8/83.1), Syddanmark 81.9 (79.8/83.9), Midtjylland 82.6 (80.9/84.3), Nordjylland 81.1 (79.0/83.3); DK 82.1 (80.3/83.9).
- Municipal groups 2024:2025 total (M/F): capital 82.6 (80.9/84.2), metropolitan 82.2 (80.4/84.0), provincial 82.1 (80.1/84.1), commuter 82.3 (80.7/84.0), rural 81.0 (79.1/83.0).
- Kommuner 2021:2025 total: lowest Lolland 78.6, Guldborgsund 79.4, Ishøj 79.7; highest Lyngby-Taarbæk 84.1, Gentofte 84.1, Rudersdal 83.9; DK 81.6.
- Education at 30, 2021:2025, remaining years men (total 50.4): primary 46.5, upper secondary 51.0, VET 50.6, short higher 52.7, bachelor-level 53.5, master's 54.6; women (total 54.0): 50.7, 54.4, 54.5, 56.1, 56.3, 57.2.
- Family type at 50, 2021:2025, men: couples 34.1, families (all) 31.3, single 26.4; women: couples 36.9, families 34.6, single 32.1.
- Income: no DST StatBank life-expectancy-by-income table found by keyword search on all 2,319 active tables (`raw/dst_life_tables_subset.json`). Danish register research: Kreiner et al., PNAS 2018 (F16). A Sundhedsstyrelsen 2014 report "Middellevetid i kommuner og bydele - Betydningen af rygning og alkohol" surfaced in search, *not opened*. No Sundhedsdatastyrelsen kommune table was found; DST's older "Dødsfald og middellevetid" statistics are marked as discontinued and built on Sundhedsdatastyrelsen data (search result, *not opened*).

### 2.4 International table (task 4)
The file has 12 countries + World (not 15); all are compared. It states no source or year. README claims "år 2024". Sources: Eurostat `demo_mlexpec` (age Y_LT1, updated 2026-09-25), World Bank WDI `SP.DYN.LE00.MA.IN`/`.FE.IN` (value year 2024, lastupdated 2026-10-08; source note: UN WPP, national statistical offices, Eurostat), WHO GHO `WHOSIS_000001` (2023; GHO modified 2026-10-01). UN WPP Data Portal API returned HTTP 401 without a token (*not retrieved*); search found no WPP 2026 revision (WPP 2024 is the latest edition).

| Country | Site M/F | Eurostat 2024 M/F | WB 2024 M/F | WHO 2023 M/F | Verdict |
|---|---|---|---|---|---|
| Denmark | 78.9/82.7 | 80.2/83.9 | 80.4/84.2 | 80.4/83.9 | stale (DST 80.3/83.9): -1.4/-1.2 |
| Sweden | 80.8/84.3 | 82.3/85.3 | 82.6/85.6 | 81.4/84.4 | stale -1.5/-1.0 |
| Norway | 80.5/84.2 | 81.6/84.8 | 81.6/84.8 | 81.3/84.1 | stale -1.1/-0.6 |
| Germany | 78.6/83.4 | 78.9/83.5 | 78.5/83.2 | 78.8/83.2 | ok |
| United Kingdom | 79.4/83.1 | n/a | 79.5/83.3 | 78.9/82.6 | ok |
| United States | 76.3/81.4 | n/a | 76.5/81.4 | 76.2/80.9 | ok |
| France | 79.7/85.6 | 80.2/85.8 | 80.2/85.9 | 79.9/85.0 | men -0.5 |
| Netherlands | 80.2/83.9 | 80.5/83.3 | 80.6/83.4 | 80.2/83.0 | women +0.6 |
| Finland | 78.7/84.5 | 79.6/84.8 | 79.8/85.0 | 78.7/83.5 | men -0.9 |
| Iceland | 81.3/84.1 | 81.1/84.5 | 81.2/84.5 | 80.4/83.3 | ok |
| Switzerland | 81.9/85.6 | 82.4/85.9 | 82.7/86.2 | 82.2/85.4 | -0.5/-0.3 |
| Japan | 81.6/87.7 | n/a | 81.09/87.13 | 81.2/86.5 | overstated +0.5/+0.6 |
| World | 72.6/77.1 | n/a | 71.1/76.0 | n/a | overstated +1.5/+1.1 |

Files: `raw/intl_compare.csv`, `raw/intl_eurostat.json`, `raw/intl_worldbank.json`, `raw/intl_who.json`. WB 2024 values may be partly estimated (*uncertain*); WHO is a year behind and modelled.
**Recommended single source:** World Bank WDI API (keyless, one endpoint family, all 13 rows, annual), with Eurostat as an automatic cross-check (warn if |difference| > 0.5), and Denmark always taken from DST. Update procedure: `raw/intl_fetch.py` (prototype), see Appendix D.

### 2.5 Healthy life years (task 5)
Eurostat `hlth_hlye` (updated 2026-07-17), latest year 2024, unit years (`raw/hly_eurostat_latest.csv`):
- Denmark HLY at birth: men 63.5, women 61.2, total 62.4 (EU27: 64.8 / 65.5 / 65.2; Sweden 68.9 / 66.0; Norway 67.0 / 62.3).
- Denmark HLY at 50: men 20.3, women 20.6. At 65: men 10.7, women 11.8, total 11.3 (EU27 10.0 / 10.5). Life expectancy at 65 in the same dataset: men 18.7, women 21.3.
- WHO GHO HALE (WHOSIS_000002 / 000007), Denmark 2023 (`raw/who_WHOSIS_00000*_DNK.json`): at birth men 69.8 [66.3-72.8], women 70.9 [66.7-74.4], total 70.3; at 60 men 17.4 [15.7-19], women 19.0 [17-20.8].
- The two sources differ by 6-10 years at birth and Eurostat shows women with *fewer* healthy years at birth while WHO shows more. Eurostat HLY is based on self-reported activity limitation in EU-SILC (from general knowledge, not re-verified this session); WHO HALE is modelled. Recommendation: use Eurostat (official, annual, sex-specific, EU comparable) for "sunde leveår ved 65", display "Eurostat/EU-SILC, selvrapporteret", and do not combine with the DST life table beyond showing the ratio at 65.

### 2.6 Lifestyle model (task 6)
See Appendix A (factor table), F03-F06, Appendix B (copy), Appendix C (disclaimer).

### 2.7 Pension and insurance (task 7)
F13, F14. Comparison table in F13. All statutory numbers retrieved from borger.dk and Lovtidende A on 2026-11-05.

### 2.8 Expected outputs for regression tests (task 8)
Computed with the real modules; the hook math is a transcription with `now` injected = **2026-11-05 12:00 Europe/Copenhagen** (`raw/run_regression_values.mjs`, output `raw/regression_values_output.json`, run with `TZ=Europe/Copenhagen`). The real hook calls `new Date()` and `calculatePreciseAge(birthdate)` without a `now` argument, so tests must mock time or the hook must accept `now`. `new Date('1985-06-15')` is parsed as UTC midnight (02:00 local in summer): results near midnight are time-zone sensitive.

| | male 40 | female 65 | male born 1985-06-15 |
|---|---|---|---|
| exact age used | 40.00 | 65.00 | 41.39 (15,118 days; "41 år, 4 mdr, 21 dage") |
| e_x (remainingBase) | 41.23 | 21.39 | 39.8909 |
| remainingYears / adjustedLifeExpectancy | 41.2 / 81.2 | 21.4 / 86.4 | 39.9 / 81.3 |
| endDate (da-DK) | 5.11.2067 | 5.11.2047 | 25.9.2066 |
| remainingDays | 14,974 (bug F11: 15,059 expected) | 7,669 (7,812 expected) | 14,568 |
| countdown | 40 y 364 d 12 h | 20 y 364 d 12 h | 39 y 323 d 13 h |
| lifePercentage | 49.2 | 75.2 | 50.9 |
| daysLived | 14,610 | 23,741 | 15,118 |
| Sandsynlighed 80/90/95/100 | 62/23/7/1 % | 77/38/15/4 % | 62/23/7/1 % |
| Sammenlign (stale file) | 81.2 vs 78.9, "over 2.3" | 86.4 vs 82.7, "over 3.7" | 81.3 vs 78.9, "over 2.4" |
| Pension: birthYear / age / working yrs / retirement yrs | 1986 / 70 / 30 / 11 | 1961 / 67 / 2 / 19 | 1985 / 70 / 29 / 11 |

Expected changes after the fixes (computed in `raw/postfix_values.mjs`): F11 end dates become 28.1.2068 (male 40) and 26.3.2048 (female 65); F10 with l_100 = 819 (M) / 2,699 (F) gives P(100) = 0.83% (male 40, shown as 1%), 2.9% (female 65, shown as 3% instead of 4%) and 0.83% (male b. 1985); Sammenlign's Danish reference becomes 80.3/83.9 or the bar is removed (F01, F02). All other values in the table are unaffected.

## Appendix A - Lifestyle factors: claimed effect, source, evidence-based proposal

Reference for all proposals = the stated comparison group in the paper; convert to "relative to the Danish average" by subtracting the prevalence-weighted mean effect (needs Danish prevalence from Den Nationale Sundhedsprofil, *not retrieved*). HR-to-years conversions use `raw/hr_to_years_output.json` (HR 1.5 = -3.4 to -3.7 y at ages 30-50; HR 2 = -5.9 to -6.4; HR 3 = -9.2 to -10.3; shrinking with age).

| Factor | Site options (years) | Site source | Evidence (verified via Europe PMC records) | Proposed effect (range) |
|---|---|---|---|---|
| Rygning | 0 / -5 / -10 | Doll & Peto 2004 BMJ, PMID 15213107, doi 10.1136/bmj.38142.554479.ae: continuing smokers died ~10 y younger; cessation at 60/50/40/30 gained ~3/6/9/10 y | Jha 2013 NEJM, PMID 23343063, doi 10.1056/nejmsa1211128: HR 2.8 (M)/3.0 (W); life expectancy shortened by > 10 y; quit at 25-34/35-44/45-54 gained ~10/9/6 y; cessation before 40 cuts excess risk ~90%. Pirie 2013 Lancet, PMID 23107252, doi 10.1016/s0140-6736(12)61720-6: rate ratio 2.76; 11-year difference; < 10/day RR 1.98. Inoue-Choi 2017 JAMA Intern Med, PMID 27918784, doi 10.1001/jamainternmed.2016.7511: 1-10 cigarettes/day HR 1.87 | Current ≥10/day -10 (-8 to -12) vs never-smoker; 1-10/day -6 (-4 to -7); add "Tidligere ryger" with quit-age rule (stopped < 40: about -1; 40-50: -3 to -4). Scale by age via HR. |
| Motion | 0 / +2 / +4 / +6 | Moore 2012 PLoS Med, PMID 23139642, doi 10.1371/journal.pmed.1001335 | Moore: vs inactive, 0.1-3.74 MET-h/wk +1.8 (1.6-2.0); 3.75-7.4 +2.5 (2.2-2.7); 7.5-14.9 +3.4 (3.2-3.6); 22.5+ +4.5 (4.3-4.7). Arem 2015 JAMA Intern Med, PMID 25844730, doi 10.1001/jamainternmed.2015.0533: HR 0.80/0.69/0.63/0.61, no harm at 10x | 0 / +2 / +3.5 / +4.5 (cap), vs inactive; label "ca. 150 min/uge giver ca. 3,4 år" |
| Kost | -2 / 0 / +3 / +5 | Fadnes 2022 PLoS Med, PMID 35134067, doi 10.1371/journal.pmed.1003889 | Model study: typical -> optimised from age 20: +10.7 (W) / +13.0 (M); feasible diet +6.2 (3.5-8.1) W / +7.3 (4.7-9.5) M; from age 60: +8.0 W / +8.8 M; age 80: +3.4. Evidence quality "moderate" (NutriGrade) | Meget sund +5 (3 to 9, age-dependent), Sund +3; drop "Usund -2" (Fadnes gives no negative arm). Label "modelberegning". |
| Alkohol | 0 / -1 / -3 / -6 | Wood 2018 Lancet, PMID 29676281, doi 10.1016/s0140-6736(18)30134-x | Lowest risk ≤ ~100 g/wk; LE at 40 lower by ~6 months (>100-200 g), 1-2 y (>200-350 g), 4-5 y (>350 g) vs ≤100 g | ≤8 genstande/uge 0; 9-16: -0.5; 17-29: -1.5 (-1 to -2); 30+: -4.5 (-4 to -5). Genstand = 12 g ethanol (*Danish standard, not retrieved this session; verify*). Align with Sundhedsstyrelsen 10/uge. |
| BMI | -2 / +2 / -1 / -4 | PSC 2009 Lancet, PMID 19299006, doi 10.1016/s0140-6736(09)60318-4 | PSC: BMI 30-35 median survival -2 to -4 y; 40-45 -8 to -10 y. Global BMI Mortality Collaboration 2016 Lancet, PMID 27423262, doi 10.1016/s0140-6736(16)30175-1: HR vs 22.5-25: 15-18.5 1.51; 25-27.5 1.07; 27.5-30 1.20; 30-35 1.45; 35-40 1.94; 40-60 2.76 | Overvægt -1 (-0.5 to -1.5); Fedme I -3 (-2 to -4); Fedme II -5.5; Fedme III -9 (-8 to -10); Undervægt -3 (confounded). Add the grades. |
| Social | +4 / +2 / -1 / -3 | Holt-Lunstad 2010 PLoS Med, PMID 20668659, doi 10.1371/journal.pmed.1000316 | OR 1.50 (1.42-1.59) survival, 148 studies; complex integration OR 1.91; living alone OR 1.19 (0.99-1.44) | Spread strong vs isolated ~ 3.5 y: Isoleret -3 (-1.5 to -4), Begrænset -1, Moderat 0, Stærkt +1 (relative to average). Observational. |
| Søvn | -2 / -1 / +2 / 0 | none | Cappuccio 2010 Sleep, PMID 20469800, doi 10.1093/sleep/33.5.585: short RR 1.12 (1.06-1.18), long RR 1.30 (1.22-1.38). Yin 2017 J Am Heart Assoc, PMID 28889101, doi 10.1161/jaha.117.005947: minimum ~7 h; RR 1.06/h below, 1.13/h above | <5 h -1.5 (-0.5 to -2); 5-6 h -1; 7-8 h 0; 9+ h -2 (-1.5 to -3; likely partly reverse causation). |
| Stress | +2 / 0 / -2 / -4 | none | Kivimäki 2012 Lancet, PMID 22981903, doi 10.1016/s0140-6736(12)60994-5: job strain HR 1.23 (1.10-1.37) for incident CHD; PAR 3.4% | No evidence for years. Remove from the sum or ≤ -0.5 with "svag evidens". |
| Mental sundhed | +2 / 0 / -2 / -3 | none | Plana-Ripoll 2019 Lancet, PMID 31668728, doi 10.1016/s0140-6736(19)32316-5 (Danish register, n=7.37M): mood disorders MRR 1.92; excess years of life lost 5.4 (organic, women) to 14.8 (substance use, men). Walker 2015 JAMA Psychiatry, PMID 25671328, doi 10.1001/jamapsychiatry.2014.2502: median 10 y lost | Rename to "Diagnosticeret psykisk lidelse"; -5 (range -4 to -10) is closer to Danish register data than -2/-3. Sensitive: consider a text-only hint instead of a number. |
| Sundhedstilstand | 0 / -2 / -5 | none | no suitable source retrieved | Remove (prognosis of known disease is not a lifestyle input). |
| Arbejdsmiljø | +1 / 0 / -1 / -2 | none | none | Remove. |
| Boligområde | +1 / -1 / -2 | none | DST LABY21 contradicts the sign (rural lowest). Air pollution paper (Apte 2015) not found in Europe PMC; *not verified* | Remove, or show DST kommunegruppe average as information only. |
| Uddannelse | -1 / 0 / +1 / +3 | none | DST LIGEHI4 2021:2025 at age 30: +8.1 (M), +6.5 (W) primary -> master's (raw association) | Keep only as information, or ~half the raw gap if kept in the sum (mediated by smoking/BMI). |
| Indkomst | +2 / 0 / -2 / -3 | none | Kreiner 2018 PNAS, PMID 30373814, doi 10.1073/pnas.1811455115: DK P20-P80 gap 4.6 (M)/4.1 (W) y unadjusted, about half adjusted. Chetty 2016 JAMA, PMID 27063997, doi 10.1001/jama.2016.4226 (US): top 1% vs bottom 1% 14.6 (M)/10.1 (W) y | Information only; overlaps education. |
| Transport | +1 / 0 / -1 | none | Celis-Morales 2017 BMJ, PMID 28424154, doi 10.1136/bmj.j1456 (UK Biobank): cycle commuting all-cause HR 0.59 (0.42-0.83), walking not significant for all-cause | Merge into "Motion" (double counts). Remove "lang pendling -1". |
| Skærmtid | +1 / 0 / -1 / -2 | none | Ekelund 2016 Lancet, PMID 27475271, doi 10.1016/s0140-6736(16)30370-1 concerns sitting time and its attenuation by activity; no screen-time life-expectancy estimate retrieved | Remove. |

Combined: Li 2018 Circulation, PMID 29712712, doi 10.1161/circulationaha.117.032047 (NHS + HPFS, n = 78,865 + 44,354; low-risk factors: never smoking, BMI 18.5-24.9, ≥ 30 min/d moderate-vigorous activity, moderate alcohol, top-40% diet): HR 0.26 all-cause, 0.35 cancer, 0.18 CVD for 5 vs 0; PAR 60.7%; life expectancy at 50 longer by 14.0 y (11.8-16.2) women, 12.2 y (10.1-14.2) men. Use as the calibration target for the combined model. Note: Moore's joint analysis (active and normal weight vs inactive and obese) gives 7.2 y (6.5-7.9).

Heritability caveat for the "60% livsstil" sentence: Ruby et al., Genetics 2018 (PMID 30401766) report life-span heritability estimates "consistently low (~15-30%)" and, after accounting for assortative mating, lower (abstract text beyond that not retrieved).

## Appendix B - Unsourced or contradicted claims and proposed Danish wording

| # | Where | Current text | Status | Proposed Danish wording |
|---|---|---|---|---|
| 1 | LivsstilPage l.49 | "Forskning viser, at livsstil udgør op til 60% af de faktorer, der bestemmer din levetid." | misquotes Li 2018 PAR | "I store amerikanske opfølgningsstudier kunne omkring 60 % af dødsfaldene tilskrives, at man ikke fulgte fem sunde levevaner (Li m.fl., Circulation 2018). Tallet gælder en befolkning, ikke dig." |
| 2 | LivsstilPage l.63 | "Regelmæssig motion kan tilføje 3-7 år til dit liv. Bare 150 minutter ... reducerer risikoen ... betydeligt." | top end unsupported | "I en samlet analyse af seks store kohortestudier levede personer med ca. 150 minutters aktivitet om ugen i gennemsnit ca. 3,4 år længere end inaktive; selv under 75 minutter om ugen var forbundet med ca. 1,8 flere leveår (Moore m.fl., PLoS Medicine 2012). Det er statistiske sammenhænge." |
| 3 | LivsstilPage l.85 | "En sund kost kan forlænge livet med 2-8 år. Den mediterrane kost er den mest dokumenterede ..." | partly supported; "mest dokumenteret" unsourced | "En modelberegning viser, at en varig omlægning til mere bælgfrugter, fuldkorn og nødder og mindre forarbejdet kød kan give omkring 3-10 flere leveår, mest hvis man starter ung (Fadnes m.fl., PLoS Medicine 2022). Det er en modelberegning, ikke et forsøg." |
| 4 | LivsstilPage l.107 | "7-9 timers kvalitetssøvn er essentielt ... Kronisk søvnmangel øger risikoen for ... tidlig død." | partly supported | "Både meget kort og meget lang søvn er i store oversigtsstudier forbundet med lidt højere dødelighed, og risikoen er lavest ved omkring 7 timer (Yin m.fl. 2017; Cappuccio m.fl. 2010). En del af sammenhængen kan skyldes, at sygdom påvirker søvnen." |
| 5 | LivsstilPage l.131 | "...forkorter livet mest - op til 10 år." | supported | "Rygere mister i gennemsnit mindst 10 leveår sammenlignet med aldrig-rygere (Jha m.fl., NEJM 2013)." |
| 6 | l.137-138 | "1 pakke om dagen: -7 år ... 2 pakker: -10 år" | no source verified | "Også 1-10 cigaretter om dagen næsten fordobler dødeligheden (Pirie m.fl., Lancet 2013)." |
| 7 | l.139-140 | "Stop før 30 år: fuld levetidsgenopretning / Stop før 50 år: halverer overdødelighed" | roughly supported | "Hvis man stopper før 40 år, undgår man omkring 90 % af den ekstra dødelighed (Jha 2013). I en britisk lægeundersøgelse genvandt mænd, der stoppede som 30-årige, ca. 10 leveår og som 50-årige ca. 6 (Doll m.fl., BMJ 2004)." |
| 8 | l.154 | "Stressmanagement kan tilføje 2-3 år til dit liv." | unsupported | "Langvarig stress på arbejdet er forbundet med en let forhøjet risiko for hjertesygdom (ca. 23 % højere i en stor europæisk analyse, Kivimäki m.fl., Lancet 2012), men der findes ikke solid dokumentation for et bestemt antal leveår ved stresshåndtering." |
| 9 | l.175 | "Moderat alkoholforbrug kan have neutrale eller svagt positive effekter" | not supported for all-cause | "Risikoen for tidlig død er lavest ved lavt forbrug og stiger derefter; ved 200-350 g alkohol om ugen (ca. 17-29 genstande) er forventet levetid ved 40 år ca. 1-2 år kortere (Wood m.fl., Lancet 2018)." |
| 10 | l.181-182 | "Kvinder: Max 7 / Mænd: Max 14 genstande" | outdated | "Sundhedsstyrelsen anbefaler højst 10 genstande om ugen og højst 4 på samme dag, for både kvinder og mænd." |
| 11 | l.197-199, 204 | "...lever 12-14 år længere end dem, der ikke følger nogen af dem." | supported (Li 2018) but over-generalised | "I et amerikansk studie af ca. 123.000 sundhedsprofessionelle havde 50-årige, der levede efter alle fem sunde levevaner (ikke-rygning, normalvægt, 30 minutters motion dagligt, moderat alkohol, sund kost), en forventet restlevetid, der var 12,2 år (mænd) og 14,0 år (kvinder) længere end dem uden nogen af dem (Li m.fl., Circulation 2018)." |
| 12 | l.208, 212 | "80% reduktion i hjertesygdomme / 50% reduktion i kræftrisiko" | wrong numbers/endpoints | "Samme studie: ca. 82 % lavere dødelighed af hjerte-kar-sygdom og ca. 65 % lavere kræftdødelighed ved fem mod ingen sunde levevaner." |
| 13 | DanmarkPage l.114 | "Danmark har stadig en højere rygefrekvens end mange andre vestlige lande" | contradicted | "I 2019 røg 12,9 % af danskerne dagligt mod 19,3 % i EU, men flere end i Sverige (7,4 %), Norge (10,3 %) og Finland (10,7 %) (Eurostat, EHIS)." |
| 14 | l.170-172 | "Hovedstadsområdet: Højeste levetid i Danmark +2-3 år" | wrong | "Middellevetiden var i 2024-2025 højest i Region Midtjylland (82,6 år) og Region Hovedstaden (82,5) og lavest i Region Nordjylland (81,1) (Danmarks Statistik). Mellem kommuner er forskellen over 5 år." |
| 15 | l.178-180 | "Uddannelse: Længere uddannelse = længere liv +7 år" | association, ok order of magnitude | "30-årige mænd med lang videregående uddannelse har ca. 8 år mere tilbage end dem med grundskole, kvinder ca. 6,5 år (Danmarks Statistik 2021-2025). Forskellen skyldes ikke kun uddannelsen." |
| 16 | l.186-188 | "Indkomst: Højere indkomst = bedre sundhed +5 år" | unadjusted | "Forskellen i middellevetid mellem personer ved 20. og 80. indkomstpercentil er ca. 4,6 år for mænd og 4,1 for kvinder, men halvt så stor, når man tager højde for, at folk skifter indkomstgruppe (Kreiner m.fl., PNAS 2018)." |
| 17 | DanmarkPage l.49 | "Danmark har en af verdens højeste levetider" | unsourced | "Middellevetiden i Danmark er over EU-gennemsnittet for mænd, men lavere end i fx Sverige og Norge (Eurostat 2024)." |
| 18 | DodsalderPage l.64 / HomePage l.213 / Footer | "statistikker fra WHO og nationale sundhedsmyndigheder" | false | "Vi bruger danske dødelighedstavler fra Danmarks Statistik (tabel HISB8, 2024-2025)." |
| 19 | HvorLangTidPage l.50 | "...justeret for din alder, køn og geografiske placering." | false | "...beregnet ud fra din alder og dit køn." |
| 20 | KropsAlder l.21-24 | "Din livsstil svarer til en krop, der er ~X år yngre 🎉" | causal/biological claim | "Ud fra de valg, du har lavet, svarer din statistiske dødelighedsrisiko til en gennemsnitsdansker på ca. X år (du er Y). Det er et statistisk billede, ikke en måling af din krop." |
| 21 | HomePage l.1317 | "Individuelle faktorer påvirker ikke beregningen" | contradicts advanced mode | "I enkel tilstand bruger beregningen kun alder og køn. I avanceret tilstand indgår dine livsstilsvalg som vejledende justeringer." |
| 22 | Sammenlign verdict | "Du ligger ca. X år over det danske gennemsnit" | misleading (F01) | "Dine livsstilsvalg ændrer dit estimat med X år i forhold til en gennemsnitsdansker på din alder." |
| 23 | Pension l.72 | "Folkepensionsalderen er lovbestemt og kan stige yderligere for årgange fra 1975." | acceptable, imprecise | "Folkepensionsalderen er 70 år for alle født efter 31. december 1970 (lov nr. 703 af 20. juni 2025). Næste regulering behandles i 2030 og kan påvirke yngre årgange." |
| 24 | Forsikringsbehov CTA | "Sammenlign livsforsikringer fra ~X kr →" | reads like a price | "Sammenlign livsforsikringer (overslag på dækningsbehov: ~X kr) →" |
| 25 | Footer l.89 | "Data baseret på WHO og nationale statistikker. Opdateret 2024." | false/stale | "Dødelighedstavler: Danmarks Statistik, HISB8, perioden 2024-2025 (opdateret 12. februar 2026). Landesammenligning: Eurostat og Verdensbanken, [år]." |
| 26 | SEOHead JSON-LD | `applicationCategory: HealthApplication` | questionable for an entertainment calculator | `UtilitiesApplication` or `LifestyleApplication` (*schema.org values not re-verified here*). |

## Appendix C - Improved Danish disclaimer (draft)

> **Om tallene**
> Det her er statistik, ikke en prognose for dig. Beregningen bygger på Danmarks Statistiks dødelighedstavler for 2024-2025 (tabel HISB8) og viser, hvor mange år en gennemsnitlig dansker af dit køn og din alder har tilbage, hvis dødeligheden forbliver som i 2024-2025. Hvis dødeligheden fortsætter med at falde, bliver det faktiske tal for nutidens børn og unge højere.
>
> I avanceret tilstand justeres estimatet med dine livsstilsvalg. Justeringerne er vejledende skøn baseret på store befolkningsstudier. De viser sammenhænge, ikke at en enkelt ændring giver et bestemt antal år, og de overlapper hinanden. Brug dem til at se retning og størrelsesorden.
>
> Værktøjet er ikke medicinsk rådgivning og kan ikke vurdere din sundhedstilstand. Tal med din læge, hvis du er bekymret for dit helbred eller vil ændre din livsstil markant. Resultatet er til information og refleksion.
>
> **Kilder:** Danmarks Statistik (HISB8, opdateret 12. februar 2026), Eurostat, Verdensbanken, [liste over studier].
>
> **Dine data:** *(variant A, hvis Plausible-props fjernes)* Dine indtastninger bliver i din browser og sendes ikke til en server. Vi bruger anonym besøgsstatistik uden cookies. *(variant B, nuværende adfærd)* Beregningen sker i din browser. Vi registrerer anonymt, at en beregning er udført, og alder og køn indgår i den anonyme statistik. Din historik gemmes kun lokalt i din browser.

The claim "uden cookies" and the choice of variant must be confirmed against the actual Plausible configuration and `Historik.jsx`/localStorage use before publishing.

## Appendix D - Annual refresh procedure (re-runnable)

1. `scripts/refresh-data.mjs` (Node 20+ `fetch`, no dependencies):
   - DST: GET `tableinfo/HISB8`, take the last `Tid` value, POST `/v1/data` for ALDER 0-99 (add q_99 so l_100 can be derived), KØN M/K, TAVLE 1/2/3; also HISB7 for the headline. Validate: 100 values per series, l_x non-increasing, e_x non-increasing from age 1, |e_x recomputed from l_x - e_x| < 0.05. Emit `src/data/lifeTableDK.generated.js` with `{ period, tableUpdated, retrieved }`.
   - Projection: FRDK426 -> precomputed cohort e_x (100 ages x 2 sexes) with the `hold after last year` rule documented.
   - Countries: World Bank WDI for the 13 rows with year; Eurostat demo_mlexpec cross-check (warn above 0.5 year); fail if a year is older than the previous run.
   - Healthy life years: Eurostat hlth_hlye, indicators `HLY_Y0`, `HLY_Y65`, `LE_Y65`.
2. Schedule: DST HISB8 next release 2027-02-12 (check 2027-02-15 and again in March); Eurostat demo_mlexpec last updated 2026-09-25 and World Bank 2026-10-08, so run in October/November.
3. CI guard (scheduled, not on PRs): compare `period` in the generated file to `tableinfo.variables[Tid].values.at(-1)`; fail with a GitHub issue "Opdatér dødelighedstavle" when newer.
4. The repo's `dataSource` string and all "2024-2025" copy should read from the generated `period`.
5. Prototypes: `raw/verify_hisb8.py` (400-value comparison), `raw/intl_fetch.py`, `raw/hly_fetch.py`, `raw/cohort_projection.py`, `raw/dst_fetch.py`.

## Appendix E - Candidate GitHub issues

1. Compare like with like in "Sammenlign"; drop the "Dig vs. fødsels-middellevetid" bars (F01)
2. Replace `lifeExpectancyData.js` with generated, sourced, dated data and fix DanmarkPage numbers (F02, F20)
3. Hazard-ratio lifestyle model with age-scaling, reference normalisation and overlap handling (F03; extends #23)
4. Recalibrate or remove lifestyle factors per evidence table; show ranges and sources (F04, F05)
5. Replace "biologisk alder" with a hazard-based "statistisk risikoalder" and reword (F06)
6. Correct provenance/privacy/location copy (WHO, IP-lokation, geografisk placering, disclaimer contradiction) and remove or implement "Brug min placering" (F07, F08)
7. Add period-vs-projected life expectancy (DST FRDK426) with explanatory wording (F09)
8. Extend survivors table to l_100 and fix "chance to reach 100" (F10)
9. Fix fractional-year truncation in age-only end date; use age + 0.5 for integer ages; cap input at 110 (F11, F12)
10. Pension: use true birth year, add half-year cohorts, reference Lov 703/2025, decide on efterløn (F13)
11. Insurance estimator: deductions, discounting, clearer CTA text (F14)
12. DanmarkPage claim audit: regional, education, income, smoking, alcohol guideline numbers from DST/Eurostat/Sundhedsstyrelsen (F16-F19)
13. Kommune/region pages from DST HISBK/HISBR/LABY21 (programmatic SEO) (F24)
14. Healthy life years section using Eurostat hlth_hlye (+ WHO HALE caveat) (F25; unblocks #31)
15. Annual data refresh script and staleness CI check (F26)
16. Inject `now` into `calculateLifespan`/hook and add fixed-clock regression tests with the values in 2.8 (F22)
17. ParMode: complete (not curtate) expectation for joint years (F21)
