// Data model for the generated /levetid/{mand,kvinde}/{alder} pages. Everything
// shown on a page is computed here from the Danish life table (src/utils, HISB8
// 2024:2025) and the generated history file; the .astro template only lays it out.
import { LIFE_TABLE_DK, remainingLifeExpectancy } from '../utils/lifeTableDK.js'
import { folkepensionAge } from '../utils/pension.js'
import history from '../data/history.generated.json'
import { evaluate } from './guard.js'

export const AGES = Array.from({ length: 14 }, (_, i) => 20 + i * 5) // 20, 25, ... 85
export const SEXES = [
  { slug: 'mand', key: 'male', noun: 'mand', plural: 'mænd', other: 'kvinde' },
  { slug: 'kvinde', key: 'female', noun: 'kvinde', plural: 'kvinder', other: 'mand' },
]
const SEX_BY_SLUG = Object.fromEntries(SEXES.map((s) => [s.slug, s]))
const THRESHOLDS = [70, 80, 90, 100]
const SNAPSHOTS = [
  { period: '1981:1982', label: '1981–82' },
  { period: '2000:2001', label: '2000–01' },
  { period: '2024:2025', label: '2024–25' },
]
const REFERENCE_YEAR = new Date().getFullYear()

export const fmt1 = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const fmt0 = (n) => Math.round(n).toLocaleString('da-DK')
const pct = (p) => `${fmt1(p * 100)} %`

/** l_x as a function of (possibly fractional) age. The table ends at 99; l_100 extends it with the last yearly survival rate. */
function survivors(sexKey) {
  const t = LIFE_TABLE_DK.survivors[sexKey]
  const last = t.length - 1
  const l = (a) => {
    if (a >= last + 1) return t[last] * (t[last] / t[last - 1]) // l_100 estimate
    const lo = Math.floor(a)
    const hi = Math.min(lo + 1, last)
    return t[lo] + (t[hi] - t[lo]) * (a - lo)
  }
  return { l, last }
}

/** Age at which half of those alive at `age` are still alive (linear between years). */
export function medianDeathAge(age, sexKey) {
  const { l } = survivors(sexKey)
  const target = l(age) / 2
  for (let a = age + 1; a <= 100; a++) {
    if (l(a) <= target) {
      const prev = l(a - 1)
      return a - 1 + (prev - target) / (prev - l(a))
    }
  }
  return 100
}

/** Age at which `share` of those alive at `age` are still alive (linear between years). */
export function ageAtShare(age, share, sexKey) {
  const { l } = survivors(sexKey)
  const target = l(age) * share
  for (let a = age + 1; a <= 100; a++) {
    if (l(a) <= target) {
      const prev = l(a - 1)
      return a - 1 + (prev - target) / (prev - l(a))
    }
  }
  return 100
}

export function reachProbability(age, to, sexKey) {
  const { l } = survivors(sexKey)
  return to <= age ? 1 : l(to) / l(age)
}

export const pathFor = (sexSlug, age) => `/levetid/${sexSlug}/${age}`

function curve(age, sexKey) {
  const { l } = survivors(sexKey)
  const out = []
  for (let a = age; a <= 100; a++) out.push([a, l(a) / l(age)])
  return out
}

