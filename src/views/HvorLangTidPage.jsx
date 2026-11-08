import React from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import AnswerFirst from '../components/AnswerFirst';
import { answerFirst } from '../utils/answerFirst';

const REASONS = [
  ['Målsætning og prioritering', 'At kende din forventede resterende levetid kan hjælpe dig med at prioritere mål og drømme i dit liv.'],
  ['Finansiel planlægning', 'Pensionsopsparing og økonomiske beslutninger kan træffes mere informeret.'],
  ['Sundhedsmotivation', 'Indsigt i hvordan livsstil påvirker levetid kan motivere til sundere valg.'],
  ['Tidsperspektiv', 'At forstå livets begrænsninger kan føre til mere bevidste valg om hvordan vi bruger vores tid.'],
];

const HvorLangTidPage = () => (
  <PageShell
    route="/hvor-lang-tid-har-jeg-tilbage"
    title="Hvor mange år har jeg tilbage?"
    subtitle="Få et statistisk estimat af din resterende levetid baseret på videnskabelige data"
  >
    <AnswerFirst text={answerFirst.hvorLangTid()} linkText="Se din egen restlevetid i levetidsberegneren" />

    <section className="card">
      <SectionHeader level={2} title={'Hvad betyder "resterende levetid"?'} />
      <div className="card-content prose-page">
        <p>
          Din resterende levetid er et statistisk estimat baseret på demografiske data, som viser hvor mange år
          du gennemsnitligt kan forvente at leve fra dit nuværende tidspunkt. Dette tal bygger på Danmarks Statistiks
          dødelighedstavler og er justeret for din alder og dit køn.
        </p>
        <h3>Faktorer der påvirker din resterende levetid:</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Alder:</strong> Jo ældre du er, jo færre år har du statistisk tilbage</li>
          <li><strong>Køn:</strong> Kvinder lever generelt længere end mænd i de fleste lande</li>
          <li><strong>Livsstil:</strong> Motion, kost, rygning og andre faktorer påvirker betydeligt</li>
        </ul>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Hvorfor beregne resterende levetid?" />
      <div className="card-content">
        <dl className="divide-y">
          {REASONS.map(([term, text]) => (
            <div key={term} className="grid gap-x-8 gap-y-1 py-4 first:pt-0 sm:grid-cols-[13rem_minmax(0,1fr)]">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>

    <section className="card">
      <SectionHeader level={2} title="Prøv med din fødselsdato" />
      <div className="card-content prose-page">
        <p>
          For den mest præcise beregning kan du indtaste din fødselsdato i stedet for bare din alder.
          Dette giver dig ekstra fun facts som antallet af fuldmåner du har oplevet og præcis hvor mange sekunder du har levet.
        </p>
        <p>
          <a href="/" className="btn btn-primary">Beregn din restlevetid i levetidsberegneren</a>
        </p>
      </div>
    </section>
  </PageShell>
);

export default HvorLangTidPage;
