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
  2026-11-05T12:34:56Z. The golden remaining years are explicit assertions (40.8, 21.0 and 39.9 years; age-only input
  counts as mid-year) and a small JSON snapshot in `e2e/__snapshots__/<case>.json` holds numbers only (years, the
  countdown values, the affiliate link rel/target, no banner IDs), never page copy. The same file checks that only the site and the
  analytics host are contacted, that every analytics event is whitelisted in `EVENTS` (`src/utils/analytics.js`:
  the event name is a key, every prop key is listed for that event, Plausible's own `pageview` carries no props),
  that no prop value and no request body contains a typed input value (age, birthdate, gender), that nothing is
  logged with `console.error`, and that a crafted share link (`?g=constructor&a=99999999`) leaves the page responsive.
- `projection.e2e.js`: the projected-figure toggle (#92): period stays the default headline, keyboard operation (Space/Enter),
  reset on "Ny beregning", no toggle from entered age 70, nothing in the URL or storage, and a computed WCAG contrast check (>= 4.5:1) of the toggle text on the gradient in light and dark (axe cannot measure the gradient).
- `share-privacy.e2e.js`: opens a new-style, an advanced and a legacy `b=` share link and records every request to the analytics origin (URL, headers, body). None may contain `g=`, `a=`, `b=`, `m=`, `lf=` or the birthdate, the pageview `u` is the clean path, the result still hydrates, and an unrelated `utm_source` still reaches analytics. The inline script in `index.html` that makes this true is also unit tested (`src/utils/shareQuery.test.js`).
- `static-contract.e2e.js`: `/robots.txt`, `/sitemap.xml`, `/privatlivspolitik`, a 404 for `/xyz` and 200 for
  `/api/health`. There is no skip: if `/sitemap.xml` falls back to the SPA, the suite fails.
- `embed.e2e.js`: the iframe widget. A page on another origin (`framer.test`, served by a Playwright route) frames
  `/embed`, which must render, while `/` and `/embed-levetidsberegner` must not be framable (`X-Frame-Options:
  SAMEORIGIN`). Also checks the response headers per URL, that the only message posted to the parent is
  `{type, height}`, and that the `Embed Calculate` event carries no props and no input.

The baseline cases come from the 2026-11-05 audit harness (branch `docs/audit-2026-11-05`, `audit/measure2/baseline`).
The pinned Plausible script in `e2e/fixtures/` is a copy from there.

### Updating the golden values and snapshots

The golden years change only when the calculation or the life table changes on purpose. Copy changes must not touch
them. Regenerate with

```sh
npm run build
npm run test:e2e -- --update-snapshots
git diff e2e/__snapshots__
```

The diff must contain only numbers: `yearsRemaining`, the `countdown` values, and (rarely) the affiliate link
attributes. A changed word in the diff means the snapshot has started to depend on copy: fix the capture, do not
commit it. Every changed number must be explained by your change. Also update the explicit `years` values in
`CASES` in `e2e/calculator.e2e.js`, and commit them together with the JSON files.

### Network is always intercepted

The fixture in `e2e/fixtures.js` routes every request. Same-origin requests go to the local server. The analytics
host is answered locally (the Plausible script is replayed from the pinned copy, events are recorded and
acknowledged with 202, never forwarded). Every other host, including partner ads, fonts and geocoding, is aborted
and recorded, and the test fails if one was contacted. Affiliate links are only inspected, never clicked. The suite
therefore never sends anything to analytics or to partners. The tests themselves need no internet once `npm ci` has
run and the browser is installed (`npx playwright install` downloads Chromium, which does use the network).
`serve` is started with `NO_UPDATE_CHECK=1` (no update check call) and `--no-port-switching` (a busy port is an
error, never a silent move to another port), bound to 127.0.0.1.

The site is opened as `http://levetid.test:4173`, which Chrome maps to 127.0.0.1, because the Plausible script
ignores localhost and 127.x and the privacy check needs it to run.

## Performance budget

`scripts/lighthouse-budget.mjs` starts `vite preview` on `dist/`, runs Lighthouse (`npx lighthouse@13.5.0`, mobile
preset) three times and fails when the median is over budget: LCP above 2.5 s, CLS above 0.1, or JavaScript
above 130 KB brotli (computed from the files in `dist/` the page loaded). It prints the runs and medians as JSON.
It is not part of CI, because timings on shared runners are too noisy. The script is not offline: `npx` downloads
`lighthouse@13.5.0` (exact pin, no install scripts, run with `npm_config_ignore_scripts`) and its transitive
dependencies from the npm registry on each run.

On agent-worker:

```sh
ssh agent-worker
cd ~/dev/lifespan-calculator && source ~/dev/env.sh
npm ci && npm run build
CHROME_PATH=/opt/google/chrome/chrome node scripts/lighthouse-budget.mjs
```

Browsers: Playwright finds its Chromium through `~/dev/pw-chrome.sh` on agent-worker (it is Google Chrome Stable,
with the sandbox on). Do not add `--no-sandbox`.
