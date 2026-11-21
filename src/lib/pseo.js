// Programmatic SEO pages: /restlevetid/<alder>-aarig-<mand|kvinde> (ages 20-90, DST HISB8) and
// /forventet-levealder/<kommune> (DST HISBK). Every figure on those pages is read from the committed
// DST datasets (src/data/*.generated.js, written by scripts/refresh-data.mjs); nothing is typed by hand.
// Loaded by plain Node (astro.config.mjs, scripts/gen-sitemap.mjs): relative imports carry the .js extension.
import { LIFE_TABLE_DK, LIFE_TABLE_META } from '../data/lifeTableDK.generated.js'
import { REGIONAL_DK } from '../data/lifeTableExtras.generated.js'

import {
  MIN_AGE,
  MAX_AGE,
  RESTLEVETID_HUB,
  restlevetidSlug,
  restlevetidRoute,
  parseRestlevetidSlug,
} from './restlevetidSlug.js'

export { MIN_AGE, MAX_AGE, RESTLEVETID_HUB }
export const LEVEALDER_HUB = '/forventet-levealder'
export const SURVIVAL_AGES = [60, 65, 70, 75, 80, 85, 90, 95]

// slug word -> table key and wording
export const SEXES = {
  mand: { key: 'male', noun: 'mand', plural: 'mænd', other: 'kvinde' },
  kvinde: { key: 'female', noun: 'kvinde', plural: 'kvinder', other: 'mand' },
}

export const fmtYears = (n) => n.toFixed(1).replace('.', ',')
export const fmtPct = (p) => `${(p * 100).toFixed(p < 0.1 || p > 0.9 ? 1 : 0).replace('.', ',')} %`

const periodEnd = (period) => period.split('-')[1]
// "2021-2025" -> "2021-25"
const shortPeriod = (period) => {
  const [a, b] = period.split('-')
  return `${a}-${b.slice(2)}`
}

// ---------------------------------------------------------------------------
// /restlevetid/<alder>-aarig-<køn>
// ---------------------------------------------------------------------------

export { restlevetidSlug, restlevetidRoute, parseRestlevetidSlug }

export const RESTLEVETID_AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i)

export function restlevetidFacts(age, sex) {
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE || !SEXES[sex]) {
    throw new Error(`restlevetidFacts: unsupported ${age} / ${sex}`)
  }
  const { key, other } = SEXES[sex]
  const otherKey = SEXES[other].key
  const e = LIFE_TABLE_DK.remaining[key][age]
  const eOther = LIFE_TABLE_DK.remaining[otherKey][age]
  const survivors = LIFE_TABLE_DK.survivors[key]
  return {
    age,
    sex,
    e,
    eOther,
    eAverage: (e + eOther) / 2,
    expectedAge: age + e,
    diffOther: eOther - e,
    survival: SURVIVAL_AGES.filter((toAge) => toAge > age).map((toAge) => ({
      toAge,
      probability: survivors[toAge] / survivors[age],
    })),
    period: LIFE_TABLE_META.period,
    tableUpdated: LIFE_TABLE_META.tableUpdated.slice(0, 10),
    retrieved: LIFE_TABLE_META.retrieved,
  }
}

export function restlevetidMeta(age, sex) {
  const f = restlevetidFacts(age, sex)
  const { noun, plural } = SEXES[sex]
  const year = periodEnd(f.period)
  const route = restlevetidRoute(age, sex)
  return {
    title: `Restlevetid for en ${age}-årig ${noun}: ${fmtYears(f.e)} år (DST ${year})`,
    description:
      `En ${age}-årig ${noun} har statistisk ${fmtYears(f.e)} år tilbage og bliver i gennemsnit ${fmtYears(f.expectedAge)} år. ` +
      `${SEXES[sex].other === 'mand' ? 'Mænd' : 'Kvinder'} på ${age}: ${fmtYears(f.eOther)} år. Danmarks Statistik (HISB8, ${f.period}).`,
    keywords: `restlevetid ${age} årig ${noun}, restlevetid ${plural}, forventet restlevetid, forventet levealder ${age} år`,
    ogTitle: `Restlevetid for en ${age}-årig ${noun}: ${fmtYears(f.e)} år`,
    ogDescription: `Forventet restlevetid og forventet alder for en ${age}-årig ${noun}, fra Danmarks Statistiks dødelighedstavler.`,
    breadcrumbs: [
      { name: 'Forside', url: '/' },
      { name: 'Restlevetid', url: RESTLEVETID_HUB },
      { name: `${age}-årig ${noun}`, url: route },
    ],
    noindex: false,
  }
}

// ---------------------------------------------------------------------------
// /forventet-levealder/<kommune>
// ---------------------------------------------------------------------------

const ASCII = { æ: 'ae', ø: 'oe', å: 'aa', é: 'e', ü: 'u' }
export const kommuneSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[æøåéü]/g, (c) => ASCII[c])
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '')

