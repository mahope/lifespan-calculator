# legacy-prod

What https://levetidsberegner.dk served on 2026-11-07, before the Astro port (#88): the Workbox
`sw.js` and `workbox-9c191d2f.js`, every file in that worker's precache list, the per-route HTML and
`404.html`. Fetched with `curl` from production. `e2e/sw-migration.e2e.js` serves it first and then
`dist/`, to test the switch for visitors who already have the old service worker. Do not edit or
rebuild it; it is a frozen copy of the old site.
