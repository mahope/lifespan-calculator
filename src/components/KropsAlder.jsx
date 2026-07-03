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
  const chrono = Math.round(age);
  const delta = chrono - bodyAge; // positive → body younger than actual age

  const message =
    delta > 0
      ? `Din livsstil svarer til en krop, der er ~${delta} år yngre 🎉`
      : delta < 0
        ? `Din livsstil svarer til en krop, der er ~${Math.abs(delta)} år ældre`
        : 'Din krop matcher din faktiske alder';

  return (
    <div className="card">
      <div className="card-content space-y-2 py-6 text-center">
        <div className="text-sm text-muted-foreground">Din biologiske alder</div>
        <div className="flex items-end justify-center gap-3">
          <span className="text-5xl font-bold text-primary">{bodyAge}</span>
          <span className="mb-1 text-lg text-muted-foreground">år · du er {chrono}</span>
        </div>
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">
          Beregnet ud fra dine livsstilsvalg og danske dødelighedstavler.
        </p>
      </div>
    </div>
  );
};

export default KropsAlder;
