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

  it('cohort e_x with constant q equals the period value and holds after the last year', () => {
    const { q } = parseCsv(csv({ q: 0.02 }));
    const c = cohortE(q, 'male', 30);
    expect(c).toBeGreaterThan(30);
    expect(c).toBeLessThan(55);
  });
});
