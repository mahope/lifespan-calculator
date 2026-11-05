import { useState, useEffect, useCallback, useRef } from 'react';
import { breakdownRemaining, computeResult } from '../utils/lifespanMath';

// Stable, fixed order of the lifestyle factors — used for both the initial state
// and for packing/unpacking factors into a shareable URL.
export const LIFESTYLE_KEYS = [
  'smoking', 'exercise', 'diet', 'alcohol', 'sleep', 'stress', 'health', 'bmi',
  'social', 'mental', 'work', 'environment', 'education', 'income', 'commute', 'screentime',
];

export const useLifespanCalculator = () => {
  const [userLocation, setUserLocation] = useState(null);
  // Default to Danish averages (this is a Danish site). We no longer probe a
  // third-party IP-geolocation service on mount — location is only resolved when
  // the user explicitly asks for it (privacy / GDPR).
  const [lifeExpectancyForLocation, setLifeExpectancyForLocation] = useState('Denmark');
  const countdownRef = useRef(null);
  const [resultData, setResultData] = useState(null);
  const [currentMode, setCurrentMode] = useState('simple');
  const [lifestyleFactors, setLifestyleFactors] = useState(() =>
    Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, 0]))
  );
  const [userAchievements, setUserAchievements] = useState([]);

  // Get user location manually (only on explicit user action)
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
            );
            const data = await response.json();

            if (data.address && data.address.country) {
              setUserLocation(data.address.country);
              setLifeExpectancyForLocation(data.address.country);
            }
          } catch (error) {
            console.error('Error fetching location:', error);
            setUserLocation('World');
            setLifeExpectancyForLocation('World');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation('World');
          setLifeExpectancyForLocation('World');
        }
      );
    }
  }, []);

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

  // Check achievements
  const checkAchievements = useCallback(() => {
    const newAchievements = [];

    if (lifestyleFactors.smoking >= 0) {
      newAchievements.push('non-smoker');
    }
    if (lifestyleFactors.exercise >= 2) {
      newAchievements.push('active-lifestyle');
    }
    if (lifestyleFactors.diet >= 3) {
      newAchievements.push('healthy-eater');
    }
    if (lifestyleFactors.stress >= 0 && lifestyleFactors.sleep >= 0) {
      newAchievements.push('wellness-warrior');
    }
    if (Object.values(lifestyleFactors).reduce((sum, val) => sum + val, 0) >= 10) {
      newAchievements.push('lifestyle-optimizer');
    }

    setUserAchievements(newAchievements);
  }, [lifestyleFactors]);

  // Start countdown timer. Counts against the exact end instant stored on the
  // result (endTimestamp) rather than re-parsing a localized date string, so the
  // seconds/minutes/hours stay accurate to the true computed moment.
  const startCountdown = useCallback(() => {
    // Clear any existing interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setResultData(prev => {
        if (!prev || !prev.endTimestamp) return prev;

        const timeRemaining = prev.endTimestamp - Date.now();

        if (timeRemaining > 0) {
          return { ...prev, countdown: breakdownRemaining(timeRemaining) };
        }
        return prev;
      });
    }, 1000);
  }, []);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Update achievements when lifestyle factors change
  useEffect(() => {
    checkAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifestyleFactors]);

  return {
    userLocation,
    lifeExpectancyForLocation,
    resultData,
    currentMode,
    lifestyleFactors,
    userAchievements,
    setCurrentMode,
    getUserLocation,
    calculateLifespan,
    updateLifestyleFactor,
    applyLifestyleFactors,
    startCountdown,
    setResultData
  };
};