// Pure lifespan math, extracted from useLifespanCalculator so it can be
// unit-tested in isolation. Keep this module free of React and side effects.

/**
 * Precise age from a birthdate.
 * @param {string|Date} birthdate
 * @param {Date} [now] - injectable "current time" so tests are deterministic.
 */
export function calculatePreciseAge(birthdate, now = new Date()) {
  const birth = new Date(birthdate);

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
