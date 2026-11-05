import { remainingLifeExpectancy } from './lifeTableDK';

/** Differences within +-this many years count as "about the same". */
export const EQUAL_THRESHOLD_YEARS = 0.5;

/**
 * Compare the user's expected age at death with the Danish average for the
 * same age and sex: age + e_x from the life table with no lifestyle adjustment.
 * `lifestyleYears` is the bounded, rounded adjustment the calculator applied,
 * so zero lifestyle input gives a difference of exactly 0.
 */
export function compareWithDanishAverage(age, gender, lifestyleYears = 0) {
  const remaining = remainingLifeExpectancy(age, gender);
  const average = age + remaining;
  const you = age + Math.max(0, remaining + lifestyleYears);
  return { you, average, diff: you - average };
}

const fmt = (n) => n.toFixed(1).replace('.', ',');

/** Danish verdict text for a difference in years: below / equal / above. */
export function verdictFor(diff) {
  if (Math.abs(diff) <= EQUAL_THRESHOLD_YEARS) {
    return {
      level: 'equal',
      text: 'Du ligger omtrent på det samme som gennemsnittet for en dansker på din alder og dit køn',
    };
  }
  const years = fmt(Math.abs(diff));
  return diff > 0
    ? { level: 'above', text: `Du ligger ca. ${years} år over gennemsnittet for en dansker på din alder og dit køn` }
    : { level: 'below', text: `Du ligger ca. ${years} år under gennemsnittet for en dansker på din alder og dit køn` };
}
