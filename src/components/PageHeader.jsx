import React from 'react';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { to: '/', label: 'Beregner' },
  { to: '/hvor-lang-tid-har-jeg-tilbage', label: 'Tid tilbage' },
  { to: '/dodsalder-calculator', label: 'Dødsalder' },
  { to: '/levetid-beregner-danmark', label: 'Danmark' },
  { to: '/livsstil-og-levetid', label: 'Livsstil' },
  { to: '/pensionsalder', label: 'Pension' },
];

// Masthead: wordmark on the left, the site's pages as a real navigation, theme switch last.
// On phones only the wordmark and the switch show; the pages are listed in the footer.
// `current` is the route of the page (the pages are separate HTML files, so it is known at build time).
export const SiteNav = ({ current }) => (
  <div className="border-b">
    <div className="container flex items-center justify-between gap-4 py-2">
      <a href="/" className="fig -ml-1 inline-flex min-h-11 items-center px-1 text-xl font-semibold">
        Levetidsberegner
      </a>
      <div className="flex items-center gap-1">
        <nav aria-label="Sider" className="hidden items-center md:flex">
          {NAV.map((item) => {
            const isActive = item.to === current;
            return (
              <a
                key={item.to}
                href={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center px-3 text-[0.9375rem] hover:underline ${
                  isActive ? 'font-semibold text-foreground underline decoration-2 underline-offset-8' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </div>
  </div>
);

// Page title block for the landing pages: left-aligned serif title, one plain sentence under it.
const PageHeader = ({ title, subtitle, current }) => (
  <header>
    <SiteNav current={current} />
    <div className="container pt-10 pb-6 sm:pt-16 sm:pb-8">
      <h1 className="fig max-w-3xl text-[2.25rem] leading-[1.1] font-semibold sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  </header>
);

export default PageHeader;
