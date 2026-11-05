import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';

const PAGES = [
  ['/', 'Levetidsberegner', 'Beregn din resterende levetid'],
  ['/hvor-lang-tid-har-jeg-tilbage', 'Hvor lang tid har jeg tilbage?', 'Lær om resterende levetid'],
  ['/dodsalder-calculator', 'Dødsalder Calculator', 'Beregn din statistiske dødsalder'],
  ['/livsstil-og-levetid', 'Livsstil og Levetid', 'Optimer din livsstil'],
  ['/levetid-beregner-danmark', 'Dansk Levetidsberegner', 'Specialiseret til Danmark med data fra Danmarks Statistik'],
  ['/pensionsalder', 'Pensionsalder', 'Se din folkepensionsalder og pensionsdato'],
];

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col">
    <SEOHead notFound />

    <PageHeader
      title="Side ikke fundet"
      subtitle="Den side du leder efter eksisterer ikke eller er blevet flyttet"
    />

    <main className="flex-1">
      <div className="container pb-12">
        <section className="card">
          <div className="card-header">
            <h2 className="fig text-2xl leading-tight font-semibold">Siden findes ikke</h2>
            <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
              Du er måske kommet hertil via et forældet link eller har tastet en forkert adresse.
            </p>
          </div>
          <div className="card-content">
            <h3 className="fig mb-2 text-lg font-semibold">Populære sider:</h3>
            <ul className="divide-y">
              {PAGES.map(([to, title, text]) => (
                <li key={to} className="grid gap-x-8 py-3 sm:grid-cols-[16rem_minmax(0,1fr)]">
                  <Link to={to} className="link inline-flex min-h-11 items-center font-medium sm:min-h-0">
                    {title}
                  </Link>
                  <p className="text-[0.9375rem] text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <Link to="/" className="btn btn-primary">Gå til forsiden</Link>
            </p>
          </div>
        </section>
      </div>
    </main>

    <Footer />
  </div>
);

export default NotFoundPage;
