// View-model for the Denmark pages. Every figure comes from src/data/*.generated.json
// (written by scripts/fetch-dst.mjs); nothing is typed into the templates.
import national from '../data/national.generated.json'
import regions from '../data/regions.generated.json'
import kommuner from '../data/kommuner.generated.json'

export const fmt1 = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const startYear = (period) => Number(period.split(':')[0])
const endYear = (period) => Number(period.split(':')[1])
export const periodLabel = (period) => period.replace(':', '–')

const latest = (arr) => arr.at(-1)
export function nationalFigures() {
  return {
    e0: { male: latest(national.e0.male), female: latest(national.e0.female) },
    e65: { male: latest(national.e65.male), female: latest(national.e65.female) },
  }
}

/** e0 trend per period for both sexes, from HISB8. */
export function trend() {
  return national.e0.male.map((m, i) => ({
    period: m.period,
    year: startYear(m.period),
    male: m.value,
    female: national.e0.female[i].value,
  }))
}

export function regionRows() {
  return Object.entries(regions)
    .map(([name, v]) => ({ name: name.replace(/^Region /, ''), total: v.total, male: v.male, female: v.female }))
    .sort((a, b) => b.total.value - a.total.value)
}

/** All kommuner with ranks (1 = highest) among those with data; suppressed areas are returned separately. */
export function kommuneRanking() {
  const rows = Object.entries(kommuner).map(([name, v]) => ({ name, total: v.total, male: v.male, female: v.female }))
  const withData = rows.filter((r) => r.total.value != null)
  const without = rows.filter((r) => r.total.value == null).map((r) => r.name).sort((a, b) => a.localeCompare(b, 'da'))
  const rank = (key) => {
    const sorted = [...withData].sort((a, b) => b[key].value - a[key].value)
    const out = new Map()
    sorted.forEach((r, i) => out.set(r.name, i > 0 && sorted[i - 1][key].value === r[key].value ? out.get(sorted[i - 1].name) : i + 1))
    return out
  }
  const ranks = { total: rank('total'), male: rank('male'), female: rank('female') }
  const sortedBy = (key) =>
    [...withData].sort((a, b) => b[key].value - a[key].value || a.name.localeCompare(b.name, 'da')).map((r) => ({ ...r, ranks: { total: ranks.total.get(r.name), male: ranks.male.get(r.name), female: ranks.female.get(r.name) } }))
  return { count: withData.length, without, by: { total: sortedBy('total'), male: sortedBy('male'), female: sortedBy('female') }, period: withData[0].total.period }
}

export const dataMeta = () => {
  const n = nationalFigures()
  return { retrieved: n.e0.male.retrieved, firstYear: startYear(national.e0.male[0].period), lastYear: endYear(latest(national.e0.male).period) }
}
