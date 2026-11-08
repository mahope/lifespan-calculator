import React from 'react';
import OmTallene from './OmTallene';

const PAGES = [
  { to: '/', label: 'Levetidsberegneren' },
  { to: '/hvor-lang-tid-har-jeg-tilbage', label: 'Hvor mange år har jeg tilbage?' },
  { to: '/dodsalder-calculator', label: 'Forventet dødsalder' },
  { to: '/livsstil-og-levetid', label: 'Livsstil og levetid' },
  { to: '/pensionsalder', label: 'Hvornår kan jeg gå på pension?' },
  { to: '/levetid-beregner-danmark', label: 'Levealder i Danmark' },
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

          <OmTallene className="md:col-span-2 lg:col-span-3" />

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
                  <a href={p.to} className="link inline-flex min-h-11 items-center sm:min-h-8">
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 max-w-3xl space-y-2 border-t pt-6 text-sm text-muted-foreground">
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
