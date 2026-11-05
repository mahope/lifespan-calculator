import { describe, it, expect } from 'vitest';
import {
  sourceLinks,
  topImprovements,
  LIFESTYLE_META,
  LIFESTYLE_FACTORS,
  LIFESTYLE_OPTIONS,
  ASSOCIATION_NOTE,
  factorHelper,
  factorYears,
} from './lifestyleFactors';
import { computeResult } from './lifespanMath';

const zero = Object.fromEntries(LIFESTYLE_META.map((m) => [m.key, 0]));

describe('topImprovements', () => {
  it('ranks the biggest gains first from a default (all-zero) profile', () => {
    const top = topImprovements(zero, LIFESTYLE_META, 3);
    expect(top).toHaveLength(3);
    // diet (best +5) and exercise (best +4.5) are the largest gains from zero.
    expect(top[0].key).toBe('diet');
    expect(top[0].gain).toBe(5);
    expect(top[1].key).toBe('exercise');
    expect(top[1].gain).toBe(4.5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i].gain).toBeLessThanOrEqual(top[i - 1].gain);
    }
  });

  it('never tells a former smoker to stop smoking', () => {
    for (const v of [11, 12, 13]) {
      const keys = topImprovements({ ...zero, smoking: v }, LIFESTYLE_META, 10).map((m) => m.key);
      expect(keys).not.toContain('smoking');
    }
    expect(topImprovements({ ...zero, smoking: -10 }, LIFESTYLE_META, 10).map((m) => m.key)).toContain('smoking');
  });

  it('does not advise shortening sleep for 9+ hours', () => {
    const keys = topImprovements({ ...zero, sleep: 11 }, LIFESTYLE_META, 10).map((m) => m.key);
    expect(keys).not.toContain('sleep');
  });

  it('excludes factors already at their best value', () => {
    const factors = { ...zero, exercise: 6, diet: 5 }; // intensive (+4.5 y), very healthy (+5 y)
    const keys = topImprovements(factors, LIFESTYLE_META, 10).map((t) => t.key);
    expect(keys).not.toContain('exercise');
    expect(keys).not.toContain('diet');
  });

  it('computes gain as best minus current', () => {
    const factors = { ...zero, smoking: -10 }; // heavy smoker (-10 y), best 0
    const smoking = topImprovements(factors, LIFESTYLE_META, 20).find((t) => t.key === 'smoking');
    expect(smoking.gain).toBe(10);
  });

  it('returns nothing when every factor is already optimal', () => {
    const best = Object.fromEntries(LIFESTYLE_META.map((m) => [m.key, m.bestValue]));
    expect(topImprovements(best, LIFESTYLE_META, 3)).toHaveLength(0);
  });
});

// Frozen golden table of the recalibration (#93): stored answer -> years per
// factor, in render order. Changing a coefficient must change this table too.
const GOLDEN = {
  smoking: { inSum: true, options: [[0, 0], [11, -1], [12, -2.5], [13, -5], [-5, -6], [-10, -10]] },
  exercise: { inSum: true, options: [[0, 0], [2, 2], [4, 3.5], [6, 4.5]] },
  diet: { inSum: true, options: [[0, 0], [3, 3.5], [5, 5]] },
  alcohol: { inSum: true, options: [[0, 0], [11, -0.5], [12, -1.5], [13, -4.5]] },
  sleep: { inSum: true, options: [[-2, -1.5], [-1, -1], [0, 0], [11, -2]] },
  stress: { inSum: false, options: [[2, 0], [0, 0], [-2, 0], [-4, 0]] },
  health: { inSum: false, options: [[0, 0], [-2, 0], [-5, 0]] },
  bmi: { inSum: true, options: [[-2, -3], [0, 0], [-1, -1], [11, -3], [12, -5.5], [13, -9]] },
  social: { inSum: true, options: [[4, 1], [0, 0], [-1, -1], [-3, -3]] },
  mental: { inSum: true, options: [[0, 0], [11, -5]] },
  work: { inSum: false, options: [[1, 0], [0, 0], [-1, 0], [-2, 0]] },
  environment: { inSum: false, options: [[1, 0], [-1, 0], [-2, 0]] },
  education: { inSum: false, options: [[-1, 0], [0, 0], [1, 0], [3, 0]] },
  income: { inSum: false, options: [[2, 0], [0, 0], [-2, 0], [-3, 0]] },
  commute: { inSum: false, options: [[1, 0], [0, 0], [-1, 0]] },
  screentime: { inSum: false, options: [[1, 0], [0, 0], [-1, 0], [-2, 0]] },
};

