// Fixed zone so local-time Date arithmetic (DST) is reproducible on any machine.
process.env.TZ = 'Europe/Copenhagen';

import { describe, it, expect } from 'vitest';
import { computeResult } from './lifespanMath';
import { LIFESTYLE_KEYS } from '../hooks/useLifespanCalculator';

// Characterization tests: pin the numbers the app produced BEFORE the #76 fixes.
const NOW = new Date(2026, 10, 5, 12, 0, 0); // 5 Nov 2026 12:00 local
const zero = Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]));

const CASES = {
  'male 40': { ageOrBirthdate: 40, gender: 'male', lifestyleFactors: zero },
  'female 65': { ageOrBirthdate: 65, gender: 'female', lifestyleFactors: zero },
  'male born 1985-06-15': { ageOrBirthdate: '1985-06-15', gender: 'male', lifestyleFactors: zero },
  'age 0': { ageOrBirthdate: 0, gender: 'female', lifestyleFactors: zero },
  'age 99': { ageOrBirthdate: 99, gender: 'male', lifestyleFactors: zero },
  'advanced two factors': {
    ageOrBirthdate: 50, gender: 'male', lifestyleFactors: { ...zero, smoking: -3, exercise: 2 },
  },
};

describe('computeResult characterization (current formulas)', () => {
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
