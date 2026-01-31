import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import PromoBanner from '../components/PromoBanner';
import { Link } from 'react-router-dom';

const LivsstilPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Livsstil og Levetid - Hvordan påvirker din livsstil din levetid?"
        description="Lær hvordan livsstilsfaktorer som motion, kost, rygning og stress påvirker din levetid. Videnskabsbaseret guide til sundere og længere liv."
        keywords="livsstil levetid, motion levetid, sund kost levetid, rygning påvirkning, stress sundhed, længere liv, sundhed"
        ogTitle="Livsstil og Levetid - Forlæng dit liv med de rigtige valg"
        ogDescription="Videnskabsbaseret guide til hvordan du kan forlænge dit liv gennem livsstilsændringer"
        canonicalUrl="/livsstil-og-levetid"
      />

      <header className="header-gradient px-4 py-8 sm:py-12 text-center sm:px-6 lg:px-8 shadow-lg">
        <div className="container animate-fadeIn">
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            💪 Livsstil og Levetid
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-white/90">
            Oplev hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="card animate-slideUp">
              <div className="card-content space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Livsstilsfaktorer med størst påvirkning</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Forskning viser, at livsstil udgør op til 60% af de faktorer, der bestemmer din levetid. Her er de
                  vigtigste områder, hvor du kan gøre en forskel:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏃‍♂️</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Motion og fysisk aktivitet</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Regelmæssig motion kan tilføje 3-7 år til dit liv. Bare 150 minutter moderat aktivitet om ugen
                        reducerer risikoen for hjertesygdomme, diabetes og kræft betydeligt.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600 dark:text-green-400">Anbefalinger:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 150 min. moderat aktivitet per uge</li>
                          <li>• Styrketræning 2 gange om ugen</li>
                          <li>• Daglige gåture på mindst 30 minutter</li>
                          <li>• Undgå stillesiddende perioder over 1 time</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍎</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Ernæring og kost</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        En sund kost kan forlænge livet med 2-8 år. Den mediterrane kost er den mest dokumenterede
                        koststil for langt liv.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600 dark:text-green-400">Kostvejledning:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Spis 5-7 portioner frugt og grønt dagligt</li>
                          <li>• Vælg fuldkornsprodukter frem for raffinerede</li>
                          <li>• Inkluder fede fisk 2-3 gange om ugen</li>
                          <li>• Begræns rødt kød og forarbejdede fødevarer</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">😴</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Søvn og hvile</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        7-9 timers kvalitetssøvn er essentielt for et langt liv. Kronisk søvnmangel øger risikoen for
                        hjertesygdomme, diabetes og tidlig død.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600 dark:text-green-400">Søvnhygiejne:</h4>
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
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚭</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Rygning og tobak</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rygning er den enkeltstående livsstilsfaktor, der forkorter livet mest - op til 10 år. At stoppe
                        med at ryge kan tilføje år til dit liv uanset alder.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-destructive">Rygningens påvirkning:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 1 pakke om dagen: -7 år i levetid</li>
                          <li>• 2 pakker om dagen: -10 år i levetid</li>
                          <li>• Stop før 30 år: fuld levetidsgenopretning</li>
                          <li>• Stop før 50 år: halverer overdødelighed</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧘‍♀️</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Stress og mental sundhed</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Kronisk stress øger risikoen for hjertesygdomme, depression og tidlig død. Stressmanagement
                        kan tilføje 2-3 år til dit liv.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600 dark:text-green-400">Stresshåndtering:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Praktiser mindfulness eller meditation</li>
                          <li>• Dyrk hobbies og interesser</li>
                          <li>• Vedligehold sociale relationer</li>
                          <li>• Søg professionel hjælp ved behov</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍷</span>
                        <h3 className="text-lg sm:text-xl font-semibold">Alkohol</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Moderat alkoholforbrug kan have neutrale eller svagt positive effekter, mens stort forbrug
                        forkorter livet betydeligt.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Anbefalinger:</h4>
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
                <h3 className="text-lg sm:text-xl font-semibold">Den kumulative effekt af livsstilsændringer</h3>
                <p className="text-muted-foreground">
                  Studier viser, at mennesker, der følger alle fem hovedlivsstilsområder (ikke-rygning, sund vægt,
                  regelmæssig motion, sund kost og moderat alkoholforbrug), lever 12-14 år længere end dem, der ikke
                  følger nogen af dem.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">+12-14</div>
                    <div className="text-sm text-muted-foreground">År ekstra ved optimal livsstil</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">80%</div>
                    <div className="text-sm text-muted-foreground">Reduktion i hjertesygdomme</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">50%</div>
                    <div className="text-sm text-muted-foreground">Reduktion i kræftrisiko</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-green-500/20 bg-green-500/5">
              <div className="card-content">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🎯</span> Start i dag
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
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

      <PromoBanner />
      <Footer />
      <ThemeToggle />
    </div>
  );
};

export default LivsstilPage;
