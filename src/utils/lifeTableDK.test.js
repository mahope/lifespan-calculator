import { describe, it, expect } from 'vitest';
import {
  LIFE_TABLE_DK,
  remainingLifeExpectancy,
  survivalProbability,
  biologicalAge,
  projectedExpectancy,
  jointLifeStats,
} from './lifeTableDK';

describe('jointLifeStats', () => {
  it('returns a horizon row per target with valid probabilities', () => {
    const s = jointLifeStats(40, 'male', 38, 'female', [10, 20, 30]);
    expect(s.at).toHaveLength(3);
    for (const r of s.at) {
      expect(r.both).toBeGreaterThanOrEqual(0);
      expect(r.both).toBeLessThanOrEqual(1);
      // "at least one" is always >= "both"
      expect(r.either).toBeGreaterThanOrEqual(r.both);
      expect(r.either).toBeLessThanOrEqual(1);
    }
  });

  it('has decreasing joint-survival as the horizon grows', () => {
    const s = jointLifeStats(50, 'male', 50, 'female', [10, 20, 30]);
    expect(s.at[1].both).toBeLessThan(s.at[0].both);
    expect(s.at[2].both).toBeLessThan(s.at[1].both);
  });

  it('gives a positive, plausible expected-years-together figure', () => {
    const s = jointLifeStats(40, 'male', 40, 'female');
    expect(s.expectedTogether).toBeGreaterThan(20);
    expect(s.expectedTogether).toBeLessThan(60);
  });

  it('yields fewer expected years together for an older couple', () => {
    const young = jointLifeStats(35, 'male', 35, 'female').expectedTogether;
    const old = jointLifeStats(70, 'male', 70, 'female').expectedTogether;
    expect(old).toBeLessThan(young);
  });

  it('does not count beyond the table (no clamp overcount at the top age)', () => {
    // At age 99 only the last table year remains (trapezoid over 99 -> 100):
    // well under a year, not the ~70 the old fixed loop produced via clamping.
    const t = jointLifeStats(99, 'male', 99, 'female').expectedTogether;
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
    expect(jointLifeStats(100, 'male', 100, 'female').expectedTogether).toBe(0);
  });

  it('integrates the final partial year to the table end (mid-year ages)', () => {
    const t = jointLifeStats(99.5, 'male', 99.5, 'female').expectedTogether;
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(0.5);
  });

  // #91: the complete expectation (trapezoid, P(0) = 1) rather than the curtate
  // sum, which is ~0.5 year low. Reference values from the data audit, F21.
  it.each([
    [40, 40, 36.76],
    [70, 70, 11.79],
  ])('expected years together for %iM + %iF is the trapezoid value %f', (a1, a2, expected) => {
    const s = jointLifeStats(a1, 'male', a2, 'female').expectedTogether;
    expect(Math.abs(s - expected)).toBeLessThan(0.02);
  });

  it('matches an independent trapezoid integration over the life tables', () => {
    const l = LIFE_TABLE_DK.survivors;
    const P = (t) => (l.male[40 + t] / l.male[40]) * (l.female[45 + t] / l.female[45]);
    let sum = 0;
    for (let t = 0; 45 + t < 100; t++) sum += (P(t) + P(t + 1)) / 2;
    const got = jointLifeStats(40, 'male', 45, 'female').expectedTogether;
    expect(Math.abs(got - sum)).toBeLessThan(0.02);
  });
});

describe('projectedExpectancy', () => {
  it('equals age + e_x with no lifestyle factors', () => {
    const p = projectedExpectancy(40, 'male', {});
    expect(p).toBeCloseTo(40 + remainingLifeExpectancy(40, 'male'), 5);
  });

  it('adds a positive lifestyle adjustment', () => {
    const base = projectedExpectancy(40, 'male', {});
    const better = projectedExpectancy(40, 'male', { exercise: 6 });
    expect(better - base).toBeCloseTo(6, 5);
  });

  it('treats missing/empty factors the same as all-zero', () => {
    expect(projectedExpectancy(50, 'female', undefined)).toBeCloseTo(
      projectedExpectancy(50, 'female', { a: 0, b: 0 }),
      5
    );
  });
});

describe('biologicalAge', () => {
  it('returns ~chronological age when remaining equals the baseline e_x', () => {
    const remaining = remainingLifeExpectancy(40, 'male');
    expect(biologicalAge(remaining, 'male')).toBeCloseTo(40, 0);
  });

  it('is younger when the user has more remaining years than baseline', () => {
    const remaining = remainingLifeExpectancy(40, 'male') + 6;
    expect(biologicalAge(remaining, 'male')).toBeLessThan(40);
  });

  it('is older when the user has fewer remaining years than baseline', () => {
    const remaining = remainingLifeExpectancy(40, 'male') - 6;
    expect(biologicalAge(remaining, 'male')).toBeGreaterThan(40);
  });

  it('clamps to the table range', () => {
    expect(biologicalAge(999, 'male')).toBe(0);
    expect(biologicalAge(-1, 'female')).toBe(99);
  });
});

