import React from 'react';
import { BarChart3 } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { getLifeExpectancyForCountry, lifeExpectancyData } from '../utils/lifeExpectancyData';
import { formatYears } from '../utils/lifespanMath';
import { compareWithDanishAverage, verdictFor } from '../utils/compareAverage';
import { PROJECTION_LABELS } from '../utils/projectionLabels';

// "Sammenlign med gennemsnittet" — the user's estimate against the Danish
// average for the same age and sex (no lifestyle adjustment), plus context rows
// with life expectancy at birth. Percentile-free on purpose.
const Sammenlign = ({ resultData }) => {
  if (!resultData) return null;

  const gender = resultData.gender === 'female' ? 'female' : 'male';
  const age = parseFloat(resultData.age);
  const lifestyle = Number(resultData.lifestyleImpact) || 0;
  if (!Number.isFinite(age)) return null;

  const { you, average, diff } = compareWithDanishAverage(age, gender, lifestyle, resultData.projection);
  const verdict = verdictFor(diff);
  const sexLabel = gender === 'female' ? 'kvinde' : 'mand';
  const dk = lifeExpectancyData.Denmark;
  const projected = resultData.projection === 'projected';
  const rows = [
    { label: 'Dig', value: you, you: true },
    {
      label: `Gennemsnitlig dansk ${sexLabel} på ${Math.floor(age)}`,
      value: average,
      note: projected ? PROJECTION_LABELS.projected : undefined,
    },
    {
      label: 'Danmark ved fødslen',
      value: getLifeExpectancyForCountry('Denmark', gender),
      note: `${dk.source}, ${dk.year}`,
    },
    ...['Japan', 'World'].map((k) => {
      const c = lifeExpectancyData[k];
      return {
        label: `${k === 'Japan' ? 'Japan' : 'Verdensgennemsnit'} ved fødslen`,
        value: getLifeExpectancyForCountry(k, gender),
        note: `${c.source}, ${c.year}`,
      };
    }),
  ];
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <div className="card">
      <SectionHeader
        icon={BarChart3}
        title="Sammenlign med gennemsnittet"
        description={`Din forventede alder (${formatYears(you)} år) sat i perspektiv.`}
      />
      <div className="card-content space-y-4">
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={r.you ? 'font-semibold' : 'text-muted-foreground'}>
                  {r.label}
                  {r.note && <span className="block text-xs">{r.note}</span>}
                </span>
                <span className={r.you ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  {formatYears(r.value)} år
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    r.you ? 'bg-primary' : 'bg-muted-foreground/40'
                  }`}
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {projected && (
          <p className="text-center text-xs text-muted-foreground" data-testid="sammenlign-basis-note">
            "Dig" og gennemsnittet for din alder bruger fremskrevet dødelighed (DST). Rækkerne "ved fødslen" er
            målte tal for nuværende dødelighed og kan ikke sammenlignes direkte.
          </p>
        )}
        <p className="text-center text-sm font-medium">{verdict.text}</p>
      </div>
    </div>
  );
};

export default Sammenlign;
