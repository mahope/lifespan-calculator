# Input validation probing, levetidsberegner.dk at 0a4c35c

Everything here ran against a **local Docker build of 0a4c35c** (`docker run -p 127.0.0.1:3010:3000`, the same `serve -s dist` the site runs on; the baseline of this build is byte-identical to the live baseline). The live site was not used. Clock frozen at 2026-11-05T12:34:56Z, locale da-DK, Chrome 157 (headless, Playwright 1.64.1), fresh context per probe, service workers blocked, analytics intercepted (script replayed from a pinned copy, events recorded and acknowledged locally, nothing forwarded), all other third parties aborted. Harness: `scripts/validate.mjs` (refuses non-local base URLs), follow-up probe `scripts/poison.mjs`; raw results in `data/validation-results.json` and `data/poison-results.json`.

Probes: 22 age-field runs (11 values x native/bypass), 14 birthdate runs (7 values x native/bypass), 55 deep links, 20 localStorage scenarios, 16 widget probes, 4 follow-ups.

Two submit modes were used for the form: **native** = a real click on "Beregn levetid", so the browser's constraint validation applies; **bypass** = the same form with the `submit` event dispatched directly, i.e. what the app does when validation is skipped (an extension, `novalidate`, an older browser) and, more importantly, what it does for every **deep link**, because `/?g=...&a=...` is hydrated into form state and auto-submitted without any validation (`HomePage.jsx` lines 107-135, `runCalculation`).

## Summary of what was found

The visible form is well guarded; the URL and localStorage inputs are not.

| # | Finding | Severity guess |
|---|---|---|
| V1 | A crafted link freezes the tab: `/?g=male&a=100000` renders after **16.3 s** (on a heavily loaded test box), `a=1000000`, `a=100000000` and `a=999999999999999999999` never answered within 30 s (renderer frozen, Chrome had to be restarted) | P2 |
| V2 | Deep links accept anything and show it: `a=abc`, `a=NaN`, `a=Infinity`, `b=not-a-date` give a result page with **NaN** days/heartbeats/fun facts and `Invalid Date`; `a=-5`, `b=2999-01-01`, `b=<tomorrow>` give **negative** days lived, negative heartbeats and an expected age of -891.9 | P2 |
| V3 | Bad deep-link results are written to the user's history and later shown as `NaN år` / `som -5-årig` next to real results | P3 |
| V4 | Silent misreading: `a=1e3` and `a=1e9` are read as age **1**, `a=12.5` as 12, `a=40abc` and `a=0x28` as 40 (`parseInt` without radix or validation), `g=other` / `g=MALE` as male, `b=2026-02-30` as 2 March 2026 | P3 |
| V5 | Ages 100 to 120 are accepted by the form (`max=120`) but the life table ends at 99: expectancy is pinned at 1.8 years, "Chance for at nå" is hidden or wrong (age 99: **100 %** to reach 100) and the comparison says "over det danske gennemsnit" by 21.9 years (age 99) up to 72.9 (age 150, link only) | P3 |
| V6 | A history array containing `null` elements (`[null]`, `[null,null]`) puts the app into a permanent crash loop (`Noget gik galt`) on every calculation; "Genindlæs siden" reloads the same result URL (the inputs are in the URL) and the form does not come back; clearing site data is the way out. `[1,2]` and bad timestamps show `Invalid Date år` | P3 |
| V7 | If `localStorage` throws (privacy mode, quota) the calculator still works (history falls back to memory) but the cookie-banner buttons throw an uncaught `SecurityError` and the banner cannot be dismissed | P3 |
| V8 | Insurance widget: `1e308` income gives "~∞ kr" and the affiliate button text "Sammenlign livsforsikringer fra ~∞ kr"; 20-digit incomes print 22-digit numbers; "years" above its `max=40` are accepted | P3 |
| V9 | Couple widget with partner age 99: "Forventede år sammen 0.0" next to "99 % / 95 % / 84 % both alive in 10 / 20 / 30 years" (survival is clamped at the last table row) | P3 |
| V10 | No injection found: XSS payloads in `g`, `a`, `b`, `m`, `lf`, an unknown param and in every field of the stored history produced no dialog, no injected attributes or elements and no markup in the HTML; React escapes them. `lf` garbage or wrong length is ignored gracefully; unknown `m` is treated as simple mode; empty `a` or `g` is ignored (form stays) | pass |
| V11 | Native validation does its job for typed input: `-5`, `150`, `1e3`, `12.5` are blocked (rangeUnderflow / rangeOverflow / stepMismatch), letters cannot be typed, empty disables the button, birthdate `2999-01-01`, `1850-01-01` and tomorrow are blocked, impossible dates cannot be entered | pass |

