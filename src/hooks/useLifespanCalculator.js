import { useState, useCallback, useRef } from 'react';
import { computeResult } from '../utils/lifespanMath';

// Stable, fixed order of the lifestyle factors — used for both the initial state
// and for packing/unpacking factors into a shareable URL.
export const LIFESTYLE_KEYS = [
  'smoking', 'exercise', 'diet', 'alcohol', 'sleep', 'stress', 'health', 'bmi',
  'social', 'mental', 'work', 'environment', 'education', 'income', 'commute', 'screentime',
];

export const useLifespanCalculator = () => {
  const [resultData, setResultData] = useState(null);
  const [currentMode, setCurrentMode] = useState('simple');
  // 'period' (default) or 'projected' (DST cohort). Page state only: never in the
  // URL and never stored. `lastInput` lets a toggle recompute with the same `now`.
  const [projection, setProjectionState] = useState('period');
  const lastInput = useRef(null);
  const [lifestyleFactors, setLifestyleFactors] = useState(() =>
    Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]))
  );

  // Calculate lifespan - accepts age (number) or birthdate (string/Date)
  const calculateLifespan = useCallback((ageOrBirthdate, gender, birthdate = null) => {
    const now = new Date();
    const input = { ageOrBirthdate, gender, birthdate, lifestyleFactors };
    lastInput.current = { input, now };
    setResultData(computeResult({ ...input, projection }, now));
    // History always stores the period figure so entries stay comparable.
    return computeResult(input, now);
  }, [lifestyleFactors, projection]);

  const setProjection = useCallback((mode) => {
    setProjectionState(mode);
    if (lastInput.current) {
      const { input, now } = lastInput.current;
      setResultData(computeResult({ ...input, projection: mode }, now));
    }
  }, []);

  // Update lifestyle factors
  const updateLifestyleFactor = useCallback((factor, value) => {
    setLifestyleFactors(prev => ({
      ...prev,
      [factor]: value
    }));
  }, []);

  // Bulk-apply factors (used when hydrating from a shared URL).
  const applyLifestyleFactors = useCallback((partial) => {
    setLifestyleFactors(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    resultData,
    currentMode,
    projection,
    setProjection,
    lifestyleFactors,
    setCurrentMode,
    calculateLifespan,
    updateLifestyleFactor,
    applyLifestyleFactors,
    setResultData
  };
};