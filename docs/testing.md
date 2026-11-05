# Testing

Three levels, from fast to slow. Only the first two run on every pull request.

| Level | Command | Runs in CI | What it protects |
| --- | --- | --- | --- |
| Unit (vitest) | `npm test` | yes, job `build` | Calculation, data and helper code in `src/` |
| End to end (Playwright) | `npm run build && npm run test:e2e` | yes, job `e2e` | What a visitor sees and what leaves the browser |
| Performance budget | `node scripts/lighthouse-budget.mjs` | no, run by hand | LCP, CLS and JavaScript weight |

## Unit tests

Vitest, files next to the code as `*.test.js`. Pure logic (`src/utils/*`) and a few components.

## End to end tests (`e2e/`)

`@playwright/test` (pinned) drives the built app in Chromium. `playwright.config.js` serves `dist/` with
`serve@14.2.6` (a pinned devDependency, the version the Dockerfile uses) and `public/serve.json`, so unknown paths are a real 404
exactly like in production. `vite preview` ignores `serve.json` and would hide that. Run `npm run build` first.

- `calculator.e2e.js`: three baseline inputs (male 40, female 65, male born 1985-06-15) with the clock frozen at
  2026-11-05T12:34:56Z. The visible result is compared exactly to `e2e/__snapshots__/<case>.json`. The same file
  checks that only the site and the analytics host are contacted, that no typed value appears in an analytics
  payload (and no event carries props), that nothing is logged with `console.error`, and that a crafted share link
  (`?g=constructor&a=99999999`) leaves the page responsive.
- `static-contract.e2e.js`: `/robots.txt`, `/sitemap.xml`, `/privatlivspolitik`, a 404 for `/xyz` and 200 for
  `/api/health`. Skipped with a message if `/sitemap.xml` is not XML.

The baseline cases come from the 2026-11-05 audit harness (branch `docs/audit-2026-11-05`, `audit/measure2/baseline`).
The pinned Plausible script in `e2e/fixtures/` is a copy from there.

### Updating the snapshots

A snapshot changes only when a visible result changes on purpose (new copy, new data table). Run

```sh
npm run build
npm run test:e2e -- --update-snapshots
git diff e2e/__snapshots__
```

and read the diff: every changed line must be explained by your change, then commit the JSON files with it.

### Network is always intercepted

The fixture in `e2e/fixtures.js` routes every request. Same-origin requests go to the local server. The analytics
host is answered locally (the Plausible script is replayed from the pinned copy, events are recorded and
acknowledged with 202, never forwarded). Every other host, including partner ads, fonts and geocoding, is aborted
and recorded, and the test fails if one was contacted. Affiliate links are only inspected, never clicked. The suite
therefore never sends anything to analytics or to partners, and needs no internet at all once `npm ci` has run.

The site is opened as `http://levetid.test:4173`, which Chrome maps to 127.0.0.1, because the Plausible script
ignores localhost and 127.x and the privacy check needs it to run.

## Performance budget

`scripts/lighthouse-budget.mjs` starts `vite preview` on `dist/`, runs Lighthouse (`npx lighthouse@13.5.0`, mobile
preset) three times and fails when the median is over budget: LCP above 2.5 s, CLS above 0.1, or JavaScript
above 130 KB brotli (computed from the files in `dist/` the page loaded). It prints the runs and medians as JSON.
It is not part of CI, because timings on shared runners are too noisy.

On agent-worker:

```sh
ssh agent-worker
cd ~/dev/lifespan-calculator && source ~/dev/env.sh
npm ci && npm run build
CHROME_PATH=/opt/google/chrome/chrome node scripts/lighthouse-budget.mjs
```

Browsers: Playwright finds its Chromium through `~/dev/pw-chrome.sh` on agent-worker (it is Google Chrome Stable,
with the sandbox on). Do not add `--no-sandbox`.
