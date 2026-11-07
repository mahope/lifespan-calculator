// Per-route <head> tags, written into the static HTML by src/layouts/Base.astro.
// Values come from src/routes.meta.js. The output is the same set of tags the SPA's
// scripts/prerender-head.mjs baked in (without its data-prerender markers); scripts/check-parity.mjs
// compares the built pages with the snapshot taken from the SPA build.
import { OG_IMAGE, SITE_NAME, absoluteUrl, jsonLd } from '../routes.meta.js'

export const MAX_TITLE = 60
export const MAX_DESCRIPTION = 160

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Duplicate or over-long titles/descriptions fail the build (astro.config.mjs). Returns a list of problems.
export function validateMeta(routes, metaByRoute) {
  const problems = []
  const seen = { title: new Map(), description: new Map() }
  for (const route of routes) {
    const meta = metaByRoute[route]
    if (!meta) {
      problems.push(`${route}: missing from ROUTE_META`)
      continue
    }
    for (const [field, max] of [['title', MAX_TITLE], ['description', MAX_DESCRIPTION]]) {
      const value = meta[field]
      if (!value) problems.push(`${route}: empty ${field}`)
      else if (value.length > max) problems.push(`${route}: ${field} is ${value.length} chars (max ${max})`)
      if (value && seen[field].has(value)) problems.push(`${route}: ${field} duplicates ${seen[field].get(value)}`)
      else if (value) seen[field].set(value, route)
    }
  }
  return problems
}

// JSON inside <script type="application/ld+json">: "<" is escaped so "</script>" can never close the tag.
export const ldJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

// All SEO tags of one route, one per line. `extraJsonLd` adds page-specific blocks (FAQPage on /pensionsalder).
export function headTags(meta, route, extraJsonLd = []) {
  const url = absoluteUrl(route)
  const ogTitle = meta.ogTitle || meta.title
  const ogDescription = meta.ogDescription || meta.description
  const m = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}" />`
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    m('name', 'description', meta.description),
    m('name', 'keywords', meta.keywords),
    m('name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow'),
    m('name', 'author', 'Mads Holst Jensen'),
    m('name', 'language', 'Danish'),
    m('property', 'og:title', ogTitle),
    m('property', 'og:description', ogDescription),
    m('property', 'og:type', 'website'),
    m('property', 'og:url', url),
    m('property', 'og:site_name', SITE_NAME),
    m('property', 'og:locale', 'da_DK'),
    m('property', 'og:image', OG_IMAGE),
    m('property', 'og:image:width', '1200'),
    m('property', 'og:image:height', '630'),
    m('property', 'og:image:alt', ogTitle),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', ogTitle),
    m('name', 'twitter:description', ogDescription),
    m('name', 'twitter:image', OG_IMAGE),
    `<link rel="canonical" href="${esc(url)}" />`,
    ...[...jsonLd(meta, url), ...extraJsonLd].map((d) => `<script type="application/ld+json">${ldJson(d)}</script>`),
  ]
  return lines.join('\n')
}

// The 404 page: no canonical or social tags, only title, description and noindex.
export function notFoundTags(meta) {
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="noindex, follow" />`,
  ].join('\n')
}
