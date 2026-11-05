import React from 'react';
import { Link } from 'react-router-dom';
import { LIFE_TABLE_META } from '../data/lifeTableDK.generated';

const PAGES = [
  { to: '/', label: 'Levetidsberegneren' },
  { to: '/hvor-lang-tid-har-jeg-tilbage', label: 'Hvor lang tid har jeg tilbage at leve?' },
  { to: '/dodsalder-calculator', label: 'Dødsalder Calculator' },
  { to: '/levetid-beregner-danmark', label: 'Dansk levetidsberegner' },
  { to: '/livsstil-og-levetid', label: 'Livsstil og levetid' },
  { to: '/pensionsalder', label: 'Pensionsalder' },
];

const Footer = () => {
  return (
    <footer className="mt-8 bg-muted/60">
      <div className="container py-12">
        <div className="footer-grid text-[0.9375rem] leading-relaxed text-muted-foreground">
          <div className="space-y-3">
            <h3 className="fig text-lg text-foreground">Om Levetidsberegneren</h3>
            <p>
              Levetidsberegneren giver et statistisk indblik i din forventede resterende levetid. Den bruger Danmarks
              Statistiks dødelighedstavler og dit køn og din alder. Sammenligningen med andre lande bruger tal fra
              Eurostat og Verdensbanken.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="fig text-lg text-foreground">Hvordan fungerer det?</h3>
            <p>
              Dine oplysninger holdes i din browser og krydses med danske dødelighedstavler for at beregne dit estimat.
              Resultatet inkluderer en live nedtælling og mulighed for at dele dine resultater.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="fig text-lg text-foreground">Datakilder og nøjagtighed</h3>
            <p>
              Tallene stammer fra Danmarks Statistiks dødelighedstavler (tabel HISB8, periode {LIFE_TABLE_META.tid}). Det
              er gennemsnitstal, og de forudsiger ikke individuelle livsforløb.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="fig text-lg text-foreground">Privatlivspolitik</h3>
            <p>
              Al behandling sker lokalt i din browser, og dine indtastninger gemmes ikke på nogen server. Vi tæller kun
              anonymt, at beregneren bruges, uden alder, køn eller andre oplysninger. Læs{' '}
              <a href="/privatlivspolitik" className="link">privatlivspolitikken</a> og{' '}
              <a href="/cookiepolitik" className="link">cookiepolitikken</a>.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="fig text-lg text-foreground">Sammenligning med andre lande</h3>
            <p>
              Dit estimat bygger kun på danske dødelighedstavler. Til sammenligning viser siden tal for Sverige, Norge og
              Finland (Eurostat) samt Japan og verden (Verdensbanken). Der slås ikke noget land eller nogen placering op.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="fig mb-2 text-lg text-foreground">Sider</h3>
            <ul>
              {PAGES.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="link inline-flex min-h-11 items-center sm:min-h-8">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 max-w-3xl space-y-2 border-t pt-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Data fra Danmarks Statistik (dødelighedstavler {LIFE_TABLE_META.tid}).
          </p>
          <p>
            Tjenesten er kun til information og refleksion. Søg professionel medicinsk rådgivning ved
            sundhedsrelaterede spørgsmål.
          </p>
          <p>
            Udviklet af{' '}
            <a href="https://mahope.dk" target="_blank" rel="noopener noreferrer" className="link">
              Mads Holst Jensen, Mahope.dk
            </a>
            . Specialiseret i WordPress webudvikling, design og SEO.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
