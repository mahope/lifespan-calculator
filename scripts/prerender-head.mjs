// Post-build step (`postbuild`): bakes each route's own <head> values into the raw HTML so that
// crawlers and link-preview fetchers that do not run JavaScript see them. Writes
// dist/<route>/index.html from dist/index.html (the home page values go into dist/index.html itself).
// Route list: ROUTES in gen-sitemap.mjs. Values: src/routes.meta.js. No dependencies.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { ROUTES } from './gen-sitemap.mjs'
import { ROUTE_META, OG_IMAGE, SITE_NAME, absoluteUrl, jsonLd } from '../src/routes.meta.js'

export const MAX_TITLE = 60
export const MAX_DESCRIPTION = 160

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Fail the build on duplicate or over-long titles/descriptions. Returns a list of problems.
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

// Tags that SEOHead sets at runtime. Every one of them is removed from the template first, so the
// result has exactly one of each (replace, never append).
const STRIP = [
  /[ \t]*<title[^>]*>[\s\S]*?<\/title>[ \t]*\r?\n?/gi,
  /[ \t]*<meta\s+name="(?:description|keywords|robots|author|language)"[^>]*>[ \t]*\r?\n?/gi,
  /[ \t]*<meta\s+property="og:[^"]*"[^>]*>[ \t]*\r?\n?/gi,
  /[ \t]*<meta\s+name="twitter:[^"]*"[^>]*>[ \t]*\r?\n?/gi,
  /[ \t]*<link\s+rel="canonical"[^>]*>[ \t]*\r?\n?/gi,
  /[ \t]*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>[ \t]*\r?\n?/gi,
]

export function headTags(meta, route) {
  const url = absoluteUrl(route)
  const ogTitle = meta.ogTitle || meta.title
  const ogDescription = meta.ogDescription || meta.description
  // data-prerender marks the baked-in tags; SEOHead removes them once react-helmet-async has
  // rendered its own copies, so a hydrated page never carries two of any tag.
  const m = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}" data-prerender="true" />`
  const lines = [
    `<title data-prerender="true">${esc(meta.title)}</title>`,
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
    `<link rel="canonical" href="${esc(url)}" data-prerender="true" />`,
    ...jsonLd(meta, url).map(
      (d) =>
        `<script type="application/ld+json" data-prerender="true">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`,
    ),
  ]
  return lines.map((l) => `    ${l}`).join('\n')
}

export function renderRoute(template, meta, route) {
  let html = template
  for (const re of STRIP) html = html.replace(re, '')
  if (!html.includes('</head>')) throw new Error('template has no </head>')
  html = html.replace('</head>', () => `${headTags(meta, route)}\n  </head>`)
  // Safety net: a tag the STRIP patterns missed (e.g. different attribute order) would be a silent duplicate.
  for (const [name, re] of ONLY_ONCE) {
    const n = (html.match(re) || []).length
    if (n !== 1) throw new Error(`${route}: expected exactly one ${name} tag, found ${n}`)
  }
  return html
}

const ONLY_ONCE = [
  ['title', /<title\b/gi],
  ['description', /<meta\b[^>]*\bname="description"/gi],
  ['robots', /<meta\b[^>]*\bname="robots"/gi],
  ['og:title', /<meta\b[^>]*\bproperty="og:title"/gi],
  ['twitter:card', /<meta\b[^>]*\bname="twitter:card"/gi],
  ['canonical', /<link\b[^>]*\brel="canonical"/gi],
]

export function prerender(distDir, routes = ROUTES, metaByRoute = ROUTE_META) {
  const problems = validateMeta(routes, metaByRoute)
  if (problems.length) throw new Error(`route meta invalid:\n  ${problems.join('\n  ')}`)
  const template = readFileSync(new URL('index.html', distDir), 'utf8')
  for (const route of routes) {
    const html = renderRoute(template, metaByRoute[route], route)
    if (route === '/') {
      writeFileSync(new URL('index.html', distDir), html)
    } else {
      const dir = new URL(`.${route}/`, distDir)
      mkdirSync(dir, { recursive: true })
      writeFileSync(new URL('index.html', dir), html)
    }
  }
  // dist/404.html is copied from public/404.html (noindex, asserted in prerender-head.test.js).
  return routes.length
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const n = prerender(new URL('../dist/', import.meta.url))
    process.stdout.write(`prerender-head: wrote ${n} routes into dist/\n`)
  } catch (err) {
    process.stderr.write(`prerender-head: ${err.message}\n`)
    process.exit(1)
  }
}
