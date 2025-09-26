import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const LivsstilPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Livsstil og Levetid - Hvordan påvirker din livsstil din levetid?"
        description="Lær hvordan livsstilsfaktorer som motion, kost, rygning og stress påvirker din levetid. Videnskabsbaseret guide til sundere og længere liv."
        keywords="livsstil levetid, motion levetid, sund kost levetid, rygning påvirkning, stress sundhed, længere liv"
        ogTitle="Livsstil og Levetid - Forlæng dit liv med de rigtige valg"
        ogDescription="Videnskabsbaseret guide til hvordan du kan forlænge dit liv gennem livsstilsændringer"
      />

      <header className="border-b bg-card px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="container">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            💪 Livsstil og Levetid
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Discover hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="card">
              <div className="card-content space-y-6">
                <h2 className="text-2xl font-bold">Livsstilsfaktorer med størst påvirkning</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Forskning viser, at livsstil udgør op til 60% af de faktorer, der bestemmer din levetid. Her er de
                  vigtigste områder, hvor du kan gøre en forskel:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏃‍♂️</span>
                        <h3 className="text-xl font-semibold">Motion og fysisk aktivitet</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Regelmæssig motion kan tilføje 3-7 år til dit liv. Bare 150 minutter moderat aktivitet om ugen
                        reducerer risikoen for hjertesygdomme, diabetes og kræft betydeligt.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Anbefalinger:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 150 min. moderat aktivitet per uge</li>
                          <li>• Styrketræning 2 gange om ugen</li>
                          <li>• Daglige gåture på mindst 30 minutter</li>
                          <li>• Undgå stillesiddende perioder over 1 time</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍎</span>
                        <h3 className="text-xl font-semibold">Ernæring og kost</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        En sund kost kan forlænge livet med 2-8 år. Den mediterrane kost er den mest dokumenterede
                        koststil for langt liv.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Kostvejledning:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Spis 5-7 portioner frugt og grønt dagligt</li>
                          <li>• Vælg fuldkornsprodukter frem for raffinerede</li>
                          <li>• Inkluder fede fisk 2-3 gange om ugen</li>
                          <li>• Begræns rødt kød og forarbejdede fødevarer</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">😴</span>
                        <h3 className="text-xl font-semibold">Søvn og hvile</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        7-9 timers kvalitetssøvn er essentielt for et langt liv. Kronisk søvnmangel øger risikoen for
                        hjertesygdomme, diabetes og tidlig død.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Søvnhygiejne:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Gå i seng og stå op på samme tid hver dag</li>
                          <li>• Undgå skærme 1 time før sengetid</li>
                          <li>• Hold soveværelset køligt og mørkt</li>
                          <li>• Undgå koffein efter kl. 14</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚭</span>
                        <h3 className="text-xl font-semibold">Rygning og tobak</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rygning er den enkeltstående livsstilsfaktor, der forkorter livet mest - op til 10 år. At stoppe
                        med at ryge kan tilføje år til dit liv uanset alder.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-600">Rygningens påvirkning:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 1 pakke om dagen: -7 år i levetid</li>
                          <li>• 2 pakker om dagen: -10 år i levetid</li>
                          <li>• Stop før 30 år: fuld levetidsgenopretning</li>
                          <li>• Stop før 50 år: halverer overdødelighed</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧘‍♀️</span>
                        <h3 className="text-xl font-semibold">Stress og mental sundhed</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Kronisk stress øger risikoen for hjertesygdomme, depression og tidlig død. Stressmanagement
                        kan tilføje 2-3 år til dit liv.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Stresshåndtering:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Praktiser mindfulness eller meditation</li>
                          <li>• Dyrk hobbies og interesser</li>
                          <li>• Vedligehold sociale relationer</li>
                          <li>• Søg professionel hjælp ved behov</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍷</span>
                        <h3 className="text-xl font-semibold">Alkohol</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Moderat alkoholforbrug kan have neutrale eller svagt positive effekter, mens stort forbrug
                        forkorter livet betydeligt.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-600">Anbefalinger:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Kvinder: Max 7 genstande per uge</li>
                          <li>• Mænd: Max 14 genstande per uge</li>
                          <li>• 2 alkoholfri dage per uge</li>
                          <li>• Undgå drukfester</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-xl font-semibold">Den kumulative effekt af livsstilsændringer</h3>
                <p className="text-muted-foreground">
                  Studier viser, at mennesker, der følger alle fem hovedlivsstilsområder (ikke-rygning, sund vægt,
                  regelmæssig motion, sund kost og moderat alkoholforbrug), lever 12-14 år længere end dem, der ikke
                  følger nogen af dem.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">+12-14</div>
                    <div className="text-sm text-muted-foreground">År ekstra ved optimal livsstil</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">80%</div>
                    <div className="text-sm text-muted-foreground">Reduktion i hjertesygdomme</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-purple-600">50%</div>
                    <div className="text-sm text-muted-foreground">Reduktion i kræftrisiko</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-green-50 border-green-200">
              <div className="card-content">
                <h3 className="text-xl font-semibold text-green-900 mb-4">🎯 Start i dag</h3>
                <p className="text-green-800 text-sm leading-relaxed mb-4">
                  Du behøver ikke at ændre alt på én gang. Start med én livsstilsændring ad gangen og byg gradvist
                  sundere vaner op. Selv små forbedringer kan have betydelig påvirkning på din levetid og livskvalitet.
                </p>
                <div className="text-center">
                  <Link to="/" className="btn btn-primary">
                    📊 Se hvordan din livsstil påvirker din levetid
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

export default LivsstilPage;