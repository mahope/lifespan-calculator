import React from 'react';
import {
  MapPin,
  BarChart3,
  Globe,
  AlertTriangle,
  Dumbbell,
  Building2,
  GraduationCap,
  Wallet,
  Calculator,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import PromoBanner from '../components/PromoBanner';
import AnswerFirst from '../components/AnswerFirst';
import { answerFirst } from '../utils/answerFirst';
import { Link } from 'react-router-dom';
import { lifeExpectancyData as le } from '../utils/lifeExpectancyData';

const fmtLE = (n) => n.toFixed(1);

const DanmarkPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead route="/levetid-beregner-danmark" />

      <PageHeader
        icon={MapPin}
        title="Levealder i Danmark"
        subtitle="Gennemsnitlig levealder og middellevetid for danske mænd og kvinder fra Danmarks Statistik"
      />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <AnswerFirst text={answerFirst.danmark()} linkText="Beregn din egen levetid i levetidsberegneren" />

            <div className="card animate-slideUp">
              <div className="card-content space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Levetid i Danmark</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Tallene her er den danske middellevetid fra Danmarks Statistiks dødelighedstavler (tabel HISB8,
                  2024-2025). Det er de samme tavler, som levetidsberegneren bruger. Sammenligningen med Sverige, Norge og
                  Finland kommer fra Eurostat, og tallene for Japan og verden kommer fra Verdensbanken.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" /> Danske tal ved fødslen ({le.Denmark.year})
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="font-medium">Kvinder:</span>
                        <span className="text-xl font-bold text-primary">{fmtLE(le.Denmark.female)} år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="font-medium">Mænd:</span>
                        <span className="text-xl font-bold text-primary">{fmtLE(le.Denmark.male)} år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="font-medium">Gennemsnit af mænd og kvinder (beregnet):</span>
                        <span className="text-xl font-bold text-primary">{fmtLE((le.Denmark.male + le.Denmark.female) / 2)} år</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Globe className="h-5 w-5 shrink-0" aria-hidden="true" /> Sammenligning med nabolande
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                        <span className="font-medium">Sverige ({le.Sweden.year}):</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-400">{fmtLE(le.Sweden.total)} år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                        <span className="font-medium">Norge ({le.Norway.year}):</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-400">{fmtLE(le.Norway.total)} år</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                        <span className="font-medium">Finland ({le.Finland.year}):</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-400">{fmtLE(le.Finland.total)} år</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold">Danske sundhedstrends</h3>
                <p className="text-muted-foreground">
                  Danmarks levetid har været stigende gennem de sidste årtier, men hastigheden er aftaget i de seneste
                  år. Her er de vigtigste faktorer, der påvirker danske borgeres levetid:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> Udfordringer i Danmark
                    </h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span><strong className="text-foreground">Rygning:</strong> Danmark har stadig en højere rygefrekvens end mange andre vestlige lande</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span><strong className="text-foreground">Alkohol:</strong> Højt alkoholforbrug påvirker levetiden negativt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span><strong className="text-foreground">Stillesiddende livsstil:</strong> Mange danskere får ikke nok motion</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span><strong className="text-foreground">Stress:</strong> Arbejdsrelateret stress påvirker mange danskeres sundhed</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 shrink-0" aria-hidden="true" /> Danske styrker
                    </h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 dark:text-green-400 mt-0.5">•</span>
                        <span><strong className="text-foreground">Gratis sundhedssystem:</strong> Universel adgang til behandling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 dark:text-green-400 mt-0.5">•</span>
                        <span><strong className="text-foreground">Forebyggelse:</strong> Stærk fokus på forebyggende sundhed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 dark:text-green-400 mt-0.5">•</span>
                        <span><strong className="text-foreground">Cykelkultur:</strong> Høj grad af fysisk aktivitet i hverdagen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 dark:text-green-400 mt-0.5">•</span>
                        <span><strong className="text-foreground">Arbejds-liv balance:</strong> Gode arbejdsvilkår og ferie</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold">Regionale forskelle i Danmark</h3>
                <p className="text-muted-foreground">
                  Der er betydelige forskelle på levetiden mellem forskellige regioner og socioøkonomiske grupper i Danmark:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <span className="mx-auto inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h4 className="font-medium">Hovedstadsområdet</h4>
                    <p className="text-sm text-muted-foreground">Højeste levetid i Danmark</p>
                    <div className="text-lg font-bold text-primary">+2-3 år</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <span className="mx-auto inline-grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h4 className="font-medium">Uddannelse</h4>
                    <p className="text-sm text-muted-foreground">Længere uddannelse = længere liv</p>
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">+7 år</div>
                  </div>
                  <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                    <span className="mx-auto inline-grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Wallet className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h4 className="font-medium">Indkomst</h4>
                    <p className="text-sm text-muted-foreground">Højere indkomst = bedre sundhed</p>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">+5 år</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary/20 bg-primary/5">
              <div className="card-content">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> Fra gennemsnit til dit eget tal
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                  Gennemsnittet for alle danskere siger ikke, hvor gammel du selv bliver. Levetidsberegneren
                  bruger de samme danske tavler, men ud fra din egen alder og dit køn.
                </p>
                <div className="text-center">
                  <Link to="/" className="btn btn-primary gap-2">
                    <Calculator className="h-5 w-5" aria-hidden="true" /> Beregn din levetid ud fra danske tal
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

export default DanmarkPage;
