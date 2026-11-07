import React, { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import { PENSION_AGE_ROWS, efterloenAgeOn, folkepensionAgeOn, pensionOutlook } from '../utils/pension';
import { FAQ } from '../utils/pensionFaq';
import { parseLocalDate, toLocalISODate } from '../utils/lifespanMath';
import { LIFE_TABLE_META } from '../data/lifeTableDK.generated';

// Before 1939-07-01 the pension age was 67, which the age schedule in utils/pension.js does not cover.
const MIN_BIRTH = '1939-07-01';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtDate = (d) => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtYears = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtAge = (years, months) => (months ? `${years}½ år` : `${years} år`);
const splitAge = (age) => [Math.floor(age), age % 1 ? 6 : 0];

// The form and the result: the island hydrated on /pensionsalder. The tables and the FAQ around it are static.
export const PensionForm = () => {
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [touched, setTouched] = useState(false);
  // "Today" is read in the browser after hydration, never frozen into the HTML at build time.
  const [today, setToday] = useState('');
  useEffect(() => setToday(toLocalISODate(new Date())), []);

  const parsed = birthdate ? parseLocalDate(birthdate) : null;
  const inRange = birthdate >= MIN_BIRTH && birthdate <= today;
  const outlook = inRange ? pensionOutlook(birthdate) : null;
  const valid = outlook !== null;
  const error =
    touched && birthdate && !valid
      ? `Skriv en gyldig fødselsdato mellem ${fmtDate(parseLocalDate(MIN_BIRTH))} og i dag. Siden dækker ikke dem, der er født før.`
      : null;
  const efterloen = outlook && parsed ? efterloenAgeOn(parsed.getFullYear(), parsed.getMonth() + 1) : undefined;
  const sexes = gender ? [gender] : ['male', 'female'];
  const sexLabel = { male: 'mænd', female: 'kvinder' };

  return (
    <>
      <section className="card" aria-label="Din fødselsdato">
        <div className="card-content max-w-xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="pension-birthdate" className="label">Fødselsdato</label>
              <input
                id="pension-birthdate"
                type="date"
                className="input"
                value={birthdate}
                min={MIN_BIRTH}
                max={today || undefined}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  setTouched(false);
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'pension-birthdate-error' : undefined}
              />
              {error && (
                <p id="pension-birthdate-error" role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="pension-sex" className="label">Køn (valgfrit)</label>
              <select
                id="pension-sex"
                className="input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Vis begge</option>
                <option value="male">Mand</option>
                <option value="female">Kvinde</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Bruges kun til overslaget over pensionsår. Intet gemmes eller sendes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div aria-live="polite">
        {outlook && (
          <section className="card" aria-label="Dit resultat">
            <div className="card-content space-y-6">
              <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-3">
                <div className="flex flex-col-reverse justify-end">
                  <dt className="mt-1 text-sm text-muted-foreground">Folkepensionsalder</dt>
                  <dd className="fig text-3xl font-semibold">{fmtAge(outlook.years, outlook.months)}</dd>
                </div>
                <div className="flex flex-col-reverse justify-end">
                  <dt className="mt-1 text-sm text-muted-foreground">
                    {outlook.retired ? 'Dato du nåede den' : 'Dato du når den'}
                  </dt>
                  <dd className="fig text-3xl font-semibold text-primary">{fmtDate(outlook.date)}</dd>
                </div>
                <div className="flex flex-col-reverse justify-end">
                  <dt className="mt-1 text-sm text-muted-foreground">
                    {outlook.retired
                      ? 'Alderen er nået'
                      : `og ${plural(outlook.until.months, 'måned', 'måneder')} og ${plural(outlook.until.days, 'dag', 'dage')} til du når folkepensionsalderen`}
                  </dt>
                  <dd className="fig text-3xl font-semibold">
                    {outlook.retired ? 'Pensioneret' : `${outlook.until.years} år`}
                  </dd>
                </div>
              </dl>

              <p className="max-w-prose leading-relaxed">
                {outlook.retired ? 'Forventede år tilbage i dag' : 'Forventede pensionsår, hvis du når pensionsalderen'}
                {sexes.map((s, i) => (
                  <span key={s}>
                    {i ? ', ' : ': '}
                    <span className="fig text-lg font-semibold">{fmtYears(outlook.yearsInRetirement[s])} år</span>
                    {' '}for {sexLabel[s]}
                  </span>
                ))}
                . Perioderestlevetid fra Danmarks Statistik ({LIFE_TABLE_META.period}), et gennemsnit for alle på samme alder
                og ikke en prognose for dig.
              </p>

              {!outlook.retired && (
                <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
                  Retten til folkepension begynder den 1. i måneden efter, at du har nået folkepensionsalderen.
                </p>
              )}

              {efterloen !== undefined && (
                <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
                  Efterlønsalderen for din årgang er{' '}
                  {efterloen === null ? 'ikke fastsat endnu' : fmtAge(...splitAge(efterloen))}
                  . Kun alderen er med; vilkår for efterløn indgår ikke.
                </p>
              )}

              <a href="/" className="btn btn-primary">Beregn din forventede levetid</a>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

// The FAQPage JSON-LD (utils/pensionFaq.js) is written into the head by src/pages/pensionsalder.astro.
const PensionsalderPage = ({ form = <PensionForm /> }) => (
    <PageShell
      route="/pensionsalder"
      title="Hvornår kan jeg gå på pension?"
      subtitle="Skriv din fødselsdato og se din folkepensionsalder, datoen du når den, og hvor mange pensionsår du i gennemsnit kan forvente"
    >
      {form}

      <section className="card">
        <SectionHeader level={2} title="Folkepensionsalder efter fødselsår" />
        <div className="card-content space-y-5">
          <p className="prose-page">
            Alderen følger Lov om social pension, senest ændret ved Lov nr. 703 af 20. juni 2025 (70 år fra årgang 1971; de øvrige aldre stammer fra tidligere ændringer), og svarer til oplysningerne på borger.dk.
          </p>
          <table className="w-full max-w-md text-[0.9375rem]">
            <caption className="sr-only">Folkepensionsalder efter fødselsdato</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="py-2 pr-4 font-semibold">Født</th>
                <th scope="col" className="py-2 font-semibold">Pensionsalder</th>
              </tr>
            </thead>
            <tbody>
              {PENSION_AGE_ROWS.map(({ label, from }) => (
                <tr key={label} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">{label}</th>
                  <td className="fig py-2 text-lg font-semibold">{fmtAge(...splitAge(folkepensionAgeOn(...from)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="prose-page text-muted-foreground">
            <p>
              Regulering 2030 betyder, at Folketinget i 2030 igen tager stilling til, om alderen skal op for de
              yngste årgange (født 1975 eller senere). Det sker ikke automatisk. Tallene ovenfor kan derfor ændre sig for dem.
            </p>
            <p>
              Pensionsårene beregnes med den danske dødelighedstabel: vi aflæser den forventede restlevetid ved
              netop din pensionsalder. Tabellen beskriver dødeligheden i {LIFE_TABLE_META.period} og tager ikke højde for, at vi
              lever længere i fremtiden. Er du allerede pensionist, bruger vi din alder i dag. Du kan få et mere
              personligt bud i{' '}
              <a href="/" className="link">levetidsberegneren</a>, som også kan tage højde for din
              livsstil.
            </p>
            <p className="text-sm">
              Forbehold: Siden er vejledende og erstatter ikke Udbetaling Danmark eller rådgivning om din egen
              pension. Din fødselsdato bliver i din browser og sendes ikke videre.
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Ofte stillede spørgsmål" />
        <div className="card-content">
          <div className="divide-y">
            {FAQ.map(([q, a]) => (
              <div key={q} className="py-4 first:pt-0">
                <h3 className="fig text-lg font-semibold">{q}</h3>
                <p className="mt-1 max-w-prose text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
);

export default PensionsalderPage;
