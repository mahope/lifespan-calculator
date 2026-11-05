# Recalibrate the lifestyle coefficients to their sources (#93)

Pull request description, kept in the repo so the numbers can be checked later.

## What changes

- Every answer in the advanced questionnaire now carries `years`: the effect in
  life years, taken from the source named in `src/utils/lifestyleFactors.js`
  (`source.cite`, `source.pmid`, `source.figure`, `source.range`). The helper text
  under each factor shows the source's own figure and range, the evidence grade
  and "Sammenhæng, ikke garanti.", plus one "Se kilden" link per cited paper.
- Eight factors have no defensible effect size in life years. They are still asked
  but marked `inSum: false` ("påvirker ikke beregningen") and never change the estimate.
- The stored answer (`value`, also the number packed into a share link) is no
  longer the years. Years are looked up in the table. `0` is always neutral.
- The sum is rounded to one decimal, half away from zero (+8.75 -> +8.8 and
  -8.75 -> -8.8). It used to be rounded to whole years, which turned +4.5 into +5,
  above its own source. Lifestyle years and the remaining years are shown with a
  decimal comma.
- With no choices made the lifestyle effect is exactly 0 and "Hvad hvis?" shows
  delta 0 (it compares like with like instead of against the rounded display).

## Old to new

Raw sum = sum of the years of the chosen answers. Bounded = after the soft cap
(full credit up to +-8, then 30 %, hard caps +12 / -15). Displayed = what the
result card shows (old: whole years; new: one decimal). The last column is the
change in expected age at death for a man of that age (the age only matters
through the "remaining years never below 0" rule, so it is the same at 30, 50 and 70).

| Scenario | Old raw | Old bounded | Old displayed | New raw | New bounded | New displayed |
|---|---|---|---|---|---|---|
| All best answers | +32 | +12.00 | +12 | +10.5 | +8.75 | +8.8 |
| All worst answers | -50 | -15.00 | -15 | -33.5 | -15.00 | -15 |
| Smoker 10+/day, age 30 | -10 | -8.60 | -9 | -10 | -8.60 | -8.6 |
| Smoker 10+/day, age 50 | -10 | -8.60 | -9 | -10 | -8.60 | -8.6 |
| Smoker 10+/day, age 70 | -10 | -8.60 | -9 | -10 | -8.60 | -8.6 |

"All best / all worst" take the most favourable / least favourable answer of
every factor. In the new table only the eight factors below count, so the old
sum of 16 factors (+32 / -50) drops to +10.5 / -33.5; the old +12 and -15 caps
were reached by factors that had no source. Heavy smoking stays at -10 raw
(Jha 2013: at least 10 years lost), so the only change there is the decimal.

Snapshot `advanced two factors` (male, age 50, the only case that changed; the
five zero-lifestyle cases are identical to master's snapshot):

| | Master | Now |
|---|---|---|
| Answers | smoking -3, exercise 2 | smoking -5 (light, -6 y), exercise 2 (+2 y) |
| Lifestyle impact | -1 | -4 |
| Remaining years | 30.3 | 27.3 |
| Expected age at death | 80.8 | 77.8 |

`smoking: -3` is not an answer the questionnaire ever offered (old options were
0, -5, -10), so the test now uses the light-smoker answer. The same answers on the
old table (-5 = -5 y, +2) would have given -3; the new -6 y for 1-10 cigarettes/day
(Pirie 2013/Jha 2013, "almost double mortality") explains the further -1.

Counting factors (`inSum: true`): smoking, exercise, diet, alcohol, sleep, BMI,
social network, diagnosed mental illness.

## Factors that no longer count (`inSum: false`) and the open question

stress, health condition, work environment, area (environment), education,
income, commute, screen time. No source in the evidence table gives
their effect in life years (stress: only HR 1.23 for heart disease; health
condition: prognosis, not a lifestyle choice). They are still asked and still
shown with source text where one exists.

**Open question for the owner: keep or remove the eight UI blocks?**

- Keep: the questions give the visitor context and a reason to read the helper
  text, and they can start counting if a source with years turns up. Cost: eight
  questions that do nothing to the number, which can feel like a bait question.
- Remove: shorter form, and every question changes the result. Cost: the data
  and the share-link positions of the eight keys must be retired (`lf` has one
  slot per key, so removing keys invalidates all old links with a lifestyle part).

**Mental health: consider text-only.** It is the one factor that counts and is
the most sensitive. It ships as -5 years for a diagnosed mental illness, with a
source range of -4 to -10 (Plana-Ripoll 2019 range 5.4-14.8, median about 10), but
there is no documented decision why -5 rather than the median. Options: (a)
keep it counting as -5 and write down why that value and not the median; (b) make it text-only
(`inSum: false`): show the figure without changing the estimate, which avoids a
visitor receiving a lower number because of a diagnosis. Not decided here.

## Removed options and suggestions, and why

| Factor | Removed | Why |
|---|---|---|
| Diet | "Usund" (-2) | The source (Fadnes 2022) quantifies the gain from moving to a healthier diet, not a loss from an "unhealthy" one; the reference is the typical diet ("Gennemsnitlig"). |
| Alcohol | Let 1-7/week (-1), Moderat 8-14 (-3), Kraftig 15+ (-6) | Replaced by the source's own bands. Up to about 8 drinks/week is the reference (0); 9-16 -0.5, 17-29 -1.5, 30+ -4.5 years (Wood 2018). The old levels did not match any band and the old "Ingen" was not better than the reference. |
| Sleep | 7-8 hours was +2, 9+ was 0 | 7-8 hours is now the reference (0). <5 h -1.5, 5-6 h -1, 9+ h -2 (Cappuccio 2010, Yin 2017); 9+ is partly reverse causation, so it is not offered as advice. |
| BMI | Normal was +2, "Svært overvægtig (30+)" -4, decimal points in the labels | Normal is the reference (0). Obesity is split into grades I-III (-3, -5.5, -9) from the Global BMI Mortality Collaboration. |
| Social | Moderat was +2 | Moderate is the reference (0); strong +1, limited -1, isolated -3 (Holt-Lunstad 2010). |
| Mental | "Meget god" (+2), "God" (0), "Depression/angst" (-2), "Alvorlige problemer" (-3) | The self-rated levels had no source. One question remains: diagnosed mental illness, with the register-based figures. |
| Smoking | New answers added, not removed | Former smokers (stopped before 40 / 40-49 / 50+: -1 / -2.5 / -5) from Jha 2013. |
| Coaching and "Hvad hvis?" | Suggestions for stress, mental health, commute, work environment, area and screen time | None of them counts in the estimate any more, so a suggestion would promise years the calculation does not give. Suggestions stay for smoking (not for former smokers), exercise, diet, alcohol, BMI, social network and sleep (not for 9+ hours). |

## Old share links

`lf` is a positional list of answer ids. Links made before this change still work
when every id exists, but the meaning of some ids moved (alcohol 0 was "Ingen",
sleep 0 was "9+ timer", mental 0 was "God", smoking -5 is now -6 y, exercise 4 and
6, diet 3, social 4 now have the source's years). Links that carry an id that no
longer exists (diet -2, alcohol -1/-3/-6, sleep 2, bmi 2/-4, social 2, mental
2/-2/-3) used to be rejected completely. Now only the lifestyle part is dropped:
gender, age and mode are kept, no lifestyle is applied. The address bar is left
as it is, as in #104.
