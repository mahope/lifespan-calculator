import { describe, it, expect } from 'vitest';
import { COHORT_TABLE } from './cohortTable.generated';
import { LIFE_TABLE_DK, LIFE_TABLE_PERIOD } from '../utils/lifeTableDK';

// Verified values from the audit (cohort_projection_output.json, DST FRDK426).
const EXPECTED = [
  ['male', 20, 67.78], ['male', 40, 46.84], ['male', 60, 25.88], ['male', 80, 9.14],
  ['female', 20, 70.14], ['female', 40, 49.43], ['female', 60, 28.41], ['female', 80, 10.87],
];

describe('generated cohort table', () => {
  it('carries provenance', () => {
    expect(COHORT_TABLE.source).toMatch(/FRDK426/);
    expect(COHORT_TABLE.tableUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(COHORT_TABLE.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(COHORT_TABLE.holdRule).toMatch(/2069/);
  });

  it.each(EXPECTED)('%s age %i is about %f', (sex, age, value) => {
    expect(Math.abs(COHORT_TABLE.remaining[sex][age] - value)).toBeLessThanOrEqual(0.05);
  });

  it.each(['male', 'female'])('%s: 100 ages, cohort >= period below 90, decreasing in age', (sex) => {
    const c = COHORT_TABLE.remaining[sex];
    const p = LIFE_TABLE_DK.remaining[sex];
    expect(c).toHaveLength(100);
    for (let a = 0; a < 90; a++) expect(c[a]).toBeGreaterThanOrEqual(p[a]);
    for (let a = 1; a < c.length; a++) expect(c[a]).toBeLessThan(c[a - 1]);
  });

  // Reminder to regenerate (`node scripts/build-cohort-table.mjs`): the cohort table's
  // first projection year must not trail the end of the period table's years by more
  // than one year. Fails once a newer period table ships without a newer projection.
  it('is not older than the life table period by more than a year', () => {
    const periodEnd = Number(LIFE_TABLE_PERIOD.split('-').pop());
    expect(Number.isInteger(periodEnd)).toBe(true);
    expect(periodEnd - COHORT_TABLE.baseYear).toBeLessThanOrEqual(1);
  });
});