Not an input-validation issue but visible in the same data: the analytics event `Calculate Lifespan` carries the typed age and gender as props (`{"age":"-5","gender":"male","location":"Unknown","usedBirthdate":false}` for the bypassed -5), and deep-link visitors never produce that event (the auto-run does not call `window.plausible`).

## Probe tables
### A. Age field (real form, `<input type=number min=0 max=120 required>`, gender Mand)

"native" = a real click on "Beregn levetid" (browser constraint validation applies). "bypass" = the same form with the `submit` event dispatched directly (what happens if validation is skipped, e.g. by an extension or a `novalidate` attribute).

| typed input | field value after typing | browser validity | button disabled | native click | bypass (submit event) | what is shown in bypass |
|---|---|---|---|---|---|---|
| `""` | `""` | invalid: valueMissing | true | BLOCKED by native validation | BAD OUTPUT (NaN) | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N` |
| `"0"` | `"0"` | valid | false | result shown | result shown | remaining 80.3; expected 80.3; 0.0% lived, 0 days, 0 beats; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.4 år over det danske gennemsnit"  |
| `"-5"` | `"-5"` | invalid: rangeUnderflow | false | BLOCKED by native validation | BAD OUTPUT (negative number) | remaining 80.3; expected 75.3; 0.0% lived, -1.827 days, -184.161.600 beats; pension 70/75/5; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 3.6 år under det danske gennemsnit"  negatives: `K Dit livsforløb 0.0% Levet -1.827 Dage levet -184.161` `.0% Levet -1.827 Dage levet -184.161.600 Hjerteslag Chance f` `ng. Fun facts om dit liv 🌅 -1.827 Solopgange set 💨 -` |
| `"1"` | `"1"` | valid | false | result shown | result shown | remaining 79.6; expected 80.6; 1.2% lived, 365 days, 36.792.000 beats; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"  |
| `"99"` | `"99"` | valid | false | result shown | result shown | remaining 1.8; expected 100.8; 98.2% lived, 36.159 days, 3.644.827.200 beats; pension 65/0/36; survival 100:100%; "Du ligger ca. 21.9 år over det danske gennemsnit"  |
| `"100"` | `"100"` | valid | false | result shown | result shown | remaining 1.8; expected 101.8; 98.2% lived, 36.525 days, 3.681.720.000 beats; pension 65/0/37; survival card hidden; "Du ligger ca. 22.9 år over det danske gennemsnit"  |
| `"150"` | `"150"` | invalid: rangeOverflow | false | BLOCKED by native validation | result shown | remaining 1.8; expected 151.8; 98.8% lived, 54.787 days, 5.522.529.600 beats; pension 65/0/87; survival card hidden; "Du ligger ca. 72.9 år over det danske gennemsnit"  |
| `"1e3"` | `"1e3"` | invalid: rangeOverflow | false | BLOCKED by native validation | result shown | remaining 79.6; expected 80.6; 1.2% lived, 365 days, 36.792.000 beats; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"  |
| `"12.5"` | `"12.5"` | invalid: stepMismatch | false | BLOCKED by native validation | result shown | remaining 68.6; expected 80.6; 14.9% lived, 4.383 days, 441.806.400 beats; pension 70/58/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"  |
| `"abc"` | `""` | invalid: valueMissing | true | BLOCKED by native validation | BAD OUTPUT (NaN) | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N` |
| `" 40 "` | `"40"` | valid | false | result shown | result shown | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"  |

### B. Birthdate field (`<input type=date min=1900-01-01 max=today required>`, gender Mand)

