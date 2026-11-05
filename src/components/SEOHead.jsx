import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ROUTE_META,
  NOT_FOUND_META,
  OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  jsonLd,
} from '../routes.meta.js';

// Head values come from src/routes.meta.js, the same table scripts/prerender-head.mjs bakes into
// the raw HTML. Pass `route` (a key of ROUTE_META) or, for the 404 view, `notFound`.
const SEOHead = ({ route = '/', notFound = false }) => {
  const meta = notFound ? NOT_FOUND_META : ROUTE_META[route];
  const canonical = absoluteUrl(notFound ? '/404' : route);
  const ogTitle = meta.ogTitle || meta.title;
  const ogDescription = meta.ogDescription || meta.description;

  // Drop the head tags baked in by scripts/prerender-head.mjs now that Helmet has rendered its own.
  useEffect(() => {
    document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove());
  }, []);

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="robots" content={meta.noindex ? 'noindex, follow' : 'index, follow'} />
      <meta name="author" content="Mads Holst Jensen" />
      <meta name="language" content="Danish" />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="da_DK" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={OG_IMAGE} />

      <link rel="canonical" href={canonical} />

      {/* Structured data: WebApplication and, below the home page, BreadcrumbList */}
      {jsonLd(meta, canonical).map((data) => (
        <script key={data['@type']} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
