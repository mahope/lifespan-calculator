import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import DataTable, { Cell } from '../components/DataTable';
import {
  MIN_AGE,
  MAX_AGE,
  RESTLEVETID_HUB,
  SEXES,
  restlevetidFacts,
  restlevetidRoute,
  fmtYears,
  fmtPct,
} from '../lib/pseo.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// One page per age (20-90) and sex: the answer first, then the same age for the other sex, the odds of
// reaching later ages (from l_x) and the neighbouring ages. Every number is read from the DST dataset.
const RestlevetidPage = ({ age, sex }) => {
  const f = restlevetidFacts(age, sex);
  const { noun, plural, other } = SEXES[sex];
  const male = restlevetidFacts(age, 'mand');
  const female = restlevetidFacts(age, 'kvinde');
  const longer = f.diffOther >= 0 ? other : sex;
  const gap = Math.abs(f.diffOther);
  const neighbours = [];
  for (let a = Math.max(MIN_AGE, age - 5); a <= Math.min(MAX_AGE, age + 5); a += 1) neighbours.push(a);

  return (
    <PageShell
      route={restlevetidRoute(age, sex)}
      title={`Restlevetid for en ${age}-årig ${noun}`}
      subtitle={`Hvor mange år en ${age}-årig ${noun} statistisk har tilbage, og hvor gammel vedkommende bliver, ifølge Danmarks Statistik`}
    >
      <AnswerFirst
        text={
          `En ${age}-årig ${noun} har statistisk ${fmtYears(f.e)} år tilbage og bliver i gennemsnit ${fmtYears(f.expectedAge)} år ` +
          `(Danmarks Statistik, ${f.period}). ${cap(SEXES[other].plural)} på ${age} har ${fmtYears(f.eOther)} år tilbage.`
        }
        linkText="Beregn din egen restlevetid i levetidsberegneren"
      />

      <section className="card">
        <SectionHeader
          level={2}
          title={`Restlevetid og forventet alder som ${age}-årig`}
          description={`Mænd og kvinder på ${age} år, side om side.`}
        />
        <div className="card-content space-y-6">
          <DataTable caption={`Restlevetid og forventet alder for ${age}-årige`} head={['', 'Restlevetid', 'Forventet alder']}>
            <tr className="border-b">
              <Cell first>{sex === 'mand' ? <strong>Mænd</strong> : 'Mænd'}</Cell>
              <Cell strong={sex === 'mand'}>{fmtYears(male.e)} år</Cell>
              <Cell strong={sex === 'mand'}>{fmtYears(male.expectedAge)} år</Cell>
            </tr>
            <tr className="border-b">
              <Cell first>{sex === 'kvinde' ? <strong>Kvinder</strong> : 'Kvinder'}</Cell>
              <Cell strong={sex === 'kvinde'}>{fmtYears(female.e)} år</Cell>
              <Cell strong={sex === 'kvinde'}>{fmtYears(female.expectedAge)} år</Cell>
            </tr>
            <tr className="border-b">
              <Cell first>Gennemsnit af mænd og kvinder (beregnet)</Cell>
              <Cell>{fmtYears(f.eAverage)} år</Cell>
              <Cell>{fmtYears(age + f.eAverage)} år</Cell>
            </tr>
          </DataTable>
          <p className="prose-page">
            {longer === 'kvinde' ? 'Kvinder' : 'Mænd'} på {age} år har {fmtYears(gap)} år mere tilbage end{' '}
            {longer === 'kvinde' ? 'mænd' : 'kvinder'} på samme alder. Gennemsnittet er det simple gennemsnit af de to køn
            og ikke vægtet efter, hvor mange mænd og kvinder der er i befolkningen.
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHeader
          level={2}
          title={`Chancen for at nå en højere alder som ${age}-årig ${noun}`}
          description="Andelen af jævnaldrende, der statistisk er i live på alderen."
        />
        <div className="card-content">
          <DataTable caption={`Sandsynlighed for at nå en bestemt alder for en ${age}-årig ${noun}`} head={['Alder', 'Chance']}>
            {f.survival.map((s) => (
              <tr key={s.toAge} className="border-b">
                <Cell first>{s.toAge} år</Cell>
                <Cell>{fmtPct(s.probability)}</Cell>
              </tr>
            ))}
          </DataTable>
          <p className="prose-page mt-4">
            Tallene er beregnet ud fra antallet af overlevende i Danmarks Statistiks tavle (HISB8, {f.period}).
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Restlevetid for nærliggende aldre" />
        <div className="card-content">
          <DataTable caption="Restlevetid for nærliggende aldre" head={['Alder', 'Mænd', 'Kvinder']}>
            {neighbours.map((a) => (
              <tr key={a} className="border-b">
                <Cell first>{a} år</Cell>
                {Object.keys(SEXES).map((s) => (
                  <Cell key={s} strong={a === age && s === sex}>
                    {a === age && s === sex ? (
                      `${fmtYears(restlevetidFacts(a, s).e)} år`
                    ) : (
                      <a href={restlevetidRoute(a, s)} className="link">
                        {fmtYears(restlevetidFacts(a, s).e)} år
                      </a>
                    )}
                  </Cell>
                ))}
              </tr>
            ))}
          </DataTable>
          <p className="prose-page mt-4">
            Se alle aldre fra {MIN_AGE} til {MAX_AGE} år i <a href={RESTLEVETID_HUB} className="link">tabellen over restlevetid</a>.
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Sådan skal du læse tallet" />
        <div className="card-content prose-page">
          <p>
            Restlevetiden er det gennemsnitlige antal år, en {age}-årig {noun} har tilbage, hvis dødeligheden forbliver som i{' '}
            {f.period}. Den er en statistik for alle danske {plural} på alderen, ikke en forudsigelse for den enkelte, og den
            tager ikke højde for helbred eller livsstil. Fordi dødeligheden historisk er faldet, ender nutidens {age}-årige i
            gennemsnit ofte med at leve lidt længere, end tallet viser.
          </p>
          <p>
            Kilde: Danmarks Statistik, tabel HISB8 (dødelighedstavle for 2-års perioden {f.period}), opdateret {f.tableUpdated} og hentet {f.retrieved}.
            Forventet alder er alder plus restlevetid.
          </p>
          <p>
            <a href="/" className="btn btn-primary">Beregn din egen restlevetid ud fra alder, køn og livsstil</a>
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default RestlevetidPage;
