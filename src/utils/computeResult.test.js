// Fixed zone so local-time Date arithmetic (DST) is reproducible on any machine.
process.env.TZ = 'Europe/Copenhagen';

import { describe, it, expect } from 'vitest';
import { computeResult, breakdownRemaining, lifestyleTotal, roundYears, roundedLifestyleAdjustment, formatSignedYears, formatYears } from './lifespanMath';
import { LIFESTYLE_KEYS } from '../hooks/useLifespanCalculator';
import { LIFE_TABLE_META } from './lifeTableDK';
import baseline from './masterBaseline.fixture.json';
import { createHash } from 'node:crypto';
import { LIFESTYLE_FACTORS } from './lifestyleFactors';

// Pins the numbers per input. The first commit recorded the pre-#76 formulas; the
// fix commit updated the snapshot so the old -> new diff is visible in git.
const NOW = new Date(2026, 10, 5, 12, 0, 0); // 5 Nov 2026 12:00 local
const zero = Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]));

const CASES = {
  'male 40': { ageOrBirthdate: 40, gender: 'male', lifestyleFactors: zero },
  'female 65': { ageOrBirthdate: 65, gender: 'female', lifestyleFactors: zero },
  'male born 1985-06-15': { ageOrBirthdate: '1985-06-15', gender: 'male', lifestyleFactors: zero },
  'age 0': { ageOrBirthdate: 0, gender: 'female', lifestyleFactors: zero },
  'age 99': { ageOrBirthdate: 99, gender: 'male', lifestyleFactors: zero },
  'advanced two factors': {
    ageOrBirthdate: 50, gender: 'male', lifestyleFactors: { ...zero, smoking: -5, exercise: 2 }, // light smoker -6 y, light exercise +2 y
  },
};

describe('computeResult characterization', () => {
  it.each(Object.entries(CASES))('%s', (name, input) => {
    const r = computeResult(input, NOW);
    expect({
      remainingYears: r.remainingYears,
      remainingDays: r.remainingDays,
      adjustedLifeExpectancy: r.adjustedLifeExpectancy,
      lifestyleImpact: r.lifestyleImpact,
      endTimestamp: r.endTimestamp,
      age: r.age,
      daysLived: r.daysLived,
      countdown: r.countdown,
      lifePercentage: r.lifePercentage,
    }).toMatchSnapshot();
  });
});

describe('computeResult consistency (#76)', () => {
  it.each(Object.entries(CASES))('%s: end instant, days, countdown and headline agree', (name, input) => {
    const r = computeResult(input, NOW);
    const msToEnd = r.endTimestamp - NOW.getTime();
    const daysToEnd = msToEnd / 864e5;
    // remainingDays is the floored distance to the end instant
    expect(Math.abs(r.remainingDays - daysToEnd)).toBeLessThan(1);
    // countdown breakdown of the same instant
    const c = breakdownRemaining(msToEnd);
    const fromTiles = c.years * 365.25 + c.days + c.hours / 24 + c.minutes / 1440 + c.seconds / 86400;
    expect(Math.abs(fromTiles - daysToEnd)).toBeLessThan(1);
    // headline "years left" (1 decimal) converted to days
    expect(Math.abs(parseFloat(r.remainingYears) * 365.25 - daysToEnd)).toBeLessThan(0.05 * 365.25 + 1);
    // end date label is the end instant (not shifted)
    expect(r.endDate).toBe(new Date(r.endTimestamp).toLocaleDateString('da-DK'));
    expect('countdown' in r).toBe(false);
  });

  it('keeps the fractional year in age mode (male 40: 40.75 years, not 41.0)', () => {
    const r = computeResult(CASES['male 40'], NOW);
    expect(r.remainingDays).toBeGreaterThan(40.65 * 365.25);
    expect(r.remainingDays).toBeLessThan(40.85 * 365.25);
  });
});

// Every counting factor at its worst answer.
const worst = Object.fromEntries(
  LIFESTYLE_FACTORS.map((f) => [f.key, f.options.reduce((a, b) => (b.years < a.years ? b : a)).value]),
);

