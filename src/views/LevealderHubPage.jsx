import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import DataTable, { Cell } from '../components/DataTable';
import { LEVEALDER_HUB, kommuner, kommuneRoute, kommunePeriod, fmtYears, extremeNames } from '../lib/pseo.js';

const LevealderHubPage = () => {
  const list = [...kommuner()].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'da'));
  const best = extremeNames(list, 'best');
  const worst = extremeNames(list, 'worst');

  return (
    <PageShell
      route={LEVEALDER_HUB}
      title="Forventet levealder pr. kommune"
      subtitle="Hvor gammel mænd og kvinder statistisk bliver i de enkelte kommuner, fra Danmarks Statistik"
    >
      <AnswerFirst
        text={
          `Den forventede levealder er højest i ${best.names} (${fmtYears(best.total)} år) og lavest i ${worst.names} (${fmtYears(worst.total)} år) ` +
          `blandt de ${list.length} kommuner med tal (Danmarks Statistik, ${kommunePeriod()}).`
        }
        linkText="Beregn din egen levetid i levetidsberegneren"
      />

      <section className="card">
        <SectionHeader
          level={2}
          title="Alle kommuner, rangeret"
          description="Middellevetid ved fødslen. Klik på en kommune for siden med dens tal."
        />
        <div className="card-content">
          <DataTable caption="Forventet levealder i kommunerne" head={['Kommune', 'Plads', 'Mænd', 'Kvinder', 'Alle']}>
            {list.map((k) => (
              <tr key={k.slug} className="border-b">
                <Cell first>
                  <a href={kommuneRoute(k.slug)} className="link">{k.name}</a>
                </Cell>
                <Cell>{k.shared ? `delt ${k.rank}` : k.rank}</Cell>
                <Cell>{fmtYears(k.male)}</Cell>
                <Cell>{fmtYears(k.female)}</Cell>
                <Cell strong>{fmtYears(k.total)}</Cell>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Om tallene" />
        <div className="card-content prose-page">
          <p>
            Tallene er middellevetiden ved fødslen i årene {kommunePeriod()}, og de bygger på fem års data, fordi enkeltår
            svinger meget i små kommuner. Kommuner, som Danmarks Statistik ikke offentliggør tal for, er ikke med i tabellen. Tallene
            siger noget om kommunen som helhed og ikke om, hvor gammel du selv bliver.
          </p>
          <p>
            Kilde: Danmarks Statistik, tabel HISBK. Vil du se, hvor mange år en person på en bestemt alder har tilbage,
            finder du det under <a href="/restlevetid" className="link">restlevetid efter alder og køn</a>, og tal for
            hele landet står på <a href="/levetid-beregner-danmark" className="link">levealder i Danmark</a>.
          </p>
          <p>
            <a href="/" className="btn btn-primary">Beregn din levetid</a>
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default LevealderHubPage;
