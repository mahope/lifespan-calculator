import React from 'react';

const PromoBanner = () => {
  const promos = [
    {
      title: 'QRtool.dk',
      description: 'Gratis QR-kode generator med logo, farver og avancerede features',
      emoji: '📱',
      url: 'https://qrtool.dk',
      highlight: 'Opret professionelle QR-koder på sekunder'
    },
    {
      title: 'Pakkeliste.com',
      description: 'Smart pakkeliste-generator til rejser, camping og weekendture',
      emoji: '🎒',
      url: 'https://pakkeliste.com',
      highlight: 'Glem aldrig noget igen'
    },
    {
      title: 'Mahope.dk',
      description: 'Freelance webudvikling og digitale løsninger',
      emoji: '💼',
      url: 'https://mahope.dk',
      highlight: 'Skræddersyede web-løsninger til din virksomhed'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[hsl(var(--gradient-from))]/5 to-[hsl(var(--gradient-to))]/5 border-t">
      <div className="container py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Andre nyttige værktøjer</h2>
          <p className="text-muted-foreground">Tjek mine andre gratis tools og services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promos.map((promo, index) => (
            <a
              key={index}
              href={promo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card hover:scale-105 hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              <div className="card-content pt-6">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {promo.emoji}
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary group-hover:text-primary/80 transition-colors">
                  {promo.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {promo.description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  <span>{promo.highlight}</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
