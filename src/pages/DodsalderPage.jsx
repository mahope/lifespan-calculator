import React from 'react';
import {
  Skull,
  BarChart3,
  Dna,
  Sprout,
  AlertTriangle,
  Dumbbell,
  X,
  Check,
  Lightbulb,
  Calculator,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import PromoBanner from '../components/PromoBanner';
import { Link } from 'react-router-dom';

const DodsalderPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Dødsalder Calculator - Beregn din forventede dødsalder"
        description="Beregn din statistiske dødsalder baseret på alder, køn og livsstil. Gratis dødsalder calculator med data fra sundhedsmyndigheder."
        keywords="dødsalder calculator, dødsalder beregner, forventet dødsalder, levetid, statistisk dødsalder, hvornår dør jeg"
        ogTitle="Dødsalder Calculator - Hvornår dør jeg statistisk?"
        ogDescription="Få et statistisk estimat af din dødsalder baseret på demografiske data og livsstilsfaktorer"
        canonicalUrl="/dodsalder-calculator"
        breadcrumbs={[
          { name: 'Forside', url: '/' },
          { name: 'Dødsalder Calculator', url: '/dodsalder-calculator' },
        ]}
      />

      <PageHeader
        icon={Skull}
        title="Dødsalder Calculator"
        subtitle="Beregn din statistiske dødsalder baseret på demografiske data og livsstilsfaktorer"
      />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="card animate-slideUp">
              <div className="card-content space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Hvad er en dødsalder calculator?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  En dødsalder calculator er et statistisk værktøj, der estimerer den alder, hvor du sandsynligvis vil dø
                  baseret på demografiske data, sundhedsstatistikker og livsstilsfaktorer. Det er vigtigt at forstå, at
                  dette kun er et gennemsnit og ikke en præcis forudsigelse af dit individuelle livsforløb.
                </p>

                <h3 className="text-lg sm:text-xl font-semibold">Hvordan fungerer beregningen?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <BarChart3 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-medium text-foreground">Demografiske data</h4>
                      <p className="text-sm text-muted-foreground">
                        Vi bruger officielle statistikker fra WHO og nationale sundhedsmyndigheder for dit land, køn og alder.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Dna className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-medium text-foreground">Biologiske faktorer</h4>
                      <p className="text-sm text-muted-foreground">
                        Alder og køn er de stærkeste prædiktorer for levetid ifølge demografisk forskning.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Sprout className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-medium text-foreground">Livsstilsjusteringer</h4>
                      <p className="text-sm text-muted-foreground">
                        Faktorer som rygning, motion, kost og stress kan justere dit estimat med flere år.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold">Livsstilsfaktorer der påvirker dødsalder</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> Faktorer der forkorter livet:
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>Rygning (reducerer levetid med 7-10 år)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>Overforbrug af alkohol</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>Fedme og usund kost</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>Kronisk stress</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>Mangel på motion</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 shrink-0" aria-hidden="true" /> Faktorer der forlænger livet:
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>Regelmæssig motion (tilføjer 3-7 år)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>Mediterran kost</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>Sociale forbindelser</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>Tilstrækkelig søvn (7-9 timer)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>Stressmanagement</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary/20 bg-primary/5">
              <div className="card-content">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> Vigtig påmindelse
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  En dødsalder calculator giver kun et statistisk estimat baseret på befolkningsdata. Din faktiske levetid
                  påvirkes af mange faktorer, som ikke kan forudsiges, herunder genetik, ulykker, medicinske fremskridt,
                  og personlige livsstilsvalg. Brug værktøjet som motivation til at leve sundere, men ikke som en definitiv
                  forudsigelse.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link to="/" className="btn btn-primary gap-2 text-base sm:text-lg px-6 sm:px-8 py-3">
                <Calculator className="h-5 w-5" aria-hidden="true" /> Beregn din dødsalder nu
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

export default DodsalderPage;
