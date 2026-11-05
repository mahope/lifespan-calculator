import { useState, useCallback } from 'react';
import { computeResult } from '../utils/lifespanMath';
import { LIFESTYLE_FACTORS } from '../utils/lifestyleFactors';

// Stable, fixed order of the lifestyle factors — used for both the initial state
// and for packing/unpacking factors into a shareable URL.
export const LIFESTYLE_KEYS = LIFESTYLE_FACTORS.map((f) => f.key);

export const useLifespanCalculator = () => {
  const [resultData, setResultData] = useState(null);
  const [currentMode, setCurrentMode] = useState('simple');
  const [lifestyleFactors, setLifestyleFactors] = useState(() =>
    Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]))
  );

  // Calculate lifespan - accepts age (number) or birthdate (string/Date)
  const calculateLifespan = useCallback((ageOrBirthdate, gender, birthdate = null) => {
    const result = computeResult({ ageOrBirthdate, gender, birthdate, lifestyleFactors }, new Date());
    setResultData(result);
    return result;
  }, [lifestyleFactors]);

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
    lifestyleFactors,
    setCurrentMode,
    calculateLifespan,
    updateLifestyleFactor,
    applyLifestyleFactors,
    setResultData
  };
};