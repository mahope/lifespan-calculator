import { describe, it, expect } from 'vitest';
import {
  calculatePreciseAge,
  breakdownRemaining,
  lifePercent,
  upcomingMilestones,
} from './lifespanMath';

describe('calculatePreciseAge', () => {
  it('computes a whole-year age on an exact birthday', () => {
    const now = new Date(2026, 0, 1); // 1 Jan 2026 (local)
    const r = calculatePreciseAge(new Date(1990, 0, 1), now);
    expect(r.years).toBe(36);
    expect(r.months).toBe(0);
    expect(r.days).toBe(0);
  });

  it('borrows days from the previous month when day-of-month is negative', () => {
    const now = new Date(2026, 2, 1); // 1 Mar 2026
    const r = calculatePreciseAge(new Date(1990, 1, 15), now); // born 15 Feb 1990
    expect(r.years).toBe(36);
    expect(r.months).toBe(0);
    // From 15 Feb to 1 Mar: Feb 2026 has 28 days -> 28 - 15 + 1 = 14
    expect(r.days).toBe(14);
  });

  it('borrows a month from the year when the month is negative', () => {
    const now = new Date(2026, 0, 10); // 10 Jan 2026
    const r = calculatePreciseAge(new Date(1990, 5, 10), now); // born 10 Jun 1990
    expect(r.years).toBe(35);
    expect(r.months).toBe(7); // Jun -> Jan is 7 months
    expect(r.days).toBe(0);
  });

  it('handles a leap-day birthdate', () => {
    const now = new Date(2026, 2, 1); // 1 Mar 2026
    const r = calculatePreciseAge(new Date(2000, 1, 29), now); // born 29 Feb 2000
    expect(r.years).toBe(26);
    expect(r.totalDaysLived).toBeGreaterThan(9490);
    expect(r.preciseAge).toBeCloseTo(r.totalDaysLived / 365.25, 5);
  });

  it('counts total days lived across a known interval', () => {
    const now = new Date(2021, 0, 1);
    const r = calculatePreciseAge(new Date(2020, 0, 1), now); // 2020 is a leap year
    expect(r.totalDaysLived).toBe(366);
  });

  it('exposes the parsed birthDate', () => {
    const r = calculatePreciseAge(new Date(1985, 4, 20), new Date(2026, 0, 1));
    expect(r.birthDate.getFullYear()).toBe(1985);
    expect(r.birthDate.getMonth()).toBe(4);
  });
});

describe('upcomingMilestones', () => {
  it('returns only future milestones, soonest first', () => {
    const ms = upcomingMilestones(5000, 4);
    expect(ms).toHaveLength(4);
    expect(ms.every((m) => m.day > 5000)).toBe(true);
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i].day).toBeGreaterThanOrEqual(ms[i - 1].day);
    }
  });

  it('leads with the next round-thousand day count', () => {
    const ms = upcomingMilestones(5000, 4);
    expect(ms[0].day).toBe(6000);
    expect(ms[0].daysUntil).toBe(1000);
  });

  it('computes daysUntil as target minus daysLived', () => {
    const ms = upcomingMilestones(12345, 3);
    ms.forEach((m) => expect(m.daysUntil).toBe(m.day - 12345));
  });

  it('has no duplicate day targets', () => {
    const ms = upcomingMilestones(0, 8);
    const days = ms.map((m) => m.day);
    expect(new Set(days).size).toBe(days.length);
  });

  it('respects the limit', () => {
    expect(upcomingMilestones(1000, 2)).toHaveLength(2);
  });
});

describe('lifePercent', () => {
  it('computes a normal percentage', () => {
    expect(lifePercent(40, 80)).toBe(50);
    expect(lifePercent(30, 78.9)).toBeCloseTo(38.02, 1);
  });

  it('clamps to 100 when age has reached/passed expectancy', () => {
    expect(lifePercent(90, 78)).toBe(100);
    expect(lifePercent(78, 78)).toBe(100);
  });

  it('returns 0 for a non-positive expectancy (no divide-by-zero)', () => {
    expect(lifePercent(40, 0)).toBe(0);
    expect(lifePercent(40, -5)).toBe(0);
  });

  it('never returns a negative percentage', () => {
    expect(lifePercent(-3, 80)).toBe(0);
  });
});

describe('breakdownRemaining', () => {
  const DAY = 24 * 60 * 60 * 1000;

  it('breaks a positive interval into units', () => {
    const ms = 2 * DAY + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000;
    const r = breakdownRemaining(ms);
    expect(r).toMatchObject({ years: 0, days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it('rolls whole years out of the day count (~365.25/yr)', () => {
    const r = breakdownRemaining(400 * DAY);
    expect(r.years).toBe(1);
    expect(r.days).toBe(Math.floor(400 % 365.25)); // 34
  });

  it('keeps hours/minutes/seconds within their ranges', () => {
    const r = breakdownRemaining(500 * DAY + 23 * 3600 * 1000 + 59 * 60 * 1000 + 59 * 1000);
    expect(r.hours).toBeLessThan(24);
    expect(r.minutes).toBeLessThan(60);
    expect(r.seconds).toBeLessThan(60);
  });

  it('never returns negative units for a past instant', () => {
    const r = breakdownRemaining(-100000);
    expect(r).toEqual({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('returns all zeros at exactly zero', () => {
    expect(breakdownRemaining(0)).toEqual({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});
