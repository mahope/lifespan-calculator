import React from 'react';
import { Dices } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { survivalProbability } from '../utils/lifeTableDK';

const TARGETS = [80, 90, 95, 100];

// One decimal below 10 % so small tail probabilities (0,83 %) are not rounded
// to 1 % or 0 %; whole percent otherwise.
export const formatPct = (pct) =>
  pct < 10 ? `${pct.toFixed(1).replace('.', ',')}%` : `${Math.round(pct)}%`;

// "Chance for at nå…" — probability of reaching selected ages from the user's
// current age, straight from the Danish survivors table (l_x). Population
// baseline, independent of the lifestyle sliders (honest framing).
const Sandsynlighed = ({ resultData }) => {
  if (!resultData) return null;

  const age = parseFloat(resultData.age);
  const gender = resultData.gender === 'female' ? 'female' : 'male';
  if (!Number.isFinite(age)) return null;

  const rows = TARGETS.filter((t) => t > age).map((t) => ({
    age: t,
    pct: survivalProbability(age, t, gender) * 100,
  }));
  if (!rows.length) return null;

  return (
    <div className="card">
      <SectionHeader
        icon={Dices}
        title="Chance for at nå…"
        description="Sandsynlighed for at nå udvalgte aldre, ud fra danske dødelighedstavler."
      />
      <div className="card-content space-y-3">
        {rows.map((r) => (
          <div key={r.age} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{r.age} år</span>
              <span className="font-semibold text-primary">{formatPct(r.pct)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-muted-foreground">
          Baseret på danske dødelighedstavler (Danmarks Statistik, 2024-2025) — en
          befolkningsgennemsnitlig sandsynlighed, uafhængig af dine livsstilsvalg.
        </p>
      </div>
    </div>
  );
};

export default Sandsynlighed;