describe('computeResult remainingDays clamp (#76 review)', () => {
  it('never reports negative days when nothing remains (birthdate mode, worst lifestyle, very old)', () => {
    const r = computeResult(
      { ageOrBirthdate: '1920-01-01', gender: 'male', lifestyleFactors: worst },
      NOW,
    );
    // The end instant falls just before `now` in this case, which Math.floor turned into -1.
    expect(r.endTimestamp - NOW.getTime()).toBeLessThanOrEqual(0);
    expect(r.endTimestamp - NOW.getTime()).toBeGreaterThan(-864e5);
    expect(r.remainingDays).toBe(0);
  });
});

describe('lifestyleTotal', () => {
  it('sums the years of the stored answers', () => {
    // exercise answer 2 = +2 y, smoking answer -5 = -6 y, alcohol answer 11 = -0.5 y
    expect(lifestyleTotal({ exercise: 2, smoking: -5, alcohol: 11 })).toBe(-4.5);
    expect(lifestyleTotal({})).toBe(0);
  });

  it('ignores factors that do not count and answers the table does not know', () => {
    expect(lifestyleTotal({ stress: -4, health: -5, education: 3, income: -3, environment: -2 })).toBe(0);
    expect(lifestyleTotal({ smoking: -99, unknown: 5 })).toBe(0);
  });
});

describe('computeResult invalid input', () => {
  it.each([NaN, 'abc', -5])('does not throw for age input %s and keeps a finite end instant', (v) => {
    const r = computeResult({ ageOrBirthdate: v, gender: 'male', lifestyleFactors: zero }, NOW);
    expect(Number.isFinite(r.endTimestamp)).toBe(true);
  });
});

describe('age-only input is an age in a year (#91)', () => {
  const r = (age, gender = 'male') =>
    computeResult({ ageOrBirthdate: age, gender, lifestyleFactors: zero }, NOW);

  it('looks e_x up at age + 0.5', () => {
    // e_40 = 41.23, e_41 = 40.27 (HISB8 male): midpoint 40.75
    expect(r(40).remainingYears).toBe('40.8');
    expect(r(40).age).toBe('40.50');
    expect(r(40).ageIsMidYear).toBe(true);
    // female 65: midpoint of e_65 = 21.39 and e_66 = 20.55 (was 21.4 at exact 65.0)
    expect(r(65, 'female').remainingYears).toBe('21.0');
  });

  it('does not change the birthdate result', () => {
    const b = computeResult({ ageOrBirthdate: '1985-06-15', gender: 'male', lifestyleFactors: zero }, NOW);
    expect(b.remainingYears).toBe('39.9');
    expect(b.ageIsMidYear).toBe(false);
  });

  it('caps the age at 110 and flags the tail rule above 99', () => {
    expect(r(120).age).toBe('110.50');
    expect(r(99).usesTailRule).toBe(true);
    expect(r(98).usesTailRule).toBe(false);
    // a 120-year-old woman no longer gets "expected age at death 122.2"
    expect(Number(r(120, 'female').adjustedLifeExpectancy)).toBeLessThan(113);
  });
});

