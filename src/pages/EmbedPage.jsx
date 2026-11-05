import React, { useEffect, useRef, useState } from 'react';
import SEOHead from '../components/SEOHead';
import { computeEmbedResult, EMBED_MAX_AGE } from '../utils/embedResult';
import { formatYears } from '../utils/lifespanMath';
import { LIFE_TABLE_META } from '../utils/lifeTableDK';
import { track } from '../utils/analytics';

export const EMBED_HEIGHT_MESSAGE = 'levetidsberegner:height';

// Tell the embedding page how tall the content is. Carries the pixel height only,
// never any input or result. Harmless if the parent does not listen.
function useReportHeight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window || typeof ResizeObserver === 'undefined') return undefined;
    let last = 0;
    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height === last) return;
      last = height;
      window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, height }, '*');
    };
    const ro = new ResizeObserver(post);
    ro.observe(el);
    post();
    return () => ro.disconnect();
  }, [ref]);
}

const EmbedPage = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  useReportHeight(rootRef);

  const handleSubmit = (e) => {
    e.preventDefault();
    const r = computeEmbedResult(age, gender);
    if (!r) {
      setResult(null);
      setError(
        gender
          ? `Angiv en alder mellem 0 og ${EMBED_MAX_AGE} år.`
          : 'Vælg køn og angiv en alder mellem 0 og ' + EMBED_MAX_AGE + ' år.'
      );
      return;
    }
    setError('');
    setResult(r);
    // No props: nothing the visitor typed or got back leaves the iframe.
    track('Embed Calculate');
  };

  return (
    <div ref={rootRef}>
      <main className="mx-auto w-full max-w-md p-3 text-foreground">
        <SEOHead route="/embed" />

        <h1 className="sr-only">Levetidsberegner</h1>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3"
          aria-label="Levetidsberegner"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-24">
              <label htmlFor="embed-age" className="label mb-1 block">
                Alder
              </label>
              <input
                id="embed-age"
                name="age"
                type="number"
                inputMode="numeric"
                min="0"
                max={EMBED_MAX_AGE}
                required
                autoComplete="off"
                className="input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-describedby={error ? 'embed-error' : undefined}
                aria-invalid={error ? 'true' : undefined}
              />
            </div>
            <fieldset className="min-w-0 flex-1">
              <legend className="label mb-1">Køn</legend>
              <div className="flex gap-4 min-h-11 items-center">
                {[
                  ['female', 'Kvinde'],
                  ['male', 'Mand'],
                ].map(([value, text]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={gender === value}
                      onChange={() => setGender(value)}
                      className="h-4 w-4 accent-primary"
                    />
                    {text}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {error && (
            <p id="embed-error" role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full">
            Beregn
          </button>
        </form>

        <div aria-live="polite" className="mt-3">
          {result && (
            <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 text-card-foreground">
              <div>
                <dt className="text-xs text-muted-foreground">Forventede år tilbage</dt>
                <dd className="text-2xl font-bold text-primary">{formatYears(result.remainingYears)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Forventet dødsalder</dt>
                <dd className="text-2xl font-bold text-primary">{formatYears(result.ageAtDeath)}</dd>
              </div>
            </dl>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">Kilde: Danmarks Statistik ({LIFE_TABLE_META.period})</p>
        <p className="mt-1 text-sm">
          <a
            href="https://levetidsberegner.dk/?utm_source=embed&utm_medium=widget"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Beregn mere detaljeret på levetidsberegner.dk
          </a>
        </p>
      </main>
    </div>
  );
};

export default EmbedPage;
