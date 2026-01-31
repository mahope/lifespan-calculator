import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import PromoBanner from '../components/PromoBanner';
import { Link } from 'react-router-dom';

const HvorLangTidPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Hvor lang tid har jeg tilbage at leve? - Dansk Levetidsberegner"
        description="Få svar på hvor lang tid du har tilbage at leve baseret på statistiske data. Vores levetidsberegner giver dig et realistisk estimat af din resterende levetid."
        keywords="hvor lang tid har jeg tilbage, resterende levetid, levetid beregning, dødsalder, livslængde, levetidsberegner"
        ogTitle="Hvor lang tid har jeg tilbage at leve?"
        ogDescription="Beregn din statistiske resterende levetid med vores præcise levetidsberegner baseret på danske data"
        canonicalUrl="/hvor-lang-tid-har-jeg-tilbage"
      />

      <header className="header-gradient px-4 py-8 sm:py-12 text-center sm:px-6 lg:px-8 shadow-lg">
        <div className="container animate-fadeIn">
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            📅 Hvor lang tid har jeg tilbage?
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-white/90">
            Få et statistisk estimat af din resterende levetid baseret på videnskabelige data
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="card animate-slideUp">
              <div className="card-content space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Hvad betyder "resterende levetid"?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Din resterende levetid er et statistisk estimat baseret på demografiske data, som viser hvor mange år
                  du gennemsnitligt kan forvente at leve fra dit nuværende tidspunkt. Dette tal bygger på nationale og
                  internationale sundhedsstatistikker og er justeret for din alder, køn og geografiske placering.
                </p>

                <h3 className="text-lg sm:text-xl font-semibold">Faktorer der påvirker din resterende levetid:</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Alder:</strong> Jo ældre du er, jo færre år har du statistisk tilbage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Køn:</strong> Kvinder lever generelt længere end mænd i de fleste lande</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Geografisk placering:</strong> Forskellige lande har forskellige levetidsforventninger</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Livsstil:</strong> Motion, kost, rygning og andre faktorer påvirker betydeligt</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold">Hvorfor beregne resterende levetid?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      <span>🎯</span> Målsætning og prioritering
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      At kende din forventede resterende levetid kan hjælpe dig med at prioritere mål og drømme i dit liv.
                    </p>
                  </div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      <span>💰</span> Finansiel planlægning
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Pensionsopsparing og økonomiske beslutninger kan træffes mere informeret.
                    </p>
                  </div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      <span>🏃‍♂️</span> Sundhedsmotivation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Indsigt i hvordan livsstil påvirker levetid kan motivere til sundere valg.
                    </p>
                  </div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      <span>⏰</span> Tidsperspektiv
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      At forstå livets begrænsninger kan føre til mere bevidste valg om hvordan vi bruger vores tid.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary/20 bg-primary/5">
              <div className="card-content space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold">🎂 Prøv med din fødselsdato</h3>
                <p className="text-muted-foreground">
                  For den mest præcise beregning kan du indtaste din fødselsdato i stedet for bare din alder. 
                  Dette giver dig ekstra fun facts som antallet af fuldmåner du har oplevet og præcis hvor mange sekunder du har levet!
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link to="/" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3">
                🧮 Beregn din resterende levetid nu
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PromoBanner />
      <Footer />
      <ThemeToggle />
    </div>
  );
};

export default HvorLangTidPage;
