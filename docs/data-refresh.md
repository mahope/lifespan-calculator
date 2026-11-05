# Refreshing the external data

Every number the calculator shows comes from a public statistics source. One command refreshes,
validates and rewrites all of it; a weekly GitHub Action tells us when Danmarks Statistik (DST)
has published something newer. Nothing here sends user input anywhere: the scripts only read
public statistics endpoints, and the app itself never talks to them.

## Command

```bash
node scripts/refresh-data.mjs <dst|countries|hly|cohort|all> [--dry-run]
node scripts/refresh-data.mjs check [--simulate-latest 2026:2027]
```

Node 20+, no dependencies. All requested datasets are fetched and validated first; files are
only written (atomically) if every one of them passes. On any failure the script exits non-zero
and the working tree is untouched. `--dry-run` shows which files would change. Re-running on
unchanged data changes nothing (the retrieval date is only bumped when content changes).

| Sub-command | Source | Writes |
|---|---|---|
| `dst` | DST StatBank `HISB8` (l_x, q_x, e_x, ages 0-99, M/K), `HISB7` (newborn headline), `HISBR`, `HISBK`, `LABY21` (regional) | `src/data/lifeTableDK.generated.js` (what the app imports: meta, e_x 0-99, l_x 0-100) and `src/data/lifeTableExtras.generated.js` (q_x, newborn, regional; not imported by the app) |
| `countries` | World Bank WDI `SP.DYN.LE00*`, Eurostat `demo_mlexpec` | the `BEGIN/END GENERATED COUNTRY TABLE` block in `src/utils/lifeExpectancyData.js` |
| `hly` | Eurostat `hlth_hlye` (`HLY_Y0`, `HLY_Y65`, `LE_Y65`) | `src/data/healthyLifeYears.generated.js` |
| `cohort` | not available yet (the cohort table is a separate pull request). `cohort` exits 1 with a "not available yet" message; it is not part of `all` | none |
| `all` | `dst`, `countries` and `hly` | all of the above |
| `check` | `tableinfo/HISB8` | stdout (JSON): committed vs latest period, `stale` flag |

### What is validated

- `dst`: latest `Tid` is read from `tableinfo/HISB8`; period has the form `YYYY:YYYY+1` and is not
  older than the committed one; 100 values per series; l_0 = 100000 and l_x non-increasing;
  e_x non-increasing from age 1 (e_0 may be below e_1); e_x recomputed from l_x (trapezoid, tail
  closed with DST's e_99) within 0.05 of DST's; HISB7 agrees with e_0; regional tables are
  complete (DST suppresses a few tiny municipalities; up to 10 % missing is accepted) and plausible.
  The 101st survivors entry `l_100` is derived as l_99 * (1 - q_99) (rounded) and written as the last
  element of `survivors`; validation requires 101 survivors values, of which the first 100 are DST's and
  the last must equal that derivation. e_x stops at 99.
- `countries`: Sweden, Norway and Finland come from Eurostat, Japan and the world average from the
  World Bank (each row carries its source and year). This deliberately keeps the choice made in #81
  and differs from the issue text (World Bank primary, Eurostat cross-check). The World Bank value
  for the same year is used to cross-check Eurostat: a difference above 0.5 year prints a warning
  (and the check is skipped with a warning when World Bank has no value for that year). Japan and the
  world average have no second source. A year older than the committed one fails the run.
- `hly`: Denmark must have all three indicators for both sexes, values must be plausible and
  HLY_Y65 may not exceed LE_Y65. Years are compared per country/indicator/sex with the committed
  file (countries publish at different times); a regression fails the run. The hly data and the
  regional and newborn exports (in `lifeTableExtras.generated.js`) are not used by the UI yet; they live in their own file so the bundle never depends on tree-shaking.

The generated life-table file exports `LIFE_TABLE_META` = `{ period, tid, tableUpdated, retrieved, source }`.
UI and SEO copy read `LIFE_TABLE_META.period` / `.tid`; a vitest test fails if `2024-2025`,
`2024–2025` or `2024:2025` appears in a `.js/.jsx/.css/.html/.json/.snap` file under `src/` outside the generated files.
The README does not state the period for the same reason.

## Procedure

1. `source ~/dev/env.sh` (or any Node >= 20.19), `npm ci`.
2. `node scripts/refresh-data.mjs all` (or one sub-command).
3. Read `git diff`: the period, `tableUpdated` and the sanity of the new numbers.
4. Run the gate: `npm run lint && npm test && npm run build`. Update tests that pin concrete
   DST values (`src/utils/lifeTableDK.test.js`) only if the numbers legitimately changed.
5. Check pages that mention specific figures (Denmark page, share text, snapshots).
6. Commit the generated files together with any test/copy changes and open a PR. Deployment is manual.

## Calendar

| When | What |
|---|---|
| 2027-02-12 | DST publishes the next HISB8 period (release page for the 2026 edition: https://www.dst.dk/nyt/52702; HISB8 was updated 2026-02-12 08:00) |
| 2027-02-15 | Run `node scripts/refresh-data.mjs all`; the weekly Action should already have opened "Opdatér dødelighedstavle" |
| March 2027 | Run it again: DST sometimes corrects tables and regional tables follow later |
| October-November each year | Eurostat (`demo_mlexpec`, `hlth_hlye`) and World Bank refresh; run `countries` and `hly` |

## CI guard

`.github/workflows/data-staleness.yml` runs every Monday (and on manual dispatch). It runs
`node scripts/refresh-data.mjs check`, which compares the committed `period` with the latest `Tid` of
`tableinfo/HISB8`. When DST is ahead it opens an issue titled "Opdatér dødelighedstavle" or, if one
is already open, comments on it (once per new period). It uses `GITHUB_TOKEN` with `issues: write`
and never pushes. `check` only detects a new period (a later `Tid`); a re-publication of the same
period with revised numbers is not flagged, which is what the March re-run is for.

Manual dispatch has two inputs: `dry_run` (default on; prints the issue text instead of creating
anything) and `simulate_latest` (e.g. `2025:2026`) to exercise the stale path before DST actually
publishes.
