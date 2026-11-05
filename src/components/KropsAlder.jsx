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
      <div className="card-header">
        <h3 className="fig text-2xl leading-tight font-semibold">
          Din alder efter gennemsnitlig restlevetid
        </h3>
      </div>
      <div className="card-content space-y-2">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span data-testid="equivalent-age" className="fig text-6xl font-semibold text-primary">
            {equivalent}
          </span>
          <span className="text-lg text-muted-foreground">år, og du er {chrono}</span>
        </p>
        <p className="font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          Beregnet ud fra dine livsstilsvalg (vejledende justeringer) og danske dødelighedstavler.
        </p>
      </div>
    </div>
  );
};

export default KropsAlder;
