import React, { useState } from 'react';
import SectionHeader from './SectionHeader';
import { LIFESTYLE_META } from '../utils/lifestyleFactors';
import { projectedExpectancy } from '../utils/lifeTableDK';

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
  const options = LIFESTYLE_META.filter((m) => (current[m.key] ?? 0) < m.best);
  if (!options.length) return null;

  const hypothetical = { ...current };
  for (const m of options) if (applied[m.key]) hypothetical[m.key] = m.best;

  const currentExpected = parseFloat(resultData.adjustedLifeExpectancy);
  const newExpected = projectedExpectancy(age, gender, hypothetical);
  const delta = newExpected - currentExpected;
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
          <div className="fig text-5xl font-semibold text-primary">{newExpected.toFixed(1)}</div>
          <div
            className={`text-[0.9375rem] font-medium ${
              delta >= 0.05
                ? 'text-primary'
                : delta <= -0.05
                  ? 'text-foreground'
                  : 'text-muted-foreground'
            }`}
          >
            {delta >= 0.05
              ? `+${delta.toFixed(1)} år i forhold til nu`
              : delta <= -0.05
                ? `${delta.toFixed(1)} år i forhold til nu`
                : 'Vælg en ændring ovenfor'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HvadHvis;
