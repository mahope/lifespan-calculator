# Analytics (Plausible, self-hosted)

Script: `https://analytics.holstjensen.eu/js/script.file-downloads.outbound-links.pageview-props.tagged-events.js`
(no `hash` variant, so `history.pushState` navigations count as pageviews). No cookies.

All custom events go through `track(eventName, props)` in `src/utils/analytics.js`.
It never throws, drops unknown event names and any prop key not listed below, and
only passes string/number values. **Never add user input** (age, sex, birthdate,
lifestyle answers, country) as a prop.

| Event (Plausible goal) | Props | Fired when |
| --- | --- | --- |
| `Calculate Lifespan` | none | The user submits the form |
| `Result Shown` | `mode` (`simple` / `advanced`) | A result is computed and shown (also for share-link auto-runs) |
| `Affiliate Impression` | `program` (`findforsikring`, `jura-docs`, `dokument24`), `placement` (`result-insurance`, `result-practical`) | Once per result, when the insurance card (or the expanded practical-papers links) is at least 50 % visible (`IntersectionObserver`) |
| `Affiliate Click` | `program`, `placement` | A partner link is clicked |
| `Share Opened` | none | The share dialog is opened |
| `Embed Calculate` | none | The form in the embeddable widget (`/embed`, inside an iframe on another site) is submitted. No props: neither input nor result leaves the iframe |
| `Share` | `method` (`clipboard-link`, `clipboard-results`, `native`, `twitter`, `facebook`, `linkedin`, `whatsapp`, `download-image`) | A share action is completed |
| `Error` | `type` (error class name) | The error boundary catches a render error |

The Plausible script also loads inside the widget iframe, so every load of `/embed` on a host
page counts as a pageview (with the host page as referrer), whether or not anyone presses
Beregn. The pageview carries no props and no user input. The info page's privacy text says so.

## Goals to create in the Plausible UI

- [ ] `Calculate Lifespan`
- [ ] `Result Shown` (custom property `mode`)
- [ ] `Affiliate Impression` (custom properties `program`, `placement`)
- [ ] `Affiliate Click` (custom properties `program`, `placement`)
- [ ] `Share Opened`
- [ ] `Embed Calculate`
- [ ] `Share` (custom property `method`; optional, already sent before this change)
- [ ] `Error` (custom property `type`; optional, already sent before this change)

Funnel suggestion: pageview `/` -> `Result Shown` -> `Affiliate Impression` -> `Affiliate Click`.

## Testing note

Plausible ignores automated browsers (`navigator.webdriver`) and `localhost`. To
check events with Playwright against `npm run preview`, use a `*.localhost`
host name, set `navigator.webdriver` to false, fulfil `analytics.holstjensen.eu`
requests locally and abort `partner-ads.com`.
