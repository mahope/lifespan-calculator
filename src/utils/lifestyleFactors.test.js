import { describe, it, expect } from 'vitest';
import { topImprovements, LIFESTYLE_META, LIFESTYLE_FACTORS, LIFESTYLE_OPTIONS } from './lifestyleFactors';
import { computeResult, boundLifestyleAdjustment } from './lifespanMath';

const zero = Object.fromEntries(LIFESTYLE_META.map((m) => [m.key, 0]));

describe('topImprovements', () => {
  it('ranks the biggest gains first from a default (all-zero) profile', () => {
    const top = topImprovements(zero, LIFESTYLE_META, 3);
    expect(top).toHaveLength(3);
    // exercise (best 6) and diet (best 5) are the largest gains from zero.
    expect(top[0].key).toBe('exercise');
    expect(top[0].gain).toBe(6);
    expect(top[1].key).toBe('diet');
    for (let i = 1; i < top.length; i++) {
      expect(top[i].gain).toBeLessThanOrEqual(top[i - 1].gain);
    }
  });

  it('excludes factors already at their best value', () => {
    const factors = { ...zero, exercise: 6, diet: 5 };
    const keys = topImprovements(factors, LIFESTYLE_META, 10).map((t) => t.key);
    expect(keys).not.toContain('exercise');
    expect(keys).not.toContain('diet');
  });

  it('computes gain as best minus current', () => {
    const factors = { ...zero, smoking: -10 }; // heavy smoker, best 0
    const smoking = topImprovements(factors, LIFESTYLE_META, 20).find((t) => t.key === 'smoking');
    expect(smoking.gain).toBe(10);
  });

  it('returns nothing when every factor is already optimal', () => {
    const best = Object.fromEntries(LIFESTYLE_META.map((m) => [m.key, m.best]));
    expect(topImprovements(best, LIFESTYLE_META, 3)).toHaveLength(0);
  });
});

// Frozen copy of the option values the hand-written HomePage buttons offered
// (in render order) before the factors became data-driven (#7).
const LEGACY_BUTTON_VALUES = {
  smoking: [0, -5, -10],
  exercise: [0, 2, 4, 6],
  diet: [-2, 0, 3, 5],
  alcohol: [0, -1, -3, -6],
  sleep: [-2, -1, 2, 0],
  stress: [2, 0, -2, -4],
  health: [0, -2, -5],
  bmi: [-2, 2, -1, -4],
  social: [4, 2, -1, -3],
  mental: [2, 0, -2, -3],
  work: [1, 0, -1, -2],
  environment: [1, -1, -2],
  education: [-1, 0, 1, 3],
  income: [2, 0, -2, -3],
  commute: [1, 0, -1],
  screentime: [1, 0, -1, -2],
};

// The old inline calculation: sum of the selected deltas, bounded and rounded.
const legacyTotal = (selection) =>
  Math.round(boundLifestyleAdjustment(Object.values(selection).reduce((a, b) => a + b, 0)));

// Small seeded PRNG (mulberry32) so the sample is reproducible.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('LIFESTYLE_FACTORS (data-driven questionnaire)', () => {
  it('has the same factors, in the same order, as the old hand-written blocks', () => {
    expect(LIFESTYLE_FACTORS.map((f) => f.key)).toEqual(Object.keys(LEGACY_BUTTON_VALUES));
  });

  it('offers the same option values in the same order per factor', () => {
    for (const f of LIFESTYLE_FACTORS) {
      expect(f.options.map((o) => o.value)).toEqual(LEGACY_BUTTON_VALUES[f.key]);
    }
  });

  it('gives every factor an icon, a label and non-empty option labels', () => {
    for (const f of LIFESTYLE_FACTORS) {
      expect(f.icon).toBeTruthy();
      expect(f.label).toBeTruthy();
      for (const o of f.options) expect(o.label.trim()).not.toBe('');
    }
  });

  it('keeps the share-link option table unchanged (0 is always valid)', () => {
    const expected = Object.fromEntries(
      Object.entries(LEGACY_BUTTON_VALUES).map(([k, v]) => [k, [...new Set([...v, 0])].sort((a, b) => a - b)])
    );
    expect(LIFESTYLE_OPTIONS).toEqual(expected);
  });

  it('matches the old inline calculation for 200 seeded combinations', () => {
    const rand = rng(7);
    const now = new Date('2026-01-15T12:00:00Z');
    for (let i = 0; i < 200; i++) {
      const legacy = {};
      const data = {};
      for (const f of LIFESTYLE_FACTORS) {
        const idx = Math.floor(rand() * f.options.length);
        legacy[f.key] = LEGACY_BUTTON_VALUES[f.key][idx];
        data[f.key] = f.options[idx].value;
      }
      expect(data).toEqual(legacy);
      const input = { ageOrBirthdate: 40, gender: 'male' };
      const result = computeResult({ ...input, lifestyleFactors: data }, now);
      expect(result.lifestyleImpact).toBe(legacyTotal(legacy));
      expect(result).toEqual(computeResult({ ...input, lifestyleFactors: legacy }, now));
    }
  });
});
