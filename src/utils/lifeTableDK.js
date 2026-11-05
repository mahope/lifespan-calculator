// Danish period life table (Danmarks Statistik, table HISB8). The data itself lives in
// src/data/lifeTableDK.generated.js, written by `node scripts/refresh-data.mjs dst`
// (see docs/data-refresh.md); the period is LIFE_TABLE_META.period.
// Index = age: remaining (e_x, expected remaining years) 0..99, survivors (l_x, of
// 100,000 born how many are alive at age x) 0..100.
// The survivors arrays carry a 101st entry, l_100 = l_99 * (1 - q_99), derived from the
// HISB8 q_99 (per 100,000) by the generator: 1392 * 0.58812 = 819 (men) and
// 4095 * 0.65909 = 2699 (women) for the current period. It lets P(reach 100) differ
// from P(reach 99). e_x stops at 99; older ages use e_99 (the tail rule).

import { boundLifestyleAdjustment } from './lifespanMath';
import { COHORT_TABLE } from '../data/cohortTable.generated';
import { LIFE_TABLE_DK, LIFE_TABLE_META } from '../data/lifeTableDK.generated';

export { LIFE_TABLE_DK, LIFE_TABLE_META };

function pick(group, gender) {
  return LIFE_TABLE_DK[group][gender] || LIFE_TABLE_DK[group].male;
}

/** Remaining life expectancy (e_x) at an exact age, linearly interpolated. */
export function remainingLifeExpectancy(age, gender) {
  const t = pick('remaining', gender);
  if (!Number.isFinite(age) || age <= 0) return t[0];
  if (age >= t.length - 1) return t[t.length - 1];
  const lo = Math.floor(age);
  return t[lo] + (t[lo + 1] - t[lo]) * (age - lo);
}

/** Projected (cohort) remaining life expectancy at an exact age, from DST FRDK426. */
export function projectedRemainingLifeExpectancy(age, gender) {
  const t = COHORT_TABLE.remaining[gender] || COHORT_TABLE.remaining.male;
  if (!Number.isFinite(age) || age <= 0) return t[0];
  if (age >= t.length - 1) return t[t.length - 1];
  const lo = Math.floor(age);
  return t[lo] + (t[lo + 1] - t[lo]) * (age - lo);
}

/** Projected figures are only offered below this age (#92). */
export const PROJECTION_MAX_AGE = 70;

/**
 * The table behind a result: 'projected' only when asked for AND the age is
 * below PROJECTION_MAX_AGE, otherwise the period table.
 * @returns {'period'|'projected'}
 */
export function effectiveProjection(age, requested) {
  return requested === 'projected' && Number.isFinite(age) && age < PROJECTION_MAX_AGE
    ? 'projected'
    : 'period';
}

/** e_x from the period table or, for 'projected', the cohort table. */
export function remainingFor(age, gender, projection = 'period') {
  return projection === 'projected'
    ? projectedRemainingLifeExpectancy(age, gender)
    : remainingLifeExpectancy(age, gender);
}

/**
 * Projected expected age at death for a given age/gender and a set of lifestyle
 * factors: age + max(0, e_x + bounded lifestyle adjustment). Mirrors the hook's
 * calculation so "what-if" scenarios stay consistent with the main result.
 * @param {number} age
 * @param {'male'|'female'} gender
 * @param {Record<string, number>} factors
 */
export function projectedExpectancy(age, gender, factors, projection = 'period') {
  const sum = Object.values(factors || {}).reduce((s, v) => s + (v || 0), 0);
  const remaining = Math.max(
    0,
    remainingFor(age, gender, projection) + Math.round(boundLifestyleAdjustment(sum))
  );
  return age + remaining;
}

/**
 * Joint-life statistics for two people, assuming independent mortality.
 * For each horizon (years from now): P(both still alive) = p1·p2 and
 * P(at least one alive) = 1−(1−p1)(1−p2). Also returns the expected number of
 * future years both are alive: the complete expectation ∫P(both alive at t)dt by
 * the trapezoid rule over yearly steps with P(0) = 1 (the sum of P(t), t >= 1, alone
 * is the curtate expectation, about 0.5 year low).
 * @param {number} age1
 * @param {'male'|'female'} g1
 * @param {number} age2
 * @param {'male'|'female'} g2
 * @param {number[]} [targets] horizons in years
 */
export function jointLifeStats(age1, g1, age2, g2, targets = [10, 20, 30]) {
  const at = targets.map((t) => {
    const p1 = survivalProbability(age1, age1 + t, g1);
    const p2 = survivalProbability(age2, age2 + t, g2);
    return { years: t, both: p1 * p2, either: 1 - (1 - p1) * (1 - p2) };
  });
  // Integrate until the older person reaches the end of the survivors table (100),
  // including the final partial year. Beyond that survivalProbability is flat, so
  // extending would overcount.
  const horizon = Math.max(0, 100 - Math.max(age1, age2));
  const both = (t) =>
    survivalProbability(age1, age1 + t, g1) * survivalProbability(age2, age2 + t, g2);
  let expectedTogether = 0;
  if (horizon > 0) {
    const lastStep = Math.floor(horizon);
    let prev = 1;
    for (let t = 1; t <= lastStep; t++) {
      const cur = both(t);
      expectedTogether += (prev + cur) / 2;
      prev = cur;
    }
    const frac = horizon - lastStep;
    if (frac > 0) expectedTogether += (frac * (prev + both(horizon))) / 2;
  }
  return { at, expectedTogether };
}

/**
 * "Biological age": the chronological age whose baseline remaining life expectancy
 * equals the user's (lifestyle-adjusted) remaining years. e_x decreases with age,
 * so more adjusted remaining maps to a younger body age. Interpolated.
 * @param {number} adjustedRemaining
 * @param {'male'|'female'} gender
 */
export function biologicalAge(adjustedRemaining, gender) {
  const t = pick('remaining', gender);
  if (!Number.isFinite(adjustedRemaining)) return 0;
  if (adjustedRemaining >= t[0]) return 0;
  if (adjustedRemaining <= t[t.length - 1]) return t.length - 1;
  for (let a = 0; a < t.length - 1; a++) {
    if (t[a] >= adjustedRemaining && adjustedRemaining >= t[a + 1]) {
      const span = t[a] - t[a + 1];
      return span === 0 ? a : a + (t[a] - adjustedRemaining) / span;
    }
  }
  return t.length - 1;
}

/**
 * Probability (0..1) of surviving from `fromAge` to `toAge`, conditional on being
 * alive at `fromAge`: l(toAge) / l(fromAge). Interpolated; the table ends at age 100
 * (l_100), so ages above that are clamped to it; result clamped to [0, 1].
 */
export function survivalProbability(fromAge, toAge, gender) {
  const t = pick('survivors', gender);
  const at = (a) => {
    if (a <= 0) return t[0];
    if (a >= t.length - 1) return t[t.length - 1];
    const lo = Math.floor(a);
    return t[lo] + (t[lo + 1] - t[lo]) * (a - lo);
  };
  if (toAge <= fromAge) return 1;
  const from = at(fromAge);
  if (from <= 0) return 0;
  return Math.max(0, Math.min(1, at(toAge) / from));
}
