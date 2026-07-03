import React from 'react';

// Shared page hero: a real (lucide) icon in a frosted-glass chip over a clean
// title + subtitle on the brand gradient. Used across the calculator and the
// content landing pages so the header is consistent (and free of emoji titles).
const PageHeader = ({ icon: Icon, title, subtitle }) => (
  <header className="header-gradient px-4 py-10 text-center sm:px-6 sm:py-14 lg:px-8">
    <div className="container animate-fadeIn">
      {Icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <Icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto max-w-xl text-sm text-white/90 sm:text-base">{subtitle}</p>
      )}
    </div>
  </header>
);

export default PageHeader;
