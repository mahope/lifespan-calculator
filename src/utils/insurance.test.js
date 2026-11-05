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

describe('estimateCover with the deceased share and existing cover (#91)', () => {
  it('multiplies by the share of income (percent) and subtracts existing cover', () => {
    expect(estimateCover(600000, 10, { sharePct: 50 })).toBe(3000000);
    expect(estimateCover(600000, 10, { sharePct: 50, existingCover: 1000000 })).toBe(2000000);
  });

  it('defaults to 100 % and no existing cover', () => {
    expect(estimateCover(500000, 10, {})).toBe(5000000);
    expect(estimateCover(500000, 10, { sharePct: NaN, existingCover: NaN })).toBe(5000000);
  });

  it('never returns Infinity for absurd input', () => {
    expect(estimateCover(1e308, 10)).toBe(0);
    expect(Number.isFinite(estimateCover(Number.MAX_VALUE, 1000))).toBe(true);
  });

  it('never goes below zero and clamps the share to 0-100', () => {
    expect(estimateCover(500000, 10, { existingCover: 9000000 })).toBe(0);
    expect(estimateCover(500000, 10, { sharePct: 250 })).toBe(5000000);
    expect(estimateCover(500000, 10, { sharePct: -5 })).toBe(0);
  });
});
