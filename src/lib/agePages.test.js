import { describe, it, expect } from 'vitest'
import { allAgePages, buildAgePage, evaluateAgePages, medianDeathAge, reachProbability, AGES } from './agePages.js'
import { remainingLifeExpectancy } from '../utils/lifeTableDK.js'
import history from '../data/history.generated.json'

describe('age pages', () => {
  it('covers 20-85 in 5-year steps for both sexes (28 pages) incl. the required ones', () => {
    const ids = allAgePages().map((p) => p.id)
    expect(ids).toHaveLength(28)
    for (const id of ['/levetid/mand/40', '/levetid/kvinde/65', '/levetid/mand/45', '/levetid/kvinde/60']) expect(ids).toContain(id)
    expect(AGES[0]).toBe(20)
    expect(AGES.at(-1)).toBe(85)
  })

  it('uses e_x straight from the life table', () => {
    const p = buildAgePage('mand', 40)
    expect(p.keyFigures[0][1]).toBe(`${remainingLifeExpectancy(40, 'male').toFixed(1).replace('.', ',')} år`)
  })

  it('history for today equals the committed life table (same HISB8 period)', () => {
    for (const sex of ['male', 'female']) {
      for (const age of [20, 40, 65, 85]) {
        expect(history[sex]['2024:2025'][age].value).toBeCloseTo(remainingLifeExpectancy(age, sex), 2)
      }
    }
  })

  it('median death age lies between e_x death age and 100 and grows with age', () => {
    const m40 = medianDeathAge(40, 'male')
    const m65 = medianDeathAge(65, 'male')
    expect(m40).toBeGreaterThan(40 + remainingLifeExpectancy(40, 'male') - 5)
    expect(m65).toBeGreaterThan(m40)
    expect(m65).toBeLessThan(100)
  })

  it('reach probabilities fall with the threshold and are 1 for passed ages', () => {
    const p = [70, 80, 90, 100].map((t) => reachProbability(40, t, 'female'))
    expect(p[0]).toBeGreaterThan(p[1])
    expect(p[2]).toBeGreaterThan(p[3])
    expect(reachProbability(85, 70, 'male')).toBe(1)
  })

  it('all required pages pass the thin-content guard', () => {
    const res = evaluateAgePages(allAgePages())
    const failing = res.filter((r) => !r.pass)
    expect(failing, JSON.stringify(failing)).toEqual([])
  })
})
