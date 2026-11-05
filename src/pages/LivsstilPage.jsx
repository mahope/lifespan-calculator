import React from 'react';
import {
  HeartPulse,
  Activity,
  Apple,
  Moon,
  CigaretteOff,
  Brain,
  Wine,
  Target,
  BarChart3,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
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
        breadcrumbs={[
          { name: 'Forside', url: '/' },
          { name: 'Livsstil og Levetid', url: '/livsstil-og-levetid' },
        ]}
      />

      <PageHeader
        icon={HeartPulse}
        title="Livsstil og Levetid"
        subtitle="Oplev hvordan dine daglige valg påvirker din levetid og lær at optimere din livsstil for et længere, sundere liv"
      />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="card animate-slideUp">
              <div className="card-content space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Livsstilsfaktorer med størst påvirkning</h2>
                <p className="text-muted-foreground leading-relaxed">
                  I store amerikanske opfølgningsstudier kunne omkring 60 % af dødsfaldene tilskrives, at man ikke fulgte
                  fem sunde levevaner (Li m.fl., Circulation 2018). Tallet gælder en befolkning, ikke dig. Her er de
                  vigtigste områder, hvor du kan gøre en forskel:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Activity className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Motion og fysisk aktivitet</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        I en samlet analyse af seks store kohortestudier levede personer med ca. 150 minutters aktivitet om
                        ugen i gennemsnit ca. 3,4 år længere end inaktive; selv under 75 minutter om ugen var forbundet med
                        ca. 1,8 flere leveår (Moore m.fl., PLoS Medicine 2012). Det er statistiske sammenhænge.
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
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Apple className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Ernæring og kost</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        En modelberegning viser, at en varig omlægning til mere bælgfrugter, fuldkorn og nødder og mindre
                        forarbejdet kød kan give omkring 3-10 flere leveår, mest hvis man starter ung (Fadnes m.fl., PLoS
                        Medicine 2022). Det er en modelberegning, ikke et forsøg.
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
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          <Moon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Søvn og hvile</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Både meget kort og meget lang søvn er i store oversigtsstudier forbundet med lidt højere
                        dødelighed, og risikoen er lavest ved omkring 7 timer (Yin m.fl. 2017; Cappuccio m.fl. 2010). En
                        del af sammenhængen kan skyldes, at sygdom påvirker søvnen.
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
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <CigaretteOff className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Rygning og tobak</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rygere mister i gennemsnit mindst 10 leveår sammenlignet med aldrig-rygere (Jha m.fl., NEJM 2013).
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-destructive">Rygningens påvirkning:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Også 1-10 cigaretter om dagen næsten fordobler dødeligheden (Pirie m.fl., Lancet 2013).</li>
                          <li>
                            • Hvis man stopper før 40 år, undgår man omkring 90 % af den ekstra dødelighed (Jha 2013).
                          </li>
                          <li>
                            • I en britisk lægeundersøgelse genvandt mænd, der stoppede som 30-årige, ca. 10 leveår og som
                            50-årige ca. 6 (Doll m.fl., BMJ 2004).
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          <Brain className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Stress og mental sundhed</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Langvarig stress på arbejdet er forbundet med en let forhøjet risiko for hjertesygdom (ca. 23 %
                        højere i en stor europæisk analyse, Kivimäki m.fl., Lancet 2012), men der findes ikke solid
                        dokumentation for et bestemt antal leveår ved stresshåndtering.
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
                        <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Wine className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold">Alkohol</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Risikoen for tidlig død er lavest ved lavt forbrug og stiger derefter; ved 200-350 g alkohol om
                        ugen (ca. 17-29 genstande) er forventet levetid ved 40 år ca. 1-2 år kortere (Wood m.fl., Lancet
                        2018).
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Anbefalinger:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>
                            • Sundhedsstyrelsen anbefaler højst 10 genstande om ugen og højst 4 på samme dag, for både
                            kvinder og mænd.
                          </li>
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
                  I et amerikansk studie af ca. 123.000 sundhedsprofessionelle havde 50-årige, der levede efter alle fem
                  sunde levevaner (ikke-rygning, normalvægt, 30 minutters motion dagligt, moderat alkohol, sund kost),
                  en forventet restlevetid, der var 12,2 år (mænd) og 14,0 år (kvinder) længere end dem uden nogen af
                  dem (Li m.fl., Circulation 2018).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">+12,2-14,0</div>
                    <div className="text-sm text-muted-foreground">Flere leveår ved 50 år: fem mod ingen sunde levevaner</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">82 %</div>
                    <div className="text-sm text-muted-foreground">Lavere dødelighed af hjerte-kar-sygdom</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">65 %</div>
                    <div className="text-sm text-muted-foreground">Lavere kræftdødelighed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-green-500/20 bg-green-500/5">
              <div className="card-content">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" /> Start i dag
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                  Du behøver ikke at ændre alt på én gang. Start med én livsstilsændring ad gangen og byg gradvist
                  sundere vaner op. Selv små forbedringer kan have betydelig påvirkning på din levetid og livskvalitet.
                </p>
                <div className="text-center">
                  <Link to="/" className="btn btn-primary gap-2">
                    <BarChart3 className="h-5 w-5" aria-hidden="true" /> Se hvordan din livsstil påvirker din levetid
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
