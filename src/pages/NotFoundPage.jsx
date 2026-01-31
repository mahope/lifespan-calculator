import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Side ikke fundet - Dansk Levetidsberegner"
        description="Siden du leder efter blev ikke fundet. Gå tilbage til levetidsberegneren for at beregne din forventede levetid."
        keywords="404, side ikke fundet, levetidsberegner"
        canonicalUrl="/404"
      />

      <header className="header-gradient px-4 py-8 sm:py-12 text-center sm:px-6 lg:px-8 shadow-lg">
        <div className="container animate-fadeIn">
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            🔍 Side ikke fundet
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-white/90">
            Den side du leder efter eksisterer ikke eller er blevet flyttet
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center space-y-6 sm:space-y-8">
            <div className="text-7xl sm:text-9xl animate-bounce">🤔</div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">Hmm, denne side findes ikke</h2>
              <p className="text-muted-foreground">
                Du er måske kommet hertil via et forældet link eller har tastet en forkert adresse.
                Lad os få dig tilbage på rette spor!
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Populære sider:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link to="/" className="card hover:shadow-md hover:border-primary/50 transition-all">
                  <div className="card-content text-center space-y-2 py-4">
                    <div className="text-2xl sm:text-3xl">🕰️</div>
                    <div className="font-medium">Levetidsberegner</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Beregn din resterende levetid</div>
                  </div>
                </Link>

                <Link to="/hvor-lang-tid-har-jeg-tilbage" className="card hover:shadow-md hover:border-primary/50 transition-all">
                  <div className="card-content text-center space-y-2 py-4">
                    <div className="text-2xl sm:text-3xl">📅</div>
                    <div className="font-medium">Hvor lang tid har jeg tilbage?</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Lær om resterende levetid</div>
                  </div>
                </Link>

                <Link to="/dodsalder-calculator" className="card hover:shadow-md hover:border-primary/50 transition-all">
                  <div className="card-content text-center space-y-2 py-4">
                    <div className="text-2xl sm:text-3xl">⚰️</div>
                    <div className="font-medium">Dødsalder Calculator</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Beregn din statistiske dødsalder</div>
                  </div>
                </Link>

                <Link to="/livsstil-og-levetid" className="card hover:shadow-md hover:border-primary/50 transition-all">
                  <div className="card-content text-center space-y-2 py-4">
                    <div className="text-2xl sm:text-3xl">💪</div>
                    <div className="font-medium">Livsstil og Levetid</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Optimer din livsstil</div>
                  </div>
                </Link>

                <Link to="/levetid-beregner-danmark" className="card hover:shadow-md hover:border-primary/50 transition-all sm:col-span-2">
                  <div className="card-content text-center space-y-2 py-4">
                    <div className="text-2xl sm:text-3xl">🇩🇰</div>
                    <div className="font-medium">Dansk Levetidsberegner</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Specialiseret til Danmark med data fra Danmarks Statistik</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="pt-4 sm:pt-6">
              <Link to="/" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3">
                🏠 Gå til forsiden
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ThemeToggle />
    </div>
  );
};

export default NotFoundPage;
