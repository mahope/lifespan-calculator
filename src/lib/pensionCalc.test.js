import { describe, it, expect } from 'vitest'
import { remainingLifeExpectancy } from '../utils/lifeTableDK.js'
import { computePension, parseBirthdate, ageBands } from './pensionCalc.js'

const TODAY = new Date(2026, 10, 5) // 5 Nov 2026

// Boundary dates from issue #97. pension.js works in whole years per birth year,
// so the half-year cohorts (1954 H1/H2, 1955 H1) cannot show a different age yet.
// Those rows document today's behaviour; they must change when the calc-fixes land.
const CASES = [
  ['1954-06-30', 66, '2020-06-30'],
  ['1954-07-01', 66, '2020-07-01'],
  ['1955-06-30', 67, '2022-06-30'],
  ['1955-07-01', 67, '2022-07-01'],
  ['1962-12-31', 67, '2029-12-31'],
  ['1963-01-01', 68, '2031-01-01'],
  ['1966-12-31', 68, '2034-12-31'],
  ['1967-01-01', 69, '2036-01-01'],
  ['1970-12-31', 69, '2039-12-31'],
  ['1971-01-01', 70, '2041-01-01'],
]

describe('computePension', () => {
  it.each(CASES)('born %s -> %i years, reached %s', (born, age, reached) => {
    const r = computePension(born, 'male', TODAY)
    expect(r.pensionYears).toBe(age)
    expect(r.pensionMonths).toBe(0)
    expect(r.reachedDate).toBe(reached)
  })

  it('counts days until the date and flags already reached', () => {
    const future = computePension('1990-01-01', '', TODAY)
    expect(future.alreadyReached).toBe(false)
    expect(future.daysUntil).toBeGreaterThan(5000)
    expect(Object.keys(future.retirementYears).sort()).toEqual(['female', 'male'])
    const past = computePension('1955-07-01', 'female', TODAY)
    expect(past.alreadyReached).toBe(true)
    expect(Object.keys(past.retirementYears)).toEqual(['female'])
  })

  it('uses the period table at the pension age for people who have not reached it', () => {
    const r = computePension('1990-01-01', 'male', TODAY)
    expect(r.pensionYears).toBe(70)
    expect(r.retirementYears.male).toBe(remainingLifeExpectancy(70, 'male'))
  })
})

describe('parseBirthdate', () => {
  it('rejects non-dates, impossible dates and dates outside 1930..today', () => {
    expect(parseBirthdate('', TODAY)).toBeNull()
    expect(parseBirthdate('1990-02-30', TODAY)).toBeNull()
    expect(parseBirthdate('1929-12-31', TODAY)).toBeNull()
    expect(parseBirthdate('2026-11-06', TODAY)).toBeNull()
    expect(parseBirthdate('2026-11-05', TODAY)).toEqual({ y: 2026, mo: 11, d: 5 })
    expect(parseBirthdate('1930-01-01', TODAY)).toEqual({ y: 1930, mo: 1, d: 1 })
  })
})

describe('ageBands', () => {
  it('groups cohorts from pension.js', () => {
    const bands = ageBands(1950, 1975)
    expect(bands.map((b) => [b.from, b.to, b.age])).toEqual([
      [1950, 1953, 65],
      [1954, 1954, 66],
      [1955, 1962, 67],
      [1963, 1966, 68],
      [1967, 1970, 69],
      [1971, 1975, 70],
    ])
  })
})
