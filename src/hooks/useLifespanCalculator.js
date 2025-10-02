import { useState, useEffect, useCallback } from 'react';
import { getLifeExpectancyForCountry, formatCountryName } from '../utils/lifeExpectancyData';

export const useLifespanCalculator = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [lifeExpectancyForLocation, setLifeExpectancyForLocation] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [currentMode, setCurrentMode] = useState('simple');
  const [lifestyleFactors, setLifestyleFactors] = useState({
    smoking: 0,
    exercise: 0,
    diet: 0,
    alcohol: 0,
    sleep: 0,
    stress: 0
  });
  const [userAchievements, setUserAchievements] = useState([]);

  // Try to detect location automatically
  const tryAutoLocationDetection = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.country_name) {
        setUserLocation(data.country_name);
        setLifeExpectancyForLocation(data.country_name);
      }
    } catch (error) {
      console.log('Could not auto-detect location:', error);
    }
  }, []);

  // Get user location manually
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

  // Calculate lifespan
  const calculateLifespan = useCallback((age, gender) => {
    const baseLifeExpectancy = getLifeExpectancyForCountry(lifeExpectancyForLocation || 'World', gender);
    const lifestyleAdjustment = Object.values(lifestyleFactors).reduce((sum, val) => sum + val, 0);
    const adjustedLifeExpectancy = baseLifeExpectancy + lifestyleAdjustment;
    const remainingYears = Math.max(0, adjustedLifeExpectancy - age);

    const now = new Date();
    const endDate = new Date(now.getFullYear() + remainingYears, now.getMonth(), now.getDate());
    const timeRemaining = endDate - now;

    // Calculate initial countdown values
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const years = Math.floor(totalDays / 365.25);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const result = {
      remainingYears: remainingYears.toFixed(1),
      remainingDays: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
      adjustedLifeExpectancy: adjustedLifeExpectancy.toFixed(1),
      lifestyleImpact: lifestyleAdjustment,
      endDate: endDate.toLocaleDateString('da-DK'),
      dataSource: formatCountryName(lifeExpectancyForLocation || 'World'),
      age,
      gender,
      lifePercentage: ((age / adjustedLifeExpectancy) * 100).toFixed(1),
      daysLived: Math.floor((now - new Date(now.getFullYear() - age, now.getMonth(), now.getDate())) / (1000 * 60 * 60 * 24)),
      heartbeats: Math.floor(age * 365.25 * 24 * 60 * 70), // ~70 bpm average
      // Initialize countdown with calculated values
      countdown: {
        years,
        days: totalDays,
        hours,
        minutes,
        seconds
      },
      // Fun facts calculations
      sunrises: Math.floor(age * 365.25),
      wordsSpoken: Math.floor(age * 365.25 * 16000),
      sleepHours: Math.floor(age * 365.25 * 8),
      blinks: Math.floor(age * 365.25 * 24 * 60 * 17),
      breaths: Math.floor(age * 365.25 * 24 * 60 * 14),
      steps: Math.floor(age * 365.25 * 7000),
      meals: Math.floor(age * 365.25 * 3),
      coffeeCups: Math.floor(age * 365.25 * 3.4),
      laughs: Math.floor(age * 365.25 * 17),
      waterLiters: Math.floor(age * 365.25 * 2),
      spaceKm: Math.floor(age * 940000000) // Earth's orbit
    };

    setResultData(result);
    return result;
  }, [lifeExpectancyForLocation, lifestyleFactors]);

  // Update lifestyle factors
  const updateLifestyleFactor = useCallback((factor, value) => {
    setLifestyleFactors(prev => ({
      ...prev,
      [factor]: value
    }));
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

  // Start countdown timer
  const startCountdown = useCallback(() => {
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    const interval = setInterval(() => {
      setResultData(prev => {
        if (!prev || !prev.remainingYears) return prev;

        const now = new Date();
        const endDate = new Date(now.getFullYear() + parseFloat(prev.remainingYears), now.getMonth(), now.getDate());
        const timeRemaining = endDate - now;

        if (timeRemaining > 0) {
          // Calculate total time units from milliseconds
          const totalSeconds = Math.floor(timeRemaining / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const totalDays = Math.floor(totalHours / 24);

          // Calculate years (approximation)
          const years = Math.floor(totalDays / 365.25);

          // Calculate remaining time components
          const hours = totalHours % 24;
          const minutes = totalMinutes % 60;
          const seconds = totalSeconds % 60;

          return {
            ...prev,
            countdown: {
              years,
              days: totalDays,
              hours,
              minutes,
              seconds
            }
          };
        }
        return prev;
      });
    }, 1000);

    setCountdownInterval(interval);
  }, [countdownInterval]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // Auto-detect location on mount
  useEffect(() => {
    tryAutoLocationDetection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    startCountdown,
    setResultData
  };
};