export function buildAgePage(sexSlug, age) {
  const sex = SEX_BY_SLUG[sexSlug]
  const other = SEXES.find((s) => s.slug !== sexSlug)
  const ex = remainingLifeExpectancy(age, sex.key)
  const exOther = remainingLifeExpectancy(age, other.key)
  const death = age + ex
  const median = medianDeathAge(age, sex.key)
  const weeks = ex * 52.1775
  const days = ex * 365.25
  const reach = THRESHOLDS.map((t) => ({ age: t, p: reachProbability(age, t, sex.key), done: t <= age }))
  const upcoming = reach.filter((r) => !r.done)
  const coin = upcoming.reduce((best, r) => (Math.abs(r.p - 0.5) < Math.abs(best.p - 0.5) ? r : best), upcoming[0])
  const hist = SNAPSHOTS.map((s) => ({ ...s, value: history[sex.key][s.period][String(age)].value }))
  const nowValue = hist[2].value
  const gain1981 = nowValue - hist[0].value
  const gain2000 = nowValue - hist[1].value
  const birthYear = REFERENCE_YEAR - age
  const pensionAge = folkepensionAge(birthYear)
  const workLeft = Math.max(0, pensionAge - age)
  const retireFrom = Math.max(age, pensionAge)
  const retirementYears = remainingLifeExpectancy(retireFrom, sex.key)
  const diffOther = ex - exOther

  const article = age === 80 || age === 85 || age === 8 ? 'en' : 'en'
  const who = `${article} ${age}-årig ${sex.noun}`

  const answer = `${who[0].toUpperCase()}${who.slice(1)} kan statistisk forvente at leve ${fmt1(ex)} år mere, så den forventede dødsalder er ${fmt1(death)} år.`
  const paragraphs = [
    `Af alle ${age}-årige ${sex.plural} i dag er halvdelen stadig i live ved ${fmt1(median)} år. Gennemsnittet (${fmt1(death)} år) og midtpunktet er ikke det samme, fordi nogle dør tidligt og trækker gennemsnittet ned. Det svarer til ${fmt0(weeks)} uger eller ${fmt0(days)} dage tilbage i gennemsnit.`,
    coin.p >= 0.5
      ? `Chancen for at fejre sin ${coin.age}-års fødselsdag er ${pct(coin.p)}, altså bedre end et møntkast. Sandsynligheden for at nå ${upcoming.at(-1).age} år er ${pct(upcoming.at(-1).p)}.`
      : `Chancen for at fejre sin ${coin.age}-års fødselsdag er ${pct(coin.p)}, altså dårligere end et møntkast. Sandsynligheden for at nå ${upcoming.at(-1).age} år er ${pct(upcoming.at(-1).p)}.`,
    `Siden 1981 er den forventede restlevetid for ${who} steget med ${fmt1(gain1981)} år (fra ${fmt1(hist[0].value)} til ${fmt1(nowValue)}), og siden 2000 med ${fmt1(gain2000)} år.`,
    diffOther >= 0
      ? `En ${age}-årig ${other.noun} har ${fmt1(exOther)} år tilbage, så ${sex.plural} på samme alder har ${fmt1(Math.abs(diffOther))} år mere.`
      : `En ${age}-årig ${other.noun} har ${fmt1(exOther)} år tilbage, så ${other.slug === 'mand' ? 'mænd' : 'kvinder'} på samme alder har ${fmt1(Math.abs(diffOther))} år mere.`,
    workLeft > 0
      ? `Med en fødselsårgang omkring ${birthYear} er folkepensionsalderen ${pensionAge} år efter de gældende regler. Der er ${workLeft} arbejdsår tilbage, og ved pensionsalderen er den forventede restlevetid ${fmt1(retirementYears)} år som pensionist.`
      : `Med en fødselsårgang omkring ${birthYear} er folkepensionsalderen ${pensionAge} år, og den er nået eller passeret. Den forventede restlevetid som pensionist er ${fmt1(ex)} år.`,
  ]

  const keyFigures = [
    ['Forventet restlevetid (e_x)', `${fmt1(ex)} år`],
    ['Forventet dødsalder', `${fmt1(death)} år`],
    ['Median dødsalder', `${fmt1(median)} år`],
    ['Uger tilbage', fmt0(weeks)],
    ['Dage tilbage', fmt0(days)],
  ]
  const shareRows = [0.9, 0.75, 0.25, 0.1].map((sh) => [`${Math.round(sh * 100)} % er i live`, `til ${fmt1(ageAtShare(age, sh, sex.key))} år`])
  const horizonRows = [10, 20, 30].map((y) => [`om ${y} år (${fmt0(age + y)} år gammel)`, pct(reachProbability(age, age + y, sex.key))])
  const reachRows = reach.map((r) => [`${r.age} år`, r.done ? 'allerede nået' : pct(r.p)])
  const historyRows = hist.map((h) => [h.label, `${fmt1(h.value)} år`, h.period === '2024:2025' ? 'i dag' : `${fmt1(nowValue - h.value)} år mindre end i dag`])
  const pensionRows = [
    ['Fødselsår (cirka)', String(birthYear)],
    ['Folkepensionsalder', `${pensionAge} år`],
    ['Arbejdsår tilbage', `${workLeft} år`],
    ['Restlevetid ved pensionsalder', `${fmt1(retirementYears)} år`],
  ]

  const caption = `Andel af ${age}-årige ${sex.plural}, der er i live ved hver alder. Halvdelen er tilbage ved ${fmt1(median)} år, og den forventede dødsalder er ${fmt1(death)} år.`
  const title = `Forventet levetid for ${who} (${fmt1(ex)} år tilbage)`
  const description = `${who[0].toUpperCase()}${who.slice(1)} har statistisk ${fmt1(ex)} år tilbage og en median dødsalder på ${fmt1(median)} år. Se sandsynlighed for at nå ${upcoming.at(-1).age} og udviklingen siden 1981.`

  const page = {
    id: pathFor(sexSlug, age),
    sex,
    other,
    age,
    title,
    description,
    h1: `Hvor længe lever ${who}?`,
    answer,
    paragraphs,
    keyFigures,
    reachRows,
    shareRows,
    horizonRows,
    historyRows,
    pensionRows,
    caption,
    curve: curve(age, sex.key),
    marks: { death, median },
    links: {
      younger: age - 5 >= AGES[0] ? pathFor(sexSlug, age - 5) : null,
      older: age + 5 <= AGES.at(-1) ? pathFor(sexSlug, age + 5) : null,
      other: pathFor(other.slug, age),
      calculator: `/?g=${sex.key}&a=${age}`,
    },
  }
  page.text = pageText(page)
  return page
}

/** The text a visitor reads (no markup, no SVG) in the order the template prints it. */
export function pageText(p) {
  return [
    p.h1,
    p.answer,
    ...p.keyFigures.flat(),
    ...p.paragraphs,
    ...p.reachRows.flat(),
    ...p.shareRows.flat(),
    ...p.horizonRows.flat(),
    ...p.historyRows.flat(),
    ...p.pensionRows.flat(),
    p.caption,
  ].join(' ')
}

let cache
export function allAgePages() {
  cache ??= SEXES.flatMap((s) => AGES.map((a) => buildAgePage(s.slug, a)))
  return cache
}

/** Neighbours for the guard: same sex age ±5 and the other sex at the same age. */
export function neighbourIds(sexSlug, age) {
  const other = SEXES.find((s) => s.slug !== sexSlug).slug
  return [pathFor(sexSlug, age - 5), pathFor(sexSlug, age + 5), pathFor(other, age)].filter((id) =>
    SEXES.some((s) => AGES.some((a) => pathFor(s.slug, a) === id)),
  )
}

export function evaluateAgePages(pages) {
  return evaluate(pages.map((p) => ({ id: p.id, text: p.text, neighbours: neighbourIds(p.sex.slug, p.age) })))
}
