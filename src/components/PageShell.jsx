import React from 'react';
import PageHeader from './PageHeader';
import PromoBanner from './PromoBanner';
import Footer from './Footer';

// Frame shared by the landing pages: masthead and title block, the sections in <main>, then the
// other-tools list and the footer. The <head> is written by src/layouts/Base.astro.
const PageShell = ({ route, title, subtitle, children }) => (
  <div className="flex min-h-screen flex-col">
    <PageHeader title={title} subtitle={subtitle} current={route} />
    <main className="flex-1">
      <div className="container pb-12">{children}</div>
    </main>
    <PromoBanner />
    <Footer />
  </div>
);

export default PageShell;
