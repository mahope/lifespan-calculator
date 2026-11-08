import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, RefreshCw } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { SiteNav } from '../components/PageHeader';
import Footer from '../components/Footer';
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
import { LIFESTYLE_FACTORS } from '../utils/lifestyleFactors';
import { formatSignedYears, lifestyleTotal as sumLifestyleFactors, roundedLifestyleAdjustment, formatYears, toLocalISODate, MAX_AGE_INPUT } from '../utils/lifespanMath';
import { track, trackCalculate } from '../utils/analytics';
import { LIFE_TABLE_META } from '../data/lifeTableDK.generated';
import { COHORT_TABLE } from '../data/cohortTable.generated';
import ProjectionToggle from '../components/ProjectionToggle';

// The pages are static HTML, so the query string is read and cleared with the History API directly.
// Clearing drops every parameter, like the router's setSearchParams({}) did before.
const currentSearchParams = () => new URLSearchParams(window.location.search);
const clearSearchParams = () => {
  if (window.location.search) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
  }
};

// The calculator island (hydrated on `/`): the form, the result view and the share dialog.
// The masthead, the other-tools list and the footer around it are static HTML (src/pages/index.astro).
export const Calculator = () => {
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

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    birthdate: '',
    useBirthdate: false
  });
  const [showResults, setShowResults] = useState(false);
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
    const parsed = parseShareParams(takeShareSearchParams(currentSearchParams()));
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
    clearSearchParams();
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
    clearSearchParams();
  };

  const shareResults = () => {
    setIsShareModalOpen(true);
    track('Share Opened');
  };

  // Bounded to match what the calculation actually applies (see #6).
  const rawLifestyleTotal = sumLifestyleFactors(lifestyleFactors);
  const lifestyleTotal = roundedLifestyleAdjustment(rawLifestyleTotal);

  const funFacts = [
    ['Solopgange set', resultData?.sunrises?.toLocaleString()],
    ['Åndedrætninger', resultData?.breaths?.toLocaleString()],
    ['Skridt taget', resultData?.steps?.toLocaleString()],
    ['Timer sovet', resultData?.sleepHours?.toLocaleString()],
    ['Gange grint', resultData?.laughs?.toLocaleString()],
    ['Måltider spist', resultData?.meals?.toLocaleString()],
    ['Liter vand drukket', resultData?.waterLiters?.toLocaleString()],
    ['km rejst i rummet', `${(resultData?.spaceKm / 1000000000)?.toFixed(1)} mia`],
    ...(resultData?.hasPreciseBirthdate
      ? [
          ['Fuldmåner oplevet', resultData?.fullMoons?.toLocaleString()],
          ['Årstider oplevet', resultData?.seasons?.toLocaleString()],
          ['Sekunder levet', resultData?.secondsLived?.toLocaleString()],
        ]
      : []),
  ];

  return (
    <>
      <main className="flex-1">
        {!showResults ? (
          <div className="container grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
            <div className="max-w-xl lg:pt-2">
              <h1 className="fig text-[2.5rem] leading-[1.08] font-semibold sm:text-6xl">Levetidsberegner</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Beregn hvor mange år du statistisk set har tilbage, baseret på danske dødelighedstavler.
              </p>
              <p className="mt-6 hidden text-[0.9375rem] leading-relaxed text-muted-foreground lg:block">
                Tallene kommer fra Danmarks Statistik ({LIFE_TABLE_META.period}). Beregningen sker i din browser, og
                det, du skriver, bliver ikke sendt nogen steder.
              </p>
            </div>

            <section aria-labelledby="form-heading" className="max-w-xl">
              <h2 id="form-heading" className="fig text-[1.75rem] font-semibold">Beregn din levetid</h2>
              <p className="mt-1 text-muted-foreground">Udfyld felterne. Det tager ti sekunder.</p>

              <div className="mt-8 space-y-8">
                {/* Mode Selection */}
                <div className="space-y-2">
                  <div className="label">Beregningsmåde</div>
                  <div className="segmented" role="radiogroup" aria-label="Beregningsmåde">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={currentMode === 'simple'}
                      className={`mode-btn ${currentMode === 'simple' ? 'active' : ''}`}
                      onClick={() => selectMode('simple')}
                    >
                      Simpel
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={currentMode === 'advanced'}
                      className={`mode-btn ${currentMode === 'advanced' ? 'active' : ''}`}
                      onClick={() => selectMode('advanced')}
                    >
                      Avanceret
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Simpel bruger kun alder og køn. Avanceret tilføjer spørgsmål om din livsstil.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Age Input Method Toggle */}
                  <div className="space-y-2">
                    <div className="label">Hvordan vil du angive din alder?</div>
                    <div className="segmented" role="radiogroup" aria-label="Hvordan vil du angive din alder?">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!formData.useBirthdate}
                        className={`mode-btn ${!formData.useBirthdate ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, useBirthdate: false, birthdate: '' }))}
                      >
                        Alder
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={formData.useBirthdate}
                        className={`mode-btn ${formData.useBirthdate ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, useBirthdate: true, age: '' }))}
                      >
                        Fødselsdato
                      </button>
                    </div>
                  </div>

                  {/* Age or Birthdate Input */}
                  {!formData.useBirthdate ? (
                    <div className="space-y-2">
                      <label htmlFor="age" className="label">Din alder:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          id="age"
                          name="age"
                          min="0"
                          max={MAX_AGE_INPUT}
                          inputMode="numeric"
                          required={!formData.useBirthdate}
                          className="input w-28"
                          value={formData.age}
                          onChange={handleInputChange}
                          aria-describedby="age-hint"
                          aria-invalid={ageTooHigh || undefined}
                        />
                        <span className="text-muted-foreground">år</span>
                      </div>
                      <p id="age-hint" className="text-sm text-muted-foreground">
                        Alder angivet i hele år, regnet som midt i året.
                      </p>
                      {ageTooHigh && (
                        <p role="alert" className="text-sm font-medium text-destructive">
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
                        className="input sm:w-56"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Med fødselsdato får du din præcise alder og mere nøjagtige fun facts.
                      </p>
                    </div>
                  )}

                  {/* Gender Selection */}
                  <div className="space-y-2">
                    <div className="label">Køn</div>
                    <div className="segmented" role="radiogroup" aria-label="Køn">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={formData.gender === 'male'}
                        className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                        onClick={() => selectGender('male')}
                      >
                        Mand
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={formData.gender === 'female'}
                        className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                        onClick={() => selectGender('female')}
                      >
                        Kvinde
                      </button>
                    </div>
                  </div>

                  {/* Lifestyle Factors (Advanced Mode) */}
                  {currentMode === 'advanced' && (
                    <div className="space-y-6 border-t pt-8">
                      <div className="space-y-1">
                        <h3 className="fig text-xl font-semibold">Livsstilsfaktorer</h3>
                        <p className="text-[0.9375rem] text-muted-foreground">
                          Juster disse faktorer for at se, hvordan din livsstil påvirker din levetid:
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

                      <div className="flex items-baseline justify-between gap-4 border-t pt-4">
                        <span className="font-medium">Livsstils påvirkning:</span>
                        <span className="fig text-2xl font-semibold text-primary">
                          {formatSignedYears(lifestyleTotal)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-full sm:w-auto sm:px-10"
                    disabled={(!formData.useBirthdate && (!formData.age || ageTooHigh)) || (formData.useBirthdate && !formData.birthdate) || !formData.gender}
                  >
                    Beregn levetid
                  </button>
                </form>
              </div>
            </section>
          </div>
        ) : (
          /* Results Section */
          <div className="container pb-10">
            <h1 className="sr-only">Levetidsberegner</h1>

            {/* Countdown Timer */}
            <div className="countdown-timer pt-10 sm:pt-16">
              <h2
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="fig max-w-3xl text-[2rem] leading-[1.1] font-semibold outline-none sm:text-5xl"
              >
                Din resterende tid
              </h2>
              {/* Announced once for screen readers; the ticking grid below is
                  hidden from assistive tech to avoid per-second spam. */}
              <p className="sr-only" aria-live="polite">
                Du har statistisk {formatYears(Number(resultData?.remainingYears))} år tilbage at leve
                {resultData?.projection === 'projected'
                  ? ' (fremskrevet af Danmarks Statistik).'
                  : ' (nuværende dødelighed).'}
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Statistisk set har du ca.{' '}
                <strong className="fig font-semibold text-foreground">
                  {formatYears(Number(resultData?.remainingYears))} år
                </strong> tilbage.
                Det svarer til en forventet alder på{' '}
                <strong className="fig font-semibold text-foreground">
                  {Number.isFinite(parseFloat(resultData?.adjustedLifeExpectancy))
                    ? formatYears(parseFloat(resultData.adjustedLifeExpectancy))
                    : resultData?.adjustedLifeExpectancy}{' '}
                  år
                </strong>
                .
              </p>
              <div className="mt-8">
                <Countdown key={resultData?.endTimestamp} endTimestamp={resultData?.endTimestamp} />
                <ProjectionToggle resultData={resultData} onChange={setProjection} />
              </div>
            </div>

            {/* Equivalent age (advanced mode) */}
            <KropsAlder resultData={resultData} />

            {/* Probability of reaching ages, with the survival curve */}
            <Sandsynlighed resultData={resultData} />

            {/* Life progress */}
            <div className="card">
              <div className="card-header">
                <h3 className="fig text-2xl leading-tight font-semibold">Dit livsforløb</h3>
                {resultData?.hasPreciseBirthdate && (
                  <p className="mt-2 text-[0.9375rem] text-muted-foreground">Præcis beregning ud fra din fødselsdato.</p>
                )}
              </div>
              <div className="card-content space-y-6">
                {resultData?.usesTailRule && (
                  <p className="max-w-prose border-l-2 border-input pl-4 text-sm text-muted-foreground">
                    Danmarks Statistiks tavle slutter ved 99 år. Fra den alder bruges den sidste
                    værdi (forventet restlevetid ved 99 år) som overslag.
                  </p>
                )}
                {/* Show precise age if birthdate was used */}
                {resultData?.hasPreciseBirthdate && (
                  <div>
                    <div className="text-[0.9375rem] text-muted-foreground">Din præcise alder</div>
                    <div className="fig text-2xl font-semibold">{resultData?.displayAge}</div>
                    {resultData?.birthdate && (
                      <div className="text-sm text-muted-foreground">Født: {resultData.birthdate}</div>
                    )}
                  </div>
                )}

                <div>
                  <div className="life-bar">
                    <div className="life-lived" style={{ width: `${resultData?.lifePercentage}%` }}></div>
                    <div className="life-remaining" style={{ width: `${100 - resultData?.lifePercentage}%` }}></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 bg-lived" /> Levet
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 bg-primary" /> Tilbage
                    </span>
                  </div>
                </div>

                <dl>
                  {[
                    ['Levet', `${resultData?.lifePercentage}%`],
                    ['Dage levet', resultData?.daysLived?.toLocaleString()],
                    ['Hjerteslag', resultData?.heartbeats?.toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-0">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="fig text-xl font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

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

            {/* Value-first livsforsikring CTA, high-intent moment */}
            <Forsikringsbehov resultData={resultData} />

            {/* Calm will / power of attorney pointer (advertising) */}
            <PraktiskePapirer resultData={resultData} />

            {/* Fun Facts Section */}
            <div className="card">
              <SectionHeader title="Fun facts om dit liv" />
              <div className="card-content">
                <dl className="grid gap-x-10 sm:grid-cols-2">
                  {funFacts.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 border-b py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="fig text-xl font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Tider tilbage */}
            <TidTilbage resultData={resultData} />

            {/* Milepæle */}
            <Milepaele resultData={resultData} />

            {/* Historik (repeat visits) */}
            <Historik resultData={resultData} />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t py-10 sm:flex-row">
              <button onClick={shareResults} className="btn btn-primary gap-2">
                <Share2 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                Del resultater
              </button>
              <button onClick={resetCalculation} className="btn btn-outline gap-2">
                <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Ny beregning
              </button>
            </div>

            {/* Disclaimers */}
            <div className="card">
              <div className="card-header">
                <h3 className="fig text-2xl leading-tight font-semibold">Bemærk</h3>
              </div>
              <div className="card-content max-w-prose space-y-3 text-[0.9375rem] text-muted-foreground">
                <p>
                  Det her er statistik, ikke en prognose for dig, og ikke medicinsk rådgivning.{' '}
                  <a href="#om-tallene" className="link">Læs mere under Om tallene</a>.
                </p>
                <p>
                  Nuværende dødelighed viser, hvor mange år en gennemsnitlig dansker på din alder og dit køn har
                  tilbage, hvis dødeligheden forbliver som i {LIFE_TABLE_META.period}. Fremskrevet bygger på Danmarks
                  Statistiks antagelse om, at dødeligheden fortsat falder (befolkningsfremskrivning 2026, opdateret{' '}
                  {COHORT_TABLE.tableUpdated.split('-').reverse().join('.')}). Fremskrivningen er en antagelse og
                  mere usikker end de målte tal.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        resultData={resultData}
        lifestyleFactors={lifestyleFactors}
        isAdvanced={currentMode === 'advanced'}
      />
    </>
  );
};

// The whole page as one React tree, for tests and server rendering checks. The site itself renders the
// same parts from src/pages/index.astro, with only <Calculator> hydrated.
const HomePage = () => (
  <div className="flex min-h-screen flex-col">
    <header>
      <SiteNav current="/" />
    </header>
    <Calculator />
    <PromoBanner />
    <Footer />
  </div>
);

export default HomePage;
