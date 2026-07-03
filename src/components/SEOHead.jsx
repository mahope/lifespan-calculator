import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title = 'Dansk Levetidsberegner - Beregn din forventede levetid',
  description = 'Beregn din forventede levetid baseret på danske statistikker. Gratis online levetidsberegner med præcise data fra Danmarks Statistik.',
  keywords = 'levetid, beregner, danmark, statistik, dødsalder, forventet levetid',
  ogTitle,
  ogDescription,
  ogImage = 'https://levetidsberegner.dk/og-image.png',
  canonicalUrl = 'https://levetidsberegner.dk',
  breadcrumbs
}) => {
  const fullCanonicalUrl = canonicalUrl.startsWith('http')
    ? canonicalUrl
    : `https://levetidsberegner.dk${canonicalUrl}`;
  const fullOgImage = ogImage.startsWith('http')
    ? ogImage
    : `https://levetidsberegner.dk${ogImage}`;
    
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Levetidsberegner",
    "url": fullCanonicalUrl,
    "description": description,
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "DKK"
    },
    "author": {
      "@type": "Person",
      "name": "Mads Holst Jensen"
    },
    "inLanguage": "da-DK"
  };

  // Optional BreadcrumbList structured data (Forside -> ... -> current page).
  const breadcrumbData =
    breadcrumbs && breadcrumbs.length
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbs.map((crumb, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": crumb.name,
            "item": crumb.url.startsWith('http')
              ? crumb.url
              : `https://levetidsberegner.dk${crumb.url}`,
          })),
        }
      : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Mads Holst Jensen" />
      <meta name="language" content="Danish" />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:site_name" content="Levetidsberegner" />
      <meta property="og:locale" content="da_DK" />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogTitle || title} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
