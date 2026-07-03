// Danish period life table (Danmarks Statistik, table HISB8, period 2024:2025).
// Source: https://www.statbank.dk/HISB8
//   REMAINING (e_x, TAVLE=3): expected remaining years at each exact age.
//   SURVIVORS (l_x, TAVLE=1): of 100,000 born, how many are still alive at age x.
// Index = age (0..99). Regenerate by curling the HISB8 CSV for TAVLE=3 and =1.

export const LIFE_TABLE_DK = {
  remaining: {
    male: [80.25, 79.56, 78.58, 77.59, 76.60, 75.60, 74.61, 73.61, 72.61, 71.62, 70.62, 69.62, 68.63, 67.63, 66.64, 65.65, 64.66, 63.67, 62.68, 61.70, 60.72, 59.74, 58.75, 57.77, 56.79, 55.82, 54.84, 53.87, 52.89, 51.91, 50.92, 49.95, 48.97, 48.01, 47.04, 46.06, 45.10, 44.13, 43.16, 42.19, 41.23, 40.27, 39.30, 38.36, 37.41, 36.44, 35.50, 34.56, 33.62, 32.68, 31.75, 30.82, 29.92, 29.01, 28.11, 27.23, 26.34, 25.44, 24.57, 23.71, 22.85, 22.00, 21.16, 20.35, 19.52, 18.72, 17.94, 17.19, 16.42, 15.70, 14.98, 14.28, 13.58, 12.91, 12.24, 11.56, 10.92, 10.27, 9.64, 9.04, 8.45, 7.86, 7.32, 6.80, 6.30, 5.79, 5.31, 4.87, 4.53, 4.15, 3.80, 3.53, 3.22, 2.98, 2.77, 2.55, 2.38, 2.10, 1.97, 1.84],
    female: [83.90, 83.25, 82.26, 81.27, 80.28, 79.29, 78.29, 77.30, 76.30, 75.31, 74.31, 73.31, 72.32, 71.32, 70.33, 69.33, 68.34, 67.34, 66.36, 65.37, 64.38, 63.40, 62.41, 61.41, 60.42, 59.44, 58.45, 57.46, 56.47, 55.49, 54.50, 53.52, 52.54, 51.55, 50.56, 49.58, 48.59, 47.61, 46.63, 45.65, 44.67, 43.69, 42.71, 41.73, 40.75, 39.79, 38.83, 37.87, 36.90, 35.94, 34.99, 34.05, 33.10, 32.15, 31.21, 30.28, 29.37, 28.44, 27.53, 26.63, 25.74, 24.85, 23.97, 23.09, 22.23, 21.39, 20.55, 19.70, 18.90, 18.09, 17.30, 16.50, 15.73, 14.97, 14.22, 13.49, 12.74, 12.01, 11.33, 10.65, 9.99, 9.33, 8.70, 8.08, 7.51, 6.96, 6.43, 5.93, 5.46, 5.01, 4.60, 4.22, 3.87, 3.56, 3.28, 3.04, 2.83, 2.60, 2.42, 2.18],
  },
  survivors: {
    male: [100000, 99613, 99596, 99576, 99570, 99564, 99558, 99555, 99549, 99546, 99546, 99543, 99530, 99523, 99508, 99494, 99482, 99463, 99449, 99417, 99389, 99346, 99336, 99299, 99260, 99216, 99178, 99129, 99086, 99041, 99020, 98972, 98925, 98850, 98795, 98737, 98667, 98596, 98530, 98452, 98363, 98268, 98176, 98040, 97914, 97821, 97653, 97507, 97338, 97147, 96951, 96720, 96410, 96123, 95774, 95375, 94951, 94587, 94105, 93557, 93019, 92386, 91689, 90886, 90076, 89150, 88093, 86869, 85671, 84211, 82658, 80957, 79243, 77305, 75306, 73303, 71018, 68700, 66183, 63412, 60514, 57514, 54171, 50595, 46908, 43203, 39343, 35245, 30654, 26568, 22566, 18479, 15036, 11788, 8933, 6657, 4736, 3435, 2229, 1392],
    female: [100000, 99582, 99572, 99562, 99549, 99539, 99529, 99526, 99516, 99513, 99513, 99503, 99496, 99490, 99483, 99477, 99468, 99462, 99436, 99425, 99402, 99377, 99363, 99355, 99339, 99319, 99290, 99272, 99255, 99233, 99211, 99173, 99141, 99119, 99097, 99061, 99036, 98990, 98952, 98898, 98864, 98814, 98772, 98727, 98671, 98584, 98478, 98380, 98288, 98184, 98060, 97884, 97736, 97583, 97409, 97195, 96901, 96646, 96356, 95977, 95581, 95178, 94684, 94220, 93635, 92974, 92256, 91541, 90642, 89712, 88656, 87583, 86354, 85024, 83557, 81968, 80400, 78639, 76531, 74355, 71962, 69414, 66685, 63679, 60278, 56652, 52811, 48688, 44378, 39925, 35309, 30681, 26146, 21682, 17536, 13820, 10555, 7921, 5724, 4095],
  },
};

function pick(group, gender) {
  return LIFE_TABLE_DK[group][gender] || LIFE_TABLE_DK[group].male;
}

/** Remaining life expectancy (e_x) at an exact age, linearly interpolated. */
export function remainingLifeExpectancy(age, gender) {
  const t = pick('remaining', gender);
  if (!Number.isFinite(age) || age <= 0) return t[0];
  if (age >= t.length - 1) return t[t.length - 1];
  const lo = Math.floor(age);
  return t[lo] + (t[lo + 1] - t[lo]) * (age - lo);
}

/**
 * "Biological age": the chronological age whose baseline remaining life expectancy
 * equals the user's (lifestyle-adjusted) remaining years. e_x decreases with age,
 * so more adjusted remaining maps to a younger body age. Interpolated.
 * @param {number} adjustedRemaining
 * @param {'male'|'female'} gender
 */
export function biologicalAge(adjustedRemaining, gender) {
  const t = pick('remaining', gender);
  if (!Number.isFinite(adjustedRemaining)) return 0;
  if (adjustedRemaining >= t[0]) return 0;
  if (adjustedRemaining <= t[t.length - 1]) return t.length - 1;
  for (let a = 0; a < t.length - 1; a++) {
    if (t[a] >= adjustedRemaining && adjustedRemaining >= t[a + 1]) {
      const span = t[a] - t[a + 1];
      return span === 0 ? a : a + (t[a] - adjustedRemaining) / span;
    }
  }
  return t.length - 1;
}

/**
 * Probability (0..1) of surviving from `fromAge` to `toAge`, conditional on being
 * alive at `fromAge`: l(toAge) / l(fromAge). Interpolated; clamped to [0, 1].
 */
export function survivalProbability(fromAge, toAge, gender) {
  const t = pick('survivors', gender);
  const at = (a) => {
    if (a <= 0) return t[0];
    if (a >= t.length - 1) return t[t.length - 1];
    const lo = Math.floor(a);
    return t[lo] + (t[lo + 1] - t[lo]) * (a - lo);
  };
  if (toAge <= fromAge) return 1;
  const from = at(fromAge);
  if (from <= 0) return 0;
  return Math.max(0, Math.min(1, at(toAge) / from));
}
