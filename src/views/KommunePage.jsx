import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import DataTable, { Cell } from '../components/DataTable';
import { LEVEALDER_HUB, kommuneFacts, kommuneRoute, fmtYears, rankLabel } from '../lib/pseo.js';

// One page per municipality with published HISBK figures: life expectancy at birth for men and women,
// the municipality's rank, the spread across municipalities and the municipalities next to it in the ranking.
const KommunePage = ({ slug }) => {
  const f = kommuneFacts(slug);
  const route = kommuneRoute(slug);

  return (
    <PageShell
      route={route}
      title={`Forventet levealder i ${f.name}`}
      subtitle={`Hvor gammel mænd og kvinder statistisk bliver i ${f.name} Kommune, ifølge Danmarks Statistik`}
    >
      <AnswerFirst
        text={
          `I ${f.name} er den forventede levealder ved fødslen ${fmtYears(f.male)} år for mænd og ${fmtYears(f.female)} år for kvinder, ` +
          `samlet ${fmtYears(f.total)} år. Kommunen er ${rankLabel(f)} af ${f.count} kommuner med tal (Danmarks Statistik, ${f.period}).`
        }
        linkText="Beregn din egen levetid i levetidsberegneren"
      />

      <section className="card">
        <SectionHeader
          level={2}
          title={`Tal for ${f.name}`}
          description={`Middellevetid ved fødslen, gennemsnit for ${f.period}.`}
        />
        <div className="card-content space-y-6">
          <DataTable caption={`Forventet levealder i ${f.name}`} head={['', 'Forventet levealder']}>
            <tr className="border-b"><Cell first>Mænd</Cell><Cell>{fmtYears(f.male)} år</Cell></tr>
            <tr className="border-b"><Cell first>Kvinder</Cell><Cell>{fmtYears(f.female)} år</Cell></tr>
            <tr className="border-b"><Cell first>Alle</Cell><Cell strong>{fmtYears(f.total)} år</Cell></tr>
          </DataTable>
          <p className="prose-page">
            Kvinder i {f.name} lever {fmtYears(f.sexGap)} år længere end mænd. Blandt de {f.count} kommuner med tal ligger
            den højeste levealder i {f.best.names} ({fmtYears(f.best.total)} år) og den laveste i {f.worst.names} ({fmtYears(f.worst.total)} år).
            Til sammenligning er tallet for hele landet {fmtYears(f.country.total)} år i samme periode ({fmtYears(f.country.male)} for mænd og{' '}
            {fmtYears(f.country.female)} for kvinder).
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Kommuner lige over og under" description="Nærmeste kommuner i rangeringen." />
        <div className="card-content">
          <DataTable caption="Kommuner nær placeringen" head={['Kommune', 'Mænd', 'Kvinder', 'Alle']}>
            {f.nearby.map((k) => (
              <tr key={k.slug} className="border-b">
                <Cell first>
                  {k.slug === slug ? (
                    <strong>{k.name}</strong>
                  ) : (
                    <a href={kommuneRoute(k.slug)} className="link">{k.name}</a>
                  )}
                </Cell>
                <Cell>{fmtYears(k.male)}</Cell>
                <Cell>{fmtYears(k.female)}</Cell>
                <Cell strong={k.slug === slug}>{fmtYears(k.total)}</Cell>
              </tr>
            ))}
          </DataTable>
          <p className="prose-page mt-4">
            Se <a href={LEVEALDER_HUB} className="link">alle kommuner</a> rangeret efter forventet levealder.
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHeader level={2} title="Sådan skal du læse tallet" />
        <div className="card-content prose-page">
          <p>
            Forventet levealder er den middellevetid, en nyfødt ville få, hvis dødeligheden i kommunen forblev som i
            perioden {f.period}. Tallet bygger på fem års data, fordi enkeltår svinger meget i små kommuner. Det beskriver
            kommunen som helhed og siger ikke, hvor gammel du selv bliver.
          </p>
          <p>
            Kilde: Danmarks Statistik, tabel HISBK (middellevetid i kommunerne), opdateret {f.tableUpdated}.
            Er man allerede kommet op i årene, har man flere år tilbage end tallet ved fødslen antyder:{' '}
            <a href="/restlevetid" className="link">se restlevetid efter alder og køn</a>.
          </p>
          <p>
            <a href="/" className="btn btn-primary">Beregn din egen levetid</a>
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default KommunePage;
