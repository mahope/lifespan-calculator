import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title = 'Dansk Levetidsberegner - Beregn din forventede levetid',
  description = 'Beregn din forventede levetid baseret på danske statistikker. Gratis online levetidsberegner med præcise data fra Danmarks Statistik.',
  keywords = 'levetid, beregner, danmark, statistik, dødsalder, forventet levetid',
  ogTitle,
  ogDescription,
  canonicalUrl = ''
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export default SEOHead;