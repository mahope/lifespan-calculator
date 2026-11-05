// Pure lifespan math, extracted from useLifespanCalculator so it can be
// unit-tested in isolation. Keep this module free of React and side effects.

import { remainingLifeExpectancy } from './lifeTableDK';
import { lifestyleYears } from './lifestyleFactors';

/**
 * Parse a calendar date as LOCAL midnight. `new Date('YYYY-MM-DD')` is UTC
 * midnight, which is the previous day west of UTC; `YYYY-MM-DD` strings are
 * therefore built with the (y, m, d) constructor. Returns an Invalid Date for
 * strings that are not a real calendar date. Date instances are copied.
 * @param {string|Date} value
 */
export function parseLocalDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!m) return new Date(value);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  // Reject overflow such as 2021-02-30 (would roll into March).
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return new Date(NaN);
  }
  return date;
}

/** Local calendar date as `YYYY-MM-DD` (unlike toISOString, never UTC-shifted). */
export function toLocalISODate(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(date.getFullYear(), 4)}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/**
 * Precise age from a birthdate.
 * @param {string|Date} birthdate
 * @param {Date} [now] - injectable "current time" so tests are deterministic.
 */
export function calculatePreciseAge(birthdate, now = new Date()) {
  const birth = parseLocalDate(birthdate);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDaysLived = Math.floor((now - birth) / msPerDay);

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  // Borrow days from the previous month when the day-of-month is negative.
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Borrow months from the year when the month is negative.
  if (months < 0) {
    years--;
    months += 12;
  }

  const preciseAge = totalDaysLived / 365.25;

  return { years, months, days, totalDaysLived, preciseAge, birthDate: birth };
}

/**
 * Raw sum of the lifestyle years (before bounding): the years of each stored
 * answer, counting only the factors that are `inSum` (see lifestyleFactors.js).
 * @param {Record<string, number>} factors - stored answer per factor key
 */
export function lifestyleTotal(factors) {
  return lifestyleYears(factors);
}

/**
 * Bound and round the lifestyle sum to one decimal (the table has half years,
 * so whole-year rounding would turn +4.5 into +5, above its source).
 * @param {number} sum - raw sum from lifestyleTotal
 */
export function roundedLifestyleAdjustment(sum) {
  return Math.round(boundLifestyleAdjustment(sum) * 10) / 10 || 0;
}