| input | field value | browser validity | button disabled | native click | bypass | what is shown in bypass |
|---|---|---|---|---|---|---|
| future 2999-01-01 | `"2999-01-01"` | invalid: rangeOverflow | false | BLOCKED by native validation | BAD OUTPUT (negative number) | remaining 80.3; expected -891.9; 0.0% lived, -355.073 days, -35.791.358.400 beats; precise age "-973 år, 10 mdr, 4 dage", born "1.1.2999 0.0% Levet -355.073 Dage levet -35.791.358.400 Hjerteslag"; pension 70/1042/0; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 970.8 år under det danske gennemsnit"  negatives: `beregning Din præcise alder -973 år, 10 mdr, 4 dage ` `e Født: 1.1.2999 0.0% Levet -355.073 Dage levet -35.791.` `% Levet -355.073 Dage levet -35.791.358.400 Hjerteslag Chance f` |
| before min 1850-01-01 | `"1850-01-01"` | invalid: rangeUnderflow | false | BLOCKED by native validation | result shown | remaining 1.8; expected 178.7; 99.0% lived, 64.591 days, 6.510.772.800 beats; precise age "176 år, 10 mdr, 4 dage", born "1.1.1850 99.0% Levet 64.591 Dage levet 6.510.772.800 Hjerteslag"; pension 65/0/114; survival card hidden; "Du ligger ca. 99.8 år over det danske gennemsnit"  |
| today 2026-11-05 (frozen) | `"2026-11-05"` | valid | false | result shown | result shown | remaining 80.3; expected 80.3; 0.0% lived, 0 days, 0 beats; precise age "0 år, 0 mdr, 0 dage", born "5.11.2026 0.0% Levet 0 Dage levet 0 Hjerteslag"; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.4 år over det danske gennemsnit"  |
| tomorrow 2026-11-06 | `"2026-11-06"` | invalid: rangeOverflow | false | BLOCKED by native validation | BAD OUTPUT (negative number) | remaining 80.3; expected 80.2; 0.0% lived, -1 days, -100.800 beats; precise age "-1 år, 11 mdr, 30 dage", born "6.11.2026 0.0% Levet -1 Dage levet -100.800 Hjerteslag"; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.3 år over det danske gennemsnit"  negatives: `beregning Din præcise alder -1 år, 11 mdr, 30 dage` ` Født: 6.11.2026 0.0% Levet -1 Dage levet -100.800` `26 0.0% Levet -1 Dage levet -100.800 Hjerteslag Chance f` |
| invalid string "abc" (fill) | `""` (fill error: locator.fill: Error: Malformed value) | invalid: valueMissing | true | BLOCKED by native validation | BAD OUTPUT (NaN) | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N` |
| partial typing "15" (day segment only) | `""` | invalid: badInput+valueMissing | true | BLOCKED by native validation | BAD OUTPUT (NaN) | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N` |
| impossible date 2026-02-30 | `""` (fill error: locator.fill: Error: Malformed value) | invalid: valueMissing | true | BLOCKED by native validation | BAD OUTPUT (NaN) | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N` |

### C. Deep links (`/?...` loaded directly; no form validation is involved)

| case | query | outcome | URL after load | what is shown |
|---|---|---|---|---|
| control male 40 | `g=male&a=40` | result shown | `/?g=male&a=40` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| a=abc | `g=male&a=abc` | BAD OUTPUT (NaN) | `/?g=male&a=abc` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| a=-5 | `g=male&a=-5` | BAD OUTPUT (negative number) | `/?g=male&a=-5` | remaining 80.3; expected 75.3; 0.0% lived, -1.827 days, -184.161.600 beats; pension 70/75/5; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 3.6 år under det danske gennemsnit"  negatives: `K Dit livsforløb 0.0% Levet -1.827 Dage levet -184.161` `.0% Levet -1.827 Dage levet -184.161.600 Hjerteslag Chance f` `ng. Fun facts om dit liv 🌅 -1.827 Solopgange set 💨 -`  |
| a=1e9 | `g=male&a=1e9` | result shown | `/?g=male&a=1e9` | remaining 79.6; expected 80.6; 1.2% lived, 365 days, 36.792.000 beats; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"   |
| a=1e3 | `g=male&a=1e3` | result shown | `/?g=male&a=1e3` | remaining 79.6; expected 80.6; 1.2% lived, 365 days, 36.792.000 beats; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"   |
| a=0 | `g=male&a=0` | result shown | `/?g=male&a=0` | remaining 80.3; expected 80.3; 0.0% lived, 0 days, 0 beats; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.4 år over det danske gennemsnit"   |
| a=1 | `g=male&a=1` | result shown | `/?g=male&a=1` | remaining 79.6; expected 80.6; 1.2% lived, 365 days, 36.792.000 beats; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"   |
| a=99 | `g=male&a=99` | result shown | `/?g=male&a=99` | remaining 1.8; expected 100.8; 98.2% lived, 36.159 days, 3.644.827.200 beats; pension 65/0/36; survival 100:100%; "Du ligger ca. 21.9 år over det danske gennemsnit"   |
| a=100 | `g=male&a=100` | result shown | `/?g=male&a=100` | remaining 1.8; expected 101.8; 98.2% lived, 36.525 days, 3.681.720.000 beats; pension 65/0/37; survival card hidden; "Du ligger ca. 22.9 år over det danske gennemsnit"   |
| a=150 | `g=male&a=150` | result shown | `/?g=male&a=150` | remaining 1.8; expected 151.8; 98.8% lived, 54.787 days, 5.522.529.600 beats; pension 65/0/87; survival card hidden; "Du ligger ca. 72.9 år over det danske gennemsnit"   |
| a=12.5 | `g=male&a=12.5` | result shown | `/?g=male&a=12.5` | remaining 68.6; expected 80.6; 14.9% lived, 4.383 days, 441.806.400 beats; pension 70/58/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.7 år over det danske gennemsnit"   |
| a=' 40 ' | `g=male&a= 40 ` | result shown | `/?g=male&a=%2040%20` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| a=40abc | `g=male&a=40abc` | result shown | `/?g=male&a=40abc` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| a=0x28 | `g=male&a=0x28` | result shown | `/?g=male&a=0x28` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| a=Infinity | `g=male&a=Infinity` | BAD OUTPUT (NaN) | `/?g=male&a=Infinity` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| a=NaN | `g=male&a=NaN` | BAD OUTPUT (NaN) | `/?g=male&a=NaN` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| a= (empty) | `g=male&a=` | IGNORED (form shown, no result) | `/?g=male&a=` |    |
| a=1000 | `g=male&a=1000` | result shown | `/?g=male&a=1000` | remaining 1.8; expected 1001.8; 99.8% lived, 365.250 days, 36.817.200.000 beats; pension 65/0/937; survival card hidden; "Du ligger ca. 922.9 år over det danske gennemsnit"   |
| a=10000 | `g=male&a=10000` | result shown | `/?g=male&a=10000` | remaining 1.8; expected 10001.8; 100.0% lived, 3.652.500 days, 368.172.000.000 beats; pension 65/0/9937; survival card hidden; "Du ligger ca. 9922.9 år over det danske gennemsnit"   |
| a=100000 | `g=male&a=100000` | result shown | `/?g=male&a=100000` | remaining 1.8; expected 100001.8; 100.0% lived, 36.525.000 days, 3.681.720.000.000 beats; pension 65/0/99937; survival card hidden; "Du ligger ca. 99922.9 år over det danske gennemsnit"   |
| a=1000000 | `g=male&a=1000000` | HANG (tab unresponsive for 30 s) | `` |    |
| a=100000000 | `g=male&a=100000000` | HANG (tab unresponsive for 30 s) | `` |    |
| a=999999999999999999999 (1e21) | `g=male&a=999999999999999999999` | HANG (tab unresponsive for 30 s) | `` |    |
| g=other | `g=other&a=40` | result shown | `/?g=other&a=40` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| g=MALE | `g=MALE&a=40` | result shown | `/?g=MALE&a=40` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| g= (empty) | `g=&a=40` | IGNORED (form shown, no result) | `/?g=&a=40` |    |
| g=female control | `g=female&a=40` | result shown | `/?g=female&a=40` | remaining 44.7; expected 84.7; 47.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/15; survival 80:73% 90:36% 95:14% 100:4%; "Du ligger ca. 2.0 år over det danske gennemsnit"   |
| b=2999-01-01 | `g=male&b=2999-01-01` | BAD OUTPUT (negative number) | `/?g=male&b=2999-01-01` | remaining 80.3; expected -891.9; 0.0% lived, -355.073 days, -35.791.358.400 beats; precise age "-973 år, 10 mdr, 4 dage", born "1.1.2999 0.0% Levet -355.073 Dage levet -35.791.358.400 Hjerteslag"; pension 70/1042/0; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 970.8 år under det danske gennemsnit"  negatives: `beregning Din præcise alder -973 år, 10 mdr, 4 dage ` `e Født: 1.1.2999 0.0% Levet -355.073 Dage levet -35.791.` `% Levet -355.073 Dage levet -35.791.358.400 Hjerteslag Chance f`  |
| b=1850-01-01 | `g=male&b=1850-01-01` | result shown | `/?g=male&b=1850-01-01` | remaining 1.8; expected 178.7; 99.0% lived, 64.591 days, 6.510.772.800 beats; precise age "176 år, 10 mdr, 4 dage", born "1.1.1850 99.0% Levet 64.591 Dage levet 6.510.772.800 Hjerteslag"; pension 65/0/114; survival card hidden; "Du ligger ca. 99.8 år over det danske gennemsnit"   |
| b=today 2026-11-05 | `g=male&b=2026-11-05` | result shown | `/?g=male&b=2026-11-05` | remaining 80.3; expected 80.3; 0.0% lived, 0 days, 0 beats; precise age "0 år, 0 mdr, 0 dage", born "5.11.2026 0.0% Levet 0 Dage levet 0 Hjerteslag"; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.4 år over det danske gennemsnit"   |
| b=tomorrow 2026-11-06 | `g=male&b=2026-11-06` | BAD OUTPUT (negative number) | `/?g=male&b=2026-11-06` | remaining 80.3; expected 80.2; 0.0% lived, -1 days, -100.800 beats; precise age "-1 år, 11 mdr, 30 dage", born "6.11.2026 0.0% Levet -1 Dage levet -100.800 Hjerteslag"; pension 70/70/10; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.3 år over det danske gennemsnit"  negatives: `beregning Din præcise alder -1 år, 11 mdr, 30 dage` ` Født: 6.11.2026 0.0% Levet -1 Dage levet -100.800` `26 0.0% Levet -1 Dage levet -100.800 Hjerteslag Chance f`  |
| b=notadate | `g=male&b=notadate` | BAD OUTPUT (NaN) | `/?g=male&b=notadate` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| b=not-a-date | `g=male&b=not-a-date` | BAD OUTPUT (NaN,Invalid Date) | `/?g=male&b=not-a-date` | remaining 80.3; 0.0% lived, NaN days, NaN beats; precise age "NaN år, NaN mdr, NaN dage", born "Invalid Date 0.0% Levet NaN Dage levet NaN Hjerteslag"; survival card hidden tokens: `beregning Din præcise alder NaN år, NaN mdr, NaN da` `g Din præcise alder NaN år, NaN mdr, NaN dage Født:` `cise alder NaN år, NaN mdr, NaN dage Født: Invalid `  |
| b=1985-6-15 | `g=male&b=1985-6-15` | result shown | `/?g=male&b=1985-6-15` | remaining 39.9; expected 81.3; 50.9% lived, 15.118 days, 1.523.894.400 beats; precise age "41 år, 4 mdr, 21 dage", born "15.6.1985 50.9% Levet 15.118 Dage levet 1.523.894.400 Hjerteslag"; pension 70/29/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.4 år over det danske gennemsnit"   |
| b=2026-02-30 | `g=male&b=2026-02-30` | result shown | `/?g=male&b=2026-02-30` | remaining 79.8; expected 80.5; 0.8% lived, 248 days, 24.998.400 beats; precise age "0 år, 8 mdr, 3 dage", born "2.3.2026 0.8% Levet 248 Dage levet 24.998.400 Hjerteslag"; pension 70/69/11; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 1.6 år over det danske gennemsnit"   |
| b and a both | `g=male&b=1985-06-15&a=40` | result shown | `/?g=male&b=1985-06-15&a=40` | remaining 39.9; expected 81.3; 50.9% lived, 15.118 days, 1.523.894.400 beats; precise age "41 år, 4 mdr, 21 dage", born "15.6.1985 50.9% Levet 15.118 Dage levet 1.523.894.400 Hjerteslag"; pension 70/29/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.4 år over det danske gennemsnit"   |
| b=0000-01-01 | `g=male&b=0000-01-01` | result shown | `/?g=male&b=0000-01-01` | remaining 1.8; expected 2028.6; 99.9% lived, 740.290 days, 74.621.232.000 beats; precise age "2026 år, 10 mdr, 4 dage", born "1.1.1 99.9% Levet 740.290 Dage levet 74.621.232.000 Hjerteslag"; pension 65/0/1964; survival card hidden; "Du ligger ca. 1949.7 år over det danske gennemsnit"   |
| b=ISO datetime | `g=male&b=1985-06-15T00:00:00Z` | result shown | `/?g=male&b=1985-06-15T00:00:00Z` | remaining 39.9; expected 81.3; 50.9% lived, 15.118 days, 1.523.894.400 beats; precise age "41 år, 4 mdr, 21 dage", born "15.6.1985 50.9% Levet 15.118 Dage levet 1.523.894.400 Hjerteslag"; pension 70/29/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.4 år over det danske gennemsnit"   |
| b=275760-09-13 (max Date) | `g=male&b=275760-09-13` | BAD OUTPUT (Invalid Date) | `/?g=male&b=275760-09-13` | remaining 80.3; expected -273648.0; 0.0% lived, -99.979.238 days, -10.077.907.190.400 beats; precise age "-273734 år, 1 mdr, 23 dage", born "13.9.275760 0.0% Levet -99.979.238 Dage levet -10.077.907.190.400 Hjerteslag"; pension 70/273798/0; survival 80:61% 90:23% 95:7% 100:1%; "Du ligger ca. 273726.9 år under det danske gennemsnit" tokens: `ge ❤️ 1 mia. hjerteslag ca. Invalid Date 99.989.159 dage 🎯 ` `ge 🎯 10.000 dage levet ca. Invalid Date 99.989.238 dage Del` negatives: `beregning Din præcise alder -273734 år, 1 mdr, 23 dage ` `ødt: 13.9.275760 0.0% Levet -99.979.238 Dage levet -10.077.` `evet -99.979.238 Dage levet -10.077.907.190.400 Hjerteslag Chance f`  |
| m=advanced&lf=garbage | `g=male&a=40&m=advanced&lf=garbage` | result shown | `/?g=male&a=40&m=advanced&lf=garbage` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| lf wrong length 1,2,3 | `g=male&a=40&m=advanced&lf=1,2,3` | result shown | `/?g=male&a=40&m=advanced&lf=1,2,3` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| lf 16 zeros (control) | `g=male&a=40&m=advanced&lf=0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0` | result shown | `/?g=male&a=40&m=advanced&lf=0%2C0%2C0%2C` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| lf 999 x16 | `g=male&a=40&m=advanced&lf=999,999,999,999,999,999,999,999,999,999,999,` | result shown | `/?g=male&a=40&m=advanced&lf=999%2C999%2C` | remaining 53.2; expected 93.2; 42.9% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/23; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 14.3 år over det danske gennemsnit"   |
| lf -999 x16 | `g=male&a=40&m=advanced&lf=-999,-999,-999,-999,-999,-999,-999,-999,-999` | result shown | `/?g=male&a=40&m=advanced&lf=-999%2C-999%` | remaining 26.2; expected 66.2; 60.4% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/0; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 12.7 år under det danske gennemsnit"   |
| lf non-numeric x16 | `g=male&a=40&m=advanced&lf=x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x` | result shown | `/?g=male&a=40&m=advanced&lf=x%2Cx%2Cx%2C` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| lf decimals x16 | `g=male&a=40&m=advanced&lf=1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,` | result shown | `/?g=male&a=40&m=advanced&lf=1.9%2C1.9%2C` | remaining 51.2; expected 91.2; 43.8% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/21; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 12.3 år over det danske gennemsnit"   |
| m=weird | `g=male&a=40&m=weird&lf=0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0` | result shown | `/?g=male&a=40&m=weird&lf=0%2C0%2C0%2C0%2` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| m=advanced no lf | `g=male&a=40&m=advanced` | result shown | `/?g=male&a=40&m=advanced` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| lf ignored in simple mode | `g=male&a=40&lf=5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5` | result shown | `/?g=male&a=40&lf=5%2C5%2C5%2C5%2C5%2C5%2` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| XSS g=img | `g=<img src=x onerror=window.__xss=1>&a=40` | result shown | `/?g=%3Cimg%20src%3Dx%20onerror%3Dwindow.` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| XSS a=script | `g=male&a=<script>window.__xss=1</script>` | BAD OUTPUT (NaN) | `/?g=male&a=%3Cscript%3Ewindow.__xss%3D1%` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| XSS b=svg | `g=male&b="><svg onload=window.__xss=1>` | BAD OUTPUT (NaN) | `/?g=male&b=%22%3E%3Csvg%20onload%3Dwindo` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| XSS m+lf | `g=male&a=40&m=<b>x</b>&lf=<script>window.__xss=1</script>` | result shown | `/?g=male&a=40&m=%3Cb%3Ex%3C%2Fb%3E&lf=%3` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |
| XSS all params | `g=<img src=x onerror=window.__xss=1>&a=<script>window.__xss=1</script>` | BAD OUTPUT (NaN) | `/?g=%3Cimg%20src%3Dx%20onerror%3Dwindow.` | remaining 80.3; 0.0% lived, NaN days, NaN beats; survival card hidden tokens: `K Dit livsforløb 0.0% Levet NaN Dage levet NaN Hjer` `b 0.0% Levet NaN Dage levet NaN Hjerteslag Dit liv ` `ng. Fun facts om dit liv 🌅 NaN Solopgange set 💨 N`  |
| XSS unknown param only | `g=male&a=40&q=<script>window.__xss=1</script>` | result shown | `/?g=male&a=40&q=%3Cscript%3Ewindow.__xss` | remaining 41.2; expected 81.2; 49.2% lived, 14.610 days, 1.472.688.000 beats; pension 70/30/11; survival 80:62% 90:23% 95:7% 100:1%; "Du ligger ca. 2.3 år over det danske gennemsnit"   |

