import React, { useState } from 'react';
import SectionHeader from './SectionHeader';

// "Tider tilbage" — translate the remaining-time estimate into finite, concrete
// moments. Leans entirely on numbers the calculation already produced.
const TidTilbage = ({ resultData }) => {
  const [visitsPerYear, setVisitsPerYear] = useState(6);

  if (!resultData) return null;

  const years = Math.max(0, parseFloat(resultData.remainingYears) || 0);
  const days = Math.max(0, resultData.remainingDays || Math.floor(years * 365.25));

  const fmt = (n) => Math.max(0, Math.floor(n)).toLocaleString('da-DK');

  const moments = [
    { value: fmt(years), label: 'somre tilbage' },
    { value: fmt(years), label: 'jul tilbage' },
    { value: fmt(years * 4), label: 'årstider' },
    { value: fmt(days / 29.53), label: 'fuldmåner' },
    { value: fmt(years), label: 'fødselsdage' },
    { value: fmt(days / 7), label: 'weekender' },
    { value: fmt(days * 2.5), label: 'kopper kaffe' },
    { value: fmt(days * 3), label: 'måltider' },
  ];

  const visitsLeft = fmt(years * visitsPerYear);

  return (
    <div className="card">
      <SectionHeader
        title="Tider tilbage"
        description="Statistisk set er dine oplevelser overraskende talbare. Her er nogle af dem."
      />
      <div className="card-content space-y-8">
        <dl className="grid gap-x-10 sm:grid-cols-2">
          {moments.map((m) => (
            <div key={m.label} className="flex items-baseline justify-between gap-4 border-b py-2.5">
              <dt className="text-muted-foreground">{m.label}</dt>
              <dd className="fig text-xl font-semibold">{m.value}</dd>
            </div>
          ))}
        </dl>

        {/* Personalizable: time left with the people you love */}
        <div className="border-l-2 border-primary pl-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-medium">Besøg hos dine kære</div>
              <label htmlFor="visitFreq" className="text-sm text-muted-foreground">
                Hvor ofte ses I?
              </label>
            </div>
            <select
              id="visitFreq"
              className="input w-full sm:w-56"
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
          <p className="mt-3">
            Så når I hinanden ca. <span className="fig text-3xl font-semibold text-primary">{visitsLeft}</span>{' '}
            gange mere.
          </p>
        </div>

        <p className="max-w-prose text-sm text-muted-foreground">
          Baseret på statistiske gennemsnit og ikke en forudsigelse.
        </p>
      </div>
    </div>
  );
};

export default TidTilbage;
