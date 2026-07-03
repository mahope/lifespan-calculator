// Danish statutory state-pension age (folkepensionsalder) by birth year.
// Verified against borger.dk / pensionforalle.dk (2026):
//   1955–1962 → 67, 1963–1966 → 68, 1967–1970 → 69, 1971+ → 70.
// Earlier cohorts (already retired) use their historical phased ages; the age
// can be raised further by law for those born 1975 or later.
export function folkepensionAge(birthYear) {
  if (birthYear <= 1953) return 65;
  if (birthYear === 1954) return 66; // phased 65–66½
  if (birthYear <= 1962) return 67;
  if (birthYear <= 1966) return 68;
  if (birthYear <= 1970) return 69;
  return 70;
}
