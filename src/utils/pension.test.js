import { describe, it, expect } from 'vitest';
import { PENSION_AGE_ROWS, folkepensionAge, folkepensionAgeOn, efterloenAgeOn, pensionCohort, folkepensionDate, pensionOutlook } from './pension';
import { remainingLifeExpectancy } from './lifeTableDK';
import { toLocalISODate } from './lifespanMath';

// Statutory ages as of 2026-11-05 (borger.dk "Før du går på folkepension";
// Lov nr. 703 af 20. juni 2025): <=1953: 65, 1954 H1: 65½, 1954 H2: 66,
// 1955 H1: 66½, 1955 H2-1962: 67, 1963-1966: 68, 1967-1970: 69, 1971+: 70.
describe('folkepensionAge (year only)', () => {
  it('matches the verified statutory schedule by birth year', () => {
    expect(folkepensionAge(1960)).toBe(67);
    expect(folkepensionAge(1962)).toBe(67);
    expect(folkepensionAge(1963)).toBe(68);
    expect(folkepensionAge(1966)).toBe(68);
    expect(folkepensionAge(1967)).toBe(69);
    expect(folkepensionAge(1970)).toBe(69);
    expect(folkepensionAge(1971)).toBe(70);
    expect(folkepensionAge(1990)).toBe(70);
  });

  it('returns the later half-year age for the two split years', () => {
    expect(folkepensionAge(1954)).toBe(66);
    expect(folkepensionAge(1955)).toBe(67);
  });

  it('handles earlier (already-retired) cohorts', () => {
    expect(folkepensionAge(1950)).toBe(65);
  });

  it('is non-decreasing across birth years', () => {
    let prev = 0;
    for (let y = 1940; y <= 2000; y++) {
      const a = folkepensionAge(y);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
  });
});

describe('folkepensionAgeOn / efterloenAgeOn at every cohort boundary date', () => {
  it.each([
    [1953, 12, 65],
    [1954, 1, 65.5],
    [1954, 6, 65.5],
    [1954, 7, 66],
    [1954, 12, 66],
    [1955, 1, 66.5],
    [1955, 6, 66.5],
    [1955, 7, 67],
    [1962, 12, 67],
    [1963, 1, 68],
    [1966, 12, 68],
    [1967, 1, 69],
    [1970, 12, 69],
    [1971, 1, 70],
  ])('born %i-%i -> %d', (y, m, expected) => {
    expect(folkepensionAgeOn(y, m)).toBe(expected);
  });

  // borger.dk: 1956 H2-1958: 63; 1959 H1: 63½; 1959 H2-1962: 64; 1963-1966: 65;
  // 1967-1970: 66; later cohorts not fixed.
  it.each([
    [1956, 6, undefined],
    [1956, 7, 63],
    [1958, 12, 63],
    [1959, 1, 63.5],
    [1959, 6, 63.5],
    [1959, 7, 64],
    [1962, 12, 64],
    [1963, 1, 65],
    [1966, 12, 65],
    [1967, 1, 66],
    [1970, 12, 66],
    [1971, 1, null],
    [1990, 6, null],
  ])('efterløn, born %i-%i -> %s', (y, m, expected) => {
    expect(efterloenAgeOn(y, m)).toBe(expected);
  });
});

describe('pensionCohort', () => {
  const NOW = new Date(2026, 5, 15); // 15 Jun 2026

  it('uses the real birth year when a birthdate is known', () => {
    // Born 1 Dec 1962 is 63 in June 2026: the naive 2026 - 63 gives 1963 (68), the real cohort is 67.
    const c = pensionCohort({ birthYear: 1962, birthMonth: 12, age: 63.5, now: NOW });
    expect(c).toMatchObject({ pensionAge: 67, label: '67', ambiguous: false, birthYears: [1962] });
  });

  it.each([
    [1954, 3, 65.5, '65½'],
    [1954, 9, 66, '66'],
    [1955, 2, 66.5, '66½'],
    [1955, 8, 67, '67'],
    [1962, 12, 67, '67'],
    [1963, 1, 68, '68'],
    [1966, 12, 68, '68'],
    [1967, 1, 69, '69'],
    [1970, 12, 69, '69'],
    [1971, 1, 70, '70'],
  ])('born %i-%i -> %d (known birthdate, never ambiguous)', (year, month, expected, label) => {
    const c = pensionCohort({ birthYear: year, birthMonth: month, age: 2026 - year, now: NOW });
    expect(c.pensionAge).toBe(expected);
    expect(c.label).toBe(label);
    expect(c.ambiguous).toBe(false);
  });

  it('is ambiguous when only the birth year is known and the year is split', () => {
    const c = pensionCohort({ birthYear: 1954, age: 72, now: NOW });
    expect(c.label).toBe('65½-66 år');
    expect(c.ambiguous).toBe(true);
  });

  it('is ambiguous in age mode at a cohort boundary', () => {
    // age 63 in 2026: born 2026-63 = 1963 (birthday passed) or 1962 (not yet)
    const c = pensionCohort({ age: 63, now: NOW });
    expect(c.birthYears).toEqual([1962, 1963]);
    expect(c.ambiguous).toBe(true);
    expect(c.label).toBe('67-68 år');
    expect(c.pensionAge).toBe(67.5);
  });

  it.each([
    [64, 1961, 1962], // 67 both
    [60, 1965, 1966], // 68 both
    [56, 1969, 1970], // 69 both
    [30, 1995, 1996], // 70 both
  ])('age %i (born %i/%i) is not ambiguous', (age, y0, y1) => {
    const c = pensionCohort({ age, now: NOW });
    expect(c.birthYears).toEqual([y0, y1]);
    expect(c.ambiguous).toBe(false);
  });

  it.each([
    [59, '68-69 år'], // 1966/67
    [55, '69-70 år'], // 1970/71
    [71, '65½-67 år'], // 1954/55
  ])('age %i shows %s', (age, label) => {
    expect(pensionCohort({ age, now: NOW }).label).toBe(label);
  });

  describe('efterløn label', () => {
    it('is exact with a known birth month', () => {
      expect(pensionCohort({ birthYear: 1960, birthMonth: 3, age: 66, now: NOW }).efterloen).toBe('64');
      expect(pensionCohort({ birthYear: 1959, birthMonth: 3, age: 67, now: NOW }).efterloen).toBe('63½');
    });
    it('says not fixed for 1971 and later, and is hidden before 1956 H2', () => {
      expect(pensionCohort({ birthYear: 1985, birthMonth: 6, age: 41, now: NOW }).efterloen).toBe('ikke fastsat');
      expect(pensionCohort({ birthYear: 1950, birthMonth: 6, age: 76, now: NOW }).efterloen).toBeNull();
    });
    it('shows a range in age mode', () => {
      // age 63: born 1962/1963 -> 64 and 65
      expect(pensionCohort({ age: 63, now: NOW }).efterloen).toBe('64-65 år');
    });
  });
});

// Boundary dates for every cohort: statutory age and the date it is reached (#97).
describe('folkepensionDate', () => {
  const cases = [
    ['1954-06-30', 65.5, '2019-12-30'],
    ['1954-07-01', 66, '2020-07-01'],
    ['1955-06-30', 66.5, '2021-12-30'],
    ['1955-07-01', 67, '2022-07-01'],
    ['1962-12-31', 67, '2029-12-31'],
    ['1963-01-01', 68, '2031-01-01'],
    ['1966-12-31', 68, '2034-12-31'],
    ['1967-01-01', 69, '2036-01-01'],
    ['1970-12-31', 69, '2039-12-31'],
    ['1971-01-01', 70, '2041-01-01'],
  ];
  it.each(cases)('birth %s → age %s on %s', (birth, age, reached) => {
    const r = folkepensionDate(birth);
    expect(r.age).toBe(age);
    expect(r.years).toBe(Math.floor(age));
    expect(r.months).toBe(age % 1 ? 6 : 0);
    expect(toLocalISODate(r.date)).toBe(reached);
  });

  it('clamps 29 February to 28 February in a non-leap target year', () => {
    expect(toLocalISODate(folkepensionDate('1960-02-29').date)).toBe('2027-02-28');
  });

  it('does not roll a month-end birthday over a short month', () => {
    expect(toLocalISODate(folkepensionDate('1954-08-31').date)).toBe('2020-08-31');
    expect(toLocalISODate(folkepensionDate('1954-01-31').date)).toBe('2019-07-31');
    expect(toLocalISODate(folkepensionDate('1953-08-31').date)).toBe('2018-08-31');
    expect(toLocalISODate(folkepensionDate('1954-06-30').date)).toBe('2019-12-30');
  });

  it('returns null for an invalid date', () => {
    expect(folkepensionDate('1999-02-30')).toBeNull();
    expect(folkepensionDate('')).toBeNull();
  });
});

describe('pensionOutlook', () => {
  const now = new Date(2026, 10, 5);
  it('counts years, months and days until the pension date', () => {
    const o = pensionOutlook('1980-01-01', now);
    expect(toLocalISODate(o.date)).toBe('2050-01-01');
    expect(o.retired).toBe(false);
    expect(o.until).toEqual({ years: 23, months: 1, days: 27 });
    expect(o.yearsInRetirement.female).toBeGreaterThan(o.yearsInRetirement.male);
  });
  it('is retired once the date has passed, using e_x at the current age', () => {
    const o = pensionOutlook('1954-06-30', now);
    expect(o.retired).toBe(true);
    expect(o.until).toBeNull();
    expect(o.yearsInRetirement.male).toBeCloseTo(remainingLifeExpectancy(72.35, 'male'), 0);
  });
  it('rejects invalid and future dates', () => {
    expect(pensionOutlook('2030-01-01', now)).toBeNull();
    expect(pensionOutlook('2001-02-30', now)).toBeNull();
  });
});

describe('PENSION_AGE_ROWS (table shown on /pensionsalder)', () => {
  it('has one constant age per row, equal to the calculator at both ends', () => {
    for (const { label, from, to } of PENSION_AGE_ROWS) {
      expect(folkepensionAgeOn(...from), label).toBe(folkepensionAgeOn(...to));
    }
  });

  it('is contiguous and covers 1930-2100 without gaps or overlaps', () => {
    const next = ([y, m]) => (m === 12 ? [y + 1, 1] : [y, m + 1]);
    expect(PENSION_AGE_ROWS[0].from).toEqual([1930, 1]);
    for (let i = 1; i < PENSION_AGE_ROWS.length; i++) {
      expect(PENSION_AGE_ROWS[i].from, PENSION_AGE_ROWS[i].label).toEqual(next(PENSION_AGE_ROWS[i - 1].to));
    }
  });

  it('changes age between neighbouring rows', () => {
    for (let i = 1; i < PENSION_AGE_ROWS.length; i++) {
      expect(folkepensionAgeOn(...PENSION_AGE_ROWS[i].from)).not.toBe(folkepensionAgeOn(...PENSION_AGE_ROWS[i - 1].from));
    }
  });
});
