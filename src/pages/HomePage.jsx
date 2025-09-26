import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
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
    birthdate: ''
  });
  const [showResults, setShowResults] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  // Update form progress
  useEffect(() => {
    let progress = 0;
    if (formData.age) progress += 40;
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
    const result = calculateLifespan(parseInt(formData.age), formData.gender);
    setShowResults(true);
    startCountdown();

    // Track analytics
    if (window.plausible) {
      window.plausible('Calculate Lifespan', {
        props: {
          age: formData.age,
          gender: formData.gender,
          location: userLocation || 'Unknown'
        }
      });
    }
  };

  const resetCalculation = () => {
    setShowResults(false);
    setResultData(null);
    setFormData({ age: '', gender: '', birthdate: '' });
  };

  const shareResults = () => {
    if (navigator.share && resultData) {
      navigator.share({
        title: 'Mine levetidsresultater',
        text: `Jeg har statistisk ${resultData.remainingYears} år tilbage at leve!`,
        url: window.location.href
      });
    }
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

      <header className="border-b bg-card px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="container">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            🕰️ Levetidsberegner
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Beregn hvor mange år du statistisk set har tilbage baseret på din alder, køn og lokation
          </p>
        </div>
      </header>

      <main className="flex-1">
        {!showResults ? (
          <div className="container py-8">
            <div className="mx-auto max-w-2xl">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Levetidsberegner</h2>
                </div>
                <div className="card-content space-y-6">
                  {/* Mode Selection */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Vælg beregningsmåde</h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        className={`mode-btn ${currentMode === 'simple' ? 'active' : ''}`}
                        onClick={() => selectMode('simple')}
                      >
                        <span className="text-2xl">⚡</span>
                        <div className="flex-1">
                          <div className="font-medium">Simpel</div>
                          <div className="text-sm text-muted-foreground">Hurtig beregning baseret på grunddata</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${currentMode === 'advanced' ? 'active' : ''}`}
                        onClick={() => selectMode('advanced')}
                      >
                        <span className="text-2xl">🎯</span>
                        <div className="flex-1">
                          <div className="font-medium">Avanceret</div>
                          <div className="text-sm text-muted-foreground">Detaljeret analyse med livsstilsfaktorer</div>
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
                    {/* Age Input */}
                    <div className="space-y-2">
                      <label htmlFor="age" className="label">Din alder:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="age"
                          name="age"
                          min="0"
                          max="120"
                          required
                          className="input flex-1"
                          value={formData.age}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm text-muted-foreground">år</span>
                      </div>
                    </div>

                    {/* Gender Selection */}
                    <div className="space-y-2">
                      <label className="label">Køn:</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                          onClick={() => selectGender('male')}
                        >
                          <span className="text-2xl">👨</span>
                          <span>Mand</span>
                        </button>
                        <button
                          type="button"
                          className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                          onClick={() => selectGender('female')}
                        >
                          <span className="text-2xl">👩</span>
                          <span>Kvinde</span>
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        🌍 {userLocation ? `Placering fundet: ${userLocation}` : 'Vi prøver automatisk at finde din lokation for præcise beregninger.'}
                      </p>
                      <button
                        type="button"
                        onClick={getUserLocation}
                        className="btn btn-outline w-full"
                      >
                        Find min lokation manuelt
                      </button>
                    </div>

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
                                🙅 Ryger ikke
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.smoking === -5 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('smoking', -5)}
                              >
                                😟 Let (1-10/dag)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.smoking === -10 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('smoking', -10)}
                              >
                                😰 Kraftig (10+/dag)
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
                                🛋️ Ingen motion
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 2 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 2)}
                              >
                                🚶 Let (1-3 t/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 4 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 4)}
                              >
                                🏃 Moderat (4-6 t/uge)
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.exercise === 6 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('exercise', 6)}
                              >
                                🏋️ Intensiv (7+ t/uge)
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
                                🍔 Usund
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 0 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 0)}
                              >
                                🍽️ Gennemsnitlig
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 3 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 3)}
                              >
                                🍎 Sund
                              </button>
                              <button
                                type="button"
                                className={`factor-btn ${lifestyleFactors.diet === 5 ? 'active' : ''}`}
                                onClick={() => selectLifestyleFactor('diet', 5)}
                              >
                                🥗 Meget sund
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
                      className="btn btn-primary w-full text-lg py-3"
                      disabled={!formData.age || !formData.gender}
                    >
                      📈 Beregn min resterende levetid
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
                <h2 className="mb-6 text-2xl font-bold text-center">Din resterende tid</h2>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  <div className="time-unit">
                    <span className="time-value">{resultData?.remainingYears || '--'}</span>
                    <span className="time-label">år</span>
                  </div>
                  <div className="time-unit">
                    <span className="time-value">{resultData?.remainingDays || '--'}</span>
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
                <div className="card-content">
                  <h3 className="mb-4 text-xl font-semibold">🌍 Dit livsforløb</h3>
                  <div className="space-y-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                      <div className="text-center space-y-1">
                        <div className="text-2xl font-bold text-primary">{resultData?.lifePercentage}%</div>
                        <div className="text-sm text-muted-foreground">% af livet levet</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-2xl font-bold text-primary">{resultData?.daysLived?.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">dage levet</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-2xl font-bold text-primary">{resultData?.heartbeats?.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">hjerteslag</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={shareResults} className="btn btn-primary">
                  📤 Del resultater
                </button>
                <button onClick={resetCalculation} className="btn btn-secondary">
                  🔄 Ny beregning
                </button>
              </div>

              {/* Disclaimers */}
              <div className="space-y-4">
                <div className="card bg-yellow-50 border-yellow-200">
                  <div className="card-content">
                    <p className="text-sm">
                      <strong>Bemærk:</strong> Dette er kun et statistisk estimat baseret på gennemsnitlige data.
                      Mange faktorer påvirker levetiden, herunder livsstil, genetik, sundhed og teknologiske fremskridt.
                    </p>
                  </div>
                </div>

                <div className="card bg-orange-50 border-orange-200">
                  <div className="card-content space-y-3">
                    <h4 className="font-semibold text-foreground">⚠️ Vigtige disclaimere:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-orange-600">•</span>
                        <div>
                          <strong>Kun statistiske gennemsnit:</strong> Beregningerne er baseret på WHO og nationale
                          statistikker og repræsenterer befolkningsgennemsnit
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-orange-600">•</span>
                        <div>
                          <strong>Individuelle faktorer ignoreres:</strong> Livsstil, genetik, eksisterende
                          helbredstilstande, socioøkonomisk status mv. påvirker ikke beregningen
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-orange-600">•</span>
                        <div>
                          <strong>Kun til underholdning:</strong> Resultaterne skal tages med et gran salt og bruges til
                          reflektion, ikke som faktuelle forudsigelser
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;