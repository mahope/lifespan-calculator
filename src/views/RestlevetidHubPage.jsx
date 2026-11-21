import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import DataTable, { Cell } from '../components/DataTable';
import { RESTLEVETID_AGES, RESTLEVETID_HUB, MIN_AGE, MAX_AGE, restlevetidFacts, restlevetidRoute, fmtYears } from '../lib/pseo.js';

const RestlevetidHubPage = () => {
  const a45 = restlevetidFacts(45, 'mand');
  const k45 = restlevetidFacts(45, 'kvinde');
  const a70 = restlevetidFacts(70, 'mand');
  const k70 = restlevetidFacts(70, 'kvinde');

  return (
    <PageShell
      route={RESTLEVETID_HUB}
      title="Restlevetid efter alder og køn"
      subtitle={`Forventet restlevetid for hver alder fra ${MIN_AGE} til ${MAX_AGE} år, for mænd og kvinder, fra Danmarks Statistik`}
    >
      <AnswerFirst
        text={
          `En 45-årig mand har statistisk ${fmtYears(a45.e)} år tilbage og en 45-årig kvinde ${fmtYears(k45.e)} år. ` +
          `For en 70-årig er tallene ${fmtYears(a70.e)} år for mænd og ${fmtYears(k70.e)} år for kvinder (Danmarks Statistik, ${a45.period}).`
        }
        linkText="Beregn din egen restlevetid i levetidsberegneren"
      />

      <section className="card">
        <SectionHeader
          level={2}
          title="Tabel over restlevetid"
          description="Klik på et tal for at se hele siden for alderen og kønnet."
        />
        <div className="card-content">
          <DataTable
            caption="Forventet restlevetid og forventet alder efter alder og køn"
            head={['Alder', 'Mænd: restlevetid', 'Kvinder: restlevetid', 'Mænd: alder', 'Kvinder: alder']}
          >
            {RESTLEVETID_AGES.map((age) => {
              const m = restlevetidFacts(age, 'mand');
              const k = restlevetidFacts(age, 'kvinde');
              return (
                <tr key={age} className="border-b">
                  <Cell first>{age} år</Cell>
                  <Cell>
                    <a href={restlevetidRoute(age, 'mand')} className="link">{fmtYears(m.e)} år</a>
                  </Cell>
                  <Cell>
                    <a href={restlevetidRoute(age, 'kvinde')} className="link">{fmtYears(k.e)} år</a>
                  </Cell>
                  <Cell>{fmtYears(m.expectedAge)} år</Cell>
                  <Cell>{fmtYears(k.expectedAge)} år</Cell>
                </tr>
              );
            })}
          </DataTable>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Sådan læser du tabellen" />
        <div className="card-content prose-page">
          <p>
            Restlevetiden er det gennemsnitlige antal år, en person på alderen har tilbage, hvis dødeligheden forbliver som
            i {a45.period}. Forventet alder er alderen plus restlevetiden. Tallene er statistik for alle danskere af samme
            køn og alder, ikke en forudsigelse for den enkelte.
          </p>
          <p>
            Kilde: Danmarks Statistik, tabel HISB8 (dødelighedstavle for 2-års perioden {a45.period}), opdateret {a45.tableUpdated} og hentet {a45.retrieved}.
          </p>
          <p>
            Vil du have et estimat ud fra din præcise alder, dit køn og din livsstil, så brug{' '}
            <a href="/hvor-lang-tid-har-jeg-tilbage" className="link">beregneren for tid tilbage</a>, eller se{' '}
            <a href="/forventet-levealder" className="link">forventet levealder i din kommune</a>.
          </p>
          <p>
            <a href="/" className="btn btn-primary">Beregn din levetid</a>
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default RestlevetidHubPage;
