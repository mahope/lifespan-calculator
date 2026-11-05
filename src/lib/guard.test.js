import { describe, it, expect } from 'vitest'
import { evaluate, numbersIn, shingles, jaccard } from './guard.js'
import { buildAgePage, neighbourIds, allAgePages, evaluateAgePages } from './agePages.js'

describe('guard primitives', () => {
  it('extracts Danish decimal numbers once', () => {
    expect([...numbersIn('41,2 år og 41,2 igen, 2.151 uger')].sort()).toEqual(['2.151', '41,2'])
  })
  it('jaccard of identical shingle sets is 1 and of disjoint sets is 0', () => {
    const a = shingles('en to tre fire fem seks syv')
    expect(jaccard(a, a)).toBe(1)
    expect(jaccard(a, shingles('alfa beta gamma delta epsilon zeta eta'))).toBe(0)
  })
})

describe('guard on pages', () => {
  const real = (sex, age) => buildAgePage(sex, age)

  it('passes real neighbouring pages', () => {
    const pages = [real('mand', 40), real('mand', 45), real('mand', 35), real('kvinde', 40)]
    const res = evaluate(pages.map((p) => ({ id: p.id, text: p.text, neighbours: pages.filter((q) => q !== p).map((q) => q.id) })))
    expect(res.every((r) => r.pass)).toBe(true)
  })

  it('FAILS a deliberately duplicated page (same text as its neighbour)', () => {
    const a = real('mand', 40)
    const b = real('mand', 45)
    const dup = { ...b, id: '/levetid/mand/45', text: a.text }
    const res = evaluate([
      { id: a.id, text: a.text, neighbours: [dup.id] },
      { id: dup.id, text: dup.text, neighbours: [a.id] },
    ])
    expect(res.map((r) => r.pass)).toEqual([false, false])
    expect(res[1].maxSimilarity).toBe(1)
    expect(res[1].uniqueNumbers).toBe(0)
    expect(res[1].reasons.join(' ')).toMatch(/similarity/)
  })

  it('FAILS a template page where only one number is swapped', () => {
    const a = real('mand', 40)
    const swapped = a.text.replace('41,2', '39,9')
    const res = evaluate([
      { id: 'a', text: a.text, neighbours: ['b'] },
      { id: 'b', text: swapped, neighbours: ['a'] },
    ])
    expect(res[1].pass).toBe(false)
    expect(res[1].uniqueNumbers).toBeLessThan(8)
  })

  it('every generated page has 3 neighbours at most and all 28 pages pass', () => {
    expect(neighbourIds('mand', 40)).toEqual(['/levetid/mand/35', '/levetid/mand/45', '/levetid/kvinde/40'])
    expect(neighbourIds('mand', 20)).toEqual(['/levetid/mand/25', '/levetid/kvinde/20'])
    expect(evaluateAgePages(allAgePages()).filter((r) => !r.pass)).toEqual([])
  })
})
