import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { pensionCohort } from '../utils/pension';

// "Pension & arbejdsår" — from the user's cohort + estimate: statutory pension
// age, working years left, and expected years in retirement, with a life-phase bar.
const Pension = ({ resultData }) => {
  if (!resultData) return null;

  const age = parseFloat(resultData.age);
  const expectancy = parseFloat(resultData.adjustedLifeExpectancy);
  if (!Number.isFinite(age) || !Number.isFinite(expectancy)) return null;

  // Real birth year when a birthdate is known; otherwise the cohort is derived
  // from the whole-year age and may straddle a pension-age boundary.
  const cohort = pensionCohort({
    birthYear: resultData.birthYear,
    birthMonth: resultData.birthMonth,
    age,
  });
  const { pensionAge } = cohort;
  const cohortText =
    cohort.birthYears.length === 1
      ? String(cohort.birthYears[0])
      : `${cohort.birthYears[0]}/${String(cohort.birthYears[1]).slice(2)}`;
  const retired = age >= pensionAge;
  const workingYearsLeft = retired ? 0 : Math.round(pensionAge - age);
  const retirementYears = Math.max(0, Math.round(expectancy - pensionAge));

  // Life-phase bar segments (as % of the whole estimated life).
  const total = Math.max(expectancy, age, 1);
  const livedPct = (Math.min(age, total) / total) * 100;
  const workPct = (Math.max(0, Math.min(pensionAge, total) - age) / total) * 100;
  const retirePct = Math.max(0, 100 - livedPct - workPct);

  return (
    <div className="card">
      <SectionHeader
        icon={Briefcase}
        title="Pension & arbejdsår"
        description={`Baseret på din årgang (${cohortText}) og den danske folkepensionsalder.`}
      />
      <div className="card-content space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-2xl font-semibold">{cohort.label}</div>
            <div className="text-xs text-muted-foreground wrap-anywhere">Folkepensionsalder</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-2xl font-semibold text-primary">{workingYearsLeft}</div>
            <div className="text-xs text-muted-foreground wrap-anywhere">
              {retired ? 'Pensioneret' : 'Arbejdsår tilbage'}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-2xl font-semibold">{retirementYears}</div>
            <div className="text-xs text-muted-foreground wrap-anywhere">Forventede pensionsår</div>
          </div>
        </div>

        <div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${livedPct}%` }} title="Levet" />
            <div className="h-full bg-primary/40" style={{ width: `${workPct}%` }} title="Arbejdsår tilbage" />
            <div className="h-full bg-muted-foreground/30" style={{ width: `${retirePct}%` }} title="Pensionsår" />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-primary" /> Levet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-primary/40" /> Arbejde tilbage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-muted-foreground/30" /> Pension
            </span>
          </div>
        </div>

        {cohort.efterloen && (
          <p className="text-center text-sm text-muted-foreground">
            Efterlønsalder for din årgang:{' '}
            <span className="font-semibold text-foreground">
              {cohort.efterloen === 'ikke fastsat' ? 'ikke fastsat endnu' : cohort.efterloen}
            </span>
            . Kun alderen er med i overslaget; vilkår for efterløn indgår ikke.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/pensionsalder" className="underline">Se alle pensionsaldre og din pensionsdato</Link>.{' '}
          Folkepensionsalderen er lovbestemt (Lov nr. 703 af 20. juni 2025; aldre efter borger.dk,
          november 2026) og kan stige yderligere for årgange fra 1975. Efterlønsaldre er
          ligeledes fra borger.dk.
        </p>
      </div>
    </div>
  );
};

export default Pension;