describe('computeResult projection mode (#92)', () => {
  const m40 = CASES['male 40'];

  it('defaults to the period table: same numbers as before, with the projected figure alongside', () => {
    const base = computeResult(m40, NOW);
    expect(base.projection).toBe('period');
    expect(base.remainingYears).toBe('40.8');
    expect(base.adjustedLifeExpectancy).toBe('81.3');
    expect(base.dataSource).toBe(`Danmarks Statistik (${LIFE_TABLE_META.period})`);
    expect(base.projectionAvailable).toBe(true);
    expect(base.projectedRemainingYears).toBe('46.3');
    expect(computeResult({ ...m40, projection: 'period' }, NOW)).toEqual(base);
  });

  it('projected mode switches headline, expected age, end instant and days', () => {
    const p = computeResult({ ...m40, projection: 'projected' }, NOW);
    const base = computeResult(m40, NOW);
    expect(p.projection).toBe('projected');
    expect(p.remainingYears).toBe('46.3');
    expect(p.adjustedLifeExpectancy).toBe('86.8');
    expect(p.endTimestamp).toBeGreaterThan(base.endTimestamp);
    expect(p.remainingDays).toBeGreaterThan(base.remainingDays);
    expect(p.periodRemainingYears).toBe('40.8');
    expect(p.projectedRemainingYears).toBe('46.3');
  });

  it('applies the lifestyle adjustment to both figures', () => {
    const adv = CASES['advanced two factors'];
    const base = computeResult(adv, NOW);
    const p = computeResult({ ...adv, projection: 'projected' }, NOW);
    expect(parseFloat(p.remainingYears) - parseFloat(base.remainingYears)).toBeGreaterThan(4);
    expect(base.projectedRemainingYears).toBe(p.remainingYears);
  });

  it('is not offered from age 70 (the entered age, not the +0.5 lookup age), and a projected request falls back to period', () => {
    const old = { ageOrBirthdate: 70, gender: 'male', lifestyleFactors: zero };
    const r = computeResult({ ...old, projection: 'projected' }, NOW);
    expect(r.projectionAvailable).toBe(false);
    expect(r.projectedRemainingYears).toBeNull();
    expect(r.projection).toBe('period');
    expect(r).toEqual(computeResult(old, NOW));
    const young = computeResult({ ...old, ageOrBirthdate: 69, projection: 'projected' }, NOW);
    expect(young.projection).toBe('projected');
  });
});

// #92 must not change any default number. The fixture was generated from master's
// computeResult (1e551f1, after #118) and is compared field by field.
describe('default results are byte-identical to master (#92)', () => {
  // dataSource carries the live period (LIFE_TABLE_META.period); the fixture stores a
  // placeholder so a table refresh does not need a fixture edit.
  const norm = (k, v) => (k === 'dataSource' ? v.replace(LIFE_TABLE_META.period, '__PERIOD__') : v);
  const pick = (r) => Object.fromEntries(baseline.masterKeys.map((k) => [k, norm(k, r[k])]));
  const input = (a, g) => ({ ageOrBirthdate: a, gender: g, lifestyleFactors: zero });

  it.each([
    ['male 40', 40, 'male'],
    ['female 65', 65, 'female'],
    ['male born 1985-06-15', '1985-06-15', 'male'],
  ])('baseline %s', (name, a, g) => {
    expect(pick(computeResult(input(a, g), NOW))).toEqual(baseline.baselines[name]);
  });

  it('every age 0-99 and both sexes', () => {
    const all = {};
    const fields = {};
    for (const g of ['male', 'female']) {
      for (let a = 0; a <= 99; a++) {
        const r = computeResult(input(a, g), NOW);
        all[`${g} ${a}`] = pick(r);
        fields[`${g} ${a}`] = Object.fromEntries(baseline.gridFields.map((k) => [k, norm(k, r[k])]));
      }
    }
    expect(fields).toEqual(baseline.grid);
    expect(createHash('sha256').update(JSON.stringify(all)).digest('hex')).toBe(baseline.gridSha256);
  });

  it('passing projection: "period" equals passing nothing', () => {
    expect(computeResult({ ...input(40, 'male'), projection: 'period' }, NOW))
      .toEqual(computeResult(input(40, 'male'), NOW));
  });
});

describe('lifestyle rounding and number format (#93)', () => {
  it('rounds half values symmetrically', () => {
    expect(roundYears(8.75)).toBe(8.8);
    expect(roundYears(-8.75)).toBe(-8.8);
    expect(roundYears(-0.04)).toBe(0);
    expect(Object.is(roundYears(-0.04), -0)).toBe(false);
    expect(roundedLifestyleAdjustment(-8.75)).toBe(-roundedLifestyleAdjustment(8.75));
    expect(formatSignedYears(-8.75)).toBe('-8,8 år');
    expect(formatSignedYears(8.75)).toBe('+8,8 år');
  });

  it('writes years with a decimal comma', () => {
    expect(formatYears(77.8)).toBe('77,8');
    expect(formatYears(80)).toBe('80,0');
    expect(formatSignedYears(4.5)).toBe('+4,5 år');
    expect(formatSignedYears(0)).toBe('0 år');
  });
});
