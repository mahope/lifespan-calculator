import React, { useState } from 'react';
import SectionHeader from './SectionHeader';
import { factorYears, isSuggestible, LIFESTYLE_META } from '../utils/lifestyleFactors';
import { projectedExpectancy } from '../utils/lifeTableDK';
import { formatSignedYears, formatYears } from '../utils/lifespanMath';

// "Hvad hvis?" — toggle hypothetical improvements and watch the projected age
// update live. Consistent with the main estimate (same projectedExpectancy()).
const HvadHvis = ({ resultData, lifestyleFactors }) => {
  const [applied, setApplied] = useState({});

  if (!resultData) return null;
  const age = parseFloat(resultData.age);
  const gender = resultData.gender === 'female' ? 'female' : 'male';
  if (!Number.isFinite(age)) return null;

  const current = lifestyleFactors || {};
  // Only factors where there's room to improve.
  const options = LIFESTYLE_META.filter((m) => isSuggestible(m, current) && factorYears(m.key, current[m.key]) < m.best);
  if (!options.length) return null;

  const hypothetical = { ...current };
  for (const m of options) if (applied[m.key]) hypothetical[m.key] = m.bestValue;

  const currentExpected = parseFloat(resultData.adjustedLifeExpectancy);
  // Same inputs and table on both sides, so no choice gives exactly 0 (the shown
  // result is rounded to one decimal and the age to two).
  const { projection } = resultData;
  const delta =
    projectedExpectancy(age, gender, hypothetical, projection) -
    projectedExpectancy(age, gender, current, projection);
  const newExpected = currentExpected + delta;
  const anyApplied = Object.values(applied).some(Boolean);

  return (
    <div className="card">
      <SectionHeader
        title="Hvad hvis?"
        description="Vælg ændringer og se effekten på dit estimat med det samme."
      />
      <div className="card-content space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Hypotetiske livsstilsændringer">
          {options.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={!!applied[m.key]}
              className={`factor-btn basis-auto! ${applied[m.key] ? 'active' : ''}`}
              onClick={() => setApplied((a) => ({ ...a, [m.key]: !a[m.key] }))}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="border-l-2 border-primary pl-4">
          <div className="text-[0.9375rem] text-muted-foreground">
            {anyApplied ? 'Ny forventet alder' : 'Din forventede alder'}
          </div>
          <div data-testid="hvadhvis-expected" className="fig text-5xl font-semibold text-primary">
            {formatYears(newExpected)}
          </div>
          <div
            data-testid="hvadhvis-delta"
            className={`text-[0.9375rem] font-medium ${
              delta >= 0.05
                ? 'text-primary'
                : delta <= -0.05
                  ? 'text-foreground'
                  : 'text-muted-foreground'
            }`}
          >
            {delta >= 0.05
              ? `${formatSignedYears(delta)} i forhold til nu`
              : delta <= -0.05
                ? `${formatSignedYears(delta)} i forhold til nu`
                : 'Vælg en ændring ovenfor'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HvadHvis;
