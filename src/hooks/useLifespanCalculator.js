import { useState, useEffect, useCallback, useRef } from 'react';
import { getLifeExpectancyForCountry, formatCountryName } from '../utils/lifeExpectancyData';
import { calculatePreciseAge, breakdownRemaining } from '../utils/lifespanMath';

export const useLifespanCalculator = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [lifeExpectancyForLocation, setLifeExpectancyForLocation] = useState(null);
  const countdownRef = useRef(null);
  const [resultData, setResultData] = useState(null);
  const [currentMode, setCurrentMode] = useState('simple');
  const [lifestyleFactors, setLifestyleFactors] = useState({
    smoking: 0,
    exercise: 0,
    diet: 0,
    alcohol: 0,
    sleep: 0,
    stress: 0,
    health: 0,
    bmi: 0,
    social: 0,
    mental: 0,
    work: 0,
    environment: 0,
    education: 0,
    income: 0,
    commute: 0,
    screentime: 0
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

  // Calculate lifespan - accepts age (number) or birthdate (string/Date)
  const calculateLifespan = useCallback((ageOrBirthdate, gender, birthdate = null) => {
    const now = new Date();
    let age;
    let preciseAgeData = null;
    let daysLived;
    let exactEndDate;
    
    // Check if we have a birthdate (either as first param or third param)
    const birthdateValue = birthdate || (typeof ageOrBirthdate === 'string' && ageOrBirthdate.includes('-') ? ageOrBirthdate : null);
    
    if (birthdateValue) {
      // Use precise calculation from birthdate
      preciseAgeData = calculatePreciseAge(birthdateValue);
      age = preciseAgeData.preciseAge;
      daysLived = preciseAgeData.totalDaysLived;
    } else {
      // Use simple age (less precise)
      age = typeof ageOrBirthdate === 'number' ? ageOrBirthdate : parseInt(ageOrBirthdate);
      // Estimate days lived (less accurate without birthdate)
      daysLived = Math.floor(age * 365.25);
    }
    
    const baseLifeExpectancy = getLifeExpectancyForCountry(lifeExpectancyForLocation || 'World', gender);
    const lifestyleAdjustment = Object.values(lifestyleFactors).reduce((sum, val) => sum + val, 0);
    const adjustedLifeExpectancy = baseLifeExpectancy + lifestyleAdjustment;
    const remainingYears = Math.max(0, adjustedLifeExpectancy - age);

    // Calculate end date more precisely if we have birthdate
    if (preciseAgeData) {
      // Add remaining years to birthdate for exact end date
      const yearsToAdd = Math.floor(adjustedLifeExpectancy);
      const fractionalYear = adjustedLifeExpectancy - yearsToAdd;
      exactEndDate = new Date(preciseAgeData.birthDate);
      exactEndDate.setFullYear(exactEndDate.getFullYear() + yearsToAdd);
      exactEndDate.setDate(exactEndDate.getDate() + Math.floor(fractionalYear * 365.25));
    } else {
      exactEndDate = new Date(now.getFullYear() + remainingYears, now.getMonth(), now.getDate());
    }
    
    const timeRemaining = exactEndDate - now;

    // Calculate fun facts based on exact days lived
    const minutesLived = daysLived * 24 * 60;
    const hoursLived = daysLived * 24;
    
    const result = {
      remainingYears: remainingYears.toFixed(1),
      remainingDays: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
      adjustedLifeExpectancy: adjustedLifeExpectancy.toFixed(1),
      lifestyleImpact: lifestyleAdjustment,
      endDate: exactEndDate.toLocaleDateString('da-DK'),
      endTimestamp: exactEndDate.getTime(),
      dataSource: formatCountryName(lifeExpectancyForLocation || 'World'),
      age: typeof age === 'number' ? age.toFixed(2) : age,
      displayAge: preciseAgeData 
        ? `${preciseAgeData.years} år, ${preciseAgeData.months} mdr, ${preciseAgeData.days} dage`
        : `${Math.floor(age)} år`,
      gender,
      lifePercentage: ((age / adjustedLifeExpectancy) * 100).toFixed(1),
      daysLived,
      hoursLived,
      minutesLived,
      hasPreciseBirthdate: !!preciseAgeData,
      birthdate: preciseAgeData?.birthDate?.toLocaleDateString('da-DK') || null,
      
      // Heart beats: average 70 bpm (range 60-100 at rest, higher during activity)
      // Using 70 as daily average accounting for rest and activity
      heartbeats: Math.floor(minutesLived * 70),
      
      // Initialize countdown with calculated values
      countdown: breakdownRemaining(timeRemaining),
      
      // Fun facts calculations - now based on exact days lived
      sunrises: daysLived,
      wordsSpoken: Math.floor(daysLived * 16000), // ~16,000 words/day average
      sleepHours: Math.floor(daysLived * 8), // 8 hours sleep/day
      blinks: Math.floor(minutesLived * 17), // ~17 blinks/minute while awake (assuming 16h awake)
      breaths: Math.floor(minutesLived * 14), // ~12-20 breaths/minute, using 14 average
      steps: Math.floor(daysLived * 7000), // ~7,000 steps/day average (varies widely)
      meals: Math.floor(daysLived * 3), // 3 meals/day
      coffeeCups: Math.floor(daysLived * 2.5), // ~2.5 cups/day (Danish average)
      laughs: Math.floor(daysLived * 17), // Adults laugh ~17 times/day
      waterLiters: Math.floor(daysLived * 2), // ~2 liters/day
      spaceKm: Math.floor(daysLived * 2575342), // Earth travels ~2.58 million km/day in orbit
      
      // Additional fun facts when precise birthdate is available
      secondsLived: preciseAgeData ? daysLived * 24 * 60 * 60 : null,
      fullMoons: preciseAgeData ? Math.floor(daysLived / 29.53) : null, // Lunar cycle ~29.53 days
      seasons: preciseAgeData ? Math.floor(daysLived / 91.31) : null, // ~4 seasons per year
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