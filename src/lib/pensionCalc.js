// Pure helpers for /pensionsalder. Uses src/utils/pension.js unchanged; birth date
// and sex never leave the browser (no storage, no query string, no network).
import { folkepensionAge } from '../utils/pension.js'
import { remainingLifeExpectancy } from '../utils/lifeTableDK.js'

export const MIN_BIRTHDATE = '1930-01-01'

/** Parses "YYYY-MM-DD"; returns null for anything that is not a real calendar date in range. */
export function parseBirthdate(str, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str ?? '')
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (date.getTime() < Date.UTC(1930, 0, 1) || date.getTime() > todayUtc) return null
  return { y, mo, d }
}

const DAY = 86400000

/**
 * @param {string} birthdate "YYYY-MM-DD"
 * @param {'male'|'female'|''} sex optional, only used for the retirement-years estimate
 * @param {Date} today injectable for tests
 */
export function computePension(birthdate, sex, today = new Date()) {
  const b = parseBirthdate(birthdate, today)
  if (!b) return null
  const pensionYears = folkepensionAge(b.y)
  const reached = new Date(Date.UTC(b.y + pensionYears, b.mo - 1, b.d))
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysUntil = Math.round((reached.getTime() - todayUtc) / DAY)
  const ageAtReach = pensionYears
  const retirementYears = (g) => remainingLifeExpectancy(Math.max(ageAtReach, currentAge(b, today)), g)
  return {
    birthYear: b.y,
    pensionYears,
    pensionMonths: 0, // pension.js works in whole years (half-year cohorts 1954-55 are not modelled)
    reachedDate: reached.toISOString().slice(0, 10),
    daysUntil,
    alreadyReached: daysUntil <= 0,
    yearsUntil: Math.floor(Math.abs(daysUntil) / 365.25),
    retirementYears: sex ? { [sex]: retirementYears(sex) } : { male: retirementYears('male'), female: retirementYears('female') },
  }
}

function currentAge(b, today) {
  let a = today.getFullYear() - b.y
  if (today.getMonth() + 1 < b.mo || (today.getMonth() + 1 === b.mo && today.getDate() < b.d)) a--
  return a
}

/** Groups consecutive birth years with the same statutory age, e.g. 1955-1962 -> 67. */
export function ageBands(from = 1950, to = 1975) {
  const bands = []
  for (let y = from; y <= to; y++) {
    const age = folkepensionAge(y)
    const last = bands.at(-1)
    if (last && last.age === age) last.to = y
    else bands.push({ from: y, to: y, age })
  }
  return bands
}
