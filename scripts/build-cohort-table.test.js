import { describe, it, expect } from 'vitest';
import { parseCsv, validate, cohortE } from './build-cohort-table.mjs';

// Tiny synthetic table: constant q over ages 0..109 and years 2026..2028.
function csv({ q = 0.01, e = null, ages = 110 } = {}) {
  const rows = ['KØN;ALDER;TAVLE;TID;INDHOLD'];
  for (const sex of ['Mænd', 'Kvinder']) {
    for (let y = 2026; y <= 2028; y++) {
      for (let a = 0; a < ages; a++) {
        rows.push(`${sex};${a} år;Aldersklassens dødshyppighed (pr. 100.000);${y};${String(q * 100000).replace('.', ',')}`);
        rows.push(`${sex};${a} år;Middellevetid (år);${y};${String(e ?? 0).replace('.', ',')}`);
      }
    }
  }
  return rows.join('\n');
}

describe('build-cohort-table', () => {
  it('rejects data whose recomputed e_x disagrees with DST', () => {
    expect(() => validate(parseCsv(csv({ e: 50 })))).toThrow(/mismatch/);
  });

  it('rejects too few ages', () => {
    expect(() => validate(parseCsv(csv({ ages: 50 })))).toThrow(/ages/);
  });

  it('rejects q outside [0,1]', () => {
    expect(() => validate(parseCsv(csv({ q: 1.5 })))).toThrow(/out of \[0,1\]/);
  });

  it('rejects an unexpected header', () => {
    expect(() => parseCsv('a;b;c')).toThrow(/header/);
  });

  // q per year for every age, both sexes (years 2026..2028).
  const byYear = (qs) => {
    const rows = ['KØN;ALDER;TAVLE;TID;INDHOLD'];
    for (const sex of ['Mænd', 'Kvinder']) {
      qs.forEach((q, i) => {
        for (let a = 0; a < 110; a++) {
          rows.push(`${sex};${a} år;Aldersklassens dødshyppighed (pr. 100.000);${2026 + i};${q * 100000}`);
        }
      });
    }
    return rows.join('\n');
  };

  it('uses the trapezoid rule: constant q=0.5 gives e_x = 1.5', () => {
    const { q } = parseCsv(byYear([0.5, 0.5, 0.5]));
    expect(cohortE(q, 'male', 30)).toBeCloseTo(1.5, 6);
  });

  it('holds mortality at the last year level and follows falling q before it', () => {
    // q = 0.5, 0.2, then 0.1 forever (2028 level held): trapezoid sum is exactly 5.0.
    const { q } = parseCsv(byYear([0.5, 0.2, 0.1]));
    expect(cohortE(q, 'male', 30)).toBeCloseTo(5.0, 2) // tail beyond age 109 is ~1e-3;
    // Without falling q (all 0.5) the result differs, so the year lookup is exercised.
    expect(cohortE(parseCsv(byYear([0.5, 0.5, 0.5])).q, 'male', 30)).not.toBeCloseTo(5.0, 0);
  });
});
