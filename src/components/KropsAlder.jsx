import React from 'react';
import { equivalentAge } from '../utils/lifeTableDK';

// "Din alder efter gennemsnitlig restlevetid" — the age whose baseline life expectancy matches the
// user's adjusted remaining years. A statistical picture built on the guidance
// adjustments, not a measure of the body. Only shown when lifestyle actually
// moves the estimate.
const KropsAlder = ({ resultData }) => {
  if (!resultData || resultData.lifestyleImpact === 0) return null;

  const age = parseFloat(resultData.age);
  // Body age is defined against the period table, so it always uses the period
  // figure; the projection toggle must not change it.
  const remaining = parseFloat(resultData.periodRemainingYears ?? resultData.remainingYears);
  const gender = resultData.gender === 'female' ? 'female' : 'male';
  if (!Number.isFinite(age) || !Number.isFinite(remaining)) return null;

  const equivalent = Math.round(equivalentAge(remaining, gender));
  // Age-only input is treated as mid-year (age + 0.5); round down so a 40-year-old is not shown as 41.
  const chrono = Math.floor(age);

  const message = `Med de valg, du har lavet, svarer dit estimat for resterende leveår til det, en gennemsnitsdansker på ca. ${equivalent} år har tilbage (du er ${chrono}). Det er en statistisk omregning af leveår, ikke en måling af din krop.`;

  return (
    <div className="card">
      <div className="card-content space-y-2 py-6 text-center">
        <div className="text-sm text-muted-foreground">Din alder efter gennemsnitlig restlevetid</div>
        <div className="flex items-end justify-center gap-3">
          <span className="text-5xl font-bold text-primary">{equivalent}</span>
          <span className="mb-1 text-lg text-muted-foreground">år · du er {chrono}</span>
        </div>
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">
          Beregnet ud fra dine livsstilsvalg (vejledende justeringer) og danske dødelighedstavler.
        </p>
      </div>
    </div>
  );
};

export default KropsAlder;
