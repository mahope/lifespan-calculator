// One decimal below 10 % so small tail probabilities (0,83 %) are not rounded
// to 1 % or 0 %; whole percent otherwise.
export const formatPct = (pct) =>
  pct < 10 ? `${pct.toFixed(1).replace('.', ',')}%` : `${Math.round(pct)}%`;
