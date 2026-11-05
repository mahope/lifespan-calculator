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

/**
 * Pension cohort info for the UI.
 *
 * With a known birth year the cohort is exact. In age mode (whole years, no
 * birthdate) the birth year is either `now - age` (birthday already passed) or
 * one earlier, so at a cohort boundary the pension age is ambiguous and shown
 * as a range such as "67-68 år"; `pensionAge` is then the midpoint.
 *
 * @param {{birthYear?: number|null, age: number, now?: Date}} input
 */
export function pensionCohort({ birthYear = null, age, now = new Date() }) {
  const birthYears =
    Number.isFinite(birthYear)
      ? [birthYear]
      : (() => {
          const y = now.getFullYear() - Math.floor(age);
          return [y - 1, y];
        })();
  const ages = birthYears.map(folkepensionAge);
  const min = Math.min(...ages);
  const max = Math.max(...ages);
  const ambiguous = min !== max;
  return {
    birthYears,
    pensionAge: (min + max) / 2,
    ambiguous,
    label: ambiguous ? `${min}-${max} år` : String(min),
  };
}
