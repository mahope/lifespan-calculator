import React from 'react';

const PROMOS = [
  {
    title: 'Beregner.dk',
    description: 'Gratis beregnere til el, løn, BMI, feriepenge, børnepenge og SU.',
    url: 'https://beregner.holstjensen.eu',
  },
  {
    title: 'WhiteNoise.dk',
    description: 'Alt om hvid støj til bedre søvn for babyer og voksne.',
    url: 'https://whitenoise.dk',
  },
  {
    title: 'QRtool.dk',
    description: 'Gratis QR-kode generator med logo og egne farver.',
    url: 'https://qrtool.dk',
  },
  {
    title: 'Pakkeliste.com',
    description: 'Pakkelister til rejser, camping og weekendture.',
    url: 'https://pakkeliste.com',
  },
  {
    title: 'Mahope.dk',
    description: 'Freelance webudvikling og digitale løsninger.',
    url: 'https://mahope.dk',
  },
];

// Other sites by the same maker: a plain list, one line each.
const PromoBanner = () => (
  <aside className="container" aria-labelledby="andre-vaerktoejer">
    <div className="card">
      <div className="card-header">
        <h2 id="andre-vaerktoejer" className="fig text-2xl leading-tight font-semibold">
          Andre værktøjer
        </h2>
        <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
          Gratis sider fra samme udvikler.
        </p>
      </div>
      <div className="card-content">
        <ul className="divide-y">
          {PROMOS.map((promo) => (
            <li key={promo.url} className="grid gap-x-8 gap-y-0.5 py-3 first:pt-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <a
                href={promo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex min-h-11 items-center font-medium sm:min-h-0 sm:items-baseline"
              >
                {promo.title}
              </a>
              <p className="text-[0.9375rem] text-muted-foreground">{promo.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </aside>
);

export default PromoBanner;