describe('remainingLifeExpectancy (Danish e_x)', () => {
  it('matches the DST 2024:2025 figures at key ages', () => {
    expect(remainingLifeExpectancy(0, 'male')).toBeCloseTo(80.25, 1);
    expect(remainingLifeExpectancy(0, 'female')).toBeCloseTo(83.9, 1);
    // A 70-year-old man has ~15 years left — NOT 78.9 - 70 = ~9.
    expect(remainingLifeExpectancy(70, 'male')).toBeGreaterThan(13);
    expect(remainingLifeExpectancy(70, 'male')).toBeLessThan(17);
  });

  it('interpolates between whole years', () => {
    const a = remainingLifeExpectancy(40, 'male');
    const b = remainingLifeExpectancy(41, 'male');
    const mid = remainingLifeExpectancy(40.5, 'male');
    expect(mid).toBeCloseTo((a + b) / 2, 2);
  });

  it('clamps out-of-range ages', () => {
    expect(remainingLifeExpectancy(-5, 'male')).toBe(remainingLifeExpectancy(0, 'male'));
    expect(remainingLifeExpectancy(150, 'female')).toBe(remainingLifeExpectancy(99, 'female'));
  });

  it('falls back to male for an unknown gender', () => {
    expect(remainingLifeExpectancy(50, 'other')).toBe(remainingLifeExpectancy(50, 'male'));
  });
});

describe('survivalProbability (Danish l_x)', () => {
  it('is 1 for a target at or below the current age', () => {
    expect(survivalProbability(50, 50, 'male')).toBe(1);
    expect(survivalProbability(50, 40, 'male')).toBe(1);
  });

  it('returns realistic conditional survival odds', () => {
    // A 40-year-old man reaching 90 is roughly a 1-in-5 chance.
    const p = survivalProbability(40, 90, 'male');
    expect(p).toBeGreaterThan(0.15);
    expect(p).toBeLessThan(0.3);
    // Women fare better at the same target.
    expect(survivalProbability(40, 90, 'female')).toBeGreaterThan(p);
  });

  it('decreases monotonically as the target age rises', () => {
    let prev = 1.01;
    for (const t of [70, 80, 90, 95, 100]) {
      const p = survivalProbability(50, t, 'male');
      expect(p).toBeLessThanOrEqual(prev);
      prev = p;
    }
  });

  it('stays within [0, 1]', () => {
    for (const t of [60, 80, 99]) {
      const p = survivalProbability(30, t, 'female');
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('l_100 and P(reach 100) (#91)', () => {
  // DST HISB8 2024:2025, q_99 = 41,188 (M) / 34,091 (F) per 100,000, so
  // l_100 = l_99 * (1 - q_99): 1392 -> 819 (M), 4095 -> 2699 (F).
  it('has 101 survivor entries per sex and 100 e_x entries', () => {
    expect(LIFE_TABLE_DK.survivors.male).toHaveLength(101);
    expect(LIFE_TABLE_DK.survivors.female).toHaveLength(101);
    expect(LIFE_TABLE_DK.remaining.male).toHaveLength(100);
    expect(LIFE_TABLE_DK.remaining.female).toHaveLength(100);
  });

  it('matches DST l_100 derived from q_99', () => {
    expect(LIFE_TABLE_DK.survivors.male[100]).toBe(819);
    expect(LIFE_TABLE_DK.survivors.female[100]).toBe(2699);
    expect(Math.round(1392 * (1 - 0.41188))).toBe(819);
    expect(Math.round(4095 * (1 - 0.34091))).toBe(2699);
  });

  it('P(100) < P(99) for every age and sex', () => {
    for (const g of ['male', 'female']) {
      for (let a = 0; a < 99; a++) {
        expect(survivalProbability(a, 100, g)).toBeLessThan(survivalProbability(a, 99, g));
      }
    }
  });

  it('gives the audited P(100): female 60 -> 2.8 %, male 40 -> 0.83 %', () => {
    expect(survivalProbability(60, 100, 'female') * 100).toBeCloseTo(2.82, 1);
    expect(survivalProbability(40, 100, 'male') * 100).toBeCloseTo(0.83, 2);
  });

  it('never returns 100 % above 99 unless the target is not above the age', () => {
    expect(survivalProbability(99.5, 100, 'male')).toBeLessThan(1);
    expect(survivalProbability(99, 100, 'female')).toBeCloseTo(0.659, 2);
    expect(survivalProbability(100, 100, 'male')).toBe(1);
  });

  it('keeps e_x clamped at e_99 above 99 (tail rule)', () => {
    expect(remainingLifeExpectancy(105, 'male')).toBe(LIFE_TABLE_DK.remaining.male[99]);
    expect(remainingLifeExpectancy(99.5, 'female')).toBe(LIFE_TABLE_DK.remaining.female[99]);
  });
});
