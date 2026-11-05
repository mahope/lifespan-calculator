import { describe, it, expect } from 'vitest'
import { computeEmbedResult } from './embedResult'
import { computeResult } from './lifespanMath'
import { remainingLifeExpectancy } from './lifeTableDK'

describe('computeEmbedResult', () => {
  it('uses e_x at mid-year age, like the main calculator', () => {
    const r = computeEmbedResult(40, 'male')
    expect(r.remainingYears).toBeCloseTo(remainingLifeExpectancy(40.5, 'male'), 1)
    expect(r.ageAtDeath).toBeCloseTo(40.5 + remainingLifeExpectancy(40.5, 'male'), 1)
  })
  it.each(['male', 'female'])('equals computeResult for ages 0..110 (%s)', (gender) => {
    for (let age = 0; age <= 110; age++) {
      const main = computeResult({ ageOrBirthdate: age, gender, lifestyleFactors: {} }, new Date())
      const embed = computeEmbedResult(age, gender)
      expect(embed.remainingYears).toBe(Number(main.remainingYears))
      expect(embed.ageAtDeath).toBe(Number(main.adjustedLifeExpectancy))
    }
  })
  it('differs by sex', () => {
    expect(computeEmbedResult(30, 'female').remainingYears).toBeGreaterThan(
      computeEmbedResult(30, 'male').remainingYears
    )
  })
  it('accepts numeric strings from the form', () => {
    expect(computeEmbedResult('65', 'female')).toEqual(computeEmbedResult(65, 'female'))
  })
  it.each([[''], ['abc'], [-1], [111], [30.5], [null]])('rejects age %s', (age) => {
    expect(computeEmbedResult(age, 'male')).toBeNull()
  })
  it('rejects unknown sex', () => {
    expect(computeEmbedResult(30, '')).toBeNull()
    expect(computeEmbedResult(30, 'other')).toBeNull()
  })
})
