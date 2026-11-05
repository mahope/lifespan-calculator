// Thin-content guard for generated pages (issue #89). A page passes only if
//   1. it shows at least MIN_UNIQUE_NUMBERS numbers that none of its neighbours show, and
//   2. its 5-word-shingle Jaccard similarity to every neighbour is below MAX_SIMILARITY.
// Pure functions: the same code runs on the data model at render time (noindex and
// sitemap) and on the finished HTML after the build (scripts/check-guard.mjs).

export const MIN_UNIQUE_NUMBERS = 8
export const MAX_SIMILARITY = 0.6
export const SHINGLE_SIZE = 5

/** Distinct numeric tokens in a text, e.g. "81,2", "40", "1981". */
export function numbersIn(text) {
  return new Set(text.match(/\d+(?:[.,]\d+)?/g) ?? [])
}

function words(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean)
}

export function shingles(text, size = SHINGLE_SIZE) {
  const w = words(text)
  const out = new Set()
  for (let i = 0; i + size <= w.length; i++) out.add(w.slice(i, i + size).join(' '))
  return out
}

export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

/**
 * @param {{id: string, text: string, neighbours: string[]}[]} pages
 * @returns {{id: string, uniqueNumbers: number, maxSimilarity: number, pass: boolean, reasons: string[]}[]}
 */
export function evaluate(pages) {
  const byId = new Map(pages.map((p) => [p.id, { ...p, nums: numbersIn(p.text), sh: shingles(p.text) }]))
  return pages.map((p) => {
    const me = byId.get(p.id)
    const neigh = p.neighbours.map((n) => byId.get(n)).filter(Boolean)
    const others = new Set(neigh.flatMap((n) => [...n.nums]))
    const uniqueNumbers = [...me.nums].filter((n) => !others.has(n)).length
    const maxSimilarity = neigh.reduce((m, n) => Math.max(m, jaccard(me.sh, n.sh)), 0)
    const reasons = []
    if (uniqueNumbers < MIN_UNIQUE_NUMBERS) reasons.push(`only ${uniqueNumbers} numbers not on neighbours (need ${MIN_UNIQUE_NUMBERS})`)
    if (maxSimilarity > MAX_SIMILARITY) reasons.push(`shingle similarity ${maxSimilarity.toFixed(2)} > ${MAX_SIMILARITY}`)
    return { id: p.id, uniqueNumbers, maxSimilarity, pass: reasons.length === 0, reasons }
  })
}
