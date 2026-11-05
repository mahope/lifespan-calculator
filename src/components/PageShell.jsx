import React from 'react';
import SEOHead from './SEOHead';
import PageHeader from './PageHeader';
import PromoBanner from './PromoBanner';
import Footer from './Footer';

// Frame shared by the landing pages: masthead and title block, the sections in <main>, then the
// other-tools list and the footer.
const PageShell = ({ route, title, subtitle, children }) => (
  <div className="flex min-h-screen flex-col">
    <SEOHead route={route} />
    <PageHeader title={title} subtitle={subtitle} />
    <main className="flex-1">
      <div className="container pb-12">{children}</div>
    </main>
    <PromoBanner />
    <Footer />
  </div>
);

export default PageShell;
