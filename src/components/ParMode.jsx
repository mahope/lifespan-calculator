import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { jointLifeStats } from '../utils/lifeTableDK';

// "Jer to sammen" — enter a partner's age/gender and see joint-life odds and the
// expected number of years you both have left, from the Danish survivors table.
const ParMode = ({ resultData }) => {
  const [partnerAge, setPartnerAge] = useState('');
  const [partnerGender, setPartnerGender] = useState('female');

  if (!resultData) return null;
  const age = parseFloat(resultData.age);
  const gender = resultData.gender === 'female' ? 'female' : 'male';
  if (!Number.isFinite(age)) return null;

  const pAge = parseInt(partnerAge, 10);
  // The life table covers ages 0–99; cap here so we never produce clamped
  // (100 %-survival) nonsense for ages beyond the data.
  const valid = Number.isFinite(pAge) && pAge >= 0 && pAge <= 99;
  const stats = valid ? jointLifeStats(age, gender, pAge, partnerGender) : null;
  const pct = (x) => `${Math.round(x * 100)}%`;

  return (
    <div className="card">
      <SectionHeader
        icon={HeartHandshake}
        tone="rose"
        title="Jer to sammen"
        description="Indtast din partners alder og køn og se, hvor mange år I statistisk har sammen."
      />
      <div className="card-content space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="partnerAge" className="label">
              Partnerens alder
            </label>
            <input
              id="partnerAge"
              type="number"
              min="0"
              max="99"
              className="input w-full"
              value={partnerAge}
              onChange={(e) => setPartnerAge(e.target.value)}
              placeholder="fx 38"
            />
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Partnerens køn">
            <button
              type="button"
              role="radio"
              aria-checked={partnerGender === 'male'}
              className={`gender-btn ${partnerGender === 'male' ? 'active' : ''}`}
              onClick={() => setPartnerGender('male')}
            >
              <span className="text-sm font-medium">Mand</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={partnerGender === 'female'}
              className={`gender-btn ${partnerGender === 'female' ? 'active' : ''}`}
              onClick={() => setPartnerGender('female')}
            >
              <span className="text-sm font-medium">Kvinde</span>
            </button>
          </div>
        </div>

        {stats && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 text-center">
              <div className="text-sm text-muted-foreground">Forventede år sammen (begge i live)</div>
              <div className="text-4xl font-bold text-primary">
                {stats.expectedTogether.toFixed(1)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="py-1 text-left font-medium">Om</th>
                    <th className="py-1 text-right font-medium">Begge i live</th>
                    <th className="py-1 text-right font-medium">Mindst én</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.at.map((r) => (
                    <tr key={r.years} className="border-t border-border/40">
                      <td className="py-1.5">{r.years} år</td>
                      <td className="py-1.5 text-right font-semibold text-primary">{pct(r.both)}</td>
                      <td className="py-1.5 text-right">{pct(r.either)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Antager uafhængig dødelighed — danske dødelighedstavler (Danmarks Statistik).
        </p>
      </div>
    </div>
  );
};

export default ParMode;
