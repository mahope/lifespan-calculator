// Slugs of the /restlevetid/<alder>-aarig-<køn> pages. Kept free of data imports so the calculator island can
// link to the matching page without pulling the DST datasets into its bundle (src/lib/pseo.js re-exports these).

export const MIN_AGE = 20
export const MAX_AGE = 90
export const RESTLEVETID_HUB = '/restlevetid'

export const restlevetidSlug = (age, sex) => `${age}-aarig-${sex}`
export const restlevetidRoute = (age, sex) => `${RESTLEVETID_HUB}/${restlevetidSlug(age, sex)}`

export function parseRestlevetidSlug(slug) {
  const m = /^([1-9]\d)-aarig-(mand|kvinde)$/.exec(String(slug))
  if (!m) return null
  const age = Number(m[1])
  return age >= MIN_AGE && age <= MAX_AGE ? { age, sex: m[2] } : null
}

// The page matching a calculator result (whole years, gender 'male' | 'female'), or null outside 20-90.
export function restlevetidPathFor(age, gender) {
  const sex = gender === 'male' ? 'mand' : gender === 'female' ? 'kvinde' : null
  return sex && Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE ? restlevetidRoute(age, sex) : null
}
