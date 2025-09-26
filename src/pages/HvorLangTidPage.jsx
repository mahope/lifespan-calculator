import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const HvorLangTidPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Hvor lang tid har jeg tilbage at leve? - Dansk Levetidsberegner"
        description="Få svar på hvor lang tid du har tilbage at leve baseret på statistiske data. Vores levetidsberegner giver dig et realistisk estimat af din resterende levetid."
        keywords="hvor lang tid har jeg tilbage, resterende levetid, levetid beregning, dødsalder, livslængde"
        ogTitle="Hvor lang tid har jeg tilbage at leve?"
        ogDescription="Beregn din statistiske resterende levetid med vores præcise levetidsberegner"
      />

      <header className="border-b bg-card px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="container">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            📅 Hvor lang tid har jeg tilbage?
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Få et statistisk estimat af din resterende levetid baseret på videnskabelige data
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="card">
              <div className="card-content space-y-6">
                <h2 className="text-2xl font-bold">Hvad betyder "resterende levetid"?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Din resterende levetid er et statistisk estimat baseret på demografiske data, som viser hvor mange år
                  du gennemsnitligt kan forvente at leve fra dit nuværende tidspunkt. Dette tal bygger på nationale og
                  internationale sundhedsstatistikker og er justeret for din alder, køn og geografiske placering.
                </p>

                <h3 className="text-xl font-semibold">Faktorer der påvirker din resterende levetid:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Alder:</strong> Jo ældre du er, jo færre år har du statistisk tilbage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Køn:</strong> Kvinder lever generelt længere end mænd i de fleste lande</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Geografisk placering:</strong> Forskellige lande har forskellige levetidsforventninger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Livsstil:</strong> Motion, kost, rygning og andre faktorer påvirker betydeligt</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-4">
                <h3 className="text-xl font-semibold">Hvorfor beregne resterende levetid?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">🎯 Målsætning og prioritering</h4>
                    <p className="text-sm text-muted-foreground">
                      At kende din forventede resterende levetid kan hjælpe dig med at prioritere mål og drømme i dit liv.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">💰 Finansiel planlægning</h4>
                    <p className="text-sm text-muted-foreground">
                      Pensionsopsparing og økonomiske beslutninger kan træffes mere informeret.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">🏃‍♂️ Sundhedsmotivation</h4>
                    <p className="text-sm text-muted-foreground">
                      Indsigt i hvordan livsstil påvirker levetid kan motivere til sundere valg.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">⏰ Tidsperspektiv</h4>
                    <p className="text-sm text-muted-foreground">
                      At forstå livets begrænsninger kan føre til mere bevidste valg om hvordan vi bruger vores tid.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/" className="btn btn-primary text-lg px-8 py-3">
                🧮 Beregn din resterende levetid nu
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HvorLangTidPage;