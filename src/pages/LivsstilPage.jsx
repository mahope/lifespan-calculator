import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';

const TOPICS = [
  {
    title: 'Motion og fysisk aktivitet',
    text: 'Regelmæssig motion kan tilføje 3-7 år til dit liv. Bare 150 minutter moderat aktivitet om ugen reducerer risikoen for hjertesygdomme, diabetes og kræft betydeligt.',
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
    text: 'En sund kost kan forlænge livet med 2-8 år. Den mediterrane kost er den mest dokumenterede koststil for langt liv.',
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
    text: '7-9 timers kvalitetssøvn er essentielt for et langt liv. Kronisk søvnmangel øger risikoen for hjertesygdomme, diabetes og tidlig død.',
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
    text: 'Rygning er den enkeltstående livsstilsfaktor, der forkorter livet mest - op til 10 år. At stoppe med at ryge kan tilføje år til dit liv uanset alder.',
    listTitle: 'Rygningens påvirkning:',
    items: [
      '1 pakke om dagen: -7 år i levetid',
      '2 pakker om dagen: -10 år i levetid',
      'Stop før 30 år: fuld levetidsgenopretning',
      'Stop før 50 år: halverer overdødelighed',
    ],
  },
  {
    title: 'Stress og mental sundhed',
    text: 'Kronisk stress øger risikoen for hjertesygdomme, depression og tidlig død. Stressmanagement kan tilføje 2-3 år til dit liv.',
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
    text: 'Moderat alkoholforbrug kan have neutrale eller svagt positive effekter, mens stort forbrug forkorter livet betydeligt.',
    listTitle: 'Anbefalinger:',
    items: [
      'Kvinder: Max 7 genstande per uge',
      'Mænd: Max 14 genstande per uge',
      '2 alkoholfri dage per uge',
      'Undgå drukfester',
    ],
  },
];

const EFFECTS = [
  ['+12-14', 'År ekstra ved optimal livsstil'],
  ['80%', 'Reduktion i hjertesygdomme'],
  ['50%', 'Reduktion i kræftrisiko'],
];

const LivsstilPage = () => (
  <PageShell
    route="/livsstil-og-levetid"
    title="Livsstil og Levetid"
    subtitle="Oplev hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv"
  >
    <section className="card">
      <SectionHeader level={2} title="Livsstilsfaktorer med størst påvirkning" />
      <div className="card-content prose-page">
        <p>
          Forskning viser, at livsstil udgør op til 60% af de faktorer, der bestemmer din levetid. Her er de
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
          Studier viser, at mennesker, der følger alle fem hovedlivsstilsområder (ikke-rygning, sund vægt,
          regelmæssig motion, sund kost og moderat alkoholforbrug), lever 12-14 år længere end dem, der ikke
          følger nogen af dem.
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
          <Link to="/" className="btn btn-primary">Se hvordan din livsstil påvirker din levetid</Link>
        </p>
      </div>
    </section>
  </PageShell>
);

export default LivsstilPage;
