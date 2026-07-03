import { describe, it, expect } from 'vitest';
import { estimateCover } from './insurance';

describe('estimateCover', () => {
  it('is income × years rounded to the nearest 100,000', () => {
    expect(estimateCover(500000, 10)).toBe(5000000);
    expect(estimateCover(480000, 10)).toBe(4800000);
    expect(estimateCover(333000, 3)).toBe(1000000); // 999,000 → 1,000,000
  });

  it('returns 0 for non-positive or invalid inputs', () => {
    expect(estimateCover(0, 10)).toBe(0);
    expect(estimateCover(500000, 0)).toBe(0);
    expect(estimateCover(NaN, 10)).toBe(0);
    expect(estimateCover(500000, NaN)).toBe(0);
  });
});
