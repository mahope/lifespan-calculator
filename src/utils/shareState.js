// Serialize / restore calculator input state to and from URL query params so a
// shared link reopens the sender's exact result. Kept pure and tested.
import { LIFESTYLE_OPTIONS } from './lifestyleFactors';
import { parseLocalDate, toLocalISODate } from './lifespanMath';

const GENDERS = ['male', 'female'];
const MODES = ['simple', 'advanced'];
const MIN_AGE = 0;
const MAX_AGE = 110;
const MIN_BIRTHDATE = '1900-01-01';

/**
 * Validate the query params of an incoming share link. Never trust a URL:
 * returns `null` for anything invalid (the page then shows the empty form),
 * otherwise a form-ready object:
 *   { gender, age, birthdate, useBirthdate, mode, lifestyle|null }
 *
 * - `g` must be male|female; `a` is clamped to an integer 0-110;
 * - `b` must be a real calendar date YYYY-MM-DD in [1900-01-01, today] (wins over `a`);
 * - `m` is simple|advanced (absent = simple); `lf` is only read in advanced
 *   mode and every value must be one the questionnaire can produce;
 * - a repeated param makes the link invalid.
 *
 * @param {URLSearchParams} searchParams
 * @param {{now?: Date, options?: Record<string, number[]>}} [opts]
 */
export function parseShareParams(searchParams, { now = new Date(), options = LIFESTYLE_OPTIONS } = {}) {
  const one = (name) => {
    const all = searchParams.getAll(name);
    if (all.length > 1) return { dup: true };
    return { value: all.length ? all[0] : null };
  };
  const g = one('g');
  const a = one('a');
  const b = one('b');
  const m = one('m');
  const lf = one('lf');
  if (g.dup || a.dup || b.dup || m.dup || lf.dup) return null;

  if (!GENDERS.includes(g.value)) return null;

  let age = '';
  let birthdate = '';
  let useBirthdate = false;
  if (b.value !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.value)) return null;
    const d = parseLocalDate(b.value);
    if (Number.isNaN(d.getTime())) return null;
    if (b.value < MIN_BIRTHDATE || b.value > toLocalISODate(now)) return null;
    birthdate = b.value;
    useBirthdate = true;
  } else if (a.value !== null) {
    if (!/^-?\d+(\.\d+)?$/.test(a.value)) return null;
    age = Math.min(MAX_AGE, Math.max(MIN_AGE, Math.floor(Number(a.value))));
  } else {
    return null;
  }

  if (m.value !== null && !MODES.includes(m.value)) return null;
  const mode = m.value === 'advanced' ? 'advanced' : 'simple';

  let lifestyle = null;
  if (mode === 'advanced' && lf.value !== null) {
    const keys = Object.keys(options);
    const parts = lf.value.split(',');
    if (parts.length !== keys.length) return null;
    lifestyle = {};
    for (let i = 0; i < keys.length; i++) {
      if (!/^-?\d+$/.test(parts[i])) return null;
      const n = Number(parts[i]);
      if (!options[keys[i]].includes(n)) return null;
      lifestyle[keys[i]] = n;
    }
  }

  return { gender: g.value, age, birthdate, useBirthdate, mode, lifestyle };
}

/** Pack lifestyle factor values into a compact, fixed-order string. */
export function packLifestyle(factors, keys) {
  return keys.map((k) => factors[k] ?? 0).join(',');
}

/**
 * Parse a packed lifestyle string back into a factors object.
 * Returns null if the string is missing or the length doesn't match `keys`.
 */
export function parseLifestyle(str, keys) {
  if (!str) return null;
  const parts = str.split(',');
  if (parts.length !== keys.length) return null;
  const out = {};
  for (let i = 0; i < keys.length; i++) {
    const n = parseInt(parts[i], 10);
    out[keys[i]] = Number.isFinite(n) ? n : 0;
  }
  return out;
}

/** Build the URL query object from the current form state. */
export function buildShareParams({ gender, age, birthdate, useBirthdate, mode, lifestyle, keys }) {
  const params = { g: gender };
  if (useBirthdate) params.b = birthdate;
  else params.a = String(age);
  if (mode === 'advanced') {
    params.m = 'advanced';
    params.lf = packLifestyle(lifestyle, keys);
  }
  return params;
}
