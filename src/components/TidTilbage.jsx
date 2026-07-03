import React, { useState } from 'react';

// "Tider tilbage" — translate the remaining-time estimate into finite, concrete
// moments. Leans entirely on numbers the calculation already produced.
const TidTilbage = ({ resultData }) => {
  const [visitsPerYear, setVisitsPerYear] = useState(6);

  if (!resultData) return null;

  const years = Math.max(0, parseFloat(resultData.remainingYears) || 0);
  const days = Math.max(0, resultData.remainingDays || Math.floor(years * 365.25));

  const fmt = (n) => Math.max(0, Math.floor(n)).toLocaleString('da-DK');

  const moments = [
    { icon: '🌞', value: fmt(years), label: 'somre tilbage' },
    { icon: '🎄', value: fmt(years), label: 'jul tilbage' },
    { icon: '🍂', value: fmt(years * 4), label: 'årstider' },
    { icon: '🌕', value: fmt(days / 29.53), label: 'fuldmåner' },
    { icon: '🎂', value: fmt(years), label: 'fødselsdage' },
    { icon: '🛌', value: fmt(days / 7), label: 'weekender' },
    { icon: '☕', value: fmt(days * 2.5), label: 'kopper kaffe' },
    { icon: '🍽️', value: fmt(days * 3), label: 'måltider' },
  ];

  const visitsLeft = fmt(years * visitsPerYear);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">⌛ Tider tilbage</h3>
        <p className="card-description">
          Statistisk set er dine oplevelser overraskende talbare. Her er nogle af dem.
        </p>
      </div>
      <div className="card-content space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {moments.map((m) => (
            <div key={m.label} className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-lg font-semibold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Personalizable: time left with the people you love */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍👩‍👧</span>
              <div>
                <div className="font-medium">Besøg hos dine kære</div>
                <label htmlFor="visitFreq" className="text-xs text-muted-foreground">
                  Hvor ofte ses I?
                </label>
              </div>
            </div>
            <select
              id="visitFreq"
              className="input h-10 w-full sm:w-56"
              value={visitsPerYear}
              onChange={(e) => setVisitsPerYear(Number(e.target.value))}
            >
              <option value={52}>Hver uge</option>
              <option value={26}>Hver 2. uge</option>
              <option value={12}>Hver måned</option>
              <option value={6}>Hver 2. måned</option>
              <option value={4}>Hvert kvartal</option>
              <option value={2}>2 gange om året</option>
              <option value={1}>1 gang om året</option>
            </select>
          </div>
          <p className="mt-3 text-center text-sm">
            Så når I hinanden ca. <span className="text-2xl font-bold text-primary">{visitsLeft}</span>{' '}
            gange mere.
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Baseret på statistiske gennemsnit — ikke en forudsigelse. Brug dine tider godt. 💛
        </p>
      </div>
    </div>
  );
};

export default TidTilbage;
