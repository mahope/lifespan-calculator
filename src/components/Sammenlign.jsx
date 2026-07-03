import React from 'react';
import { getLifeExpectancyForCountry } from '../utils/lifeExpectancyData';

// "Sammenlign med gennemsnittet" — the user's adjusted estimate against the
// Danish average and a couple of reference countries. Uses the static country
// dataset only (an honest, percentile-free comparison).
const Sammenlign = ({ resultData }) => {
  if (!resultData) return null;

  const gender = resultData.gender;
  const you = parseFloat(resultData.adjustedLifeExpectancy);
  if (!Number.isFinite(you) || !gender) return null;

  const dkAvg = getLifeExpectancyForCountry('Denmark', gender);
  const rows = [
    { label: 'Dig', value: you, you: true },
    { label: 'Danmark (gennemsnit)', value: dkAvg },
    { label: 'Japan (højest i verden)', value: getLifeExpectancyForCountry('Japan', gender) },
    { label: 'Verdensgennemsnit', value: getLifeExpectancyForCountry('World', gender) },
  ];
  const max = Math.max(...rows.map((r) => r.value));

  const diff = you - dkAvg;
  const absDiff = Math.abs(diff).toFixed(1);
  const verdict =
    diff >= 0.05
      ? `Du ligger ca. ${absDiff} år over det danske gennemsnit 🎉`
      : diff <= -0.05
        ? `Du ligger ca. ${absDiff} år under det danske gennemsnit`
        : 'Du ligger lige omkring det danske gennemsnit';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">📊 Sammenlign med gennemsnittet</h3>
        <p className="card-description">Din forventede alder ({you.toFixed(1)} år) sat i perspektiv.</p>
      </div>
      <div className="card-content space-y-4">
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={r.you ? 'font-semibold' : 'text-muted-foreground'}>{r.label}</span>
                <span className={r.you ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  {r.value.toFixed(1)} år
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
        <p className="text-center text-sm font-medium">{verdict}</p>
      </div>
    </div>
  );
};

export default Sammenlign;
