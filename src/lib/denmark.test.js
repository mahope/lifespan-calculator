import { describe, it, expect } from 'vitest'
import national from '../data/national.generated.json'
import kommuner from '../data/kommuner.generated.json'
import regions from '../data/regions.generated.json'
import { nationalFigures, trend, regionRows, kommuneRanking, fmt1 } from './denmark.js'
import { remainingLifeExpectancy } from '../utils/lifeTableDK.js'

const stamped = (x) => x && typeof x.value !== 'undefined' && x.period && x.source && x.retrieved

describe('generated data files', () => {
  it('every figure carries { value, period, source, retrieved }', () => {
    const all = [
      ...national.e0.male, ...national.e0.female, ...national.e65.male, ...national.e65.female,
      ...Object.values(regions).flatMap(Object.values),
      ...Object.values(kommuner).flatMap(Object.values),
    ]
    expect(all.length).toBeGreaterThan(300)
    expect(all.every(stamped)).toBe(true)
  })

  it('national e0/e65 for the latest period equal the committed life table (same HISB8 period)', () => {
    const n = nationalFigures()
    expect(n.e0.male.period).toBe('2024:2025')
    expect(n.e0.male.value).toBeCloseTo(remainingLifeExpectancy(0, 'male'), 2)
    expect(n.e65.female.value).toBeCloseTo(remainingLifeExpectancy(65, 'female'), 2)
  })

  it('trend has one row per HISB8 period, 1981 to 2024', () => {
    const t = trend()
    expect(t[0].year).toBe(1981)
    expect(t.at(-1).year).toBe(2024)
    expect(t.every((r) => r.male > 60 && r.female > r.male)).toBe(true)
  })
})

describe('view-model numbers come from the data', () => {
  it('regions: 5, sorted by total, every number in the file', () => {
    const rows = regionRows()
    expect(rows).toHaveLength(5)
    expect(rows.map((r) => r.total.value)).toEqual([...rows.map((r) => r.total.value)].sort((a, b) => b - a))
    const fileValues = new Set(Object.values(regions).flatMap((r) => Object.values(r).map((x) => fmt1(x.value))))
    for (const r of rows) for (const k of ['total', 'male', 'female']) expect(fileValues.has(fmt1(r[k].value))).toBe(true)
  })

  it('kommuner: ranked with data + suppressed areas listed separately, nothing lost', () => {
    const k = kommuneRanking()
    expect(k.count + k.without.length).toBe(Object.keys(kommuner).length)
    expect(k.without.length).toBe(5)
    expect(k.by.total).toHaveLength(k.count)
    expect(k.by.total[0].ranks.total).toBe(1)
    expect(k.by.male.map((r) => r.male.value)).toEqual([...k.by.male.map((r) => r.male.value)].sort((a, b) => b - a))
    expect(k.by.total.every((r) => r.total.value > 70 && r.total.value < 90)).toBe(true)
  })
})
