import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const DanmarkPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Dansk Levetidsberegner - Specialiseret til danske forhold"
        description="Beregn din levetid med data specifikt fra Danmarks Statistik. Vores danske levetidsberegner bruger de seneste data fra danske sundhedsmyndigheder."
        keywords="dansk levetidsberegner, danmark levetid, danmarks statistik levetid, dansk dødsalder, levetid danmark"
        ogTitle="Dansk Levetidsberegner - Præcise data fra Danmarks Statistik"
        ogDescription="Specialiseret levetidsberegner med data fra Danmarks Statistik og danske sundhedsmyndigheder"
      />

      <header className="border-b bg-card px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="container">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            🇩🇰 Dansk Levetidsberegner
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Specialiseret levetidsberegner med præcise data fra Danmarks Statistik og danske sundhedsmyndigheder
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="card">
              <div className="card-content space-y-6">
                <h2 className="text-2xl font-bold">Levetid i Danmark</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Danmark har en af verdens højeste levetider, og danske data adskiller sig på flere områder fra det
                  globale gennemsnit. Vores specialiserede danske levetidsberegner bruger de seneste tilgængelige data
                  fra Danmarks Statistik, Sundhedsstyrelsen og andre danske myndigheder.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">📊 Aktuelle danske tal (2024)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Kvinder:</span>
                        <span className="text-xl font-bold text-blue-600">82.7 år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Mænd:</span>
                        <span className="text-xl font-bold text-blue-600">78.9 år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Samlet gennemsnit:</span>
                        <span className="text-xl font-bold text-blue-600">80.8 år</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600">🌍 Sammenligning med nabolande</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Sverige:</span>
                        <span className="text-lg font-bold text-green-600">82.6 år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Norge:</span>
                        <span className="text-lg font-bold text-green-600">82.3 år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Finland:</span>
                        <span className="text-lg font-bold text-green-600">81.6 år</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-xl font-semibold">Danske sundhedstrends</h3>
                <p className="text-muted-foreground">
                  Danmarks levetid har været stigende gennem de sidste årtier, men hastigheden er aftaget i de seneste
                  år. Her er de vigtigste faktorer, der påvirker danske borgeres levetid:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-red-600">🚨 Udfordringer i Danmark</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong>Rygning:</strong> Danmark har stadig en højere rygefrekvens end mange andre vestlige lande</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong>Alkohol:</strong> Højt alkoholforbrug påvirker levetiden negativt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong>Stillesiddende livsstil:</strong> Mange danskere får ikke nok motion</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong>Stress:</strong> Arbejdsrelateret stress påvirker mange danskeres sundhed</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-600">💪 Danske styrker</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong>Gratis sundhedssystem:</strong> Universel adgang til behandling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong>Forebyggelse:</strong> Stærk fokus på forebyggende sundhed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong>Cykelkultur:</strong> Høj grad af fysisk aktivitet i hverdagen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong>Arbejds-liv balance:</strong> Gode arbejdsvilkår og ferie</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-xl font-semibold">Regionale forskelle i Danmark</h3>
                <p className="text-muted-foreground">
                  Der er betydelige forskelle på levetiden mellem forskellige regioner og socioøkonomiske grupper i Danmark:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-2xl">🏙️</div>
                    <h4 className="font-medium">Hovedstadsområdet</h4>
                    <p className="text-sm text-muted-foreground">Højeste levetid i Danmark</p>
                    <div className="text-lg font-bold text-blue-600">+2-3 år</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl">🎓</div>
                    <h4 className="font-medium">Uddannelse</h4>
                    <p className="text-sm text-muted-foreground">Længere uddannelse = længere liv</p>
                    <div className="text-lg font-bold text-green-600">+7 år</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl">💰</div>
                    <h4 className="font-medium">Indkomst</h4>
                    <p className="text-sm text-muted-foreground">Højere indkomst = bedre sundhed</p>
                    <div className="text-lg font-bold text-purple-600">+5 år</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <div className="card-content">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">🇩🇰 Hvorfor bruge den danske version?</h3>
                <p className="text-blue-800 text-sm leading-relaxed mb-4">
                  Vores danske levetidsberegner giver mere præcise resultater for danske borgere, da den bruger
                  landspecifikke data og tager højde for danske sundhedsmønstre, livsstil og miljøfaktorer.
                  Dette giver dig et mere realistisk estimat sammenlignet med globale kalkulatorer.
                </p>
                <div className="text-center">
                  <Link to="/" className="btn btn-primary">
                    🧮 Prøv den danske levetidsberegner
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DanmarkPage;