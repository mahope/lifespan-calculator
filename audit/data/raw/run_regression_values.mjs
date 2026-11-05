// Regression reference values for levetidsberegner.dk, computed with the REAL util modules (copied to ./code_copy,
// import path fixed only) and a verbatim transcription of useLifespanCalculator.calculateLifespan with an injected `now`.
// Run: TZ=Europe/Copenhagen node run_regression_values.mjs > regression_values_output.json
import { calculatePreciseAge, boundLifestyleAdjustment, lifePercent, breakdownRemaining } from './code_copy/lifespanMath.mjs';
import { remainingLifeExpectancy, survivalProbability, biologicalAge, projectedExpectancy } from './code_copy/lifeTableDK.mjs';
import { folkepensionAge } from './code_copy/pension.mjs';
import { getLifeExpectancyForCountry } from './code_copy/lifeExpectancyData.mjs';

const NOW = new Date(2026, 10, 5, 12, 0, 0); // 2026-11-05 12:00 local (Europe/Copenhagen)

// transcription of the hook (lines 63-160), `now` injected, lifestyle = {} by default
function calc(ageOrBirthdate, gender, factors = {}, birthdate = null) {
  const now = NOW;
  let age, preciseAgeData = null, daysLived, exactEndDate;
  const birthdateValue = birthdate || (typeof ageOrBirthdate === 'string' && ageOrBirthdate.includes('-') ? ageOrBirthdate : null);
  if (birthdateValue) {
    preciseAgeData = calculatePreciseAge(birthdateValue, now); // NB: hook calls this WITHOUT `now` (uses new Date())
    age = preciseAgeData.preciseAge;
    daysLived = preciseAgeData.totalDaysLived;
  } else {
    age = typeof ageOrBirthdate === 'number' ? ageOrBirthdate : parseInt(ageOrBirthdate);
    daysLived = Math.floor(age * 365.25);
  }
  const genderKey = gender === 'female' ? 'female' : 'male';
  const raw = Object.values(factors).reduce((s, v) => s + v, 0);
  const adj = Math.round(boundLifestyleAdjustment(raw));
  const remainingBase = remainingLifeExpectancy(age, genderKey);
  const remainingYears = Math.max(0, remainingBase + adj);
  const adjustedLifeExpectancy = age + remainingYears;
  if (preciseAgeData) {
    const yearsToAdd = Math.floor(adjustedLifeExpectancy);
    const fractionalYear = adjustedLifeExpectancy - yearsToAdd;
    exactEndDate = new Date(preciseAgeData.birthDate);
    exactEndDate.setFullYear(exactEndDate.getFullYear() + yearsToAdd);
    exactEndDate.setDate(exactEndDate.getDate() + Math.floor(fractionalYear * 365.25));
  } else {
    exactEndDate = new Date(now.getFullYear() + remainingYears, now.getMonth(), now.getDate());
  }
  const timeRemaining = exactEndDate - now;
  const result = {
    input: { ageOrBirthdate, gender, factors },
    remainingBase: +remainingBase.toFixed(4),
    lifestyleAdjustment: adj,
    remainingYears: remainingYears.toFixed(1),
    remainingDays: Math.floor(timeRemaining / 86400000),
    remainingDaysIfFractionNotTruncated: Math.floor(remainingYears * 365.25),
    adjustedLifeExpectancy: adjustedLifeExpectancy.toFixed(1),
    endDate: exactEndDate.toLocaleDateString('da-DK'),
    age: age.toFixed(2),
    displayAge: preciseAgeData ? `${preciseAgeData.years} år, ${preciseAgeData.months} mdr, ${preciseAgeData.days} dage` : `${Math.floor(age)} år`,
    daysLived,
    lifePercentage: lifePercent(age, adjustedLifeExpectancy).toFixed(1),
    countdown: breakdownRemaining(timeRemaining),
  };
  // Sandsynlighed.jsx
  result.sandsynlighed = [80, 90, 95, 100].filter((t) => t > age).map((t) => ({ age: t, pct: Math.round(survivalProbability(age, t, genderKey) * 100) }));
  // Sammenlign.jsx
  const you = parseFloat(result.adjustedLifeExpectancy);
  const dk = getLifeExpectancyForCountry('Denmark', genderKey);
  const diff = you - dk;
  result.sammenlign = { you, dkAvgInFile: dk, diff: +diff.toFixed(2),
    verdict: diff >= 0.05 ? `over (${Math.abs(diff).toFixed(1)})` : diff <= -0.05 ? `under (${Math.abs(diff).toFixed(1)})` : 'lige omkring' };
  // Pension.jsx
  const ageNum = parseFloat(result.age);
  const birthYear = NOW.getFullYear() - Math.floor(ageNum);
  const pensionAge = folkepensionAge(birthYear);
  const retired = ageNum >= pensionAge;
  result.pension = { birthYearDerived: birthYear, pensionAge, workingYearsLeft: retired ? 0 : Math.round(pensionAge - ageNum),
    retirementYears: Math.max(0, Math.round(parseFloat(result.adjustedLifeExpectancy) - pensionAge)) };
  return result;
}

