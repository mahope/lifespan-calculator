import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container py-12">
        <div className="footer-grid">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Om Levetidsberegneren</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vores gratis levetidsberegner hjælper dig med at få et statistisk indblik i din forventede resterende levetid.
              Værktøjet anvender data fra Verdenssundhedsorganisationen (WHO) og nationale statistikker fra over 12 lande for at
              give dig et estimat baseret på din alder, køn og geografiske placering.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Hvordan fungerer det?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Levetidsberegneren bruger automatisk IP-lokation til at bestemme dit land uden at bede om tilladelse til GPS.
              Derefter krydses dine personlige data med officielle levetidsstatistikker for at beregne dit personlige estimat.
              Resultatet inkluderer en live nedtælling og mulighed for at dele dine resultater.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Datakilder og nøjagtighed</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Alle data stammer fra troværdige kilder som WHO, nationale sundhedsmyndigheder og demografiske institutter.
              Statistikkerne opdateres årligt og afspejler de seneste tilgængelige data. Dog skal det understreges, at dette kun
              er gennemsnitstal og ikke forudsiger individuelle livsforløb.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Privatlivspolitik</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi respekterer dit privatliv. Ingen personlige data gemmes eller deles. Al behandling sker lokalt i din browser,
              og vi bruger kun din IP-adresse til at bestemme dit land - ikke til tracking eller analyse. Der anvendes ingen
              cookies eller tredjepartsscripts.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Understøttede lande</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Værktøjet indeholder specifik data for Danmark, Sverige, Norge, Tyskland, Storbritannien, USA, Frankrig,
              Holland, Finland, Island, Schweiz og Japan. For andre lande anvendes verdensgennemsnittet baseret på WHO's
              globale statistikker.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Se også:</strong>{' '}
              <Link to="/levetid-beregner-danmark" className="text-primary hover:underline">
                Specialiseret dansk levetidsberegner
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Relaterede sider</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/hvor-lang-tid-har-jeg-tilbage" className="text-primary hover:underline text-sm">
                  📅 Hvor lang tid har jeg tilbage at leve?
                </Link>
              </li>
              <li>
                <Link to="/dodsalder-calculator" className="text-primary hover:underline text-sm">
                  ⚰️ Dødsalder Calculator
                </Link>
              </li>
              <li>
                <Link to="/livsstil-og-levetid" className="text-primary hover:underline text-sm">
                  💪 Livsstil og Levetid
                </Link>
              </li>
              <li>
                <Link to="/levetid-beregner-danmark" className="text-primary hover:underline text-sm">
                  🇩🇰 Dansk Levetidsberegner
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 text-center space-y-4">
          <p className="text-sm font-medium text-foreground">
            Data baseret på WHO og nationale statistikker. Opdateret 2024.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Denne tjeneste er kun til informative og underholdende formål. Søg professionel medicinsk rådgivning for
            sundhedsrelaterede spørgsmål.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              🌐 Udviklet af{' '}
              <a
                href="https://mahope.dk"
                target="_blank"
                rel="noopener"
                className="text-primary hover:underline"
              >
                Mads Holst Jensen - Mahope.dk
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              Specialiseret i WordPress webudvikling, design og SEO-optimering
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;