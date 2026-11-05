import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Hourglass,
  Zap,
  SlidersHorizontal,
  Hash,
  CalendarDays,
  Sparkles,
  Clock,
  RefreshCw,
  Share2,
} from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import PageHeader from '../components/PageHeader';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import ShareModal from '../components/ShareModal';
import Countdown from '../components/Countdown';
import PromoBanner from '../components/PromoBanner';
import LifeInWeeksGrid from '../components/LifeInWeeksGrid';
import TidTilbage from '../components/TidTilbage';
import Milepaele from '../components/Milepaele';
import Sammenlign from '../components/Sammenlign';
import Pension from '../components/Pension';
import Sandsynlighed from '../components/Sandsynlighed';
import KropsAlder from '../components/KropsAlder';
import Coaching from '../components/Coaching';
import LifestyleFactor from '../components/LifestyleFactor';
import Historik from '../components/Historik';
import HvadHvis from '../components/HvadHvis';
import ParMode from '../components/ParMode';
import Forsikringsbehov from '../components/Forsikringsbehov';
import PraktiskePapirer from '../components/PraktiskePapirer';
import { saveEntry } from '../utils/history';
import { useLifespanCalculator } from '../hooks/useLifespanCalculator';
import { parseShareParams, takeShareSearchParams } from '../utils/shareState';
import { LIFE_TABLE_META } from '../data/lifeTableDK.generated';
import { LIFESTYLE_FACTORS } from '../utils/lifestyleFactors';
import { formatSignedYears, lifestyleTotal as sumLifestyleFactors, roundedLifestyleAdjustment, formatYears, toLocalISODate, MAX_AGE_INPUT } from '../utils/lifespanMath';
import { track, trackCalculate } from '../utils/analytics';
import { COHORT_TABLE } from '../data/cohortTable.generated';
import ProjectionToggle from '../components/ProjectionToggle';

