import { remainingLifeExpectancy } from './lifeTableDK';

export const EMBED_MIN_AGE = 0;
export const EMBED_MAX_AGE = 99;

/**
 * Result for the embeddable widget: expected remaining years (e_x from the Danish
 * period life table) and the expected age at death. Returns null for input the
 * widget does not accept.
 * @param {number|string} age whole years, 0..99
 * @param {'male'|'female'} gender
 */
export function computeEmbedResult(age, gender) {
  const a = typeof age === 'string' && age.trim() !== '' ? Number(age) : age;
  if (!Number.isInteger(a) || a < EMBED_MIN_AGE || a > EMBED_MAX_AGE) return null;
  if (gender !== 'male' && gender !== 'female') return null;
  const remaining = remainingLifeExpectancy(a, gender);
  return { remainingYears: remaining, ageAtDeath: a + remaining };
}