const NATIONAL_CODE = '000'
let kommunerCache
// Municipalities with published figures (HISBK suppresses a few small ones), ranked by life expectancy at birth.
export function kommuner() {
  if (!kommunerCache) {
    const list = Object.entries(REGIONAL_DK.municipalities.areas)
      .filter(([code]) => code !== NATIONAL_CODE)
      .map(([code, a]) => ({
        code,
        name: a.name,
        slug: kommuneSlug(a.name),
        total: a.total,
        male: a.male,
        female: a.female,
      }))
    kommunerCache = list.map((k) => ({
      ...k,
      rank: 1 + list.filter((o) => o.total > k.total).length,
      // HISBK has one decimal, so several municipalities can share a figure and with it a rank.
      shared: list.filter((o) => o.total === k.total).length > 1,
    }))
  }
  return kommunerCache
}

export const rankLabel = (k) => `${k.shared ? 'delt nr.' : 'nr.'} ${k.rank}`

// Names of every municipality with the highest/lowest figure, e.g. "Gentofte og Lyngby-Taarbæk".
export function extremeNames(list, which) {
  const value = Math[which === 'best' ? 'max' : 'min'](...list.map((k) => k.total))
  const names = list.filter((k) => k.total === value).map((k) => k.name).sort((a, b) => a.localeCompare(b, 'da'))
  return { names: names.length > 1 ? `${names.slice(0, -1).join(', ')} og ${names.at(-1)}` : names[0], total: value }
}

export const kommuneRoute = (slug) => `${LEVEALDER_HUB}/${slug}`
export const kommunePeriod = () => REGIONAL_DK.municipalities.period

export function kommuneFacts(slug) {
  const list = kommuner()
  const k = list.find((x) => x.slug === slug)
  if (!k) throw new Error(`kommuneFacts: unknown municipality ${slug}`)
  const sorted = [...list].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'da'))
  const i = sorted.findIndex((x) => x.slug === slug)
  const from = Math.max(0, Math.min(i - 2, sorted.length - 5))
  const nearby = sorted.slice(from, from + 5)
  // HISBK carries the national figure for the same period as the municipalities (area 000, "Hele landet").
  const country = REGIONAL_DK.municipalities.areas[NATIONAL_CODE]
  return {
    ...k,
    count: list.length,
    best: extremeNames(list, 'best'),
    worst: extremeNames(list, 'worst'),
    nearby,
    sexGap: k.female - k.male,
    period: REGIONAL_DK.municipalities.period,
    tableUpdated: REGIONAL_DK.municipalities.tableUpdated.slice(0, 10),
    country: { ...country, period: REGIONAL_DK.municipalities.period },
  }
}

export function kommuneMeta(slug) {
  const f = kommuneFacts(slug)
  const long = `Forventet levealder i ${f.name}: ${fmtYears(f.total)} år (DST ${shortPeriod(f.period)})`
  return {
    title: long.length <= 60 ? long : `Forventet levealder i ${f.name}: ${fmtYears(f.total)} år`,
    description:
      `Forventet levealder i ${f.name}: mænd ${fmtYears(f.male)} år, kvinder ${fmtYears(f.female)} år ved fødslen, ` +
      `${rankLabel(f)} af ${f.count} kommuner. Danmarks Statistik (HISBK, ${f.period}).`,
    keywords: `forventet levealder ${f.name}, levealder ${f.name} kommune, middellevetid ${f.name}`,
    ogTitle: `Forventet levealder i ${f.name}: ${fmtYears(f.total)} år`,
    ogDescription: `Forventet levealder for mænd og kvinder i ${f.name} Kommune, fra Danmarks Statistik.`,
    breadcrumbs: [
      { name: 'Forside', url: '/' },
      { name: 'Forventet levealder', url: LEVEALDER_HUB },
      { name: f.name, url: kommuneRoute(slug) },
    ],
    noindex: false,
  }
}

// ---------------------------------------------------------------------------
// Route list and meta lookup (used by the sitemap, the build checks and layouts/Base.astro)
// ---------------------------------------------------------------------------

export const PSEO_ROUTES = [
  ...RESTLEVETID_AGES.flatMap((age) => Object.keys(SEXES).map((sex) => restlevetidRoute(age, sex))),
  ...kommuner().map((k) => kommuneRoute(k.slug)),
]

export function pseoMeta(route) {
  if (route.startsWith(`${RESTLEVETID_HUB}/`)) {
    const p = parseRestlevetidSlug(route.slice(RESTLEVETID_HUB.length + 1))
    return p ? restlevetidMeta(p.age, p.sex) : null
  }
  if (route.startsWith(`${LEVEALDER_HUB}/`)) {
    const slug = route.slice(LEVEALDER_HUB.length + 1)
    return kommuner().some((k) => k.slug === slug) ? kommuneMeta(slug) : null
  }
  return null
}