/** Signed years in Danish number format: "+4,5 år", "-0,5 år", "0 år". */
export function formatSignedYears(years) {
  const n = Math.round(years * 10) / 10 || 0;
  const body = Math.abs(n).toLocaleString('da-DK', { maximumFractionDigits: 1 });
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${body} år`;
}

/**
 * Bound the summed lifestyle adjustment to a plausible range.
 * Full credit up to ±8 years, then diminishing returns, hard-capped at +12 / -15.
 * This keeps the (illustrative) additive model from producing absurd estimates
 * when many factors are stacked. See #6 — a proper hazard model is #23.
 * @param {number} sum - raw sum of the factor deltas
 */
export function boundLifestyleAdjustment(sum) {
  const SOFT = 8;
  const MAX_POS = 12;
  const MAX_NEG = -15;
  let v = sum;
  if (v > SOFT) v = SOFT + (v - SOFT) * 0.3;
  else if (v < -SOFT) v = -SOFT + (v + SOFT) * 0.3;
  return Math.max(MAX_NEG, Math.min(MAX_POS, v));
}

/**
 * Upcoming round-number life milestones, soonest first.
 * @param {number} daysLived - whole days lived so far
 * @param {number} [limit=4]
 * @returns {{day:number, daysUntil:number, icon:string, label:string}[]}
 */
export function upcomingMilestones(daysLived, limit = 4) {
  const HEARTBEATS_PER_DAY = 70 * 60 * 24; // 100,800
  const SECONDS_PER_DAY = 86400;
  const da = (n) => n.toLocaleString('da-DK');
  const candidates = [];

  // Next two round-thousand day counts
  const nextThousand = (Math.floor(daysLived / 1000) + 1) * 1000;
  candidates.push({ day: nextThousand, icon: '📅', label: `${da(nextThousand)} dage levet` });
  candidates.push({ day: nextThousand + 1000, icon: '📅', label: `${da(nextThousand + 1000)} dage levet` });

  // Big round day landmarks
  [10000, 15000, 20000, 25000, 30000, 35000].forEach((d) =>
    candidates.push({ day: d, icon: '🎯', label: `${da(d)} dage levet` })
  );

  // Billion seconds lived
  [1, 1.5, 2, 2.5, 3].forEach((b) =>
    candidates.push({
      day: Math.round((b * 1e9) / SECONDS_PER_DAY),
      icon: '⏱️',
      label: `${String(b).replace('.', ',')} mia. sekunder levet`,
    })
  );

  // Billion heartbeats
  [1, 2, 3].forEach((b) =>
    candidates.push({
      day: Math.round((b * 1e9) / HEARTBEATS_PER_DAY),
      icon: '❤️',
      label: `${b} mia. hjerteslag`,
    })
  );

  // Round-number ages
  [30, 40, 50, 60, 70, 80, 90, 100].forEach((a) =>
    candidates.push({ day: Math.round(a * 365.25), icon: '🎂', label: `Du fylder ${a}` })
  );

  const seen = new Set();
  return candidates
    .filter((m) => m.day > daysLived)
    .filter((m) => (seen.has(m.day) ? false : seen.add(m.day)))
    .sort((a, b) => a.day - b.day)
    .slice(0, limit)
    .map((m) => ({ ...m, daysUntil: m.day - daysLived }));
}

/**
 * Percentage of the statistical life already lived, clamped to [0, 100].
 * Guards against division by zero and against values > 100 for people who have
 * already reached/passed their statistical life expectancy.
 * @param {number} age
 * @param {number} expectancy
 */
export function lifePercent(age, expectancy) {
  if (!expectancy || expectancy <= 0) return 0;
  const pct = (age / expectancy) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Break a remaining-time interval (in milliseconds) into countdown units.
 * Never goes negative — a past instant yields all zeros.
 * @param {number} msRemaining
 */
export function breakdownRemaining(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return {
    years: Math.floor(totalDays / 365.25),
    days: Math.floor(totalDays % 365.25), // days remaining within the current year
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  };
}

/**
 * Everything the result view needs, computed purely from the input and `now`.
 * @param {{ageOrBirthdate: number|string, gender: string, birthdate?: string|Date|null,
 *          lifestyleFactors: Record<string, number>}} input
 * @param {Date} now
 */
export function computeResult(input, now) {
  const { ageOrBirthdate, gender, birthdate = null, lifestyleFactors } = input;
  let age;
  let preciseAgeData = null;
  let daysLived;

  // Check if we have a birthdate (either as first param or third param)
  const birthdateValue = birthdate || (typeof ageOrBirthdate === 'string' && ageOrBirthdate.includes('-') ? ageOrBirthdate : null);

  if (birthdateValue) {
    preciseAgeData = calculatePreciseAge(birthdateValue, now);
    age = preciseAgeData.preciseAge;
    daysLived = preciseAgeData.totalDaysLived;
  } else {
    age = typeof ageOrBirthdate === 'number' ? ageOrBirthdate : parseInt(ageOrBirthdate);
    daysLived = Math.floor(age * 365.25);
  }

  // Age-conditional remaining life expectancy (e_x) from the Danish period life table.
  const genderKey = gender === 'female' ? 'female' : 'male';
  const rawLifestyleAdjustment = lifestyleTotal(lifestyleFactors);
  const lifestyleAdjustment = roundedLifestyleAdjustment(rawLifestyleAdjustment);
  const remainingBase = remainingLifeExpectancy(age, genderKey);
  const remainingYears = Math.max(0, remainingBase + lifestyleAdjustment);
  const adjustedLifeExpectancy = age + remainingYears; // expected age at death

  // One end instant for both modes, with the fractional year kept (the old age
  // branch used the Date constructor, which truncated it to whole years).
  const MS_PER_YEAR = 365.25 * 864e5;
  const exactEndDate = preciseAgeData
    ? new Date(preciseAgeData.birthDate.getTime() + adjustedLifeExpectancy * MS_PER_YEAR)
    : new Date(now.getTime() + remainingYears * MS_PER_YEAR);

  const timeRemaining = exactEndDate - now;

  const minutesLived = daysLived * 24 * 60;
  const hoursLived = daysLived * 24;

  return {
    remainingYears: remainingYears.toFixed(1),
    remainingDays: Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24))),
    adjustedLifeExpectancy: adjustedLifeExpectancy.toFixed(1),
    lifestyleImpact: lifestyleAdjustment,
    endDate: exactEndDate.toLocaleDateString('da-DK'),
    endTimestamp: exactEndDate.getTime(),
    dataSource: 'Danmarks Statistik (2024-2025)',
    age: typeof age === 'number' ? age.toFixed(2) : age,
    displayAge: preciseAgeData
      ? `${preciseAgeData.years} år, ${preciseAgeData.months} mdr, ${preciseAgeData.days} dage`
      : `${Math.floor(age)} år`,
    gender,
    lifePercentage: lifePercent(age, adjustedLifeExpectancy).toFixed(1),
    daysLived,
    hoursLived,
    minutesLived,
    hasPreciseBirthdate: !!preciseAgeData,
    birthYear: preciseAgeData ? preciseAgeData.birthDate.getFullYear() : null,
    birthdate: preciseAgeData?.birthDate?.toLocaleDateString('da-DK') || null,

    // Heart beats: average 70 bpm across rest and activity
    heartbeats: Math.floor(minutesLived * 70),

    sunrises: daysLived,
    wordsSpoken: Math.floor(daysLived * 16000), // ~16,000 words/day average
    sleepHours: Math.floor(daysLived * 8), // 8 hours sleep/day
    blinks: Math.floor(minutesLived * 17), // ~17 blinks/minute while awake
    breaths: Math.floor(minutesLived * 14), // ~14 breaths/minute average
    steps: Math.floor(daysLived * 7000), // ~7,000 steps/day average
    meals: Math.floor(daysLived * 3), // 3 meals/day
    coffeeCups: Math.floor(daysLived * 2.5), // ~2.5 cups/day (Danish average)
    laughs: Math.floor(daysLived * 17), // adults laugh ~17 times/day
    waterLiters: Math.floor(daysLived * 2), // ~2 liters/day
    spaceKm: Math.floor(daysLived * 2575342), // Earth travels ~2.58 million km/day

    secondsLived: preciseAgeData ? daysLived * 24 * 60 * 60 : null,
    fullMoons: preciseAgeData ? Math.floor(daysLived / 29.53) : null, // lunar cycle ~29.53 days
    seasons: preciseAgeData ? Math.floor(daysLived / 91.31) : null, // ~4 seasons per year
  };
}
