# Redesign: direction

Brief (5 Nov 2026): "The design and layout look very AI-generated, change it." Same calculations, same URLs, same privacy
fixes. This file is written before building; the screenshots in `foer/` are the starting point.

## Before: what reads as a template

Observed in `foer/` (390, 768, 1440 px, every route plus the result view):

1. **Blue gradient hero on every page** (`header-gradient`, `#3b82f6` to `#2563eb`, violet in dark mode) with a
   frosted-glass icon chip above a centred H1. The same banner sits above the calculator, the four landing pages and the 404.
2. **Everything centred**: hero, section headings, card text, stat captions, footer.
3. **One card for everything.** White rounded box, 1 px grey border, soft shadow, hover shadow. The result page is
   about 17 of these stacked, so nothing has more weight than anything else (the result view is 9,800 px tall on mobile).
4. **Icon chips**: a lucide icon in a tinted rounded square in front of every card title (`SectionHeader`).
5. **Emoji as icons and decoration**: tool promos, footer links, fun-fact tiles, milestones, lifestyle factors, "🎉", "🎯", "💛".
6. **Grids of identical tiles** with an emoji, a number and a caption (fun facts, "Tider tilbage", pension stats).
7. **Rainbow of tints**: primary blue, green, amber, violet, rose and an orange/yellow disclaimer card on one page.
8. **SaaS countdown**: five translucent "glass" tiles (`backdrop-blur`, white/10) on the gradient.
9. **Pill progress bars** with a gradient fill (`from-primary to-primary/80`) for everything, including a "0% udfyldt" form
   progress bar nobody asked for.
10. **Selection buttons that fill with solid blue** plus an icon, subtitle and `active:scale`; floating round theme button with
    `hover:scale-110`.
11. **Promo block** of five emoji cards with `hover:scale-105` and a tinted gradient background, which looks like the product.
12. **Entrance animations** (`animate-slideUp`, `fadeIn`) on page load and on cards.
13. **Chart without a chart**: the survival odds are four bars, the comparison is five bars, the pension split a pill. The
    one thing the data can show (the shape of survival with age) is never drawn.

## Direction: a statistical bulletin with one real chart

The subject is serious and personal: a number about your own life, built from official tables. The page should read like
a good piece of data journalism or a Nordic statistics office publication: calm, plain, specific, and honest about what
the number is. Not a toy and not a dashboard.

**The memorable thing is the survival curve.** The result opens with one sentence and one large figure ("40,8 år"), and directly
under it a single chart: the share of people your age who are still alive at each age, drawn from the Danish life
table, with *now*, *expected age at death* and the 80/90/95/100 marks annotated on the line. Everything else on the page
is quiet so that this chart and the figure carry the weight.

### Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Ground | `hsl(200 20% 97.5%)` cool paper | `hsl(205 22% 8%)` |
| Ink | `hsl(215 28% 12%)` | `hsl(200 20% 93%)` |
| Muted ink | `hsl(215 14% 34%)` | `hsl(205 12% 68%)` |
| Rule | `hsl(210 14% 84%)` | `hsl(205 15% 21%)` |
| Accent (one) | `hsl(188 62% 22%)` fjord petrol | `hsl(172 42% 62%)` |

One accent, used for the *remaining* part of a life, links and the primary button. The *lived* part is neutral ink. No
gradients, no glow, no second hue. Warning/destructive keeps a muted red, used only for errors.

### Type

* **Source Serif 4** (variable, self-hosted, SIL OFL, 50 KB latin subset) for the page title, section headings and every
  large figure. Numbers are set with tabular lining figures wherever they are compared or ticking.
* **Inter** (already self-hosted) for body text, forms and labels, sentence case only.
* Scale 14 / 16 / 18 / 22 / 28 / 40 / 64 px; body 16 px / 1.6, headings 1.15 with slight negative tracking, measure about 65 ch.
  No uppercase labels except the five-letter unit labels of the countdown (`ÅR DAGE TIMER MIN SEK`), which the e2e
  snapshot reads as text.

### Layout

* **Left-aligned, asymmetric.** A slim masthead with the wordmark and the six pages as a real navigation (they were only
  reachable from the footer). Pages use a 12-column grid: a 7-8 column reading/figure column and a narrow margin
  column for notes and sources, collapsing to one column on mobile (mobile first).
* **Sections are separated by space and one rule, not boxes.** `.card` is kept as a class (the e2e capture reads
  it) but is restyled as an open section: a top rule, no fill, no shadow, no radius.
* Figures in a definition-list rhythm ("label ... value" rows with tabular numbers) instead of tile grids.
* Form: ruled fields on the page, segmented text controls (no icons, no subtitles), no progress bar.
* Ads and "other tools" are plain, clearly marked text lists. They keep every `partner-ads` attribute and tracking call.
* Radius 2 px on controls, none elsewhere. Motion: none on load; state changes only (the curve draws once on result).
* Dark mode is its own palette (not an inversion), selected by the existing `.dark` class; light is the default.

### What does not change

Calculation code (`src/utils`, `src/hooks`, `src/data`), routes and URLs, `routes.meta.js` and prerendered head,
analytics events, copy that carries a number or a source, the self-hosted font setup, `.time-unit` / `.time-value` /
`.time-label` / `.countdown-timer` / `.card` hooks used by the e2e capture.

## Checks (see `efter/` and `maalinger.md`)

* e2e numbers-only snapshots for the three test inputs unchanged (`git diff` on `e2e/__snapshots__` is empty).
* `src/utils`, `src/hooks`, `src/data` untouched (`git diff --stat origin/master -- src/utils src/hooks src/data` is empty).
* Lighthouse mobile (performance, accessibility, CLS) before and after; axe on every route, light and dark.
