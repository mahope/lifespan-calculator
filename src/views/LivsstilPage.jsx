import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import { answerFirst } from '../utils/answerFirst';

const TOPICS = [
  {
    title: 'Motion og fysisk aktivitet',
    text: 'I en samlet analyse af seks store kohortestudier levede personer med ca. 150 minutters aktivitet om ugen i gennemsnit ca. 3,4 år længere end inaktive; selv under 75 minutter om ugen var forbundet med ca. 1,8 flere leveår (Moore m.fl., PLoS Medicine 2012). Det er statistiske sammenhænge.',
    listTitle: 'Anbefalinger:',
    items: [
      '150 min. moderat aktivitet per uge',
      'Styrketræning 2 gange om ugen',
      'Daglige gåture på mindst 30 minutter',
      'Undgå stillesiddende perioder over 1 time',
    ],
  },
  {
    title: 'Ernæring og kost',
    text: 'En modelberegning viser, at en varig omlægning til mere bælgfrugter, fuldkorn og nødder og mindre forarbejdet kød kan give omkring 3-10 flere leveår, mest hvis man starter ung (Fadnes m.fl., PLoS Medicine 2022). Det er en modelberegning, ikke et forsøg.',
    listTitle: 'Kostvejledning:',
    items: [
      'Spis 5-7 portioner frugt og grønt dagligt',
      'Vælg fuldkornsprodukter frem for raffinerede',
      'Inkluder fede fisk 2-3 gange om ugen',
      'Begræns rødt kød og forarbejdede fødevarer',
    ],
  },
  {
    title: 'Søvn og hvile',
    text: 'Både meget kort og meget lang søvn er i store oversigtsstudier forbundet med lidt højere dødelighed, og risikoen er lavest ved omkring 7 timer (Yin m.fl. 2017; Cappuccio m.fl. 2010). En del af sammenhængen kan skyldes, at sygdom påvirker søvnen.',
    listTitle: 'Søvnhygiejne:',
    items: [
      'Gå i seng og stå op på samme tid hver dag',
      'Undgå skærme 1 time før sengetid',
      'Hold soveværelset køligt og mørkt',
      'Undgå koffein efter kl. 14',
    ],
  },
  {
    title: 'Rygning og tobak',
    text: 'Rygere mister i gennemsnit mindst 10 leveår sammenlignet med aldrig-rygere (Jha m.fl., NEJM 2013).',
    listTitle: 'Rygningens påvirkning:',
    items: [
      'Også 1-10 cigaretter om dagen næsten fordobler dødeligheden (Pirie m.fl., Lancet 2013).',
      'Hvis man stopper før 40 år, undgår man omkring 90 % af den ekstra dødelighed (Jha 2013).',
      'I en britisk lægeundersøgelse genvandt mænd, der stoppede som 30-årige, ca. 10 leveår og som 50-årige ca. 6 (Doll m.fl., BMJ 2004).',
    ],
  },
  {
    title: 'Stress og mental sundhed',
    text: 'Langvarig stress på arbejdet er forbundet med en let forhøjet risiko for hjertesygdom (ca. 23 % højere i en stor europæisk analyse, Kivimäki m.fl., Lancet 2012), men der findes ikke solid dokumentation for et bestemt antal leveår ved stresshåndtering.',
    listTitle: 'Stresshåndtering:',
    items: [
      'Praktiser mindfulness eller meditation',
      'Dyrk hobbies og interesser',
      'Vedligehold sociale relationer',
      'Søg professionel hjælp ved behov',
    ],
  },
  {
    title: 'Alkohol',
    text: 'Risikoen for tidlig død er lavest ved lavt forbrug og stiger derefter; ved 200-350 g alkohol om ugen (ca. 17-29 genstande) er forventet levetid ved 40 år ca. 1-2 år kortere end ved højst 100 g om ugen (ca. 8 genstande) (Wood m.fl., Lancet 2018).',
    listTitle: 'Anbefalinger:',
    items: [
      'Sundhedsstyrelsen anbefaler højst 10 genstande om ugen og højst 4 på samme dag, for både kvinder og mænd.',
      '2 alkoholfri dage per uge',
      'Undgå drukfester',
    ],
  },
];

const EFFECTS = [
  ['+12,2-14,0', 'Flere leveår ved 50 år: fem mod ingen sunde levevaner'],
  ['82 %', 'Lavere dødelighed af hjerte-kar-sygdom ved fem mod ingen sunde levevaner (Li m.fl. 2018)'],
  ['65 %', 'Lavere kræftdødelighed ved fem mod ingen sunde levevaner (Li m.fl. 2018)'],
];

const LivsstilPage = () => (
  <PageShell
    route="/livsstil-og-levetid"
    title="Livsstil og Levetid"
    subtitle="Oplev hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv"
  >
    <AnswerFirst text={answerFirst.livsstil()} linkText="Læg din livsstil ind i levetidsberegneren" />

    <section className="card">
      <SectionHeader level={2} title="Livsstilsfaktorer med størst påvirkning" />
      <div className="card-content prose-page">
        <p>
          I store amerikanske opfølgningsstudier kunne omkring 60 % af dødsfaldene tilskrives, at man ikke fulgte
          fem sunde levevaner (Li m.fl., Circulation 2018). Tallet gælder en befolkning, ikke dig. Her er de
          vigtigste områder, hvor du kan gøre en forskel:
        </p>
      </div>
    </section>

    {TOPICS.map((t) => (
      <section key={t.title} className="card">
        <SectionHeader title={t.title} />
        <div className="card-content prose-page">
          <p>{t.text}</p>
          <h4>{t.listTitle}</h4>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {t.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </section>
    ))}

    <section className="card">
      <SectionHeader title="Den kumulative effekt af livsstilsændringer" />
      <div className="card-content space-y-6">
        <p className="prose-page">
          I et amerikansk studie af ca. 123.000 sundhedsprofessionelle havde 50-årige, der levede efter alle fem
          sunde levevaner (ikke-rygning, normalvægt, 30 minutters motion dagligt, moderat alkohol, sund kost),
          en forventet restlevetid, der var 12,2 år (mænd) og 14,0 år (kvinder) længere end dem uden nogen af
          dem (Li m.fl., Circulation 2018).
        </p>
        <dl className="grid gap-x-10 sm:grid-cols-3">
          {EFFECTS.map(([value, label]) => (
            <div key={label} className="flex flex-col-reverse justify-end border-t py-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="fig text-4xl font-semibold text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>

    <section className="card">
      <SectionHeader title="Start i dag" />
      <div className="card-content prose-page">
        <p>
          Du behøver ikke at ændre alt på én gang. Start med én livsstilsændring ad gangen og byg gradvist
          sundere vaner op. Selv små forbedringer kan have betydelig påvirkning på din levetid og livskvalitet.
        </p>
        <p>
          <a href="/" className="btn btn-primary">Se hvordan din livsstil påvirker din levetid</a>
        </p>
      </div>
    </section>
  </PageShell>
);

export default LivsstilPage;