### D. Reflection / injection check (XSS-style strings in every parameter)

| case | alert/dialog | handler attrs injected | extra scripts | `window.__xss` set | raw payload as markup in HTML | outcome |
|---|---|---|---|---|---|---|
| XSS g=img | none | 0 | 2 | false | false | result shown |
| XSS a=script | none | 0 | 2 | false | false | BAD OUTPUT (NaN) |
| XSS b=svg | none | 0 | 2 | false | false | BAD OUTPUT (NaN) |
| XSS m+lf | none | 0 | 2 | false | false | result shown |
| XSS all params | none | 0 | 2 | false | false | BAD OUTPUT (NaN) |
| XSS unknown param only | none | 0 | 2 | false | false | result shown |

### E. localStorage `lifespan:history` corruption (seeded before load, then one normal calculation: male, 40)

| seed | outcome | Historik card / errors |
|---|---|---|
| control: 2 valid entries | result shown | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). 4. nov. 2026 81.2 år (som 40-årig) 4. nov. 2026 81.9 år (som 4    |
| invalid JSON "{not json" | result shown | card hidden    |
| truncated JSON | result shown | card hidden    |
| JSON string "x" | result shown | card hidden    |
| JSON number 123 | result shown | card hidden    |
| JSON object {"a":1} | result shown | card hidden    |
| JSON null | result shown | card hidden    |
| empty array [] | result shown | card hidden    |
| [null,null] | CRASH (ErrorBoundary) | card hidden  <br>analytics: Error {"message":"Cannot read properties of null (reading 'expected')"}  |
| [1,2] | BAD OUTPUT (Invalid Date) | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). Invalid Date år Invalid Date år 5. nov. 2026 81.2 år (som 40-å    |
| [null] | CRASH (ErrorBoundary) | card hidden  <br>analytics: Error {"message":"Cannot read properties of null (reading 'expected')"}  |
| [{"ts":1}] | result shown | Din historik Sådan har dit estimat udviklet sig (2 beregninger, gemt lokalt). 1. jan. 1970 år 5. nov. 2026 81.2 år (som 40-årig) Dit estimat    |
| [{ts:"x",age:"y",expected:"z"}] x2 | BAD OUTPUT (Invalid Date) | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). Invalid Date z år Invalid Date z år 5. nov. 2026 81.2 år (som     |
| expected not numeric x2 | result shown | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). 1. jan. 1970 abc år 1. jan. 1970 def år 5. nov. 2026 81.2 år (    |
| ts = 1e20 (Invalid Date) x2 | BAD OUTPUT (Invalid Date) | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). Invalid Date 80.0 år (som 40-årig) Invalid Date 81.0 år (som 4    |
| HTML in fields x2 | result shown | Din historik Sådan har dit estimat udviklet sig (3 beregninger, gemt lokalt). 1. jan. 1970 <img src=x onerror=window.__xss=1> år (som 40-åri    |
| 1000 valid entries | result shown | Din historik Sådan har dit estimat udviklet sig (20 beregninger, gemt lokalt). 4. nov. 2026 80.0 år (som 40-årig) 4. nov. 2026 80.1 år (som     |
| duplicate ts keys x3 | result shown | Din historik Sådan har dit estimat udviklet sig (4 beregninger, gemt lokalt). 1. jan. 1970 80.0 år (som 40-årig) 1. jan. 1970 81.0 år (som 4    |
| localStorage getter throws (privacy mode) | result shown | card hidden <br>pageErrors: denied  <br>theme toggle: {"pageErrors":["denied"],"boundary":false} |
| localStorage.setItem throws (quota) | result shown | card hidden <br>pageErrors: quota   |

### F. Result-page widgets with odd input

| widget | input | output |
|---|---|---|
| insurance | income 500000, years 10 | cover `5.000.000 kr`; button: Sammenlign livsforsikringer fra ~5.000.000 kr → |
| insurance | income -1, years 10 | cover ``; button: Sammenlign livsforsikringer → |
| insurance | income 1e308, years 40 | cover `∞ kr`; button: Sammenlign livsforsikringer fra ~∞ kr → |
| insurance | income 1e308, years 10 | cover `∞ kr`; button: Sammenlign livsforsikringer fra ~∞ kr → |
| insurance | income 0, years 10 | cover ``; button: Sammenlign livsforsikringer → |
| insurance | income 500000, years -3 | cover ``; button: Sammenlign livsforsikringer → |
| insurance | income 500000, years 1e2 | cover `50.000.000 kr`; button: Sammenlign livsforsikringer fra ~50.000.000 kr → |
| insurance | income 99999999999999999999, years 40 | cover `4.000.000.000.000.000.000.000 kr`; button: Sammenlign livsforsikringer fra ~4.000.000.000.000.000.000.000 kr → |
| partner | partner age 38 |  Forventede år sammen (begge i live) 37.0 Om Begge i live Mindst én 10 år 98% 100% 20 år 92% 100% 30 år 77% 99% Antager uafhængig dødelighed — danske dødelighed |
| partner | partner age 99 |  Forventede år sammen (begge i live) 0.0 Om Begge i live Mindst én 10 år 99% 100% 20 år 95% 100% 30 år 84% 100% Antager uafhængig dødelighed — danske dødelighed |
| partner | partner age 100 |  Antager uafhængig dødelighed — danske dødelighedstavler (Danmarks Statistik). |
| partner | partner age -1 |  Antager uafhængig dødelighed — danske dødelighedstavler (Danmarks Statistik). |
| partner | partner age 12.5 |  Forventede år sammen (begge i live) 40.4 Om Begge i live Mindst én 10 år 98% 100% 20 år 94% 100% 30 år 83% 100% Antager uafhængig dødelighed — danske dødelighe |
| partner | partner age 1e1 |  Forventede år sammen (begge i live) 40.6 Om Begge i live Mindst én 10 år 98% 100% 20 år 94% 100% 30 år 84% 100% Antager uafhængig dødelighed — danske dødelighe |
| partner | partner age 0 |  Forventede år sammen (begge i live) 40.4 Om Begge i live Mindst én 10 år 98% 100% 20 år 94% 100% 30 år 83% 100% Antager uafhængig dødelighed — danske dødelighe |

Page errors during widget probing: []

### Outcome counts

- Age field, native: {"BLOCKED by native validation":6,"result shown":5}
- Age field, bypass: {"BAD OUTPUT (NaN)":2,"result shown":8,"BAD OUTPUT (negative number)":1}
- Birthdate, native: {"BLOCKED by native validation":6,"result shown":1}
- Birthdate, bypass: {"BAD OUTPUT (negative number)":2,"result shown":2,"BAD OUTPUT (NaN)":3}
- Deep links: {"result shown":38,"BAD OUTPUT (NaN)":7,"BAD OUTPUT (negative number)":3,"IGNORED (form shown, no result)":2,"HANG (tab unresponsive for 30 s)":3,"BAD OUTPUT (NaN,Invalid Date)":1,"BAD OUTPUT (Invalid Date)":1}
- History seeds: {"result shown":15,"CRASH (ErrorBoundary)":2,"BAD OUTPUT (Invalid Date)":3}

## Follow-up probes (`scripts/poison.mjs`, `data/poison-results.json`)

1. **History poisoning from a bad link.** Visit a bad deep link, then do a normal calculation (male, 40) in the same browser profile:

```
/?g=male&a=abc      stored: [{"ts":1793882096000,"age":null,"gender":"male","expected":"NaN"}]
                    Historik after normal calc: "5. nov. 2026 NaN år  5. nov. 2026 81.2 år (som 40-årig)  Dit estimat er stort set uændret"
/?g=male&a=-5       stored: [{"ts":1793882096000,"age":-5,"gender":"male","expected":"75.3"}]
                    Historik after normal calc: "75.3 år (som -5-årig) ... Dit estimat er steget 5.9 år siden din første beregning"
/?g=male&b=not-a-date  stored: [{"age":null,"expected":"NaN"}]  -> same "NaN år" row
```

2. **Crash persistence.** Seed `lifespan:history = [null]`, calculate (male, 40) twice, then reload:

```
attempt 1: ErrorBoundary shown ("Noget gik galt"), stored after: [null,{"ts":...,"age":40,"gender":"male","expected":"81.2"}]
attempt 2: ErrorBoundary shown again, stored unchanged
reload:    URL is still /?g=male&a=40, the deep-link auto-run fires again and the calculator form does not come back (page.reload then #age missing;
           the error screen itself was not captured on this step)
analytics: Error {"message":"Cannot read properties of null (reading 'expected')"}
```

Cause: `loadHistory()` only checks `Array.isArray(parsed)` (`history.js:26`), `Historik.jsx:19-21` reads `first.expected` and `last.expected` without checking the elements.

## Notes on method and limits

- "Outcome" is computed from the rendered text: `CRASH` = ErrorBoundary text "Noget gik galt" or empty `#root`; `BAD OUTPUT` = the page text contains `NaN`, `Infinity`, `∞`, `undefined`, `null`, `Invalid Date`, `[object` or a whitespace-preceded negative number; `IGNORED` = the form is still shown and no result; `HANG` = no response within 30 s.
- The HANG rows mean the renderer did not return from `page.evaluate` within 30 s on a busy machine (load average above 30 on 16 cores at the time); `a=100000` finished in 16.3 s in the same conditions. Absolute timings on a quiet desktop will be lower, but the cost is linear in the age (about 52 canvas draws per year of age; `LifeInWeeksGrid.jsx:47` `totalYears = Math.max(90, Math.ceil(expectancy))`, `:80` a canvas loop over `totalYears * 52` weeks, no upper bound). `a=1000` and `a=10000` rendered in about 2.6 s including page load.
- "Native" for the birthdate field: a typed or filled value that the browser's date control rejects as malformed (`abc`, `2026-02-30`) leaves the field empty, so the submit button stays disabled and the bypass run falls into the age path with an empty age (NaN).
- Not exercised: geolocation ("Brug min placering" and the Nominatim call), the share modal and its clipboard/native-share paths (a selector problem made the modal text unreliable, so no claim is made), the "download image" function (`html-to-image`), IME/mobile keyboard input, other browsers.
- The harness classifies and records; the severities in the summary table are my estimate. The XSS check covers React's output path only. It did not look for `dangerouslySetInnerHTML` elsewhere (grep of `src/` finds none) or for server-side reflection (the origin is a static file server).
