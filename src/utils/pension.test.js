import { describe, it, expect } from 'vitest';
import { folkepensionAge, pensionCohort } from './pension';

describe('folkepensionAge', () => {
  it('matches the verified statutory schedule by birth year', () => {
    expect(folkepensionAge(1960)).toBe(67); // 1955–1962
    expect(folkepensionAge(1962)).toBe(67);
    expect(folkepensionAge(1963)).toBe(68); // 1963–1966
    expect(folkepensionAge(1966)).toBe(68);
    expect(folkepensionAge(1967)).toBe(69); // 1967–1970
    expect(folkepensionAge(1970)).toBe(69);
    expect(folkepensionAge(1971)).toBe(70); // 1971+
    expect(folkepensionAge(1990)).toBe(70);
  });

  it('handles earlier (already-retired) cohorts', () => {
    expect(folkepensionAge(1950)).toBe(65);
    expect(folkepensionAge(1954)).toBe(66);
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

describe('pensionCohort', () => {
  const NOW = new Date(2026, 5, 15); // 15 Jun 2026

  it('uses the real birth year when a birthdate is known', () => {
    // Born 1 Dec 1962 is 63 in June 2026: the naive 2026 - 63 gives 1963 (68), the real cohort is 67.
    const c = pensionCohort({ birthYear: 1962, age: 63.5, now: NOW });
    expect(c).toMatchObject({ pensionAge: 67, label: '67', ambiguous: false, birthYears: [1962] });
  });

  it.each([
    [1954, 66],
    [1955, 67],
    [1962, 67],
    [1963, 68],
    [1966, 68],
    [1967, 69],
    [1970, 69],
    [1971, 70],
  ])('birth year %i -> %i (known birthdate, never ambiguous)', (year, expected) => {
    const c = pensionCohort({ birthYear: year, age: 2026 - year, now: NOW });
    expect(c.pensionAge).toBe(expected);
    expect(c.ambiguous).toBe(false);
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
    [71, '66-67 år'], // 1954/55
  ])('age %i shows %s', (age, label) => {
    expect(pensionCohort({ age, now: NOW }).label).toBe(label);
  });
});
