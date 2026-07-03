import { describe, it, expect } from 'vitest';
import { topImprovements, LIFESTYLE_META } from './lifestyleFactors';

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
