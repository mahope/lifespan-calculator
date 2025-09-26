import React from 'react';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Side ikke fundet - Dansk Levetidsberegner"
        description="Siden du leder efter blev ikke fundet. Gå tilbage til levetidsberegneren for at beregne din forventede levetid."
        keywords="404, side ikke fundet, levetidsberegner"
      />

      <header className="border-b bg-card px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="container">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            🔍 Side ikke fundet
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Den side du leder efter eksisterer ikke eller er blevet flyttet
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center space-y-8">
            <div className="text-9xl">🤔</div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Hmm, denne side findes ikke</h2>
              <p className="text-muted-foreground">
                Du er måske kommet hertil via et forældet link eller har tastet en forkert adresse.
                Lad os få dig tilbage på rette spor!
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Populære sider:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/" className="card hover:shadow-md transition-shadow">
                  <div className="card-content text-center space-y-2">
                    <div className="text-3xl">🕰️</div>
                    <div className="font-medium">Levetidsberegner</div>
                    <div className="text-sm text-muted-foreground">Beregn din resterende levetid</div>
                  </div>
                </Link>

                <Link to="/hvor-lang-tid-har-jeg-tilbage" className="card hover:shadow-md transition-shadow">
                  <div className="card-content text-center space-y-2">
                    <div className="text-3xl">📅</div>
                    <div className="font-medium">Hvor lang tid har jeg tilbage?</div>
                    <div className="text-sm text-muted-foreground">Lær om resterende levetid</div>
                  </div>
                </Link>

                <Link to="/livsstil-og-levetid" className="card hover:shadow-md transition-shadow">
                  <div className="card-content text-center space-y-2">
                    <div className="text-3xl">💪</div>
                    <div className="font-medium">Livsstil og Levetid</div>
                    <div className="text-sm text-muted-foreground">Optimer din livsstil</div>
                  </div>
                </Link>

                <Link to="/levetid-beregner-danmark" className="card hover:shadow-md transition-shadow">
                  <div className="card-content text-center space-y-2">
                    <div className="text-3xl">🇩🇰</div>
                    <div className="font-medium">Dansk Levetidsberegner</div>
                    <div className="text-sm text-muted-foreground">Specialiseret til Danmark</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="pt-6">
              <Link to="/" className="btn btn-primary text-lg px-8 py-3">
                🏠 Gå til forsiden
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;