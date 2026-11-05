import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Briefcase, Calculator } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import PromoBanner from '../components/PromoBanner';
import { PENSION_AGE_ROWS, efterloenAgeOn, folkepensionAgeOn, pensionOutlook } from '../utils/pension';
import { FAQ, faqJsonLd } from '../utils/pensionFaq';
import { parseLocalDate, toLocalISODate } from '../utils/lifespanMath';

// Before 1939-07-01 the pension age was 67, which the age schedule in utils/pension.js does not cover.
const MIN_BIRTH = '1939-07-01';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtDate = (d) => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtYears = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtAge = (years, months) => (months ? `${years}½ år` : `${years} år`);
const splitAge = (age) => [Math.floor(age), age % 1 ? 6 : 0];

const PensionsalderPage = () => {
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [touched, setTouched] = useState(false);
  const today = toLocalISODate(new Date());

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
    <div className="flex min-h-screen flex-col">
      <SEOHead route="/pensionsalder" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <PageHeader
        icon={Briefcase}
        title="Hvornår kan jeg gå på pension?"
        subtitle="Skriv din fødselsdato og se din folkepensionsalder, datoen du når den, og hvor mange pensionsår du i gennemsnit kan forvente"
      />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
            <div className="card">
              <div className="card-content space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="pension-birthdate" className="label">Fødselsdato</label>
                    <input
                      id="pension-birthdate"
                      type="date"
                      className="input"
                      value={birthdate}
                      min={MIN_BIRTH}
                      max={today}
                      onChange={(e) => {
                        setBirthdate(e.target.value);
                        setTouched(false);
                      }}
                      onBlur={() => setTouched(true)}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'pension-birthdate-error' : undefined}
                    />
                    {error && (
                      <p id="pension-birthdate-error" role="alert" className="text-sm text-destructive">
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
                    <p className="text-xs text-muted-foreground">
                      Bruges kun til overslaget over pensionsår. Intet gemmes eller sendes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div aria-live="polite">
              {outlook && (
              <div className="card">
                <div className="card-content space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="text-2xl font-semibold">{fmtAge(outlook.years, outlook.months)}</div>
                      <div className="text-xs text-muted-foreground">Folkepensionsalder</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="text-2xl font-semibold text-primary">{fmtDate(outlook.date)}</div>
                      <div className="text-xs text-muted-foreground">
                        {outlook.retired ? 'Dato du nåede den' : 'Dato du når den'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="text-2xl font-semibold">
                        {outlook.retired
                          ? 'Pensioneret'
                          : `${outlook.until.years} år`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {outlook.retired
                          ? 'Alderen er nået'
                          : `og ${plural(outlook.until.months, 'måned', 'måneder')} og ${plural(outlook.until.days, 'dag', 'dage')} til du når folkepensionsalderen`}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed">
                    {outlook.retired ? 'Forventede år tilbage i dag' : 'Forventede pensionsår, hvis du når pensionsalderen'}
                    {sexes.map((s, i) => (
                      <span key={s}>
                        {i ? ', ' : ': '}
                        <span className="font-semibold">{fmtYears(outlook.yearsInRetirement[s])} år</span>
                        {' '}for {sexLabel[s]}
                      </span>
                    ))}
                    . Perioderestlevetid fra Danmarks Statistik (2024-2025), et gennemsnit for alle på samme alder
                    og ikke en prognose for dig.
                  </p>

                  {!outlook.retired && (
                    <p className="text-sm text-muted-foreground">
                      Retten til folkepension begynder den 1. i måneden efter, at du har nået folkepensionsalderen.
                    </p>
                  )}

                  {efterloen !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Efterlønsalderen for din årgang er{' '}
                      {efterloen === null ? 'ikke fastsat endnu' : fmtAge(...splitAge(efterloen))}
                      . Kun alderen er med; vilkår for efterløn indgår ikke.
                    </p>
                  )}

                  <Link to="/" className="btn btn-primary gap-2">
                    <Calculator className="h-5 w-5" aria-hidden="true" /> Beregn din forventede levetid
                  </Link>
                </div>
              </div>
              )}
            </div>

            <div className="card">
              <div className="card-content space-y-4">
                <h2 className="text-xl font-bold sm:text-2xl">Folkepensionsalder efter fødselsår</h2>
                <p className="leading-relaxed text-muted-foreground">
                  Alderen følger Lov om social pension, senest ændret ved Lov nr. 703 af 20. juni 2025 (70 år fra årgang 1971; de øvrige aldre stammer fra tidligere ændringer), og svarer til oplysningerne på borger.dk.
                </p>
                <table className="w-full text-sm">
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
                        <td className="py-2">{fmtAge(...splitAge(folkepensionAgeOn(...from)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="leading-relaxed text-muted-foreground">
                  Regulering 2030 betyder, at Folketinget i 2030 igen tager stilling til, om alderen skal op for de
                  yngste årgange (født 1975 eller senere). Det sker ikke automatisk. Tallene ovenfor kan derfor ændre sig for dem.
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  Pensionsårene beregnes med den danske dødelighedstabel: vi aflæser den forventede restlevetid ved
                  netop din pensionsalder. Tabellen beskriver dødeligheden i 2024-2025 og tager ikke højde for, at vi
                  lever længere i fremtiden. Er du allerede pensionist, bruger vi din alder i dag. Du kan få et mere
                  personligt bud i{' '}
                  <Link to="/" className="underline">levetidsberegneren</Link>, som også kan tage højde for din
                  livsstil.
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Forbehold: Siden er vejledende og erstatter ikke Udbetaling Danmark eller rådgivning om din egen
                  pension. Din fødselsdato bliver i din browser og sendes ikke videre.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-4">
                <h2 className="text-xl font-bold sm:text-2xl">Ofte stillede spørgsmål</h2>
                {FAQ.map(([q, a]) => (
                  <div key={q}>
                    <h3 className="font-semibold">{q}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PromoBanner />
      <Footer />
      <ThemeToggle />
    </div>
  );
};

export default PensionsalderPage;
