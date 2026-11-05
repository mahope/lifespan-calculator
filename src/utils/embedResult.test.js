import { describe, it, expect } from 'vitest'
import { computeEmbedResult } from './embedResult'
import { LIFE_TABLE_DK } from './lifeTableDK'

describe('computeEmbedResult', () => {
  it('uses e_x straight from the Danish life table', () => {
    const r = computeEmbedResult(40, 'male')
    expect(r.remainingYears).toBe(LIFE_TABLE_DK.remaining.male[40])
    expect(r.ageAtDeath).toBeCloseTo(40 + LIFE_TABLE_DK.remaining.male[40], 10)
  })
  it('differs by sex', () => {
    expect(computeEmbedResult(30, 'female').remainingYears).toBeGreaterThan(
      computeEmbedResult(30, 'male').remainingYears
    )
  })
  it('accepts numeric strings from the form', () => {
    expect(computeEmbedResult('65', 'female')).toEqual(computeEmbedResult(65, 'female'))
  })
  it.each([[''], ['abc'], [-1], [100], [30.5], [null]])('rejects age %s', (age) => {
    expect(computeEmbedResult(age, 'male')).toBeNull()
  })
  it('rejects unknown sex', () => {
    expect(computeEmbedResult(30, '')).toBeNull()
    expect(computeEmbedResult(30, 'other')).toBeNull()
  })
})
