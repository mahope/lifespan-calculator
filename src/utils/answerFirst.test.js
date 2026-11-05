import { describe, it, expect } from 'vitest'
import { LIFE_TABLE_DK, LIFE_TABLE_META } from './lifeTableDK'
import { answerFirst, SOURCE } from './answerFirst'

const fmt = (n) => `${n.toFixed(1).replace('.', ',')} år`
const e = (age, g) => LIFE_TABLE_DK.remaining[g][age]

describe('answerFirst', () => {
  it('danmark: birth and age-40 figures equal the table values, with source', () => {
    const t = answerFirst.danmark()
    for (const v of [e(0, 'male'), e(0, 'female'), e(40, 'male'), e(40, 'female')]) expect(t).toContain(fmt(v))
    expect(t).toContain(SOURCE)
    expect(SOURCE).toContain(LIFE_TABLE_META.period)
  })
  it('danmark: matches independently typed control values', () => {
    const t = answerFirst.danmark()
    expect(t).toContain('80,3 år')
    expect(t).toContain('83,9 år')
    expect(t).toContain('41,2 år')
  })
  it('hvorLangTid: remaining years at 40 and 60', () => {
    const t = answerFirst.hvorLangTid()
    for (const a of [40, 60]) for (const g of ['male', 'female']) expect(t).toContain(fmt(e(a, g)))
  })
  it('dodsalder: age at death is age + remaining', () => {
    const t = answerFirst.dodsalder()
    expect(t).toContain(fmt(40 + e(40, 'male')))
    expect(t).toContain(fmt(40 + e(40, 'female')))
  })
  it('livsstil: repeats no birth figures from the Danmark page', () => {
    const t = answerFirst.livsstil()
    expect(t).not.toContain(fmt(e(0, 'male')))
    expect(t).not.toContain(fmt(e(0, 'female')))
    expect(t).not.toMatch(/\d/)
  })
})
