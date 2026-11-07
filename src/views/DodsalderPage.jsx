import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import { answerFirst } from '../utils/answerFirst';

const STEPS = [
  ['Demografiske data', 'Vi bruger Danmarks Statistiks dødelighedstavler for dit køn og din alder.'],
  ['Biologiske faktorer', 'Alder og køn er de stærkeste prædiktorer for levetid ifølge demografisk forskning.'],
  ['Livsstilsjusteringer', 'Faktorer som rygning, motion, kost og stress kan justere dit estimat med flere år.'],
];

const SHORTEN = [
  'Rygning (reducerer levetid med 7-10 år)',
  'Overforbrug af alkohol',
  'Fedme og usund kost',
  'Kronisk stress',
  'Mangel på motion',
];

const EXTEND = [
  'Regelmæssig motion (tilføjer 3-7 år)',
  'Mediterran kost',
  'Sociale forbindelser',
  'Tilstrækkelig søvn (7-9 timer)',
  'Stressmanagement',
];

const DodsalderPage = () => (
  <PageShell
    route="/dodsalder-calculator"
    title="Forventet dødsalder"
    subtitle="Beregn din statistiske dødsalder baseret på demografiske data og livsstilsfaktorer"
  >
    <AnswerFirst text={answerFirst.dodsalder()} linkText="Beregn din forventede dødsalder i levetidsberegneren" />

    <section className="card">
      <SectionHeader level={2} title="Hvad er en dødsalder calculator?" />
      <div className="card-content space-y-8">
        <p className="prose-page">
          En dødsalder calculator er et statistisk værktøj, der estimerer den alder, hvor du sandsynligvis vil dø
          baseret på demografiske data, sundhedsstatistikker og livsstilsfaktorer. Det er vigtigt at forstå, at
          dette kun er et gennemsnit og ikke en præcis forudsigelse af dit individuelle livsforløb.
        </p>
        <div>
          <h3 className="fig text-xl font-semibold">Hvordan fungerer beregningen?</h3>
          <dl className="mt-3 divide-y">
            {STEPS.map(([term, text]) => (
              <div key={term} className="grid gap-x-8 gap-y-1 py-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
                <dt className="font-semibold">{term}</dt>
                <dd className="text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Livsstilsfaktorer der påvirker dødsalder" />
      <div className="card-content grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="fig text-lg font-semibold">Faktorer der forkorter livet:</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            {SHORTEN.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="fig text-lg font-semibold">Faktorer der forlænger livet:</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            {EXTEND.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Vigtig påmindelse" />
      <div className="card-content prose-page">
        <p>
          En dødsalder calculator giver kun et statistisk estimat baseret på befolkningsdata. Din faktiske levetid
          påvirkes af mange faktorer, som ikke kan forudsiges, herunder genetik, ulykker, medicinske fremskridt,
          og personlige livsstilsvalg. Brug værktøjet som motivation til at leve sundere, men ikke som en definitiv
          forudsigelse.
        </p>
        <p>
          <a href="/" className="btn btn-primary">Beregn din forventede dødsalder</a>
        </p>
      </div>
    </section>
  </PageShell>
);

export default DodsalderPage;
