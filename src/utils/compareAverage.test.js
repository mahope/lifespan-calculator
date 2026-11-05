import { describe, it, expect } from 'vitest';
import { compareWithDanishAverage, verdictFor, EQUAL_THRESHOLD_YEARS } from './compareAverage';
import { LIFE_TABLE_DK } from './lifeTableDK';

describe('compareWithDanishAverage', () => {
  for (const sex of ['male', 'female']) {
    for (const age of [0, 1, 40, 70, 99]) {
      it(`zero lifestyle input gives difference exactly 0 (${sex}, age ${age})`, () => {
        const r = compareWithDanishAverage(age, sex, 0);
        expect(r.diff).toBe(0);
        expect(r.you).toBe(r.average);
        expect(r.average).toBe(age + LIFE_TABLE_DK.remaining[sex][age]);
      });
    }
  }

  it('is exactly 0 for fractional ages too', () => {
    expect(compareWithDanishAverage(40.37, 'male', 0).diff).toBe(0);
  });

  it('reflects the lifestyle adjustment', () => {
    expect(compareWithDanishAverage(40, 'male', 3).diff).toBeCloseTo(3, 10);
    expect(compareWithDanishAverage(40, 'male', -4).diff).toBeCloseTo(-4, 10);
  });

  it('never projects a death before today', () => {
    const r = compareWithDanishAverage(99, 'male', -50);
    expect(r.you).toBe(99);
  });
});

describe('verdictFor', () => {
  it('uses a +-0.5 year band for "about equal"', () => {
    expect(EQUAL_THRESHOLD_YEARS).toBe(0.5);
    expect(verdictFor(0).level).toBe('equal');
    expect(verdictFor(0.5).level).toBe('equal');
    expect(verdictFor(-0.5).level).toBe('equal');
    expect(verdictFor(0.51).level).toBe('above');
    expect(verdictFor(-0.51).level).toBe('below');
  });

  it('does not say "over det danske gennemsnit" for an average user', () => {
    expect(verdictFor(0).text).not.toMatch(/over det danske gennemsnit/);
    expect(verdictFor(0).text).toMatch(/omtrent på det samme som gennemsnittet/);
  });

  it('mentions the size of the gap when above or below', () => {
    expect(verdictFor(2.34).text).toMatch(/2,3 år/);
    expect(verdictFor(-1.26).text).toMatch(/1,3 år/);
  });
});
