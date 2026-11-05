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
| `Affiliate Impression` | `program` (`findforsikring`), `placement` (`result-insurance`) | Once per result, when the insurance card is at least 50 % visible (`IntersectionObserver`) |
| `Affiliate Click` | `program`, `placement` | The Findforsikring link is clicked |
| `Share Opened` | none | The share dialog is opened |
| `Share` | `method` (`clipboard-link`, `clipboard-results`, `native`, `twitter`, `facebook`, `linkedin`, `whatsapp`, `download-image`) | A share action is completed |
| `Error` | `type` (error class name) | The error boundary catches a render error |

## Goals to create in the Plausible UI

- [ ] `Calculate Lifespan`
- [ ] `Result Shown` (custom property `mode`)
- [ ] `Affiliate Impression` (custom properties `program`, `placement`)
- [ ] `Affiliate Click` (custom properties `program`, `placement`)
- [ ] `Share Opened`
- [ ] `Share` (custom property `method`)
- [ ] `Error` (custom property `type`)

Funnel suggestion: pageview `/` -> `Result Shown` -> `Affiliate Impression` -> `Affiliate Click`.
