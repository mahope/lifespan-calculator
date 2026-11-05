import React from 'react';
import { Link } from 'react-router-dom';
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
        title="Pension & arbejdsår"
        description={`Baseret på din årgang (${cohortText}) og den danske folkepensionsalder.`}
      />
      <div className="card-content space-y-6">
        <dl className="grid grid-cols-3 gap-4">
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-muted-foreground wrap-anywhere">Folkepensionsalder</dt>
            <dd className="fig text-3xl font-semibold sm:text-4xl">{cohort.label}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-muted-foreground wrap-anywhere">
              {retired ? 'Pensioneret' : 'Arbejdsår tilbage'}
            </dt>
            <dd className="fig text-3xl font-semibold text-primary sm:text-4xl">{workingYearsLeft}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-muted-foreground wrap-anywhere">Forventede pensionsår</dt>
            <dd className="fig text-3xl font-semibold sm:text-4xl">{retirementYears}</dd>
          </div>
        </dl>

        <div>
          <div className="flex h-3 w-full overflow-hidden bg-secondary">
            <div className="h-full bg-lived" style={{ width: `${livedPct}%` }} title="Levet" />
            <div className="h-full bg-primary/40" style={{ width: `${workPct}%` }} title="Arbejdsår tilbage" />
            <div className="h-full bg-primary" style={{ width: `${retirePct}%` }} title="Pensionsår" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-lived" /> Levet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-primary/40" /> Arbejde tilbage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-primary" /> Pension
            </span>
          </div>
        </div>

        {cohort.efterloen && (
          <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
            Efterlønsalder for din årgang:{' '}
            <span className="font-semibold text-foreground">
              {cohort.efterloen === 'ikke fastsat' ? 'ikke fastsat endnu' : cohort.efterloen}
            </span>
            . Kun alderen er med i overslaget; vilkår for efterløn indgår ikke.
          </p>
        )}

        <p>
          <Link to="/pensionsalder" className="link font-medium">Se alle pensionsaldre og din pensionsdato</Link>
        </p>

        <p className="max-w-prose text-sm text-muted-foreground">
          Folkepensionsalderen er 70 år for dem, der er født fra 1. januar 1971 (Lov nr. 703 af 20. juni 2025, som
          også satte 69 år for 1967-1970). De øvrige aldre er efter borger.dk, november 2026, og alderen kan stige
          yderligere for årgange fra 1975. Efterlønsaldre er ligeledes fra borger.dk.
        </p>
      </div>
    </div>
  );
};

export default Pension;
