// Serialize / restore calculator input state to and from URL query params so a
// shared link reopens the sender's exact result. Kept pure and tested.

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
