import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import { answerFirst } from '../utils/answerFirst';
import { LIFE_TABLE_META } from '../utils/lifeTableDK';
import { lifeExpectancyData as le } from '../utils/lifeExpectancyData';

const fmtLE = (n) => n.toFixed(1);

const CHALLENGES = [
  ['Rygning:', 'Danmark har stadig en højere rygefrekvens end mange andre vestlige lande'],
  ['Alkohol:', 'Højt alkoholforbrug påvirker levetiden negativt'],
  ['Stillesiddende livsstil:', 'Mange danskere får ikke nok motion'],
  ['Stress:', 'Arbejdsrelateret stress påvirker mange danskeres sundhed'],
];

const STRENGTHS = [
  ['Gratis sundhedssystem:', 'Universel adgang til behandling'],
  ['Forebyggelse:', 'Stærk fokus på forebyggende sundhed'],
  ['Cykelkultur:', 'Høj grad af fysisk aktivitet i hverdagen'],
  ['Arbejds-liv balance:', 'Gode arbejdsvilkår og ferie'],
];

const REGIONAL = [
  ['Hovedstadsområdet', 'Højeste levetid i Danmark', '+2-3 år'],
  ['Uddannelse', 'Længere uddannelse = længere liv', '+7 år'],
  ['Indkomst', 'Højere indkomst = bedre sundhed', '+5 år'],
];

const Rows = ({ rows }) => (
  <dl>
    {rows.map(([label, value]) => (
      <div key={label} className="flex items-baseline justify-between gap-4 border-b py-2.5">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="fig shrink-0 text-xl font-semibold">{value}</dd>
      </div>
    ))}
  </dl>
);

const DanmarkPage = () => (
  <PageShell
    route="/levetid-beregner-danmark"
    title="Levealder i Danmark"
    subtitle="Gennemsnitlig levealder og middellevetid for danske mænd og kvinder fra Danmarks Statistik"
  >
    <AnswerFirst text={answerFirst.danmark()} linkText="Beregn din egen levetid i levetidsberegneren" />

    <section className="card">
      <SectionHeader level={2} title="Levetid i Danmark" />
      <div className="card-content space-y-8">
        <p className="prose-page">
          Tallene her er den danske middellevetid fra Danmarks Statistiks dødelighedstavler
          (tabel HISB8, {LIFE_TABLE_META.period}). Det er de samme tavler, som levetidsberegneren bruger.
          Sammenligningen med Sverige, Norge og Finland kommer fra Eurostat, og tallene for Japan og verden
          kommer fra Verdensbanken.
        </p>
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          <div>
            <h3 className="fig mb-2 text-lg font-semibold">Danske tal ved fødslen ({le.Denmark.year})</h3>
            <Rows
              rows={[
                ['Kvinder:', `${fmtLE(le.Denmark.female)} år`],
                ['Mænd:', `${fmtLE(le.Denmark.male)} år`],
                ['Gennemsnit af mænd og kvinder (beregnet):', `${fmtLE((le.Denmark.male + le.Denmark.female) / 2)} år`],
              ]}
            />
          </div>
          <div>
            <h3 className="fig mb-2 text-lg font-semibold">Sammenligning med nabolande</h3>
            <Rows
              rows={[
                [`Sverige (${le.Sweden.year}):`, `${fmtLE(le.Sweden.total)} år`],
                [`Norge (${le.Norway.year}):`, `${fmtLE(le.Norway.total)} år`],
                [`Finland (${le.Finland.year}):`, `${fmtLE(le.Finland.total)} år`],
              ]}
            />
          </div>
        </div>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Danske sundhedstrends" />
      <div className="card-content space-y-8">
        <p className="prose-page">
          Danmarks levetid har været stigende gennem de sidste årtier, men hastigheden er aftaget i de seneste
          år. Her er de vigtigste faktorer, der påvirker danske borgeres levetid:
        </p>
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
          <div>
            <h3 className="fig text-lg font-semibold">Udfordringer i Danmark</h3>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-muted-foreground">
              {CHALLENGES.map(([k, v]) => (
                <li key={k}><strong className="text-foreground">{k}</strong> {v}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="fig text-lg font-semibold">Danske styrker</h3>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-muted-foreground">
              {STRENGTHS.map(([k, v]) => (
                <li key={k}><strong className="text-foreground">{k}</strong> {v}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Regionale forskelle i Danmark" />
      <div className="card-content space-y-6">
        <p className="prose-page">
          Der er betydelige forskelle på levetiden mellem forskellige regioner og socioøkonomiske grupper i Danmark:
        </p>
        <dl className="grid gap-x-10 sm:grid-cols-3">
          {REGIONAL.map(([title, text, value]) => (
            <div key={title} className="border-t py-4">
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-1 text-muted-foreground">{text}</dd>
              <dd className="fig mt-2 text-3xl font-semibold text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Fra gennemsnit til dit eget tal" />
      <div className="card-content prose-page">
        <p>
          Gennemsnittet for alle danskere siger ikke, hvor gammel du selv bliver. Levetidsberegneren
          bruger de samme danske tavler, men ud fra din egen alder og dit køn.
        </p>
        <p>
          <a href="/" className="btn btn-primary">Beregn din levetid ud fra danske tal</a>
        </p>
      </div>
    </section>
  </PageShell>
);

export default DanmarkPage;