const out = { evaluatedAt: '2026-11-05T12:00 Europe/Copenhagen', node: process.version, cases: {}, diagnostics: {} };
out.cases.male40 = calc(40, 'male');
out.cases.female65 = calc(65, 'female');
out.cases.male_born_1985_06_15 = calc('1985-06-15', 'male');

// ---- diagnostics (bugs/edge cases referenced in DATA-REPORT.md)
const d = out.diagnostics;
// 1. P(100) == P(99)
d.p99_vs_p100_male40 = { p99: survivalProbability(40, 99, 'male'), p100: survivalProbability(40, 100, 'male') };
d.p99_vs_p100_female60 = { p99: survivalProbability(60, 99, 'female'), p100: survivalProbability(60, 100, 'female') };
d.age99_5_prob_to_100 = survivalProbability(99.5, 100, 'male');
// 2. fixed-year lifestyle adjustment is age independent: heavy smoker (-10) at various ages
d.heavySmokerFlatMinus9 = [30, 50, 70, 80, 85, 90].map((a) => ({ age: a, e_x_male: +remainingLifeExpectancy(a, 'male').toFixed(2),
  remainingAfter: +Math.max(0, remainingLifeExpectancy(a, 'male') + Math.round(boundLifestyleAdjustment(-10))).toFixed(2) }));
// 3. biological age delta for same lifestyle effect at different ages (male)
d.biologicalAgeDelta = [25, 40, 55, 70, 85].map((a) => {
  const base = remainingLifeExpectancy(a, 'male');
  const row = { age: a };
  for (const adj of [+6, -6]) row[`adj${adj > 0 ? '+' : ''}${adj}`] = a - Math.round(biologicalAge(base + adj, 'male'));
  return row;
});
// 4. pension birth-year approximation near the 1970/1971 boundary
const mk = (iso) => { const p = calculatePreciseAge(iso, NOW); const by = NOW.getFullYear() - Math.floor(p.preciseAge); return { born: iso, trueBirthYear: +iso.slice(0, 4), derivedBirthYear: by, folkepensionAgeTrue: folkepensionAge(+iso.slice(0, 4)), folkepensionAgeShown: folkepensionAge(by) }; };
d.pensionBirthYearBoundary = [mk('1970-12-20'), mk('1970-11-06'), mk('1971-11-20'), mk('1962-12-24'), mk('1966-12-31')];
// 5. Date constructor with fractional year (age-only mode)
d.dateCtorFraction = { years: 41.23, endDate: new Date(2026 + 41.23, 10, 5).toISOString(), expectedIfFractionKept: new Date(2026 + 41, 10, 5 + Math.floor(0.23 * 365.25)).toISOString() };
// 6. TZ sensitivity of new Date('YYYY-MM-DD') (UTC midnight)
d.birthdateParse = { iso: new Date('1985-06-15').toISOString(), localString: new Date('1985-06-15').toString() };
// 7. e_x at exact ages and expected age at death (age + e_x), no lifestyle
d.expectedAgeAtDeath = [[0, 'male'], [0, 'female'], [20, 'male'], [40, 'male'], [40, 'female'], [65, 'male'], [65, 'female'], [80, 'male'], [99, 'male'], [99.5, 'male'], [120, 'female']].map(([a, g]) => ({ age: a, g, e_x: +remainingLifeExpectancy(a, g).toFixed(3), ageAtDeath: +(a + remainingLifeExpectancy(a, g)).toFixed(2) }));
// 8. Sammenlign unconditional vs conditional (zero lifestyle input)
d.sammenlignApplesToOranges = [[0, 'male'], [40, 'male'], [65, 'male'], [80, 'male'], [65, 'female'], [80, 'female']].map(([a, g]) => {
  const you = a + remainingLifeExpectancy(a, g); const dk = getLifeExpectancyForCountry('Denmark', g);
  return { age: a, g, you: +you.toFixed(1), dkAvgFile: dk, diff: +(you - dk).toFixed(1) };
});
// 9. boundLifestyleAdjustment sums for extreme profiles
d.bound = { bestEverRaw: 32, bestEverBounded: boundLifestyleAdjustment(32), worstEverRaw: -50 /* -10-0-2-6-2-4-5-4-3-3-2-2-1-3-1-2 */, };
d.bound.worstEverBounded = boundLifestyleAdjustment(d.bound.worstEverRaw);
console.log(JSON.stringify(out, null, 1));
