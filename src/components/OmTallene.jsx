import React from 'react';
import { dataSource } from '../utils/dataSource';

// "Om tallene" — the one disclaimer text, shown on the result page and in the
// footer. Period and update date come from `dataSource`.
const OmTallene = ({ className = '' }) => (
  <section className={`space-y-3 text-sm leading-relaxed text-muted-foreground ${className}`}>
    <h3 className="text-lg font-semibold text-foreground">Om tallene</h3>
    <p>
      Det her er statistik, ikke en prognose for dig. Beregningen bygger på Danmarks Statistiks dødelighedstavler for{' '}
      {dataSource.period} (tabel {dataSource.table}) og viser, hvor mange år en gennemsnitlig dansker af dit køn og din
      alder har tilbage, hvis dødeligheden forbliver som i {dataSource.period}. Hvis dødeligheden fortsætter med at falde,
      bliver det faktiske tal for nutidens børn og unge højere.
    </p>
    <p>
      I enkel tilstand bruger beregningen kun alder og køn. I avanceret tilstand justeres estimatet med dine livsstilsvalg. Justeringerne er vejledende skøn baseret på store
      befolkningsstudier. De viser sammenhænge, ikke at en enkelt ændring giver et bestemt antal år, og de overlapper
      hinanden. Brug dem til at se retning og størrelsesorden.
    </p>
    <p>
      Værktøjet er ikke medicinsk rådgivning og kan ikke vurdere dit helbred. Tal med din læge, hvis du er bekymret for
      dit helbred eller vil ændre din livsstil markant. Resultatet er til information og refleksion.
    </p>
    <p>
      <strong className="text-foreground">Kilder:</strong> Danmarks Statistik ({dataSource.table}, opdateret{' '}
      {dataSource.updated}), Eurostat og Verdensbanken (landesammenligning), Moore m.fl. 2012 (PLoS Medicine), Fadnes
      m.fl. 2022 (PLoS Medicine), Li m.fl. 2018 (Circulation), Jha m.fl. 2013 (NEJM), Doll m.fl. 2004 (BMJ), Pirie m.fl.
      2013 (Lancet), Wood m.fl. 2018 (Lancet), Prospective Studies Collaboration 2009 (Lancet), Holt-Lunstad m.fl. 2010
      (PLoS Medicine), Kivimäki m.fl. 2012 (Lancet), Cappuccio m.fl. 2010 (Sleep) og Yin m.fl. 2017 (JAHA).
    </p>
    <p>
      <strong className="text-foreground">Dine data:</strong> Dine indtastninger bliver i din browser og sendes ikke til
      en server. Din historik gemmes kun lokalt i din browser. Vi bruger anonym besøgsstatistik uden cookies.
    </p>
  </section>
);

export default OmTallene;
