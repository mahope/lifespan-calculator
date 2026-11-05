// Fixed zone so local-time Date arithmetic (DST) is reproducible on any machine.
process.env.TZ = 'Europe/Copenhagen';

import { describe, it, expect } from 'vitest';
import { computeResult, breakdownRemaining, lifestyleTotal } from './lifespanMath';
import { LIFESTYLE_KEYS } from '../hooks/useLifespanCalculator';

// Pins the numbers per input. The first commit recorded the pre-#76 formulas; the
// fix commit updated the snapshot so the old -> new diff is visible in git.
const NOW = new Date(2026, 10, 5, 12, 0, 0); // 5 Nov 2026 12:00 local
const zero = Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]));

const CASES = {
  'male 40': { ageOrBirthdate: 40, gender: 'male', lifestyleFactors: zero },
  'female 65': { ageOrBirthdate: 65, gender: 'female', lifestyleFactors: zero },
  'male born 1985-06-15': { ageOrBirthdate: '1985-06-15', gender: 'male', lifestyleFactors: zero },
  'age 0': { ageOrBirthdate: 0, gender: 'female', lifestyleFactors: zero },
  'age 99': { ageOrBirthdate: 99, gender: 'male', lifestyleFactors: zero },
  'advanced two factors': {
    ageOrBirthdate: 50, gender: 'male', lifestyleFactors: { ...zero, smoking: -3, exercise: 2 },
  },
};

describe('computeResult characterization', () => {
  it.each(Object.entries(CASES))('%s', (name, input) => {
    const r = computeResult(input, NOW);
    expect({
      remainingYears: r.remainingYears,
      remainingDays: r.remainingDays,
      adjustedLifeExpectancy: r.adjustedLifeExpectancy,
      lifestyleImpact: r.lifestyleImpact,
      endTimestamp: r.endTimestamp,
      age: r.age,
      daysLived: r.daysLived,
      countdown: r.countdown,
      lifePercentage: r.lifePercentage,
    }).toMatchSnapshot();
  });
});

describe('computeResult consistency (#76)', () => {
  it.each(Object.entries(CASES))('%s: end instant, days, countdown and headline agree', (name, input) => {
    const r = computeResult(input, NOW);
    const msToEnd = r.endTimestamp - NOW.getTime();
    const daysToEnd = msToEnd / 864e5;
    // remainingDays is the floored distance to the end instant
    expect(Math.abs(r.remainingDays - daysToEnd)).toBeLessThan(1);
    // countdown breakdown of the same instant
    const c = breakdownRemaining(msToEnd);
    const fromTiles = c.years * 365.25 + c.days + c.hours / 24 + c.minutes / 1440 + c.seconds / 86400;
    expect(Math.abs(fromTiles - daysToEnd)).toBeLessThan(1);
    // headline "years left" (1 decimal) converted to days
    expect(Math.abs(parseFloat(r.remainingYears) * 365.25 - daysToEnd)).toBeLessThan(0.05 * 365.25 + 1);
    // end date label is the end instant (not shifted)
    expect(r.endDate).toBe(new Date(r.endTimestamp).toLocaleDateString('da-DK'));
    expect('countdown' in r).toBe(false);
  });

  it('keeps the fractional year in age mode (male 40: 41.2 years, not 41.0)', () => {
    const r = computeResult(CASES['male 40'], NOW);
    expect(r.remainingDays).toBeGreaterThan(41.1 * 365.25);
    expect(r.remainingDays).toBeLessThan(41.3 * 365.25);
  });
});

describe('lifestyleTotal', () => {
  it('sums factor deltas', () => {
    expect(lifestyleTotal({ a: 2, b: -3, c: 0 })).toBe(-1);
    expect(lifestyleTotal({})).toBe(0);
  });
});

describe('computeResult invalid input', () => {
  it.each([NaN, 'abc', -5])('does not throw for age input %s and keeps a finite end instant', (v) => {
    const r = computeResult({ ageOrBirthdate: v, gender: 'male', lifestyleFactors: zero }, NOW);
    expect(Number.isFinite(r.endTimestamp)).toBe(true);
  });
});