const HomePage = () => {
  const {
    resultData,
    currentMode,
    setProjection,
    resetProjection,
    lifestyleFactors,
    setCurrentMode,
    calculateLifespan,
    updateLifestyleFactor,
    applyLifestyleFactors,
    setResultData
  } = useLifespanCalculator();

  const [searchParams, setSearchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    birthdate: '',
    useBirthdate: false
  });
  const [showResults, setShowResults] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const resultsHeadingRef = useRef(null);

  // Move focus to the results heading when the results appear, so keyboard and
  // screen-reader users follow the view change instead of being stranded on the
  // now-hidden form.
  useEffect(() => {
    if (showResults && resultsHeadingRef.current) {
      resultsHeadingRef.current.focus();
    }
  }, [showResults]);

  // Update form progress
  useEffect(() => {
    let progress = 0;
    // Check if age or birthdate is filled (depending on mode)
    if (formData.useBirthdate ? formData.birthdate : formData.age) progress += 50;
    if (formData.gender) progress += 50;
    setFormProgress(progress);
  }, [formData]);

  // Run the calculation from the current form state and reveal the results.
  const runCalculation = useCallback(() => {
    const result =
      formData.useBirthdate && formData.birthdate
        ? calculateLifespan(formData.birthdate, formData.gender)
        : calculateLifespan(parseInt(formData.age), formData.gender);
    setShowResults(true);
    // Persist to local history (captures the returned result).
    if (result) {
      track('Result Shown', { mode: currentMode });
      saveEntry({
        ts: Date.now(),
        age: Math.floor(parseFloat(result.age)),
        gender: result.gender,
        expected: result.adjustedLifeExpectancy,
      });
    }
  }, [formData, calculateLifespan, currentMode]);

  // Hydrate the form from a shared deep-link (?g=&a=/&b=&m=&lf=) exactly once.
  useEffect(() => {
    const parsed = parseShareParams(takeShareSearchParams(searchParams));
    if (!parsed) return;

    setCurrentMode(parsed.mode);
    setFormData({
      age: parsed.useBirthdate ? '' : String(parsed.age),
      gender: parsed.gender,
      birthdate: parsed.birthdate,
      useBirthdate: parsed.useBirthdate,
    });
    if (parsed.lifestyle) applyLifestyleFactors(parsed.lifestyle);
    setAutoSubmit(true);
    // Drop the share params so a reload doesn't re-hydrate stale input.
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the hydrated state has settled, auto-run the calculation once.
  useEffect(() => {
    if (!autoSubmit) return;
    const hasInput = formData.useBirthdate ? formData.birthdate : formData.age;
    if (!formData.gender || !hasInput) return;
    runCalculation();
    setAutoSubmit(false);
  }, [autoSubmit, formData, runCalculation]);

  const ageTooHigh = !formData.useBirthdate && Number(formData.age) > MAX_AGE_INPUT;

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

    runCalculation();

    // Track analytics
    trackCalculate();
  };

  const resetCalculation = () => {
    resetProjection();
    setShowResults(false);
    setResultData(null);
    setFormData({ age: '', gender: '', birthdate: '', useBirthdate: false });
    setSearchParams({}, { replace: true });
  };

  const shareResults = () => {
    setIsShareModalOpen(true);
    track('Share Opened');
  };

  // Bounded to match what the calculation actually applies (see #6).
  const rawLifestyleTotal = sumLifestyleFactors(lifestyleFactors);
  const lifestyleTotal = roundedLifestyleAdjustment(rawLifestyleTotal);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead route="/" />

      <PageHeader
        icon={Hourglass}
        title="Levetidsberegner"
        subtitle="Beregn hvor mange år du statistisk set har tilbage — baseret på danske dødelighedstavler."
      />

      <main className="flex-1">
        {!showResults ? (
          <div className="container py-8">
            <div className="mx-auto max-w-2xl">
              <div className="card animate-slideUp">
                <SectionHeader
                  icon={Hourglass}
                  level={2}
                  title="Beregn din levetid"
                  description="Udfyld felterne — det tager ti sekunder."
                />
                <div className="card-content space-y-6">
                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Beregningsmåde</h3>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Beregningsmåde">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={currentMode === 'simple'}
                        className={`mode-btn ${currentMode === 'simple' ? 'active' : ''}`}
                        onClick={() => selectMode('simple')}
                      >
                        <Zap className="h-5 w-5 shrink-0" strokeWidth={2} />
                        <div className="text-left w-full">
                          <div className="font-medium text-sm">Simpel</div>
                          <div className="text-xs text-muted-foreground">Hurtig beregning</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={currentMode === 'advanced'}
                        className={`mode-btn ${currentMode === 'advanced' ? 'active' : ''}`}
                        onClick={() => selectMode('advanced')}
                      >
                        <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2} />
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
                      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Hvordan vil du angive din alder?">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!formData.useBirthdate}
                          className={`mode-btn ${!formData.useBirthdate ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, useBirthdate: false, birthdate: '' }))}
                        >
                          <Hash className="h-5 w-5 shrink-0" strokeWidth={2} />
                          <div className="text-left w-full">
                            <div className="font-medium text-sm">Alder</div>
                            <div className="text-xs text-muted-foreground">Hurtig</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.useBirthdate}
                          className={`mode-btn ${formData.useBirthdate ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, useBirthdate: true, age: '' }))}
                        >
                          <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={2} />
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
                            max={MAX_AGE_INPUT}
                            required={!formData.useBirthdate}
                            className="input flex-1"
                            value={formData.age}
                            onChange={handleInputChange}
                            aria-describedby="age-hint"
                            aria-invalid={ageTooHigh || undefined}
                          />
                          <span className="text-sm text-muted-foreground">år</span>
                        </div>
                        <p id="age-hint" className="text-xs text-muted-foreground">
                          Alder angivet i hele år, regnet som midt i året.
                        </p>
                        {ageTooHigh && (
                          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                            Indtast en alder mellem 0 og {MAX_AGE_INPUT} år.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label htmlFor="birthdate" className="label">Din fødselsdato:</label>
                        <input
                          type="date"
                          id="birthdate"
                          name="birthdate"
                          required={formData.useBirthdate}
                          max={toLocalISODate()}
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
                      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Køn">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.gender === 'male'}
                          className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                          onClick={() => selectGender('male')}
                        >
                          <span className="text-sm font-medium">Mand</span>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.gender === 'female'}
                          className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                          onClick={() => selectGender('female')}
                        >
                          <span className="text-sm font-medium">Kvinde</span>
                        </button>
                      </div>
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
                          {LIFESTYLE_FACTORS.map((factor) => (
                            <LifestyleFactor
                              key={factor.key}
                              factor={factor}
                              value={lifestyleFactors[factor.key]}
                              onSelect={selectLifestyleFactor}
                            />
                          ))}
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Livsstils påvirkning:</span>
                            <span className="font-bold text-primary">
                              {formatSignedYears(lifestyleTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={(!formData.useBirthdate && (!formData.age || ageTooHigh)) || (formData.useBirthdate && !formData.birthdate) || !formData.gender}
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
                <h2
                  ref={resultsHeadingRef}
                  tabIndex={-1}
                  className="mb-6 flex items-center justify-center gap-2 text-2xl font-semibold outline-none"
                >
                  <Clock className="h-6 w-6" strokeWidth={2} /> Din resterende tid
                </h2>
                {/* Announced once for screen readers; the ticking grid below is
                    hidden from assistive tech to avoid per-second spam. */}
                <p className="sr-only" aria-live="polite">
                  Du har statistisk {formatYears(Number(resultData?.remainingYears))} år tilbage at leve
                  {resultData?.projection === 'projected'
                    ? ' (fremskrevet af Danmarks Statistik).'
                    : ' (nuværende dødelighed).'}
                </p>
                <Countdown key={resultData?.endTimestamp} endTimestamp={resultData?.endTimestamp} />
                <ProjectionToggle resultData={resultData} onChange={setProjection} />
              </div>

              {/* Biological age (advanced mode) */}
              <KropsAlder resultData={resultData} />

              {/* Life Progress Bar */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Dit livsforløb</h3>
                  {resultData?.hasPreciseBirthdate && (
                    <span className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                      🎯 Præcis beregning
                    </span>
                  )}
                </div>
                <div className="card-content space-y-4">
                  {resultData?.usesTailRule && (
                    <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Danmarks Statistiks tavle slutter ved 99 år. Fra den alder bruges den sidste
                      værdi (forventet restlevetid ved 99 år) som overslag.
                    </p>
                  )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="min-w-0 text-center space-y-1">
                      <div className="text-xl font-semibold">{resultData?.lifePercentage}%</div>
                      <div className="text-xs text-muted-foreground">Levet</div>
                    </div>
                    <div className="min-w-0 text-center space-y-1">
                      <div className="text-xl font-semibold break-words">{resultData?.daysLived?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Dage levet</div>
                    </div>
                    <div className="min-w-0 text-center space-y-1 col-span-2 sm:col-span-1">
                      <div className="text-xl font-semibold break-words">{resultData?.heartbeats?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Hjerteslag</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Probability of reaching ages */}
              <Sandsynlighed resultData={resultData} />

              {/* What-if scenarios */}
              <HvadHvis resultData={resultData} lifestyleFactors={lifestyleFactors} />

              {/* Compare to average */}
              <Sammenlign resultData={resultData} />

              {/* Pension & working years */}
              <Pension resultData={resultData} />

              {/* Couples / joint-life */}
              <ParMode resultData={resultData} />

              {/* Lifestyle coaching (advanced mode) */}
              {currentMode === 'advanced' && <Coaching lifestyleFactors={lifestyleFactors} />}

              {/* Life in weeks */}
              <LifeInWeeksGrid resultData={resultData} />

              {/* Value-first livsforsikring CTA — high-intent moment */}
              <Forsikringsbehov resultData={resultData} />

              {/* Calm will / power of attorney pointer (advertising) */}
              <PraktiskePapirer resultData={resultData} />

              {/* Fun Facts Section */}
              <div className="card">
                <SectionHeader icon={Sparkles} tone="amber" title="Fun facts om dit liv" />
                <div className="card-content">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🌅</div>
                      <div className="text-lg font-semibold break-words">{resultData?.sunrises?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Solopgange set</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">💨</div>
                      <div className="text-lg font-semibold break-words">{resultData?.breaths?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Åndedrætninger</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">👣</div>
                      <div className="text-lg font-semibold break-words">{resultData?.steps?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Skridt taget</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">😴</div>
                      <div className="text-lg font-semibold break-words">{resultData?.sleepHours?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Timer sovet</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">😊</div>
                      <div className="text-lg font-semibold break-words">{resultData?.laughs?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Gange grint</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🍽️</div>
                      <div className="text-lg font-semibold break-words">{resultData?.meals?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Måltider spist</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">💧</div>
                      <div className="text-lg font-semibold break-words">{resultData?.waterLiters?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Liter vand drukket</div>
                    </div>
                    <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl mb-1">🚀</div>
                      <div className="text-lg font-semibold break-words">{(resultData?.spaceKm / 1000000000)?.toFixed(1)} mia</div>
                      <div className="text-xs text-muted-foreground">km rejst i rummet</div>
                    </div>
                    {resultData?.hasPreciseBirthdate && (
                      <>
                        <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">🌙</div>
                          <div className="text-lg font-semibold break-words">{resultData?.fullMoons?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Fuldmåner oplevet</div>
                        </div>
                        <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">🍂</div>
                          <div className="text-lg font-semibold break-words">{resultData?.seasons?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Årstider oplevet</div>
                        </div>
                        <div className="min-w-0 text-center p-3 bg-muted/30 rounded-lg border-2 border-primary/20">
                          <div className="text-2xl mb-1">⏱️</div>
                          <div className="text-lg font-semibold break-words">{resultData?.secondsLived?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Sekunder levet</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tider tilbage */}
              <TidTilbage resultData={resultData} />

              {/* Milepæle */}
              <Milepaele resultData={resultData} />

              {/* Historik (repeat visits) */}
              <Historik resultData={resultData} />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={shareResults} className="btn btn-primary flex items-center justify-center gap-2">
                  <Share2 className="h-5 w-5" strokeWidth={2} />
                  Del resultater
                </button>
                <button onClick={resetCalculation} className="btn btn-outline flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
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
                      <li>• Baseret på danske dødelighedstavler (Danmarks Statistik, {LIFE_TABLE_META.period})</li>
                      <li>
                        • Nuværende dødelighed viser, hvor mange år en gennemsnitlig dansker på din alder og dit køn har
                        tilbage, hvis dødeligheden forbliver som i {LIFE_TABLE_META.period}. Fremskrevet bygger på Danmarks Statistiks
                        antagelse om, at dødeligheden fortsat falder (befolkningsfremskrivning 2026, opdateret{' '}
                        {COHORT_TABLE.tableUpdated.split('-').reverse().join('.')}). Fremskrivningen er en antagelse og
                        mere usikker end de målte tal.
                      </li>
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
        lifestyleFactors={lifestyleFactors}
        isAdvanced={currentMode === 'advanced'}
      />
    </div>
  );
};

export default HomePage;