import React from 'react';
import { biologicalAge } from '../utils/lifeTableDK';

// "Din biologiske alder" — reframes the lifestyle factors into one memorable
// number: the age whose baseline life expectancy matches the user's adjusted
// remaining years. Only shown when lifestyle actually moves the estimate.
const KropsAlder = ({ resultData }) => {
  if (!resultData || resultData.lifestyleImpact === 0) return null;

  const age = parseFloat(resultData.age);
  const remaining = parseFloat(resultData.remainingYears);
  const gender = resultData.gender === 'female' ? 'female' : 'male';
  if (!Number.isFinite(age) || !Number.isFinite(remaining)) return null;

  const bodyAge = Math.round(biologicalAge(remaining, gender));
  // Age-only input is treated as mid-year (age + 0.5); round down so a 40-year-old is not shown as 41.
  const chrono = Math.floor(age);
  const delta = chrono - bodyAge; // positive → body younger than actual age

  const message =
    delta > 0
      ? `Din livsstil svarer til en krop, der er ~${delta} år yngre`
      : delta < 0
        ? `Din livsstil svarer til en krop, der er ~${Math.abs(delta)} år ældre`
        : 'Din krop matcher din faktiske alder';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="fig text-2xl leading-tight font-semibold">Din biologiske alder</h3>
      </div>
      <div className="card-content space-y-2">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="fig text-6xl font-semibold text-primary">{bodyAge}</span>
          <span className="text-lg text-muted-foreground">år, og du er {chrono}</span>
        </p>
        <p className="font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          Beregnet ud fra dine livsstilsvalg og danske dødelighedstavler.
        </p>
      </div>
    </div>
  );
};

export default KropsAlder;
