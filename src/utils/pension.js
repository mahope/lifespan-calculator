// Danish statutory state-pension age (folkepensionsalder) by birth date.
// Source: borger.dk "Før du går på folkepension", as of 2026-11-05, and
// Lov nr. 703 af 20. juni 2025 (69 for births 1967-1970, 70 from 1971):
//   <= 1953 → 65, 1954 H1 → 65½, 1954 H2 → 66, 1955 H1 → 66½,
//   1955 H2-1962 → 67, 1963-1966 → 68, 1967-1970 → 69, 1971+ → 70.
// Earlier cohorts (already retired) use their historical ages; the age can be
// raised further by law for those born 1975 or later.
// Efterløn (borger.dk, same date): 1956 H2-1958 → 63, 1959 H1 → 63½,
// 1959 H2-1962 → 64, 1963-1966 → 65, 1967-1970 → 66; later cohorts are not fixed.

/** Statutory age for a birth year and half (1 = Jan-Jun, 2 = Jul-Dec). */
function pensionAgeFor(year, half) {
  if (year <= 1953) return 65;
  if (year === 1954) return half === 1 ? 65.5 : 66;
  if (year === 1955) return half === 1 ? 66.5 : 67;
  if (year <= 1962) return 67;
  if (year <= 1966) return 68;
  if (year <= 1970) return 69;
  return 70;
}

/**
 * Efterløn age for a cohort: a number, `null` when not yet fixed (1971 and later)
 * and `undefined` when the table does not cover the cohort (before 1956 H2).
 */
function efterloenAgeFor(year, half) {
  if (year < 1956 || (year === 1956 && half === 1)) return undefined;
  if (year <= 1958) return 63;
  if (year === 1959) return half === 1 ? 63.5 : 64;
  if (year <= 1962) return 64;
  if (year <= 1966) return 65;
  if (year <= 1970) return 66;
  return null;
}

const halfOf = (month) => (month <= 6 ? 1 : 2);

/**
 * Pension age for a birth year alone. For the two split years (1954, 1955) this is
 * the later half-year's age; use `folkepensionAgeOn` when the month is known.
 */
export function folkepensionAge(birthYear) {
  return pensionAgeFor(birthYear, 2);
}

/** Exact statutory pension age for a birth year and month (1-12). */
export function folkepensionAgeOn(birthYear, birthMonth) {
  return pensionAgeFor(birthYear, halfOf(birthMonth));
}

/** Efterløn age for a birth year and month (1-12); see `efterloenAgeFor`. */
export function efterloenAgeOn(birthYear, birthMonth) {
  return efterloenAgeFor(birthYear, halfOf(birthMonth));
}

const fmtAge = (n) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);
const fmtRange = (min, max) => (min === max ? fmtAge(min) : `${fmtAge(min)}-${fmtAge(max)} år`);

/**
 * Pension cohort info for the UI.
 *
 * With a known birth year and month the cohort is exact. With only a birth year
 * (or in age mode: whole years, no birthdate, where the birth year is `now - age`
 * or one earlier) the pension age is ambiguous at cohort boundaries and shown as
 * a range such as "67-68 år"; `pensionAge` is then the midpoint.
 *
 * `efterloen` is the efterløn age label, 'ikke fastsat' for 1971 and later, or
 * null when the cohort is outside the table (so the UI can hide it).
 *
 * @param {{birthYear?: number|null, birthMonth?: number|null, age: number, now?: Date}} input
 */
export function pensionCohort({ birthYear = null, birthMonth = null, age, now = new Date() }) {
  const birthYears =
    Number.isFinite(birthYear)
      ? [birthYear]
      : (() => {
          const y = now.getFullYear() - Math.floor(age);
          return [y - 1, y];
        })();
  const halves = Number.isFinite(birthYear) && Number.isFinite(birthMonth) ? [halfOf(birthMonth)] : [1, 2];
  const cohorts = birthYears.flatMap((y) => halves.map((h) => [y, h]));

  const ages = cohorts.map(([y, h]) => pensionAgeFor(y, h));
  const min = Math.min(...ages);
  const max = Math.max(...ages);

  const efter = cohorts.map(([y, h]) => efterloenAgeFor(y, h)).filter((v) => v !== undefined);
  const efterNumbers = efter.filter((v) => v !== null);
  let efterloen = null;
  if (efter.length) {
    if (!efterNumbers.length) efterloen = 'ikke fastsat';
    else {
      const lo = Math.min(...efterNumbers);
      const hi = Math.max(...efterNumbers);
      efterloen = efterNumbers.length < efter.length ? `${fmtAge(lo)} eller ikke fastsat` : fmtRange(lo, hi);
    }
  }

  return {
    birthYears,
    pensionAge: (min + max) / 2,
    ambiguous: min !== max,
    label: fmtRange(min, max),
    efterloen,
  };
}