const maxYears = (f) => Math.max(...f.options.map((o) => o.years));
const minYears = (f) => Math.min(...f.options.map((o) => o.years));

describe('LIFESTYLE_FACTORS (data-driven questionnaire)', () => {
  it('has the same factors, in the same order, as the golden table', () => {
    expect(LIFESTYLE_FACTORS.map((f) => f.key)).toEqual(Object.keys(GOLDEN));
  });

  it('matches the golden table: inSum, stored answers and years per option', () => {
    for (const f of LIFESTYLE_FACTORS) {
      expect(f.inSum, f.key).toBe(GOLDEN[f.key].inSum);
      expect(f.options.map((o) => [o.value, o.years]), f.key).toEqual(GOLDEN[f.key].options);
    }
  });

  it('gives every factor an icon, a label and non-empty option labels', () => {
    for (const f of LIFESTYLE_FACTORS) {
      expect(f.icon).toBeTruthy();
      expect(f.label).toBeTruthy();
      for (const o of f.options) expect(o.label.trim()).not.toBe('');
    }
  });

  it('uses unique stored answers per factor, and answer 0 is always neutral', () => {
    for (const f of LIFESTYLE_FACTORS) {
      const values = f.options.map((o) => o.value);
      expect(new Set(values).size, f.key).toBe(values.length);
      for (const o of f.options) if (o.value === 0) expect(o.years, f.key).toBe(0);
    }
  });

  it('keeps the share-link option table in sync (0 is always valid)', () => {
    const expected = Object.fromEntries(
      Object.entries(GOLDEN).map(([k, g]) => [k, [...new Set([0, ...g.options.map(([v]) => v)])].sort((a, b) => a - b)])
    );
    expect(LIFESTYLE_OPTIONS).toEqual(expected);
  });
});

describe('evidence and sum rules (#93)', () => {
  it('fails for a factor that counts in the sum without any evidence', () => {
    for (const f of LIFESTYLE_FACTORS) {
      if (f.inSum) expect(f.evidence, f.key).not.toBe('none');
    }
  });

  it('has a valid evidence grade on every factor', () => {
    for (const f of LIFESTYLE_FACTORS) expect(['strong', 'moderate', 'weak', 'none']).toContain(f.evidence);
  });

  it('requires a source with a figure and a range for every factor that counts', () => {
    for (const f of LIFESTYLE_FACTORS.filter((x) => x.inSum)) {
      expect(f.source?.cite, f.key).toBeTruthy();
      expect(f.source?.pmid, f.key).toMatch(/^\d+$/);
      expect(f.source?.figure, f.key).toBeTruthy();
      expect(f.source?.range.min, f.key).toBeLessThan(f.source.range.max);
    }
  });

  it('keeps every non-zero effect that counts inside the range its source supports', () => {
    for (const f of LIFESTYLE_FACTORS.filter((x) => x.inSum)) {
      for (const o of f.options.filter((x) => x.years !== 0)) {
        expect(o.years, `${f.key} ${o.label}`).toBeGreaterThanOrEqual(f.source.range.min);
        expect(o.years, `${f.key} ${o.label}`).toBeLessThanOrEqual(f.source.range.max);
      }
    }
  });

  it('gives factors that do not count zero years on every option', () => {
    for (const f of LIFESTYLE_FACTORS.filter((x) => !x.inSum)) {
      for (const o of f.options) expect(o.years, f.key).toBe(0);
    }
  });

  it('has the table maxima for the factors that count', () => {
    const expected = {
      smoking: [-10, 0],
      exercise: [0, 4.5],
      diet: [0, 5],
      alcohol: [-4.5, 0],
      sleep: [-2, 0],
      bmi: [-9, 0],
      social: [-3, 1],
      mental: [-5, 0],
    };
    const counting = LIFESTYLE_FACTORS.filter((f) => f.inSum);
    expect(counting.map((f) => f.key).sort()).toEqual(Object.keys(expected).sort());
    for (const f of counting) expect([minYears(f), maxYears(f)], f.key).toEqual(expected[f.key]);
  });

  it('stays within the cap for the worst and the best case', () => {
    const pick = (cmp) =>
      Object.fromEntries(LIFESTYLE_FACTORS.map((f) => [f.key, f.options.reduce((a, b) => (cmp(b, a) ? b : a)).value]));
    const now = new Date('2026-01-15T12:00:00Z');
    const input = { ageOrBirthdate: 30, gender: 'female' };
    const worst = computeResult({ ...input, lifestyleFactors: pick((b, a) => b.years < a.years) }, now);
    const best = computeResult({ ...input, lifestyleFactors: pick((b, a) => b.years > a.years) }, now);
    expect(worst.lifestyleImpact).toBeGreaterThanOrEqual(-15);
    expect(best.lifestyleImpact).toBeLessThanOrEqual(12);
    // Golden: raw -33.5 -> bounded -15 (safety net); raw +10.5 -> 8.75 -> 8.8.
    expect(worst.lifestyleImpact).toBe(-15);
    expect(best.lifestyleImpact).toBe(8.8);
  });

  it('does not let factors that do not count change the estimate', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const input = { ageOrBirthdate: 40, gender: 'male' };
    const base = Object.fromEntries(LIFESTYLE_FACTORS.map((f) => [f.key, 0]));
    const noisy = { ...base, stress: -4, health: -5, work: -2, environment: -2, education: -1, income: -3, commute: -1, screentime: -2 };
    expect(computeResult({ ...input, lifestyleFactors: noisy }, now)).toEqual(
      computeResult({ ...input, lifestyleFactors: base }, now)
    );
  });

  it('rounds to one decimal and never reports -0', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const input = { ageOrBirthdate: 40, gender: 'male' };
    const f = (over) => ({ ...Object.fromEntries(LIFESTYLE_FACTORS.map((x) => [x.key, 0])), ...over });
    expect(computeResult({ ...input, lifestyleFactors: f({ alcohol: 11 }) }, now).lifestyleImpact).toBe(-0.5);
    expect(computeResult({ ...input, lifestyleFactors: f({ exercise: 6 }) }, now).lifestyleImpact).toBe(4.5);
    expect(Object.is(computeResult({ ...input, lifestyleFactors: f({}) }, now).lifestyleImpact, 0)).toBe(true);
  });

  it('resolves stored answers to years', () => {
    expect(factorYears('exercise', 4)).toBe(3.5);
    expect(factorYears('bmi', 11)).toBe(-3);
    expect(factorYears('stress', -4)).toBe(0);
    expect(factorYears('nope', 1)).toBe(0);
  });
});

