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
