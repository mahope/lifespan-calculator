# Deterministic regression baseline for levetidsberegner.dk

`baseline.mjs` drives the real UI with Playwright and prints one JSON document on stdout. Two runs against the same deployed build are byte-identical, so a deploy can be checked with a plain `diff`.

Written for the 2026-11-05 audit of commit `0a4c35c` (master). Saved result: `baseline-live-0a4c35c.json`.

## Usage

```sh
npm i --save-exact playwright-core@1.64.1          # only dependency; needs a Chromium/Chrome Playwright can launch
node baseline.mjs https://levetidsberegner.dk > before.json
# ... deploy ...
node baseline.mjs https://levetidsberegner.dk > after.json
diff before.json after.json                          # empty diff = nothing user-visible moved
```

If `playwright-core` is not resolvable from the script directory: `PLAYWRIGHT_MODULE=/abs/path/node_modules/playwright-core/index.mjs node baseline.mjs ...`.
Diagnostics (Chrome version, progress) go to stderr; stdout is only the JSON. Runtime about 25 s.

Options: `--only=routes|cases`, `--timeout=<ms>`, `--no-asset-cache`, `--plausible-script=<file>`, `--map-host=<host>=<ip>`.

### Checking a local build (before it is deployed)

```sh
docker build -t levetid:test .                      # the Dockerfile in the repo = what production runs
docker run -d --rm -p 127.0.0.1:3010:3000 levetid:test
node baseline.mjs http://levetid.test:3010 --map-host=levetid.test=127.0.0.1 > local.json
diff local.json before.json                          # should be empty for an unchanged build
```

Do not build with a plain `npm run build` and compare CSS or hashes: `dist/` is tracked in git, and a stale `dist/` changes what Tailwind scans (the CSS came out 1.4 kB larger than production in this audit). The Docker build of 0a4c35c produced an `index.html` and CSS byte-identical to live.
`--map-host` is needed because the Plausible script ignores `localhost` and `127.x` hosts, so the events could not be observed on `http://127.0.0.1`. The tested origin is rewritten to `https://levetidsberegner.dk` in the output, so local and live results are directly diffable.

## What is captured

Per route (`/`, the 4 landing pages, and a nonexistent `/xyz`), rendered DOM after network idle: HTTP status, final path, title, `<html lang>`, canonical(s), meta robots, meta description(s), og:*/twitter tags, h1, all headings in order, JSON-LD types, footer count, cookie banner state, hard-coded explainer text, local link list, partner-ads links, same-origin request inventory (build hashes masked as `[hash]`), blocked third-party hosts, console errors, analytics events.

Per calculator case, through the real UI (labels and roles, no CSS selectors for the form):

1. male, age 40
2. female, age 65
3. male via birthdate 1985-06-15
4. bonus: male 50 in advanced mode (smoking "Let", exercise "Moderat", diet "Sund", sleep "7-8 timer"), so biological age, coaching and what-if are exercised

For each: URL after submit, `headline` (remaining years, expected age at death, countdown units, life progress, survival probabilities, comparison rows and verdict, pension tiles, biological age), every rendered heading, the full normalised text of every result card (`sections`, the byte-level regression guard), all partner-ads links (href/rel/target/text, never clicked), all external links, localStorage content, interactions with the insurance widget (income 500000) and the couple widget (partner 38), a deep-link round trip (reload the URL the app wrote and compare), and the analytics events (`name` + props) the page tried to send.

## How determinism is achieved

- Playwright clock: `page.clock.install({time})` plus `setFixedTime(time)` with `2026-11-05T12:34:56Z`. `Date.now()` is constant, so the "ticking" countdown shows the same digits every run. Consequence: seconds and minutes are present in the JSON on purpose and carry no information about ticking; the per-second update logic itself is not exercised.
- The time is deliberately not on a minute boundary. The app renders any countdown unit that is 0 as `--` (`value || '--'`), and a first try frozen at exactly 12:00:00Z produced `MIN: "--", SEK: "--"`.
- Locale `da-DK`, timezone `Europe/Copenhagen`, viewport 1280x900, light scheme, reduced motion, fixed user agent, fresh context per page and per case, service workers blocked, empty localStorage at start (the cookie banner is dismissed with "Afvis" as a user would).
- Console messages are sorted; the benign "Service Worker registration blocked" message caused by `serviceWorkers: 'block'` is dropped.
- Plausible `engagement` events carry real elapsed times and are dropped; `pageview` and custom events are kept.

## Network policy (nothing leaks to analytics or partners)

- `analytics.holstjensen.eu`: the script is replayed from a pinned local copy (`plausible-script.pinned.js`, sha256 `eb950acd60d1a3c51cd971947844ed2a0a9204dd7034c2bc5a6f6ca6db96241c`); `POST /api/event` is recorded and answered `202` locally, never forwarded. The Plausible script ignores automation unless `window.__plausible` is set, which the harness does with an init script, so events can be observed at all.
- `partner-ads.com`, `fonts.googleapis.com` and every other third party: aborted, host recorded in `blockedThirdPartyHosts`. The affiliate link is only inspected, never clicked.
- Same-origin `/assets/*` responses are fetched once per run and replayed from memory for later contexts, so one run sends about 40 requests to the server (14 documents, about 26 assets).

## Verification performed

```
runs against https://levetidsberegner.dk  : 2 (run1 == run2, cmp exit 0)
runs against the local Docker build        : 2 (run1 == run2, cmp exit 0)
live vs local                              : diff empty
sha256 (all four files)                    : db445c19b0043281f22a67366b2234b25233f9b5cb5d261c59bbb7df3f2eac85
Chromium used                              : 157.0.8103.38 (Google Chrome Stable via the Playwright shim on agent-worker)
playwright-core                            : 1.64.1 (published 2026-10-14)
```

Sensitivity check (the harness must be able to fail): a copy of the Docker build's `HomePage-*.js` was patched (`*70` -> `*71` for heartbeats per minute, and the label "Dage levet" -> "Dage levede") and served on another port; the baseline diff against the unmodified build showed 32 changed lines, including the `Hjerteslag` figure `1.472.688.000 -> 1.493.726.400` and the changed label inside `sections[].text`. Note that the structured `headline.lifeProgress` regex returned `null` for the changed label: the `sections` text is the authoritative guard, `headline` is a convenience view.

## Limits

No visual comparison, no accessibility check, no performance numbers, no mobile viewport, no real network time zone or locale variation. Only the 4 inputs above are exercised; the harness records what is on screen but does not assert that numbers are sane (it would happily record `NaN`). For invalid and hostile input see `validation.md`. Geolocation ("Brug min placering", Nominatim), the share modal and the theme toggle are not exercised.
