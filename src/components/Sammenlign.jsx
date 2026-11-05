import React from 'react';
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
  const lo = Math.floor((Math.min(...rows.map((r) => r.value)) - 2) / 5) * 5;
  const hi = Math.ceil((Math.max(...rows.map((r) => r.value)) + 1) / 5) * 5;
  const pos = (v) => ((v - lo) / (hi - lo)) * 100;
  const ticks = [];
  for (let t = lo; t <= hi; t += 5) ticks.push(t);
  const grid = {
    backgroundImage: 'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)',
    backgroundSize: `${(5 / (hi - lo)) * 100}% 100%`,
  };

  return (
    <div className="card">
      <SectionHeader
        title="Sammenlign med gennemsnittet"
        description={`Din forventede alder (${formatYears(you)} år) sat i perspektiv.`}
      />
      <div className="card-content space-y-5">
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                <span className={r.you ? 'font-semibold' : 'text-muted-foreground'}>
                  {r.label}
                  {r.note && <span className="block text-sm">{r.note}</span>}
                </span>
                <span className={`fig shrink-0 text-lg ${r.you ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {formatYears(r.value)} år
                </span>
              </div>
              <div className="relative mt-1.5 h-4 border-r" style={grid} aria-hidden="true">
                <div
                  className="absolute top-1/2 h-px -translate-y-1/2 bg-foreground/30"
                  style={{ left: 0, width: `${pos(r.value)}%` }}
                />
                <div
                  className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    r.you ? 'bg-primary' : 'bg-lived'
                  }`}
                  style={{ left: `${pos(r.value)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="relative h-5 text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute whitespace-nowrap"
              style={{ left: `${pos(t)}%`, transform: t === lo ? 'none' : t === hi ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {t} år
            </span>
          ))}
        </div>
        {projected && (
          <p className="max-w-prose text-sm text-muted-foreground" data-testid="sammenlign-basis-note">
            "Dig" og gennemsnittet for din alder bruger fremskrevet dødelighed (DST). Rækkerne "ved fødslen" er
            målte tal for nuværende dødelighed og kan ikke sammenlignes direkte.
          </p>
        )}
        <p className="font-medium">{verdict.text}</p>
      </div>
    </div>
  );
};

export default Sammenlign;
