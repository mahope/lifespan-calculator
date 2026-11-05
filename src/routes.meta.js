// Single source of truth for per-route head metadata. Read by <SEOHead> at runtime and by
// scripts/prerender-head.mjs, which bakes the same values into dist/<route>/index.html.
// Keep this file free of imports (it is loaded by plain Node during the build).
// The route list itself lives in scripts/gen-sitemap.mjs (ROUTES); a test keeps both in sync.

export const SITE_URL = 'https://levetidsberegner.dk'
export const OG_IMAGE = `${SITE_URL}/og-image.png`
export const SITE_NAME = 'Levetidsberegner'

const HOME = { name: 'Forside', url: '/' }

export const ROUTE_META = {
  '/': {
    title: 'Levetidsberegner - resterende levetid baseret på statistik',
    description:
      'Gratis levetidsberegner der beregner din statistiske resterende levetid ud fra alder og køn og danske dødelighedstavler. Med live nedtælling og deling.',
    keywords:
      'levetidsberegner, resterende levetid, statistik, dødsalderen, levetid beregner, hvor længe lever jeg, lifespan calculator dansk',
    ogTitle: 'Levetidsberegner - Hvor lang tid har du tilbage?',
    ogDescription:
      'Beregn din statistiske resterende levetid med vores gratis levetidsberegner. Baseret på Danmarks Statistiks dødelighedstavler.',
    breadcrumbs: [],
    noindex: false,
  },
  '/hvor-lang-tid-har-jeg-tilbage': {
    title: 'Hvor lang tid har jeg tilbage at leve? - Levetidsberegner',
    description:
      'Få svar på hvor lang tid du har tilbage at leve baseret på statistiske data. Levetidsberegneren giver dig et realistisk estimat af din resterende levetid.',
    keywords:
      'hvor lang tid har jeg tilbage, resterende levetid, levetid beregning, dødsalder, livslængde, levetidsberegner',
    ogTitle: 'Hvor lang tid har jeg tilbage at leve?',
    ogDescription:
      'Beregn din statistiske resterende levetid med vores præcise levetidsberegner baseret på danske data',
    breadcrumbs: [HOME, { name: 'Hvor lang tid har jeg tilbage', url: '/hvor-lang-tid-har-jeg-tilbage' }],
    noindex: false,
  },
  '/dodsalder-calculator': {
    title: 'Dødsalder Calculator - Beregn din forventede dødsalder',
    description:
      'Beregn din statistiske dødsalder baseret på alder, køn og livsstil. Gratis dødsalder calculator med data fra sundhedsmyndigheder.',
    keywords:
      'dødsalder calculator, dødsalder beregner, forventet dødsalder, levetid, statistisk dødsalder, hvornår dør jeg',
    ogTitle: 'Dødsalder Calculator - Hvornår dør jeg statistisk?',
    ogDescription:
      'Få et statistisk estimat af din dødsalder baseret på demografiske data og livsstilsfaktorer',
    breadcrumbs: [HOME, { name: 'Dødsalder Calculator', url: '/dodsalder-calculator' }],
    noindex: false,
  },
  '/levetid-beregner-danmark': {
    title: 'Dansk Levetidsberegner - Specialiseret til danske forhold',
    description:
      'Beregn din levetid med data specifikt fra Danmarks Statistik. Vores danske levetidsberegner bruger de seneste data fra danske sundhedsmyndigheder.',
    keywords:
      'dansk levetidsberegner, danmark levetid, danmarks statistik levetid, dansk dødsalder, levetid danmark, forventet levealder danmark',
    ogTitle: 'Dansk Levetidsberegner - Præcise data fra Danmarks Statistik',
    ogDescription:
      'Specialiseret levetidsberegner med data fra Danmarks Statistik og danske sundhedsmyndigheder',
    breadcrumbs: [HOME, { name: 'Levetidsberegner Danmark', url: '/levetid-beregner-danmark' }],
    noindex: false,
  },
  '/livsstil-og-levetid': {
    title: 'Livsstil og Levetid - Hvordan påvirker livsstil levetiden?',
    description:
      'Lær hvordan livsstilsfaktorer som motion, kost, rygning og stress påvirker din levetid. Videnskabsbaseret guide til sundere og længere liv.',
    keywords:
      'livsstil levetid, motion levetid, sund kost levetid, rygning påvirkning, stress sundhed, længere liv, sundhed',
    ogTitle: 'Livsstil og Levetid - Forlæng dit liv med de rigtige valg',
    ogDescription:
      'Videnskabsbaseret guide til hvordan du kan forlænge dit liv gennem livsstilsændringer',
    breadcrumbs: [HOME, { name: 'Livsstil og Levetid', url: '/livsstil-og-levetid' }],
    noindex: false,
  },
  '/pensionsalder': {
    title: 'Hvornår kan jeg gå på pension? Beregn din pensionsalder',
    description:
      'Se din folkepensionsalder, den dato du når den, og hvor mange år du i gennemsnit kan forvente som pensionist. Gratis, uden login.',
    keywords:
      'hvornår kan jeg gå på pension, pensionsalder beregner, folkepensionsalder, pensionsalder 2026',
    breadcrumbs: [HOME, { name: 'Pensionsalder', url: '/pensionsalder' }],
    noindex: false,
  },
}

// Not a sitemap route: the catch-all 404 view. Runtime only (public/404.html is the served file).
export const NOT_FOUND_META = {
  title: 'Side ikke fundet - Dansk Levetidsberegner',
  description:
    'Siden du leder efter blev ikke fundet. Gå tilbage til levetidsberegneren for at beregne din forventede levetid.',
  keywords: '404, side ikke fundet, levetidsberegner',
  breadcrumbs: [],
  noindex: true,
}

export const absoluteUrl = (path) => (path.startsWith('http') ? path : `${SITE_URL}${path}`)

export function jsonLd(meta, path) {
  const url = absoluteUrl(path)
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url,
    description: meta.description,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'DKK' },
    author: { '@type': 'Person', name: 'Mads Holst Jensen' },
    inLanguage: 'da-DK',
  }
  const out = [app]
  if (meta.breadcrumbs?.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.url),
      })),
    })
  }
  return out
}