describe('helper texts', () => {
  it('generates a helper from the table for every factor that has a source or info', () => {
    for (const f of LIFESTYLE_FACTORS) {
      const text = factorHelper(f);
      expect(text, f.key).toContain('Evidens:');
      if (f.source?.pmid) expect(text, f.key).toContain(`PMID ${f.source.pmid}`);
    }
  });

  it('shows the Moore 2012 figure for exercise', () => {
    const text = factorHelper(LIFESTYLE_FACTORS.find((f) => f.key === 'exercise'));
    expect(text).toContain('Ca. 150 min/uge giver ca. 3,4 år');
    expect(text).toContain('3,2-3,6');
  });

  it('keeps the one-place association note', () => {
    expect(ASSOCIATION_NOTE).toBe('Sammenhæng, ikke garanti.');
    // The note is added by the component, so no helper repeats it.
    for (const f of LIFESTYLE_FACTORS) expect(factorHelper(f)).not.toContain(ASSOCIATION_NOTE);
  });
});

describe('sourceLinks (#93)', () => {
  it('has one pmid per paper the cite names, in order', () => {
    for (const f of LIFESTYLE_FACTORS.filter((x) => x.source?.pmid)) {
      const links = sourceLinks(f);
      expect(links.length, f.key).toBe(f.source.cite.split(';').length);
      expect(links.every((l) => /^\d+$/.test(l.pmid) && l.short), f.key).toBe(true);
      expect(new Set(links.map((l) => l.pmid)).size, f.key).toBe(links.length);
    }
  });

  it('names the first author of each paper', () => {
    const bmi = LIFESTYLE_FACTORS.find((f) => f.key === 'bmi');
    expect(sourceLinks(bmi).map((l) => l.short)).toEqual(['Global BMI Mortality Collaboration', 'Prospective Studies Collaboration']);
    expect(factorHelper(bmi)).toContain('PMID 27423262, 19299006');
  });

  it('gives no links for a source without a pmid', () => {
    expect(sourceLinks({ source: { cite: 'Danmarks Statistik, LABY21' } })).toEqual([]);
    expect(sourceLinks({})).toEqual([]);
  });
});

