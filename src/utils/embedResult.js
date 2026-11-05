import { computeResult, MAX_AGE_INPUT } from './lifespanMath';

export const EMBED_MIN_AGE = 0;
export const EMBED_MAX_AGE = MAX_AGE_INPUT;

/**
 * Result for the embeddable widget: expected remaining years and the expected age
 * at death. Goes through computeResult, the main calculator's entry point, so the
 * numbers (including the mid-year age convention) equal the calculator's for the
 * same input with no lifestyle answers. Returns null for input the widget does
 * not accept.
 * @param {number|string} age whole years, 0..MAX_AGE_INPUT
 * @param {'male'|'female'} gender
 */
export function computeEmbedResult(age, gender) {
  const a = typeof age === 'string' && age.trim() !== '' ? Number(age) : age;
  if (!Number.isInteger(a) || a < EMBED_MIN_AGE || a > EMBED_MAX_AGE) return null;
  if (gender !== 'male' && gender !== 'female') return null;
  const r = computeResult({ ageOrBirthdate: a, gender, lifestyleFactors: {} }, new Date());
  return { remainingYears: Number(r.remainingYears), ageAtDeath: Number(r.adjustedLifeExpectancy) };
}
