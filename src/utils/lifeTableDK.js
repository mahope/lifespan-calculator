// Danish period life table (Danmarks Statistik, table HISB8). The data itself lives in
// src/data/lifeTableDK.generated.js, written by `node scripts/refresh-data.mjs dst`
// (see docs/data-refresh.md). Index = exact age (0..99).
//   remaining (e_x): expected remaining years at each exact age.
//   survivors (l_x): of 100,000 born, how many are still alive at age x.

import { boundLifestyleAdjustment } from './lifespanMath';
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

/**
 * Projected expected age at death for a given age/gender and a set of lifestyle
 * factors: age + max(0, e_x + bounded lifestyle adjustment). Mirrors the hook's
 * calculation so "what-if" scenarios stay consistent with the main result.
 * @param {number} age
 * @param {'male'|'female'} gender
 * @param {Record<string, number>} factors
 */
export function projectedExpectancy(age, gender, factors) {
  const sum = Object.values(factors || {}).reduce((s, v) => s + (v || 0), 0);
  const remaining = Math.max(
    0,
    remainingLifeExpectancy(age, gender) + Math.round(boundLifestyleAdjustment(sum))
  );
  return age + remaining;
}

/**
 * Joint-life statistics for two people, assuming independent mortality.
 * For each horizon (years from now): P(both still alive) = p1·p2 and
 * P(at least one alive) = 1−(1−p1)(1−p2). Also returns the expected number of
 * future years both are alive (Σ over yearly steps).
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
  // Sum only over years the table actually covers (up to age 99 for both), so we
  // neither truncate early for young couples nor overcount past 99 where
  // survivalProbability clamps to a constant.
  let expectedTogether = 0;
  const maxT = 99 - Math.max(age1, age2);
  for (let t = 1; t <= maxT; t++) {
    const p1 = survivalProbability(age1, age1 + t, g1);
    const p2 = survivalProbability(age2, age2 + t, g2);
    expectedTogether += p1 * p2;
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
 * alive at `fromAge`: l(toAge) / l(fromAge). Interpolated; clamped to [0, 1].
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
