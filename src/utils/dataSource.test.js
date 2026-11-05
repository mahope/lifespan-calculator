import { describe, expect, it } from 'vitest';
import { dataSource } from './dataSource';
import { LIFESTYLE_META } from './lifestyleFactors';

describe('dataSource', () => {
  it('holds the period and update date used across the UI', () => {
    expect(dataSource).toMatchObject({ table: 'HISB8', period: '2024-2025', updated: '12. februar 2026' });
    expect(dataSource.label).toContain(dataSource.period);
  });
});

describe('LIFESTYLE_META citations', () => {
  it("shows the source's own figure next to every citation", () => {
    for (const m of LIFESTYLE_META.filter((x) => x.cite)) {
      expect(m.figure, m.key).toBeTruthy();
    }
  });
});
