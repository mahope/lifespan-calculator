import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import ShareModal from '../components/ShareModal';
import PromoBanner from '../components/PromoBanner';
import { useLifespanCalculator } from '../hooks/useLifespanCalculator';
import { achievements } from '../utils/lifeExpectancyData';

const HomePage = () => {
  const {
    userLocation,
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
  } = useLifespanCalculator();

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    birthdate: '',
    useBirthdate: false
  });
  const [showResults, setShowResults] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Update form progress
  useEffect(() => {
    let progress = 0;
    // Check if age or birthdate is filled (depending on mode)
    if (formData.useBirthdate ? formData.birthdate : formData.age) progress += 40;
    if (formData.gender) progress += 40;
    if (userLocation) progress += 20;
    setFormProgress(progress);
  }, [formData, userLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectGender = (gender) => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  const selectMode = (mode) => {
    setCurrentMode(mode);
  };

  const selectLifestyleFactor = (factor, value) => {
    updateLifestyleFactor(factor, parseInt(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Use birthdate if available, otherwise use age
    let result;
    if (formData.useBirthdate && formData.birthdate) {
      result = calculateLifespan(formData.birthdate, formData.gender);
    } else {
      result = calculateLifespan(parseInt(formData.age), formData.gender);
    }
    
    setShowResults(true);
    startCountdown();

    // Track analytics
    if (window.plausible) {
      window.plausible('Calculate Lifespan', {
        props: {
          age: formData.useBirthdate ? 'birthdate' : formData.age,
          gender: formData.gender,
          location: userLocation || 'Unknown',
          usedBirthdate: formData.useBirthdate
        }
      });
    }
  };

  const resetCalculation = () => {
    setShowResults(false);
    setResultData(null);
    setFormData({ age: '', gender: '', birthdate: '', useBirthdate: false });
  };

  const shareResults = () => {
    setIsShareModalOpen(true);
  };

  const showScenario = (scenario) => {
    // Show what-if scenarios
    const scenarios = {
      'quit-smoking': { text: 'Hvis du stopper med at ryge', change: '+5 år' },
      'more-exercise': { text: 'Hvis du dyrker mere motion', change: '+3 år' },
      'healthy-diet': { text: 'Hvis du spiser sundere', change: '+4 år' },
      'less-stress': { text: 'Hvis du reducerer stress', change: '+2 år' }
    };

    const scenarioData = scenarios[scenario];
    if (scenarioData) {
      const scenarioResult = document.getElementById('scenarioResult');
      const scenarioText = document.getElementById('scenarioText');
      const scenarioChange = document.getElementById('scenarioChange');

      if (scenarioResult && scenarioText && scenarioChange) {
        scenarioText.textContent = scenarioData.text;
        scenarioChange.textContent = scenarioData.change;
        scenarioResult.classList.remove('hidden');
      }
    }
  };

  const lifestyleTotal = Object.values(lifestyleFactors).reduce((sum, val) => sum + val, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Levetidsberegner - Beregn din resterende levetid baseret på statistik"
        description="Gratis levetidsberegner der beregner din statistiske resterende levetid baseret på alder, køn og geografisk placering. Inkluderer live nedtælling og deling."
        keywords="levetidsberegner, resterende levetid, statistik, dødsalderen, levetid beregner, hvor længe lever jeg, lifespan calculator dansk"
        ogTitle="Levetidsberegner - Hvor lang tid har du tilbage?"
        ogDescription="Beregn din statistiske resterende levetid med vores gratis levetidsberegner. Baseret på WHO data og nationale statistikker."
      />

      <header className="header-gradient px-4 py-8 sm:py-12 text-center sm:px-6 lg:px-8 shadow-lg">
        <div className="container animate-fadeIn">
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            ⏳ Levetidsberegner
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-white/90">
            Beregn hvor mange år du statistisk set har tilbage baseret på din alder, køn og lokation
          </p>
        </div>
      </header>

      <main className="flex-1">
        {!showResults ? (
          <div className="container py-8">
            <div className="mx-auto max-w-2xl">
              <div className="card animate-slideUp">
                <div className="card-header">
                  <h2 className="card-title">Levetidsberegner</h2>
                </div>
                <div className="card-content space-y-6">
                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Beregningsmåde</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`mode-btn ${currentMode === 'simple' ? 'active' : ''}`}
                        onClick={() => selectMode('simple')}
                      >
                        <div className="text-left w-full">
                          <div className="font-medium text-sm">Simpel</div>
                          <div className="text-xs text-muted-foreground">Hurtig beregning</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${currentMode === 'advanced' ? 'active' : ''}`}
                        onClick={() => selectMode('advanced')}
                      >
                        <div className="text-left w-full">
                          <div className="font-medium text-sm">Avanceret</div>
                          <div className="text-xs text-muted-foreground">Med livsstil</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="form-progress">
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${formProgress}%` }}></div>
                    </div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                      {formProgress}% udfyldt
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Age Input Method Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="label">Hvordan vil du angive din alder?</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`mode-btn ${!formData.useBirthdate ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, useBirthdate: false, birthdate: '' }))}
                        >
                          <div className="text-left w-full">
                            <div className="font-medium text-sm">Alder</div>
                            <div className="text-xs text-muted-foreground">Hurtig</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`mode-btn ${formData.useBirthdate ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, useBirthdate: true, age: '' }))}
                        >
                          <div className="text-left w-full">
                            <div className="font-medium text-sm">Fødselsdato</div>
                            <div className="text-xs text-muted-foreground">Mere præcis</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Age or Birthdate Input */}
                    {!formData.useBirthdate ? (
                      <div className="space-y-2">
                        <label htmlFor="age" className="label">Din alder:</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            id="age"
                            name="age"
                            min="0"
                            max="120"
                            required={!formData.useBirthdate}
                            className="input flex-1"
                            value={formData.age}
                            onChange={handleInputChange}
                          />
                          <span className="text-sm text-muted-foreground">år</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label htmlFor="birthdate" className="label">Din fødselsdato:</label>
                        <input
                          type="date"
                          id="birthdate"
                          name="birthdate"
                          required={formData.useBirthdate}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          className="input w-full"
                          value={formData.birthdate}
                          onChange={handleInputChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          🎯 Med fødselsdato får du præcis alder og mere nøjagtige fun facts
                        </p>
                      </div>
                    )}

                    {/* Gender Selection */}
                    <div className="space-y-2">
                      <label className="label">Køn</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                          onClick={() => selectGender('male')}
                        >
                          <span className="text-sm font-medium">Mand</span>
                        </button>
                        <button
                          type="button"
                          className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                          onClick={() => selectGender('female')}
                        >
                          <span className="text-sm font-medium">Kvinde</span>
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    {userLocation ? (
                      <p className="text-xs text-muted-foreground">
                        📍 {userLocation}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Vi finder automatisk din lokation
                        </p>
                        <button
                          type="button"
                          onClick={getUserLocation}
                          className="btn btn-outline w-full"
                        >
                          Find lokation manuelt
                        </button>
                      </div>
                    )}

                    {/* Lifestyle Factors (Advanced Mode) */}
                    {currentMode === 'advanced' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span>🌱</span> Livsstilsfaktorer
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Juster disse faktorer for at se hvordan din livsstil påvirker din levetid:
                          </p>
                        </div>

                        <div className="lifestyle-grid">
                          {/* Smoking */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🚭</span>
                                <label className="font-medium">Rygning</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.smoking > 0 ? `+${lifestyleFactors.smoking}` : lifestyleFactors.smoking} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.smoking === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('smoking', 0)}
                              >
                                Ryger ikke
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.smoking === -5 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('smoking', -5)}
                              >
                                Let (1-10/dag)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.smoking === -10 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('smoking', -10)}
                              >
                                Kraftig (10+/dag)
                              </button>
                            </div>
                          </div>

                          {/* Exercise */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🏃‍♂️</span>
                                <label className="font-medium">Motion</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.exercise > 0 ? `+${lifestyleFactors.exercise}` : lifestyleFactors.exercise} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 0)}
                              >
                                Ingen
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 2)}
                              >
                                Let (1-3 t/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 4 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 4)}
                              >
                                Moderat (4-6 t/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 6 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 6)}
                              >
                                Intensiv (7+ t/uge)
                              </button>
                            </div>
                          </div>

                          {/* Diet */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🍎</span>
                                <label className="font-medium">Kost</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.diet > 0 ? `+${lifestyleFactors.diet}` : lifestyleFactors.diet} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', -2)}
                              >
                                Usund
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 0)}
                              >
                                Gennemsnitlig
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 3)}
                              >
                                Sund
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 5 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 5)}
                              >
                                Meget sund
                              </button>
                            </div>
                          </div>

                          {/* Alcohol */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🍷</span>
                                <label className="font-medium">Alkohol</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.alcohol > 0 ? `+${lifestyleFactors.alcohol}` : lifestyleFactors.alcohol} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.alcohol === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('alcohol', 0)}
                              >
                                Ingen
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.alcohol === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('alcohol', -1)}
                              >
                                Let (1-7/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.alcohol === -3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('alcohol', -3)}
                              >
                                Moderat (8-14/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.alcohol === -6 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('alcohol', -6)}
                              >
                                Kraftig (15+/uge)
                              </button>
                            </div>
                          </div>

                          {/* Sleep */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">😴</span>
                                <label className="font-medium">Søvn</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.sleep > 0 ? `+${lifestyleFactors.sleep}` : lifestyleFactors.sleep} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.sleep === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('sleep', -2)}
                              >
                                &lt;5 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.sleep === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('sleep', -1)}
                              >
                                5-6 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.sleep === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('sleep', 2)}
                              >
                                7-8 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.sleep === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('sleep', 0)}
                              >
                                9+ timer
                              </button>
                            </div>
                          </div>

                          {/* Stress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">😰</span>
                                <label className="font-medium">Stress</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.stress > 0 ? `+${lifestyleFactors.stress}` : lifestyleFactors.stress} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.stress === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('stress', 2)}
                              >
                                Lavt
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.stress === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('stress', 0)}
                              >
                                Moderat
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.stress === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('stress', -2)}
                              >
                                Højt
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.stress === -4 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('stress', -4)}
                              >
                                Meget højt
                              </button>
                            </div>
                          </div>

                          {/* Health */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🏥</span>
                                <label className="font-medium">Sundhedstilstand</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.health > 0 ? `+${lifestyleFactors.health}` : lifestyleFactors.health} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.health === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('health', 0)}
                              >
                                Ingen sygdomme
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.health === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('health', -2)}
                              >
                                1 kronisk sygdom
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.health === -5 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('health', -5)}
                              >
                                2+ sygdomme
                              </button>
                            </div>
                          </div>

                          {/* BMI */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">⚖️</span>
                                <label className="font-medium">BMI/Vægt</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.bmi > 0 ? `+${lifestyleFactors.bmi}` : lifestyleFactors.bmi} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.bmi === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('bmi', -2)}
                              >
                                Undervægtig (&lt;18.5)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.bmi === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('bmi', 2)}
                              >
                                Normal (18.5-24.9)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.bmi === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('bmi', -1)}
                              >
                                Overvægtig (25-29.9)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.bmi === -4 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('bmi', -4)}
                              >
                                Svært overvægtig (30+)
                              </button>
                            </div>
                          </div>

                          {/* Social */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">👨‍👩‍👧‍👦</span>
                                <label className="font-medium">Social aktivitet</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.social > 0 ? `+${lifestyleFactors.social}` : lifestyleFactors.social} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.social === 4 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('social', 4)}
                              >
                                Stærkt netværk
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.social === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('social', 2)}
                              >
                                Moderat netværk
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.social === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('social', -1)}
                              >
                                Begrænset
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.social === -3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('social', -3)}
                              >
                                Isoleret
                              </button>
                            </div>
                          </div>

                          {/* Mental Health */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🧠</span>
                                <label className="font-medium">Mental sundhed</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.mental > 0 ? `+${lifestyleFactors.mental}` : lifestyleFactors.mental} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.mental === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('mental', 2)}
                              >
                                Meget god
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.mental === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('mental', 0)}
                              >
                                God
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.mental === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('mental', -2)}
                              >
                                Depression/angst
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.mental === -3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('mental', -3)}
                              >
                                Alvorlige problemer
                              </button>
                            </div>
                          </div>

                          {/* Work Environment */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">💼</span>
                                <label className="font-medium">Arbejdsmiljø</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.work > 0 ? `+${lifestyleFactors.work}` : lifestyleFactors.work} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.work === 1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('work', 1)}
                              >
                                Fleksibelt/balanceret
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.work === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('work', 0)}
                              >
                                Kontorarbejde
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.work === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('work', -1)}
                              >
                                Fysisk krævende
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.work === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('work', -2)}
                              >
                                Farligt arbejde
                              </button>
                            </div>
                          </div>

                          {/* Environment */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🌍</span>
                                <label className="font-medium">Boligområde</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.environment > 0 ? `+${lifestyleFactors.environment}` : lifestyleFactors.environment} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.environment === 1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('environment', 1)}
                              >
                                Landdistrikter
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.environment === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('environment', -1)}
                              >
                                Forstad
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.environment === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('environment', -2)}
                              >
                                By m/ forurening
                              </button>
                            </div>
                          </div>

                          {/* Education */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🎓</span>
                                <label className="font-medium">Uddannelse</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.education > 0 ? `+${lifestyleFactors.education}` : lifestyleFactors.education} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.education === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('education', -1)}
                              >
                                Grundskole
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.education === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('education', 0)}
                              >
                                Gymnasium
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.education === 1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('education', 1)}
                              >
                                Bachelor
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.education === 3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('education', 3)}
                              >
                                Master/PhD
                              </button>
                            </div>
                          </div>

                          {/* Income */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">💰</span>
                                <label className="font-medium">Indkomst</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.income > 0 ? `+${lifestyleFactors.income}` : lifestyleFactors.income} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.income === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('income', 2)}
                              >
                                Høj
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.income === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('income', 0)}
                              >
                                Mellem
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.income === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('income', -2)}
                              >
                                Lav
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.income === -3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('income', -3)}
                              >
                                Fattigdom
                              </button>
                            </div>
                          </div>

                          {/* Commute */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🚗</span>
                                <label className="font-medium">Transport</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.commute > 0 ? `+${lifestyleFactors.commute}` : lifestyleFactors.commute} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.commute === 1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('commute', 1)}
                              >
                                Cykling/gåtur
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.commute === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('commute', 0)}
                              >
                                Offentlig/bil &lt;30 min
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.commute === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('commute', -1)}
                              >
                                Lang pendling 1h+
                              </button>
                            </div>
                          </div>

                          {/* Screen Time */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">📱</span>
                                <label className="font-medium">Skærmtid (fritid)</label>
                              </div>
                              <span className="text-sm font-medium">
                                {lifestyleFactors.screentime > 0 ? `+${lifestyleFactors.screentime}` : lifestyleFactors.screentime} år
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.screentime === 1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('screentime', 1)}
                              >
                                &lt;2 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.screentime === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('screentime', 0)}
                              >
                                2-4 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.screentime === -1 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('screentime', -1)}
                              >
                                4-6 timer
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.screentime === -2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('screentime', -2)}
                              >
                                6+ timer
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Livsstils påvirkning:</span>
                            <span className="font-bold text-primary">
                              {lifestyleTotal > 0 ? `+${lifestyleTotal}` : lifestyleTotal} år
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={(!formData.useBirthdate && !formData.age) || (formData.useBirthdate && !formData.birthdate) || !formData.gender}
                    >
                      Beregn levetid
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="container py-8">
            <div className="mx-auto max-w-6xl space-y-8">
              {/* Countdown Timer */}
              <div className="countdown-timer">
                <h2 className="mb-6 text-2xl font-semibold text-center">Din resterende tid</h2>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  <div className="time-unit">
                    <span className="time-value">{resultData?.countdown?.years || resultData?.remainingYears || '--'}</span>
                    <span className="time-label">år</span>
                  </div>
                  <div className="time-unit">
                    <span className="time-value">{resultData?.countdown?.days || '--'}</span>
                    <span className="time-label">dage</span>
                  </div>
                  <div className="time-unit">
                    <span className="time-value">{resultData?.countdown?.hours || '--'}</span>
                    <span className="time-label">timer</span>
                  </div>
                  <div className="time-unit">
                    <span className="time-value">{resultData?.countdown?.minutes || '--'}</span>
                    <span className="time-label">min</span>
                  </div>
                  <div className="time-unit">
                    <span className="time-value">{resultData?.countdown?.seconds || '--'}</span>
                    <span className="time-label">sek</span>
                  </div>
                </div>
              </div>

              {/* Life Progress Bar */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Dit livsforløb</h3>
                  {resultData?.hasPreciseBirthdate && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      🎯 Præcis beregning
                    </span>
                  )}
                </div>
                <div className="card-content space-y-4">
                  {/* Show precise age if birthdate was used */}
                  {resultData?.hasPreciseBirthdate && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Din præcise alder</div>
                      <div className="text-lg font-semibold">{resultData?.displayAge}</div>
                      {resultData?.birthdate && (
                        <div className="text-xs text-muted-foreground mt-1">Født: {resultData.birthdate}</div>
                      )}
                    </div>
                  )}
                  
                  <div className="life-bar">
                    <div
                      className="life-lived"
                      style={{ width: `${resultData?.lifePercentage}%` }}
                    ></div>
                    <div
                      className="life-remaining"
                      style={{ width: `${100 - resultData?.lifePercentage}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center space-y-1">
                      <div className="text-xl font-semibold">{resultData?.lifePercentage}%</div>
                      <div className="text-xs text-muted-foreground">Levet</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-xl font-semibold">{resultData?.daysLived?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Dage levet</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-xl font-semibold">{resultData?.heartbeats?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Hjerteslag</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Livsforsikring CTA — high-intent moment: user just saw remaining lifespan */}
              <a
                href="https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=60068&uid=levetidsberegner"
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="card block group"
              >
                <div className="card-content py-5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Annonce</div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">Sikr dine kære med en livsforsikring</h3>
                      <p className="text-sm text-muted-foreground">Sammenlign livsforsikringer på Findforsikring.dk — Danmarks største forsikringsportal — og find den rette dækning til din familie.</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2">Sammenlign livsforsikringer →</span>
                    </div>
                  </div>
                </div>
              </a>

              {/* Fun Facts Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">🎉 Fun Facts om dit liv</h3>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🌅</div>
                      <div className="text-lg font-semibold">{resultData?.sunrises?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Solopgange set</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">💨</div>
                      <div className="text-lg font-semibold">{resultData?.breaths?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Åndedrætninger</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">👣</div>
                      <div className="text-lg font-semibold">{resultData?.steps?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Skridt taget</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">😴</div>
                      <div className="text-lg font-semibold">{resultData?.sleepHours?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Timer sovet</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">😊</div>
                      <div className="text-lg font-semibold">{resultData?.laughs?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Gange grint</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🍽️</div>
                      <div className="text-lg font-semibold">{resultData?.meals?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Måltider spist</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">💧</div>
                      <div className="text-lg font-semibold">{resultData?.waterLiters?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Liter vand drukket</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🚀</div>
                      <div className="text-lg font-semibold">{(resultData?.spaceKm / 1000000000)?.toFixed(1)} mia</div>
                      <div className="text-xs text-muted-foreground">km rejst i rummet</div>
                    </div>
                    {resultData?.hasPreciseBirthdate && (
                      <>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">🌙</div>
                          <div className="text-lg font-semibold">{resultData?.fullMoons?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Fuldmåner oplevet</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">🍂</div>
                          <div className="text-lg font-semibold">{resultData?.seasons?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Årstider oplevet</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">⏱️</div>
                          <div className="text-lg font-semibold">{resultData?.secondsLived?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Sekunder levet</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={shareResults} className="btn btn-primary flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Del resultater
                </button>
                <button onClick={resetCalculation} className="btn btn-outline">
                  Ny beregning
                </button>
              </div>

              {/* Disclaimers */}
              <div className="space-y-3">
                <div className="card border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <div className="card-content">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Bemærk:</strong> Dette er kun et statistisk estimat baseret på gennemsnitlige data.
                      Mange faktorer påvirker levetiden, herunder livsstil, genetik, sundhed og teknologiske fremskridt.
                    </p>
                  </div>
                </div>

                <div className="card border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="card-content space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Vigtige disclaimere</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Baseret på WHO og nationale statistikker</li>
                      <li>• Individuelle faktorer påvirker ikke beregningen</li>
                      <li>• Kun til underholdning og reflektion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PromoBanner />
      <Footer />
      <ThemeToggle />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        resultData={resultData}
      />
    </div>
  );
};

export default HomePage;