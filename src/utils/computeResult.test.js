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

describe('computeResult remainingDays clamp (#76 review)', () => {
  it('never reports negative days when nothing remains (birthdate mode, worst lifestyle, very old)', () => {
    const r = computeResult(
      { ageOrBirthdate: '1920-01-01', gender: 'male', lifestyleFactors: { ...zero, smoking: -15 } },
      NOW,
    );
    // The end instant falls just before `now` in this case, which Math.floor turned into -1.
    expect(r.endTimestamp - NOW.getTime()).toBeLessThanOrEqual(0);
    expect(r.endTimestamp - NOW.getTime()).toBeGreaterThan(-864e5);
    expect(r.remainingDays).toBe(0);
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

describe('computeResult projection mode (#92)', () => {
  const m40 = CASES['male 40'];

  it('defaults to the period table: same numbers as before, with the projected figure alongside', () => {
    const base = computeResult(m40, NOW);
    expect(base.projection).toBe('period');
    expect(base.remainingYears).toBe('41.2');
    expect(base.adjustedLifeExpectancy).toBe('81.2');
    expect(base.dataSource).toBe('Danmarks Statistik (2024-2025)');
    expect(base.projectionAvailable).toBe(true);
    expect(base.projectedRemainingYears).toBe('46.8');
    expect(computeResult({ ...m40, projection: 'period' }, NOW)).toEqual(base);
  });

  it('projected mode switches headline, expected age, end instant and days', () => {
    const p = computeResult({ ...m40, projection: 'projected' }, NOW);
    const base = computeResult(m40, NOW);
    expect(p.projection).toBe('projected');
    expect(p.remainingYears).toBe('46.8');
    expect(p.adjustedLifeExpectancy).toBe('86.8');
    expect(p.endTimestamp).toBeGreaterThan(base.endTimestamp);
    expect(p.remainingDays).toBeGreaterThan(base.remainingDays);
    expect(p.periodRemainingYears).toBe('41.2');
    expect(p.projectedRemainingYears).toBe('46.8');
  });

  it('applies the lifestyle adjustment to both figures', () => {
    const adv = CASES['advanced two factors'];
    const base = computeResult(adv, NOW);
    const p = computeResult({ ...adv, projection: 'projected' }, NOW);
    expect(parseFloat(p.remainingYears) - parseFloat(base.remainingYears)).toBeGreaterThan(4);
    expect(base.projectedRemainingYears).toBe(p.remainingYears);
  });

  it('is not offered from age 70, and a projected request falls back to period', () => {
    const old = { ageOrBirthdate: 70, gender: 'male', lifestyleFactors: zero };
    const r = computeResult({ ...old, projection: 'projected' }, NOW);
    expect(r.projectionAvailable).toBe(false);
    expect(r.projectedRemainingYears).toBeNull();
    expect(r.projection).toBe('period');
    expect(r).toEqual(computeResult(old, NOW));
    const young = computeResult({ ...old, ageOrBirthdate: 69, projection: 'projected' }, NOW);
    expect(young.projection).toBe('projected');
  });
});
