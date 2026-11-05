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
    title: 'Hvor gammel bliver jeg? Levetidsberegner med danske tal',
    description: 'Levetidsberegner: se din statistiske restlevetid ud fra alder og køn i Danmarks Statistiks dødelighedstavler. Med nedtælling.',
    keywords: 'hvor gammel bliver jeg, levetidsberegner, hvor gammel bliver jeg beregner, hvor gammel bliver jeg test, hvor længe lever jeg',
    ogTitle: 'Hvor gammel bliver jeg? Beregn din levetid',
    ogDescription: 'Beregn din statistiske levetid ud fra alder og køn. Baseret på Danmarks Statistiks dødelighedstavler.',
    breadcrumbs: [],
    noindex: false,
  },
  '/hvor-lang-tid-har-jeg-tilbage': {
    title: 'Hvor mange år har jeg tilbage? Beregn din restlevetid',
    description: 'Hvor mange år har du statistisk tilbage? Se restlevetiden for din alder og dit køn i Danmarks Statistiks tavler.',
    keywords: 'hvor mange år har jeg tilbage, restlevetid, resterende levetid, hvor lang tid har jeg tilbage',
    ogTitle: 'Hvor mange år har jeg tilbage?',
    ogDescription: 'Se din statistiske restlevetid ud fra alder og køn, baseret på Danmarks Statistiks dødelighedstavler.',
    breadcrumbs: [HOME, { name: 'Hvor lang tid har jeg tilbage', url: '/hvor-lang-tid-har-jeg-tilbage' }],
    noindex: false,
  },
  '/dodsalder-calculator': {
    title: 'Forventet dødsalder: beregn din statistiske dødsalder',
    description: 'Forventet dødsalder for din alder og dit køn, beregnet af Danmarks Statistiks tavler. Se også, hvad livsstil kan ændre.',
    keywords: 'forventet dødsalder, dødsalder beregner, dødsalder calculator, statistisk dødsalder, hvornår dør jeg',
    ogTitle: 'Forventet dødsalder: hvornår dør jeg statistisk?',
    ogDescription: 'Et statistisk estimat af din forventede dødsalder ud fra alder og køn, baseret på Danmarks Statistik.',
    breadcrumbs: [HOME, { name: 'Dødsalder Calculator', url: '/dodsalder-calculator' }],
    noindex: false,
  },
  '/levetid-beregner-danmark': {
    title: 'Levealder i Danmark: tal for mænd og kvinder',
    description: 'Gennemsnitlig levealder i Danmark for mænd og kvinder fra Danmarks Statistik, plus middellevetid sammenlignet med nabolande.',
    keywords: 'levealder danmark, gennemsnitlig levealder, middellevetid danmark, levetid danmark, danmarks statistik levealder',
    ogTitle: 'Levealder i Danmark: aktuelle tal fra Danmarks Statistik',
    ogDescription: 'Gennemsnitlig levealder for danske mænd og kvinder og sammenligning med Sverige, Norge og Finland.',
    breadcrumbs: [HOME, { name: 'Levetidsberegner Danmark', url: '/levetid-beregner-danmark' }],
    noindex: false,
  },
  '/livsstil-og-levetid': {
    title: 'Livsstil og levetid: hvad kan motion og rygning ændre?',
    description: 'Livsstil og levetid: hvordan motion, kost, rygning og søvn påvirker den forventede levetid, og hvordan du lægger det ind i et estimat.',
    keywords: 'livsstil og levetid, motion levetid, rygning levetid, sund kost levetid, længere liv',
    ogTitle: 'Livsstil og levetid: hvad flytter dit estimat?',
    ogDescription: 'Hvordan motion, kost, rygning og søvn hænger sammen med levetid, og hvordan du bruger det i beregneren.',
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
