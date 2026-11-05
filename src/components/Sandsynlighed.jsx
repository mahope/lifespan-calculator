import React from 'react';
import SectionHeader from './SectionHeader';
import Overlevelseskurve from './Overlevelseskurve';
import { survivalProbability, LIFE_TABLE_META } from '../utils/lifeTableDK';
import { formatPct } from '../utils/formatPct';

const TARGETS = [80, 90, 95, 100];

// "Chance for at nå…" — probability of reaching selected ages from the user's
// current age, straight from the Danish survivors table (l_x). Population
// baseline, independent of the lifestyle sliders (honest framing). The curve
// shows the whole shape; the table repeats the values as text.
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
        title="Chance for at nå…"
        description={
          resultData.projection === 'projected'
            ? 'Sandsynlighed for at nå udvalgte aldre, ud fra danske dødelighedstavler (nuværende dødelighed, også når du har valgt fremskrevet).'
            : 'Sandsynlighed for at nå udvalgte aldre, ud fra danske dødelighedstavler.'
        }
      />
      <div className="card-content space-y-6">
        <Overlevelseskurve
          age={age}
          gender={gender}
          expectedAge={parseFloat(resultData.adjustedLifeExpectancy)}
        />
        <table className="w-full max-w-md text-[0.9375rem]">
          <caption className="sr-only">Sandsynlighed for at nå udvalgte aldre</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">Alder</th>
              <th scope="col" className="py-2 text-right font-medium">Chance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.age} className="border-b last:border-0">
                <th scope="row" className="py-2 pr-4 text-left font-medium">{r.age} år</th>
                <td className="fig py-2 text-right text-lg font-semibold">{formatPct(r.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="max-w-prose text-sm text-muted-foreground">
          Baseret på danske dødelighedstavler (Danmarks Statistik, {LIFE_TABLE_META.period}). Det er en
          befolkningsgennemsnitlig sandsynlighed, uafhængig af dine livsstilsvalg. Den stiplede linje er din justerede forventede alder og er ikke en andel på kurven.
        </p>
      </div>
    </div>
  );
};

export default Sandsynlighed;
